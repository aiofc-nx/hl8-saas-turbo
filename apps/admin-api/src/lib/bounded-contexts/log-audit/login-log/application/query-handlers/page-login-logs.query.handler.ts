import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { PaginationResult } from '@hl8/rest';

import { LoginLogReadRepoPortToken } from '../../constants';
import type { LoginLogProperties } from '../../domain/login-log.read.model';
import type { LoginLogReadRepoPort } from '../../ports/login-log.read.repo-port';
import { PageLoginLogsQuery } from '../../queries/page-login-logs.query';

/**
 * 分页查询登录日志查询处理器
 *
 * @description 处理分页查询登录日志的查询请求，遵循CQRS模式的查询处理器规范。
 * 该处理器负责协调查询对象和仓储端口，执行登录日志的分页查询操作。
 *
 * @example
 * ```typescript
 * // 通过CQRS总线发送查询
 * const query = new PageLoginLogsQuery({ page: 1, pageSize: 10 });
 * const result = await queryBus.execute(query);
 * ```
 */
@QueryHandler(PageLoginLogsQuery)
export class PageLoginLogsQueryHandler
  implements
    IQueryHandler<PageLoginLogsQuery, PaginationResult<LoginLogProperties>>
{
  /**
   * 登录日志读取仓储端口
   *
   * @description 通过依赖注入获取的登录日志读取仓储，用于执行实际的查询操作。
   */
  @Inject(LoginLogReadRepoPortToken)
  private readonly repository: LoginLogReadRepoPort;

  /**
   * 执行分页查询登录日志
   *
   * @description 根据查询对象中的分页参数和筛选条件，从仓储中获取登录日志列表。
   *
   * @param query - 分页查询登录日志的查询对象
   * @returns Promise<PaginationResult<LoginLogProperties>> 包含登录日志列表和分页信息的结果
   * @throws {Error} 当查询操作失败时抛出错误
   */
  async execute(
    query: PageLoginLogsQuery,
  ): Promise<PaginationResult<LoginLogProperties>> {
    return this.repository.pageLoginLogs(query);
  }
}
