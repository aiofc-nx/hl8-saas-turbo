import { DynamicModule, Module, Provider } from '@nestjs/common';

import { EventHandlers } from './application/event-handlers';
import { QueryHandlers } from './application/query-handlers';

/**
 * 令牌模块
 *
 * @description
 * 令牌有界上下文的应用模块，采用动态模块模式注册。
 * 该模块负责注册令牌相关的查询处理器和事件处理器，
 * 并允许基础设施层注入仓储实现等依赖。
 *
 * 该模块遵循 Clean Architecture 的分层原则，将应用层的处理器与基础设施层的实现解耦。
 * 令牌用于用户认证和授权，包括访问令牌和刷新令牌的管理。
 *
 * @example
 * ```typescript
 * // 在基础设施模块中使用
 * @Module({
 *   imports: [
 *     TokensModule.register({
 *       inject: [
 *         {
 *           provide: TokensReadRepoPortToken,
 *           useClass: TokensReadPostgresRepository,
 *         },
 *         {
 *           provide: TokensWriteRepoPortToken,
 *           useClass: TokensWritePostgresRepository,
 *         },
 *       ],
 *       imports: [],
 *     }),
 *   ],
 * })
 * export class TokensInfraModule {}
 * ```
 */
@Module({})
export class TokensModule {
  /**
   * 注册令牌模块
   *
   * @description
   * 动态注册令牌模块，配置模块的提供者和导入。
   * 该方法会注册所有查询处理器和事件处理器，
   * 并允许外部注入仓储实现等依赖。
   *
   * @param options - 模块配置选项
   * @param options.inject - 需要注入的提供者数组，通常包括仓储实现的提供者
   * @param options.imports - 需要导入的其他模块数组
   * @returns 返回配置好的动态模块，包含所有处理器和注入的提供者
   *
   * @example
   * ```typescript
   * TokensModule.register({
   *   inject: [
   *     {
   *       provide: TokensReadRepoPortToken,
   *       useClass: TokensReadPostgresRepository,
   *     },
   *     {
   *       provide: TokensWriteRepoPortToken,
   *       useClass: TokensWritePostgresRepository,
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
      module: TokensModule,
      imports: [...options.imports],
      providers: [...EventHandlers, ...QueryHandlers, ...options.inject],
      exports: [...QueryHandlers],
    };
  }
}
