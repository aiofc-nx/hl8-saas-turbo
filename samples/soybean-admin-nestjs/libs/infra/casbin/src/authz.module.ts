import { Module, DynamicModule, Global } from '@nestjs/common';
import * as casbin from 'casbin';

import {
  AUTHZ_MODULE_OPTIONS,
  AUTHZ_ENFORCER,
} from './constants/authz.constants';
import { AuthZGuard } from './guards/authz.guard';
import { AuthZModuleOptions } from './interfaces';
import {
  AuthZRBACService,
  AuthZManagementService,
  AuthZService,
} from './services';

/**
 * 授权模块
 * 
 * @description 提供基于 Casbin 的权限管理功能，包括权限验证、RBAC 管理和策略管理
 * 
 * @class AuthZModule
 */
@Global()
@Module({})
export class AuthZModule {
  /**
   * 注册授权模块
   * 
   * @description 动态注册授权模块，配置 Casbin 执行器和相关服务
   * 
   * @param options - 授权模块配置选项
   * @returns 返回动态模块配置
   * 
   * @throws {Error} 当未提供 enforcerProvider 且未提供 model 和 policy 时抛出
   * 
   * @example
   * ```typescript
   * AuthZModule.register({
   *   model: 'path/to/model.conf',
   *   policy: 'path/to/policy.csv',
   *   userFromContext: (ctx) => ctx.switchToHttp().getRequest().user
   * })
   * ```
   */
  static register(options: AuthZModuleOptions): DynamicModule {
    const moduleOptionsProvider = {
      provide: AUTHZ_MODULE_OPTIONS,
      useValue: options || {},
    };

    let enforcerProvider = options.enforcerProvider;
    const importsModule = options.imports || [];

    if (!enforcerProvider) {
      if (!options.model || !options.policy) {
        throw new Error(
          'must provide either enforcerProvider or both model and policy',
        );
      }

      enforcerProvider = {
        provide: AUTHZ_ENFORCER,
        useFactory: async () => {
          const isFile = typeof options.policy === 'string';

          let policyOption;

          if (isFile) {
            policyOption = options.policy as string;
          } else {
            policyOption = await options.policy;
          }

          return casbin.newEnforcer(options.model, policyOption);
        },
      };
    }

    return {
      module: AuthZModule,
      providers: [
        moduleOptionsProvider,
        enforcerProvider,
        AuthZGuard,
        AuthZRBACService,
        AuthZManagementService,
        AuthZService,
      ],
      imports: importsModule,
      exports: [
        moduleOptionsProvider,
        enforcerProvider,
        AuthZGuard,
        AuthZRBACService,
        AuthZManagementService,
        AuthZService,
      ],
    };
  }
}
