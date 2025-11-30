import { DynamicModule, Module, Provider } from '@nestjs/common';

import { EventHandlers } from './application/event-handlers';
import { QueryHandlers } from './application/query-handlers';

/**
 * 操作日志模块
 *
 * @description 操作日志功能模块，提供用户操作日志的记录和查询功能。
 * 该模块采用动态注册模式，允许外部注入仓储实现和其他依赖项。
 * 模块包含事件处理器（用于记录操作日志）和查询处理器（用于查询操作日志）。
 *
 * @example
 * ```typescript
 * OperationLogModule.register({
 *   imports: [MikroOrmModule],
 *   inject: [
 *     {
 *       provide: OperationLogWriteRepoPortToken,
 *       useClass: OperationLogMikroOrmRepository
 *     },
 *     {
 *       provide: OperationLogReadRepoPortToken,
 *       useClass: OperationLogMikroOrmRepository
 *     }
 *   ]
 * })
 * ```
 */
@Module({})
export class OperationLogModule {
  /**
   * 动态注册操作日志模块
   *
   * @description 动态创建并配置操作日志模块，注册事件处理器、查询处理器和外部依赖。
   * 该方法允许灵活配置模块的依赖项，支持不同的仓储实现。
   *
   * @param options - 模块配置选项
   * @param options.inject - 需要注入的提供者数组，通常包括仓储端口的实现
   * @param options.imports - 需要导入的其他模块数组，如数据库模块等
   * @returns DynamicModule 配置完成的动态模块
   */
  static register(options: {
    inject: Provider[];
    imports: any[];
  }): DynamicModule {
    return {
      module: OperationLogModule,
      imports: [...options.imports],
      providers: [...EventHandlers, ...QueryHandlers, ...options.inject],
      exports: [...QueryHandlers],
    };
  }
}
