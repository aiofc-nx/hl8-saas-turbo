import { DynamicModule, Module, Provider } from '@nestjs/common';

import { CommandHandlers } from './application/command-handlers';
import { QueryHandlers } from './application/query-handlers';
import { CasbinEnforcerReloadService } from './application/service/casbin-enforcer-reload.service';
import { CasbinModelService } from './application/service/casbin-model.service';

/**
 * Casbin 模块
 *
 * @description
 * 提供 Casbin 权限管理功能，包括策略规则、角色继承关系和模型配置版本管理。
 * 使用动态模块注册，支持依赖注入仓储实现。
 *
 * @example
 * ```typescript
 * CasbinModule.register({
 *   inject: [CasbinPolicyReadRepoPortToken, CasbinPolicyWriteRepoPortToken, ...],
 *   imports: [],
 * })
 * ```
 */
@Module({})
export class CasbinModule {
  /**
   * 注册 Casbin 模块
   *
   * @param options - 模块配置选项
   * @param options.inject - 需要注入的提供者数组（仓储端口令牌等）
   * @param options.imports - 需要导入的模块数组
   * @returns 动态模块配置
   */
  static register(options: {
    inject: Provider[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    imports: any[];
  }): DynamicModule {
    return {
      module: CasbinModule,
      imports: [...options.imports],
      providers: [
        ...CommandHandlers,
        ...QueryHandlers,
        CasbinModelService,
        CasbinEnforcerReloadService,
        ...options.inject,
      ],
      exports: [
        ...QueryHandlers,
        CasbinModelService,
        CasbinEnforcerReloadService,
      ],
    };
  }
}
