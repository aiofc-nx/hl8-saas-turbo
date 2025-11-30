import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { ApiEndpointReadRepoPortToken } from '../../constants';
import {
  EndpointProperties,
  EndpointTreeProperties,
} from '../../domain/endpoint.read.model';
import type { ApiEndpointReadRepoPort } from '../../ports/api-endpoint.read.repo-port';
import { EndpointsQuery } from '../../queries/endpoints.query';

/**
 * 端点查询处理器
 *
 * @description
 * 处理 EndpointsQuery 查询，负责查询所有需要权限控制的 API 端点，
 * 并将结果组织成树形结构，按控制器分组。
 *
 * @implements {IQueryHandler<EndpointsQuery, Readonly<EndpointTreeProperties[]> | []>}
 */
@QueryHandler(EndpointsQuery)
export class EndpointsQueryHandler
  implements
    IQueryHandler<EndpointsQuery, Readonly<EndpointTreeProperties[]> | []>
{
  /**
   * API 端点读取仓储端口
   *
   * @description 用于查询 API 端点的仓储接口
   */
  @Inject(ApiEndpointReadRepoPortToken)
  private readonly repository: ApiEndpointReadRepoPort;

  /**
   * 执行端点查询
   *
   * @description
   * 查询所有需要权限控制的 API 端点，并将结果组织成树形结构。
   * 树形结构按控制器分组，每个控制器节点包含其下的所有端点。
   *
   * @param _ - 查询对象（未使用）
   * @returns 返回树形结构的端点列表，如果没有任何端点则返回空数组
   */
  async execute(
    _: EndpointsQuery,
  ): Promise<Readonly<EndpointTreeProperties[]> | []> {
    const endpoints = await this.repository.findAllPermissionApi();
    return this.createEndpointTree(endpoints);
  }

  /**
   * 创建端点树
   *
   * @description
   * 将扁平化的端点列表转换为树形结构。
   * 按照控制器分组，每个控制器作为父节点，其下的端点作为子节点。
   *
   * @param endpoints - 扁平化的端点属性数组
   * @returns 返回树形结构的端点列表
   */
  private createEndpointTree(
    endpoints: EndpointProperties[],
  ): EndpointTreeProperties[] {
    const tree: EndpointTreeProperties[] = [];

    endpoints.forEach((endpoint) => {
      let node = tree.find((n) => n.controller === endpoint.controller);
      if (!node) {
        node = {
          id: `controller-${endpoint.controller}`,
          path: '',
          method: '',
          action: '',
          resource: '',
          controller: endpoint.controller,
          summary: null,
          createdAt: new Date(),
          updatedAt: null,
          children: [],
        };
        tree.push(node);
      }
      node.children!.push({
        ...endpoint,
        children: [],
      });
    });

    return tree;
  }
}
