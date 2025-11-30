import { EntityManager, FilterQuery } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';

import type { OperationLogProperties } from '@/lib/bounded-contexts/log-audit/operation-log/domain/operation-log.read.model';
import type { OperationLogReadRepoPort } from '@/lib/bounded-contexts/log-audit/operation-log/ports/operation-log.read.repo-port';
import { PageOperationLogsQuery } from '@/lib/bounded-contexts/log-audit/operation-log/queries/page-operation-logs.query';

import { PaginationResult } from '@hl8/rest';

/**
 * OperationLog 读取仓储实现
 *
 * @description 使用 MikroORM EntityManager 实现 OperationLog 数据的读取操作
 */
@Injectable()
export class OperationLogReadRepository implements OperationLogReadRepoPort {
  constructor(private readonly em: EntityManager) {}

  /**
   * 分页查询操作日志
   *
   * @param query - 分页查询参数
   * @returns 分页结果
   */
  async pageOperationLogs(
    query: PageOperationLogsQuery,
  ): Promise<PaginationResult<OperationLogProperties>> {
    const where: FilterQuery<any> = {};

    if (query.username) {
      where.username = { $like: `%${query.username}%` };
    }

    if (query.domain) {
      where.domain = query.domain;
    }

    if (query.moduleName) {
      where.moduleName = { $like: `%${query.moduleName}%` };
    }

    if (query.method) {
      where.method = query.method;
    }

    const [operationLogs, total] = await this.em.findAndCount(
      'SysOperationLog',
      where,
      {
        limit: query.size,
        offset: (query.current - 1) * query.size,
        orderBy: [{ createdAt: 'DESC' }],
      },
    );

    return new PaginationResult<OperationLogProperties>(
      query.current,
      query.size,
      total,
      operationLogs as OperationLogProperties[],
    );
  }
}
