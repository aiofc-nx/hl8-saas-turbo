import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { PaginationResult } from '@hl8/rest';

import { ApiEndpointReadRepoPortToken } from '../../constants';
import type { EndpointProperties } from '../../domain/endpoint.read.model';
import type { ApiEndpointReadRepoPort } from '../../ports/api-endpoint.read.repo-port';
import { PageEndpointsQuery } from '../../queries/page-endpoints.query';

/**
 * 端点分页查询处理器
 *
 * @description
 * 处理 PageEndpointsQuery 查询，负责分页查询 API 端点列表。
 * 支持按路径、HTTP 方法、操作和资源筛选，返回分页结果。
 *
 * @implements {IQueryHandler<PageEndpointsQuery, PaginationResult<EndpointProperties>>}
 */
@QueryHandler(PageEndpointsQuery)
export class PageEndpointsQueryHandler
  implements
    IQueryHandler<PageEndpointsQuery, PaginationResult<EndpointProperties>>
{
  /**
   * API 端点读取仓储端口
   *
   * @description 用于查询 API 端点的仓储接口
   */
  @Inject(ApiEndpointReadRepoPortToken)
  private readonly repository: ApiEndpointReadRepoPort;

  /**
   * 执行分页查询端点
   *
   * @description 根据查询条件分页查询 API 端点列表，支持按路径、方法、操作和资源筛选
   *
   * @param query - 分页查询对象，包含分页参数、路径、方法、操作、资源等筛选条件
   * @returns 返回分页结果，包含 API 端点列表和分页信息
   */
  async execute(
    query: PageEndpointsQuery,
  ): Promise<PaginationResult<EndpointProperties>> {
    return this.repository.pageEndpoints(query);
  }
}
