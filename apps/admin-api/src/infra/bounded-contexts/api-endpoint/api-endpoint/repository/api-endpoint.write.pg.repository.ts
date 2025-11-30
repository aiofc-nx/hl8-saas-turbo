import { EntityManager, FilterQuery } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';

import { ApiEndpoint } from '@/lib/bounded-contexts/api-endpoint/api-endpoint/domain/api-endpoint.model';
import type { ApiEndpointWriteRepoPort } from '@/lib/bounded-contexts/api-endpoint/api-endpoint/ports/api-endpoint.write.repo-port';

/**
 * API 端点写入仓储实现
 *
 * @description 使用 MikroORM EntityManager 实现 API 端点数据的写入操作
 */
@Injectable()
export class ApiEndpointWriteRepository implements ApiEndpointWriteRepoPort {
  constructor(private readonly em: EntityManager) {}

  /**
   * 保存 API 端点列表（批量更新插入和删除）
   *
   * @param endpoints - API 端点列表
   * @returns Promise<void>
   */
  async save(endpoints: ApiEndpoint[]): Promise<void> {
    await this.em.transactional(async (em) => {
      const existingEndpoints = await em.find(
        'SysEndpoint',
        {} as FilterQuery<any>,
      );
      const existingIds = existingEndpoints.map((ep: any) => ep.id);
      const newIds = endpoints.map((ep) => ep.id);
      const idsToDelete = existingIds.filter((id) => !newIds.includes(id));

      // 删除不存在的端点
      if (idsToDelete.length > 0) {
        await em.nativeDelete('SysEndpoint', { id: { $in: idsToDelete } });
      }

      // 批量更新或插入端点
      for (const endpoint of endpoints) {
        const existing = await em.findOne('SysEndpoint', {
          id: endpoint.id,
        } as FilterQuery<any>);
        // 映射字段：确保 controller 字段有值（从 controller 或 controllerName 获取）
        const controller =
          endpoint.controller ||
          (endpoint as any).controllerName ||
          'UnknownController';
        const endpointData = {
          id: endpoint.id,
          path: endpoint.path || '/',
          method: endpoint.method || 'GET',
          action: endpoint.action || '',
          resource: endpoint.resource || '',
          controller: controller,
          summary: endpoint.summary || null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        if (existing) {
          // 更新现有端点
          await em.nativeUpdate(
            'SysEndpoint',
            { id: endpoint.id },
            {
              path: endpointData.path,
              method: endpointData.method,
              action: endpointData.action,
              resource: endpointData.resource,
              controller: endpointData.controller,
              summary: endpointData.summary,
              updatedAt: endpointData.updatedAt,
            },
          );
        } else {
          // 创建新端点
          const newEndpoint = em.create('SysEndpoint', endpointData);
          await em.persist(newEndpoint);
        }
      }

      await em.flush();
    });
  }
}
