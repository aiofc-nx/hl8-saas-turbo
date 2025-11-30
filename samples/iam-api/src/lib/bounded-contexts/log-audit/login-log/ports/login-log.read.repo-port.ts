import { PaginationResult } from '@hl8/rest';

import type { LoginLogProperties } from '../domain/login-log.read.model';
import { PageLoginLogsQuery } from '../queries/page-login-logs.query';

/**
 * 登录日志读取仓储端口
 *
 * @description 定义登录日志的查询操作接口，遵循端口适配器模式。
 * 该接口用于从持久化存储中查询登录日志数据，支持分页和条件筛选，实现类由基础设施层提供。
 *
 * @example
 * ```typescript
 * class LoginLogMikroOrmRepository implements LoginLogReadRepoPort {
 *   async pageLoginLogs(query: PageLoginLogsQuery): Promise<PaginationResult<LoginLogProperties>> {
 *     // 实现分页查询逻辑
 *   }
 * }
 * ```
 */
export interface LoginLogReadRepoPort {
  /**
   * 分页查询登录日志
   *
   * @description 根据查询条件分页获取登录日志列表，支持按用户名、域名、地址、类型等条件筛选。
   *
   * @param query - 分页查询参数，包含分页信息和筛选条件
   * @returns Promise<PaginationResult<LoginLogProperties>> 包含登录日志列表和分页信息的结果
   * @throws {Error} 当查询操作失败时抛出错误
   *
   * @example
   * ```typescript
   * const query = new PageLoginLogsQuery({
   *   page: 1,
   *   pageSize: 10,
   *   username: 'john.doe',
   *   domain: 'example.com'
   * });
   * const result = await repository.pageLoginLogs(query);
   * ```
   */
  pageLoginLogs(
    query: PageLoginLogsQuery,
  ): Promise<PaginationResult<LoginLogProperties>>;
}
