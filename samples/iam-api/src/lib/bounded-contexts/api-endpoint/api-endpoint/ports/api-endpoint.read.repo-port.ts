import { PaginationResult } from '@hl8/rest';

import type { EndpointProperties } from '../domain/endpoint.read.model';
import { PageEndpointsQuery } from '../queries/page-endpoints.query';

/**
 * API 端点读取仓储端口
 *
 * @description
 * 定义 API 端点的读取操作接口，遵循端口适配器模式。
 * 该接口由基础设施层实现，用于查询 API 端点数据。
 *
 * @interface ApiEndpointReadRepoPort
 */
export interface ApiEndpointReadRepoPort {
  /**
   * 分页查询 API 端点
   *
   * @description 根据查询条件分页查询 API 端点列表，支持按路径、方法、操作和资源筛选
   *
   * @param query - 分页查询对象，包含分页参数、路径、方法、操作、资源等筛选条件
   * @returns 返回分页结果，包含 API 端点列表和分页信息
   */
  pageEndpoints(
    query: PageEndpointsQuery,
  ): Promise<PaginationResult<EndpointProperties>>;

  /**
   * 根据 ID 列表查找端点
   *
   * @description 批量查询指定 ID 列表的 API 端点信息
   *
   * @param ids - 端点 ID 数组
   * @returns 返回端点属性数组，如果某些 ID 不存在则不会包含在结果中
   */
  findEndpointsByIds(ids: string[]): Promise<EndpointProperties[]>;

  /**
   * 查询所有端点
   *
   * @description 查询所有 API 端点，返回完整的属性列表
   *
   * @returns 返回所有端点的属性数组
   */
  findAll(): Promise<EndpointProperties[]>;

  /**
   * 查询所有需要权限控制的端点
   *
   * @description 查询所有需要权限控制的 API 端点，用于权限管理
   *
   * @returns 返回需要权限控制的端点属性数组
   */
  findAllPermissionApi(): Promise<EndpointProperties[]>;
}
