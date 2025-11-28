import { Injectable, NotFoundException } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';

import type { EndpointProperties } from '../../../../api-endpoint/api-endpoint/domain/endpoint.read.model';
import { FindEndpointsByIdsQuery } from '../../../../api-endpoint/api-endpoint/queries/endpoints.by-ids.query';
import type { DomainProperties } from '../../../domain/domain/domain.read.model';
import { FindDomainByCodeQuery } from '../../../domain/queries/domain.by-code.query';
import type { MenuProperties } from '../../../menu/domain/menu.read.model';
import { MenuIdsByUserIdAndDomainQuery } from '../../../menu/queries/menu-ids.by-user_id&domain.query';
import { MenusByIdsQuery } from '../../../menu/queries/menus.by-ids.query';
import type { RoleProperties } from '../../../role/domain/role.read.model';
import { FindRoleByIdQuery } from '../../../role/queries/role.by-id.query';

import { AuthZRBACService } from '@hl8/casbin';
import { EntityManager } from '@mikro-orm/core';

import { RoleAssignPermissionCommand } from '../../commands/role-assign-permission.command';
import { RoleAssignRouteCommand } from '../../commands/role-assign-route.command';
import { RoleAssignUserCommand } from '../../commands/role-assign-user.command';
import type { UserProperties } from '../../domain/user.read.model';
import { UserIdsByRoleIdQuery } from '../../queries/user-ids.by-role_id.query';
import { UsersByIdsQuery } from '../../queries/users.by-ids.query';

/**
 * 授权服务
 *
 * 提供基于角色的访问控制（RBAC）相关的业务逻辑，包括：
 * - 为角色分配权限（API 端点权限）
 * - 为角色分配路由（菜单路由）
 * - 为用户分配角色
 *
 * @remarks
 * - 使用 Casbin 进行权限策略管理
 * - 通过 CQRS 模式处理查询操作
 * - 使用数据库事务确保数据一致性
 * - 支持多租户（域）隔离
 */
