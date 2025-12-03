import { DynamicModule, Module, Provider } from '@nestjs/common';

import { EventHandlers } from './application/event-handlers';
import { QueryHandlers } from './application/query-handlers';
import { Services } from './application/service';

/**
 * API 端点模块
 *
 * @description
 * API 端点有界上下文的应用模块，采用动态模块模式注册。
 * 该模块负责注册 API 端点相关的查询处理器、事件处理器和服务，
 * 并允许基础设施层注入仓储实现等依赖。
 *
 * 该模块遵循 Clean Architecture 的分层原则，将应用层的处理器与服务与基础设施层的实现解耦。
 * API 端点用于 Casbin 权限控制，系统启动时会自动收集所有 API 路由并保存到数据库。
 *
 * @example
 * ```typescript
 * // 在基础设施模块中使用
 * @Module({
 *   imports: [
 *     ApiEndpointModule.register({
 *       inject: [
 *         {
 *           provide: ApiEndpointReadRepoPortToken,
 *           useClass: ApiEndpointReadPostgresRepository,
 *         },
 *         {
 *           provide: ApiEndpointWriteRepoPortToken,
 *           useClass: ApiEndpointWritePostgresRepository,
 *         },
 *       ],
 *       imports: [],
 *     }),
 *   ],
 * })
 * export class ApiEndpointInfraModule {}
 * ```
 */
@Module({})
export class ApiEndpointModule {
  /**
   * 注册 API 端点模块
   *
   * @description
   * 动态注册 API 端点模块，配置模块的提供者和导入。
   * 该方法会注册所有查询处理器、事件处理器和服务，
   * 并允许外部注入仓储实现等依赖。
   *
   * @param options - 模块配置选项
   * @param options.inject - 需要注入的提供者数组，通常包括仓储实现的提供者
   * @param options.imports - 需要导入的其他模块数组
   * @returns 返回配置好的动态模块，包含所有处理器、服务和注入的提供者
   *
   * @example
   * ```typescript
   * ApiEndpointModule.register({
   *   inject: [
   *     {
   *       provide: ApiEndpointReadRepoPortToken,
   *       useClass: ApiEndpointReadPostgresRepository,
   *     },
   *     {
   *       provide: ApiEndpointWriteRepoPortToken,
   *       useClass: ApiEndpointWritePostgresRepository,
   *     },
   *   ],
   *   imports: [SomeOtherModule],
   * })
   * ```
   */
  static register(options: {
    inject: Provider[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    imports: any[];
  }): DynamicModule {
    return {
      module: ApiEndpointModule,
      imports: [...options.imports],
      providers: [
        ...EventHandlers,
        ...QueryHandlers,
        ...Services,
        ...options.inject,
      ],
      exports: [...QueryHandlers, ...Services],
    };
  }
}
