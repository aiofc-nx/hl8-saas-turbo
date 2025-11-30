import { PaginationResult } from '@hl8/rest';

import type { OperationLogProperties } from '../domain/operation-log.read.model';
import { PageOperationLogsQuery } from '../queries/page-operation-logs.query';

/**
 * 操作日志读取仓储端口
 *
 * @description 定义操作日志的查询操作接口，遵循端口适配器模式。
 * 该接口用于从持久化存储中查询操作日志数据，支持分页和条件筛选，实现类由基础设施层提供。
 *
 * @example
 * ```typescript
 * class OperationLogMikroOrmRepository implements OperationLogReadRepoPort {
 *   async pageOperationLogs(query: PageOperationLogsQuery): Promise<PaginationResult<OperationLogProperties>> {
 *     // 实现分页查询逻辑
 *   }
 * }
 * ```
 */
export interface OperationLogReadRepoPort {
  /**
   * 分页查询操作日志
   *
   * @description 根据查询条件分页获取操作日志列表，支持按用户名、域名、模块名、HTTP方法等条件筛选。
   *
   * @param query - 分页查询参数，包含分页信息和筛选条件
   * @returns Promise<PaginationResult<OperationLogProperties>> 包含操作日志列表和分页信息的结果
   * @throws {Error} 当查询操作失败时抛出错误
   *
   * @example
   * ```typescript
   * const query = new PageOperationLogsQuery({
   *   page: 1,
   *   pageSize: 10,
   *   username: 'john.doe',
   *   domain: 'example.com',
   *   moduleName: 'user-management',
   *   method: 'POST'
   * });
   * const result = await repository.pageOperationLogs(query);
   * ```
   */
  pageOperationLogs(
    query: PageOperationLogsQuery,
  ): Promise<PaginationResult<OperationLogProperties>>;
}
