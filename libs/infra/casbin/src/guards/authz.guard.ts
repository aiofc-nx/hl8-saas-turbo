import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import * as casbin from 'casbin';

import { CacheConstant } from '@hl8/constants';
import { RedisUtility } from '@hl8/redis';

import {
  AUTHZ_ENFORCER,
  AUTHZ_MODULE_OPTIONS,
  PERMISSIONS_METADATA,
} from '../constants/authz.constants';
import type { AuthZModuleOptions, Permission } from '../interfaces';

/**
 * 授权守卫
 *
 * @description 基于 Casbin 的权限验证守卫，用于验证用户是否具有访问特定资源的权限
 *
 * @class AuthZGuard
 * @implements {CanActivate}
 */
@Injectable()
export class AuthZGuard implements CanActivate {
  private readonly logger = new Logger(AuthZGuard.name);

  /**
   * 构造函数
   *
   * @param reflector - NestJS 反射器，用于获取路由元数据
   * @param enforcer - Casbin 执行器实例
   * @param options - 授权模块配置选项
   */
  constructor(
    private readonly reflector: Reflector,
    @Inject(AUTHZ_ENFORCER) private readonly enforcer: casbin.Enforcer,
    @Inject(AUTHZ_MODULE_OPTIONS) private readonly options: AuthZModuleOptions,
  ) {}

  /**
   * 检查用户是否具有访问权限
   *
   * @description 从路由元数据中获取所需的权限要求，从上下文中提取用户信息，验证用户是否满足所有权限要求
   *
   * @param context - 执行上下文，包含请求和响应对象
   * @returns 返回 true 表示用户具有所有必需权限，false 表示权限不足
   *
   * @throws {UnauthorizedException} 当用户未认证时抛出
   *
   * @example
   * ```typescript
   * @UseGuards(AuthZGuard)
   * @UsePermissions({ resource: 'data1', action: 'read' })
   * @Get('data')
   * async getData() { ... }
   * ```
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const permissions: Permission[] = this.reflector.get<Permission[]>(
        PERMISSIONS_METADATA,
        context.getHandler(),
      );

      if (!permissions) {
        return true;
      }

      const user = this.options.userFromContext(context);

      if (!user) {
        throw new UnauthorizedException();
      }

      const userRoles = await RedisUtility.instance.smembers(
        `${CacheConstant.AUTH_TOKEN_PREFIX}${user.uid}`,
      );

      if (userRoles && userRoles.length <= 0) {
        return false;
      }

      return await AuthZGuard.asyncEvery<Permission>(
        permissions,
        async (permission) =>
          this.hasPermission(
            new Set(userRoles),
            user.domain,
            permission,
            context,
            this.enforcer,
          ),
      );
    } catch (e) {
      this.logger.error('权限验证失败', e);
      throw e;
    }
  }

  /**
   * 检查是否拥有权限
   *
   * @description 检查用户的角色集合中是否有任何一个角色拥有指定的权限
   *
   * @param roles - 用户角色集合
   * @param domain - 域名
   * @param permission - 权限对象，包含资源（resource）和动作（action）
   * @param context - 执行上下文
   * @param enforcer - Casbin 执行器实例
   * @returns 返回 true 表示至少有一个角色拥有该权限，false 表示所有角色都不拥有
   */
  async hasPermission(
    roles: Set<string>,
    domain: string,
    permission: Permission,
    context: ExecutionContext,
    enforcer: casbin.Enforcer,
  ): Promise<boolean> {
    const { resource, action } = permission;

    return AuthZGuard.asyncSome<string>(Array.from(roles), async (role) => {
      return enforcer.enforce(role, resource, action, domain);
    });
  }

  /**
   * 异步数组 some 方法
   *
   * @description 异步检查数组中是否至少有一个元素满足回调函数的条件
   *
   * @param array - 要检查的数组
   * @param callback - 异步回调函数，返回 Promise<boolean>
   * @returns 返回 true 表示至少有一个元素满足条件，false 表示所有元素都不满足
   */
  static async asyncSome<T>(
    array: T[],
    callback: (value: T, index: number, a: T[]) => Promise<boolean>,
  ): Promise<boolean> {
    for (let i = 0; i < array.length; i++) {
      const result = await callback(array[i], i, array);
      if (result) {
        return result;
      }
    }

    return false;
  }

  /**
   * 异步数组 every 方法
   *
   * @description 异步检查数组中是否所有元素都满足回调函数的条件
   *
   * @param array - 要检查的数组
   * @param callback - 异步回调函数，返回 Promise<boolean>
   * @returns 返回 true 表示所有元素都满足条件，false 表示至少有一个元素不满足
   */
  static async asyncEvery<T>(
    array: T[],
    callback: (value: T, index: number, a: T[]) => Promise<boolean>,
  ): Promise<boolean> {
    for (let i = 0; i < array.length; i++) {
      const result = await callback(array[i], i, array);
      if (!result) {
        return result;
      }
    }

    return true;
  }
}
