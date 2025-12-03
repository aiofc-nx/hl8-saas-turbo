import { EntityManager, FilterQuery } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';

import type { EndpointProperties } from '@/lib/bounded-contexts/api-endpoint/api-endpoint/domain/endpoint.read.model';
import type { ApiEndpointReadRepoPort } from '@/lib/bounded-contexts/api-endpoint/api-endpoint/ports/api-endpoint.read.repo-port';
import { PageEndpointsQuery } from '@/lib/bounded-contexts/api-endpoint/api-endpoint/queries/page-endpoints.query';

import { PaginationResult } from '@hl8/rest';

/**
 * API 端点读取仓储实现
 *
 * @description 使用 MikroORM EntityManager 实现 API 端点数据的读取操作
 */
@Injectable()
export class ApiEndpointReadRepository implements ApiEndpointReadRepoPort {
  constructor(private readonly em: EntityManager) {}

  /**
   * 分页查询 API 端点
   *
   * @param query - 分页查询参数
   * @returns 分页结果
   */
  async pageEndpoints(
    query: PageEndpointsQuery,
  ): Promise<PaginationResult<EndpointProperties>> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: FilterQuery<any> = {};

    if (query.path) {
      where.path = { $like: `%${query.path}%` };
    }

    if (query.method) {
      where.method = query.method;
    }

    if (query.action) {
      where.action = query.action;
    }

    if (query.resource) {
      where.resource = { $like: `%${query.resource}%` };
    }

    const [endpoints, total] = await this.em.findAndCount(
      'SysEndpoint',
      where,
      {
        limit: query.size,
        offset: (query.current - 1) * query.size,
        orderBy: [
          { createdAt: 'ASC' },
          { controller: 'ASC' },
          { path: 'ASC' },
          { method: 'ASC' },
          { action: 'ASC' },
        ],
      },
    );

    return new PaginationResult<EndpointProperties>(
      query.current,
      query.size,
      total,
      endpoints as EndpointProperties[],
    );
  }

  /**
   * 根据 ID 列表查找 API 端点
   *
   * @param ids - API 端点 ID 列表
   * @returns API 端点属性列表
   */
  async findEndpointsByIds(ids: string[]): Promise<EndpointProperties[]> {
    const endpoints = await this.em.find('SysEndpoint', {
      id: { $in: ids },
    } as FilterQuery<any>);
    return endpoints as EndpointProperties[];
  }

  /**
   * 查询所有 API 端点
   *
   * @returns API 端点属性列表
   */
  async findAll(): Promise<EndpointProperties[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const endpoints = await this.em.find('SysEndpoint', {} as FilterQuery<any>);
    return endpoints as EndpointProperties[];
  }

  /**
   * 查询所有需要权限的 API 端点
   *
   * @returns API 端点属性列表
   */
  async findAllPermissionApi(): Promise<EndpointProperties[]> {
    const endpoints = await this.em.find('SysEndpoint', {
      $and: [{ action: { $ne: '' } }, { resource: { $ne: '' } }],
    } as FilterQuery<any>);
    return endpoints as EndpointProperties[];
  }
}
