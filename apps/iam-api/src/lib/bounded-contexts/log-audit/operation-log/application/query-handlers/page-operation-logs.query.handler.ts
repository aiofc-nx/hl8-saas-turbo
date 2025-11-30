import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { PaginationResult } from '@hl8/rest';

import { OperationLogReadRepoPortToken } from '../../constants';
import type { OperationLogProperties } from '../../domain/operation-log.read.model';
import type { OperationLogReadRepoPort } from '../../ports/operation-log.read.repo-port';
import { PageOperationLogsQuery } from '../../queries/page-operation-logs.query';

/**
 * 分页查询操作日志查询处理器
 *
 * @description 处理分页查询操作日志的查询请求，遵循CQRS模式的查询处理器规范。
 * 该处理器负责协调查询对象和仓储端口，执行操作日志的分页查询操作。
 *
 * @example
 * ```typescript
 * // 通过CQRS总线发送查询
 * const query = new PageOperationLogsQuery({ page: 1, pageSize: 10 });
 * const result = await queryBus.execute(query);
 * ```
 */
@QueryHandler(PageOperationLogsQuery)
export class PageOperationLogsQueryHandler
  implements
    IQueryHandler<
      PageOperationLogsQuery,
      PaginationResult<OperationLogProperties>
    >
{
  /**
   * 操作日志读取仓储端口
   *
   * @description 通过依赖注入获取的操作日志读取仓储，用于执行实际的查询操作。
   */
  @Inject(OperationLogReadRepoPortToken)
  private readonly repository: OperationLogReadRepoPort;

  /**
   * 执行分页查询操作日志
   *
   * @description 根据查询对象中的分页参数和筛选条件，从仓储中获取操作日志列表。
   *
   * @param query - 分页查询操作日志的查询对象
   * @returns Promise<PaginationResult<OperationLogProperties>> 包含操作日志列表和分页信息的结果
   * @throws {Error} 当查询操作失败时抛出错误
   */
  async execute(
    query: PageOperationLogsQuery,
  ): Promise<PaginationResult<OperationLogProperties>> {
    return this.repository.pageOperationLogs(query);
  }
}