@Injectable()
export class AuthorizationService {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly authZRBACService: AuthZRBACService,
    private readonly em: EntityManager,
  ) {}

  /**
   * 为角色分配权限
   *
   * 将 API 端点权限分配给指定角色，并同步到 Casbin 权限策略中。
   *
   * @param command - 角色分配权限命令，包含域代码、角色 ID 和权限 ID 列表
   *
   * @throws {NotFoundException} 当域、角色或权限不存在时抛出
   *
   * @remarks
   * - 验证域和角色的存在性
   * - 查询并验证权限（API 端点）是否存在
   * - 获取角色现有的权限策略
   * - 同步权限：删除不再需要的权限，添加新权限
   * - 权限策略格式：[角色代码, 资源, 操作, 域, 'allow']
   */
  async assignPermission(command: RoleAssignPermissionCommand) {
    const { domainCode, roleCode } = await this.checkDomainAndRole(
      command.domain,
      command.roleId,
    );

    const permissions = await this.queryBus.execute<
      FindEndpointsByIdsQuery,
      EndpointProperties[]
    >(new FindEndpointsByIdsQuery(command.permissions));
    if (!permissions.length) {
      throw new NotFoundException('One or more permissions not found.');
    }

    const existingPermissions =
      await this.authZRBACService.enforcer.getFilteredPolicy(
        0,
        roleCode,
        '',
        '',
        domainCode,
      );

    await this.syncRolePermissions(
      roleCode,
      domainCode,
      permissions,
      existingPermissions,
    );
  }

  async assignRoutes(command: RoleAssignRouteCommand) {
    const { domainCode, roleId } = await this.checkDomainAndRole(
      command.domain,
      command.roleId,
    );

    const routes = await this.queryBus.execute<
      MenusByIdsQuery,
      MenuProperties[]
    >(new MenusByIdsQuery(command.menuIds));
    if (!routes.length) {
      throw new NotFoundException('One or more routes not found.');
    }

    const existingRouteIds = await this.queryBus.execute<
      MenuIdsByUserIdAndDomainQuery,
      number[]
    >(new MenuIdsByUserIdAndDomainQuery(roleId, domainCode));

    const newRouteIds = command.menuIds.filter(
      (id) => !existingRouteIds.includes(id),
    );
    const routeIdsToDelete = existingRouteIds.filter(
      (id) => !command.menuIds.includes(id),
    );

    await this.em.transactional(async (em) => {
      // 创建新的角色菜单关联
      for (const routeId of newRouteIds) {
        const roleMenu = em.create('SysRoleMenu', {
          roleId: roleId,
          menuId: routeId,
          domain: domainCode,
        });
        await em.persist(roleMenu);
      }

      // 删除需要移除的角色菜单关联
      for (const routeId of routeIdsToDelete) {
        await em.nativeDelete('SysRoleMenu', {
          roleId: roleId,
          menuId: routeId,
          domain: domainCode,
        });
      }

      await em.flush();
    });
  }

  async assignUsers(command: RoleAssignUserCommand) {
    await this.checkRole(command.roleId);

    const users = await this.queryBus.execute<
      UsersByIdsQuery,
      UserProperties[]
    >(new UsersByIdsQuery(command.userIds));
    if (!users.length) {
      throw new NotFoundException('One or more users not found.');
    }

    const existingUserIds = await this.queryBus.execute<
      UserIdsByRoleIdQuery,
      string[]
    >(new UserIdsByRoleIdQuery(command.roleId));

    const newUserIds = command.userIds.filter(
      (id) => !existingUserIds.includes(id),
    );
    const userIdsToDelete = existingUserIds.filter(
      (id) => !command.userIds.includes(id),
    );

    await this.em.transactional(async (em) => {
      // 创建新的用户角色关联
      for (const userId of newUserIds) {
        const userRole = em.create('SysUserRole', {
          roleId: command.roleId,
          userId: userId,
        });
        await em.persist(userRole);
      }

      // 删除需要移除的用户角色关联
      for (const userId of userIdsToDelete) {
        await em.nativeDelete('SysUserRole', {
          roleId: command.roleId,
          userId: userId,
        });
      }

      await em.flush();
    });
  }

  private async checkDomainAndRole(domainCode: string, roleId: string) {
    const domain = await this.queryBus.execute<
      FindDomainByCodeQuery,
      Readonly<DomainProperties> | null
    >(new FindDomainByCodeQuery(domainCode));
    if (!domain) {
      throw new NotFoundException('Domain not found.');
    }

    const { roleCode } = await this.checkRole(roleId);

    return { domainCode: domain.code, roleId, roleCode };
  }

  private async checkRole(roleId: string) {
    const role = await this.queryBus.execute<
      FindRoleByIdQuery,
      Readonly<RoleProperties> | null
    >(new FindRoleByIdQuery(roleId));
    if (!role) {
      throw new NotFoundException('Role not found.');
    }

    return { roleCode: role.code };
  }

  private async syncRolePermissions(
    roleCode: string,
    domain: string,
    newPermissions: EndpointProperties[],
    existingPermissions: string[][],
  ): Promise<void> {
    // 转换新权限为 Casbin 策略格式
    const newPermSet = new Set(
      newPermissions.map((perm) =>
        JSON.stringify([roleCode, perm.resource, perm.action, domain, 'allow']),
      ),
    );

    const existingPermSet = new Set(
      existingPermissions.map((perm) => JSON.stringify(perm)),
    );

    // 删除在新权限中不存在的现有权限
    for (const perm of existingPermissions) {
      if (!newPermSet.has(JSON.stringify(perm))) {
        await this.authZRBACService.enforcer.removeFilteredPolicy(
          0,
          roleCode,
          perm[1],
          perm[2],
          domain,
        );
      }
    }

    // 添加不存在的新权限
    for (const perm of newPermissions) {
      const permArray = [roleCode, perm.resource, perm.action, domain, 'allow'];
      if (!existingPermSet.has(JSON.stringify(permArray))) {
        await this.authZRBACService.enforcer.addPermissionForUser(
          roleCode,
          perm.resource,
          perm.action,
          domain,
        );
      }
    }
  }
}
