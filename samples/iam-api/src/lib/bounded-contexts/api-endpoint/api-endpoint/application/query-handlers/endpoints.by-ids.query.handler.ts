import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { ApiEndpointReadRepoPortToken } from '../../constants';
import type { EndpointProperties } from '../../domain/endpoint.read.model';
import type { ApiEndpointReadRepoPort } from '../../ports/api-endpoint.read.repo-port';
import { FindEndpointsByIdsQuery } from '../../queries/endpoints.by-ids.query';

/**
 * 根据 ID 列表查询端点处理器
 *
 * @description
 * 处理 FindEndpointsByIdsQuery 查询，负责根据端点 ID 列表批量查询 API 端点信息。
 * 通常用于权限分配时获取指定的端点详情。
 *
 * @implements {IQueryHandler<FindEndpointsByIdsQuery, EndpointProperties[]>}
 */
@QueryHandler(FindEndpointsByIdsQuery)
export class FindEndpointsByIdsQueryHandler
  implements IQueryHandler<FindEndpointsByIdsQuery, EndpointProperties[]>
{
  /**
   * API 端点读取仓储端口
   *
   * @description 用于查询 API 端点的仓储接口
   */
  @Inject(ApiEndpointReadRepoPortToken)
  private readonly repository: ApiEndpointReadRepoPort;

  /**
   * 执行根据 ID 列表查询端点
   *
   * @description 根据查询对象中的 ID 列表批量查询 API 端点信息
   *
   * @param query - 查询对象，包含要查询的端点 ID 数组
   * @returns 返回端点属性数组
   */
  async execute(query: FindEndpointsByIdsQuery): Promise<EndpointProperties[]> {
    return this.repository.findEndpointsByIds(query.ids);
  }
}
