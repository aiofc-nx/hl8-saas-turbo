import { OperationLog } from '../domain/operation-log.model';

/**
 * 操作日志写入仓储端口
 *
 * @description 定义操作日志的持久化写入操作接口，遵循端口适配器模式。
 * 该接口用于将操作日志聚合根保存到持久化存储中，实现类由基础设施层提供。
 *
 * @example
 * ```typescript
 * class OperationLogMikroOrmRepository implements OperationLogWriteRepoPort {
 *   async save(operationLog: OperationLog): Promise<void> {
 *     // 实现保存逻辑
 *   }
 * }
 * ```
 */
export interface OperationLogWriteRepoPort {
  /**
   * 保存操作日志
   *
   * @description 将操作日志聚合根持久化到存储中。
   *
   * @param operationLog - 待保存的操作日志聚合根
   * @returns Promise<void> 保存操作完成后的Promise
   * @throws {Error} 当保存操作失败时抛出错误
   */
  save(operationLog: OperationLog): Promise<void>;
}
