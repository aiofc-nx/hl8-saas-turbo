import { EntityManager, FilterQuery } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';

import type { RoleProperties } from '@/lib/bounded-contexts/iam/role/domain/role.read.model';
import type { RoleReadRepoPort } from '@/lib/bounded-contexts/iam/role/ports/role.read.repo-port';
import { PageRolesQuery } from '@/lib/bounded-contexts/iam/role/queries/page-roles.query';

import { PaginationResult } from '@hl8/rest';

/**
 * Role 读取仓储实现
 *
 * @description 使用 MikroORM EntityManager 实现 Role 数据的读取操作
 */
@Injectable()
export class RoleReadPostgresRepository implements RoleReadRepoPort {
  constructor(private readonly em: EntityManager) {}

  /**
   * 根据用户 ID 查找角色代码集合
   *
   * @param userId - 用户 ID
   * @returns 角色代码集合
   */
  async findRolesByUserId(userId: string): Promise<Set<string>> {
    const userRoles = await this.em.find(
      'SysUserRole',
      { userId } as FilterQuery<any>,
      { fields: ['roleId'] },
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const roleIds = userRoles.map((userRole: any) => userRole.roleId);

    if (roleIds.length === 0) {
      return new Set<string>();
    }

    const roles = await this.em.find(
      'SysRole',
      { id: { $in: roleIds } } as FilterQuery<any>,
      { fields: ['code'] },
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return new Set(roles.map((role: any) => role.code));
  }

  /**
   * 分页查询角色
   *
   * @param query - 分页查询参数
   * @returns 分页结果
   */
  async pageRoles(
    query: PageRolesQuery,
  ): Promise<PaginationResult<RoleProperties>> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: FilterQuery<any> = {};

    if (query.code) {
      where.code = { $like: `%${query.code}%` };
    }

    if (query.name) {
      where.name = { $like: `%${query.name}%` };
    }

    if (query.status) {
      where.status = query.status;
    }

    const [roles, total] = await this.em.findAndCount('SysRole', where, {
      limit: query.size,
      offset: (query.current - 1) * query.size,
    });

    return new PaginationResult<RoleProperties>(
      query.current,
      query.size,
      total,
      roles as RoleProperties[],
    );
  }

  /**
   * 根据代码获取角色
   *
   * @param code - 角色代码
   * @returns 角色属性或 null
   */
  async getRoleByCode(code: string): Promise<Readonly<RoleProperties> | null> {
    const role = await this.em.findOne('SysRole', { code } as FilterQuery<any>);
    return role as Readonly<RoleProperties> | null;
  }

  /**
   * 根据 ID 获取角色
   *
   * @param id - 角色 ID
   * @returns 角色属性或 null
   */
  async getRoleById(id: string): Promise<Readonly<RoleProperties> | null> {
    const role = await this.em.findOne('SysRole', { id } as FilterQuery<any>);
    return role as Readonly<RoleProperties> | null;
  }
}
