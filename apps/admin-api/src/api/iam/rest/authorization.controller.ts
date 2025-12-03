import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { AuthorizationService } from '@/lib/bounded-contexts/iam/authentication/application/service/authorization.service';
import { RoleAssignPermissionCommand } from '@/lib/bounded-contexts/iam/authentication/commands/role-assign-permission.command';
import { RoleAssignRouteCommand } from '@/lib/bounded-contexts/iam/authentication/commands/role-assign-route.command';
import { RoleAssignUserCommand } from '@/lib/bounded-contexts/iam/authentication/commands/role-assign-user.command';
import { UserRoute } from '@/lib/bounded-contexts/iam/menu/application/dto/route.dto';
import { MenuService } from '@/lib/bounded-contexts/iam/menu/application/service/menu.service';

import { AuthZGuard, UsePermissions } from '@hl8/casbin';
import { CacheConstant } from '@hl8/constants';
import { RedisUtility } from '@hl8/redis';
import { ApiRes } from '@hl8/rest';
import { IAuthentication } from '@hl8/typings';
import type { FastifyRequest } from 'fastify';

import { AssignPermissionDto } from '../dto/assign-permission.dto';
import { AssignRouteDto } from '../dto/assign-route.dto';
import { AssignUserDto } from '../dto/assign-user.dto';

/**
 * 授权控制器
 *
 * @description
 * 提供权限授权相关的 REST API 接口，包括为角色分配权限、路由和用户等功能。
 * 该控制器使用 Casbin 进行权限控制，所有接口都需要通过权限验证。
 *
 * @example
 * ```typescript
 * // 为角色分配权限
 * POST /authorization/assign-permission
 * {
 *   "domain": "domain001",
 *   "roleId": "role-id-123",
 *   "permissions": ["permission1", "permission2"]
 * }
 * ```
 */
@UseGuards(AuthZGuard)
@ApiTags('Authorization - Module')
@Controller('authorization')
export class AuthorizationController {
  /**
   * 构造函数
   *
   * @param authorizationService - 授权服务，用于处理权限分配逻辑
   * @param menuService - 菜单服务，用于获取用户路由信息
   */
  constructor(
    private readonly authorizationService: AuthorizationService,
    private readonly menuService: MenuService,
  ) {}

  /**
   * 为角色分配权限
   *
   * @description
   * 在指定域内为角色分配一组权限。权限格式通常为 "资源:操作"，例如 "user:read"、"user:write"。
   * 该操作会更新 Casbin 策略规则。
   *
   * @param dto - 权限分配数据传输对象，包含域、角色 ID 和权限列表
   * @returns 返回操作结果，成功时返回 null
   *
   * @throws {HttpException} 当角色不存在、域不存在或权限格式错误时抛出异常
   *
   * @example
   * ```typescript
   * POST /authorization/assign-permission
   * {
   *   "domain": "domain001",
   *   "roleId": "role-id-123",
   *   "permissions": ["user:read", "user:write", "role:read"]
   * }
   * ```
   */
  @Post('assign-permission')
  @UsePermissions({ resource: 'authorization', action: 'assign-permission' })
  @ApiOperation({
    summary: 'Assign Permissions to Role',
    description:
      'Assigns a set of permissions to a specified role within a domain.',
  })
  async assignPermission(
    @Body() dto: AssignPermissionDto,
  ): Promise<ApiRes<null>> {
    await this.authorizationService.assignPermission(
      new RoleAssignPermissionCommand(dto.domain, dto.roleId, dto.permissions),
    );
    return ApiRes.ok();
  }

  /**
   * 为角色分配路由
   *
   * @description
   * 在指定域内为角色分配一组菜单路由。路由是前端菜单项，分配后该角色的用户可以看到对应的菜单。
   *
   * @param dto - 路由分配数据传输对象，包含域、角色 ID 和路由 ID 列表
   * @returns 返回操作结果，成功时返回 null
   *
   * @throws {HttpException} 当角色不存在、域不存在或路由不存在时抛出异常
   *
   * @example
   * ```typescript
   * POST /authorization/assign-routes
   * {
   *   "domain": "domain001",
   *   "roleId": "role-id-123",
   *   "routeIds": [1, 2, 3]
   * }
   * ```
   */
  @Post('assign-routes')
  @UsePermissions({ resource: 'authorization', action: 'assign-routes' })
  @ApiOperation({
    summary: 'Assign Routes to Role',
    description: 'Assigns a set of routes to a specified role within a domain.',
  })
  async assignRoutes(@Body() dto: AssignRouteDto): Promise<ApiRes<null>> {
    await this.authorizationService.assignRoutes(
      new RoleAssignRouteCommand(dto.domain, dto.roleId, dto.routeIds),
    );
    return ApiRes.ok();
  }

  /**
   * 为角色分配用户
   *
   * @description
   * 将一组用户分配给指定角色。用户获得角色后，将拥有该角色的所有权限和路由访问权限。
   *
   * @param dto - 用户分配数据传输对象，包含角色 ID 和用户 ID 列表
   * @returns 返回操作结果，成功时返回 null
   *
   * @throws {HttpException} 当角色不存在或用户不存在时抛出异常
   *
   * @example
   * ```typescript
   * POST /authorization/assign-users
   * {
   *   "roleId": "role-id-123",
   *   "userIds": ["user-id-1", "user-id-2", "user-id-3"]
   * }
   * ```
   */
  @Post('assign-users')
  @UsePermissions({ resource: 'authorization', action: 'assign-users' })
  @ApiOperation({
    summary: 'Assign Users to Role',
    description: 'Assigns a set of users to a specified role',
  })
  async assignUsers(@Body() dto: AssignUserDto): Promise<ApiRes<null>> {
    await this.authorizationService.assignUsers(
      new RoleAssignUserCommand(dto.roleId, dto.userIds),
    );
    return ApiRes.ok();
  }

  /**
   * 获取用户路由
   *
   * @description
   * 根据当前用户的角色和域获取该用户可访问的所有路由。返回的路由信息用于前端菜单渲染和路由守卫。
   *
   * @param req - HTTP 请求对象，包含当前登录用户信息（通过认证中间件注入）
   * @returns 返回用户路由信息，包含路由树结构
   *
   * @throws {HttpException} 当用户没有分配任何角色时抛出异常
   *
   * @example
   * ```typescript
   * GET /authorization/getUserRoutes
   * // 返回用户可访问的路由树
   * ```
   */
  @Get('getUserRoutes')
  @ApiOperation({
    summary: 'Get user routes',
    description:
      'Retrieve user-specific routes based on their roles and domain.',
  })
  async getUserRoutes(
    @Request() req: FastifyRequest & { user: IAuthentication },
  ): Promise<ApiRes<UserRoute>> {
    const user: IAuthentication = req.user;
    const userRoleCode = await RedisUtility.instance.smembers(
      `${CacheConstant.AUTH_TOKEN_PREFIX}${user.uid}`,
    );
    if (!userRoleCode || userRoleCode.length === 0) {
      throw new HttpException(
        'No roles found for the user',
        HttpStatus.NOT_FOUND,
      );
    }
    const routes = await this.menuService.getUserRoutes(
      userRoleCode,
      user.domain,
    );
    return ApiRes.success(routes);
  }
}
