import { DynamicModule, Module, Provider } from '@nestjs/common';

import { PubSubCommandHandlers } from './application/command-handlers';
import { EventHandlers } from './application/event-handlers';
import { QueryHandlers } from './application/query-handlers';

/**
 * 访问密钥模块
 *
 * @description
 * 访问密钥有界上下文的应用模块，采用动态模块模式注册。
 * 该模块负责注册访问密钥相关的命令处理器、查询处理器和事件处理器，
 * 并允许基础设施层注入仓储实现等依赖。
 *
 * 该模块遵循 Clean Architecture 的分层原则，将应用层的处理器与基础设施层的实现解耦。
 *
 * @example
 * ```typescript
 * // 在基础设施模块中使用
 * @Module({
 *   imports: [
 *     AccessKeyModule.register({
 *       inject: [
 *         {
 *           provide: AccessKeyReadRepoPortToken,
 *           useClass: AccessKeyReadPostgresRepository,
 *         },
 *         {
 *           provide: AccessKeyWriteRepoPortToken,
 *           useClass: AccessKeyWritePostgresRepository,
 *         },
 *       ],
 *       imports: [],
 *     }),
 *   ],
 * })
 * export class AccessKeyInfraModule {}
 * ```
 */
@Module({})
export class AccessKeyModule {
  /**
   * 注册访问密钥模块
   *
   * @description
   * 动态注册访问密钥模块，配置模块的提供者和导入。
   * 该方法会注册所有命令处理器、事件处理器和查询处理器，
   * 并允许外部注入仓储实现等依赖。
   *
   * @param options - 模块配置选项
   * @param options.inject - 需要注入的提供者数组，通常包括仓储实现的提供者
   * @param options.imports - 需要导入的其他模块数组
   * @returns 返回配置好的动态模块，包含所有处理器和注入的提供者
   *
   * @example
   * ```typescript
   * AccessKeyModule.register({
   *   inject: [
   *     {
   *       provide: AccessKeyReadRepoPortToken,
   *       useClass: AccessKeyReadPostgresRepository,
   *     },
   *   ],
   *   imports: [SomeOtherModule],
   * })
   * ```
   */
  static register(options: {
    inject: Provider[];
    imports: any[];
  }): DynamicModule {
    return {
      module: AccessKeyModule,
      imports: [...options.imports],
      providers: [
        ...PubSubCommandHandlers,
        ...EventHandlers,
        ...QueryHandlers,
        ...options.inject,
      ],
      exports: [...QueryHandlers],
    };
  }
}
