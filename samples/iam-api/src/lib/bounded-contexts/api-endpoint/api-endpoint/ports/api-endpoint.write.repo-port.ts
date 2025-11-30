import { ApiEndpoint } from '../domain/api-endpoint.model';

/**
 * API 端点写入仓储端口
 *
 * @description
 * 定义 API 端点的写入操作接口，遵循端口适配器模式。
 * 该接口由基础设施层实现，用于持久化 API 端点数据。
 *
 * @interface ApiEndpointWriteRepoPort
 */
export interface ApiEndpointWriteRepoPort {
  /**
   * 保存 API 端点
   *
   * @description
   * 批量保存 API 端点到数据库。通常用于系统启动时自动收集并保存所有 API 端点。
   *
   * @param endpoints - 要保存的 API 端点聚合根数组
   * @returns Promise<void>
   *
   * @throws {Error} 当保存操作失败时抛出异常
   */
  save(endpoints: ApiEndpoint[]): Promise<void>;
}
