import { EntityManager } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';

import { OperationLog } from '@/lib/bounded-contexts/log-audit/operation-log/domain/operation-log.model';
import type { OperationLogWriteRepoPort } from '@/lib/bounded-contexts/log-audit/operation-log/ports/operation-log.write.repo-port';

/**
 * OperationLog 写入仓储实现
 *
 * @description 使用 MikroORM EntityManager 实现 OperationLog 数据的写入操作
 */
@Injectable()
export class OperationLogWriteRepository implements OperationLogWriteRepoPort {
  constructor(private readonly em: EntityManager) {}

  /**
   * 保存操作日志
   *
   * @param operationLog - 操作日志聚合根
   * @returns Promise<void>
   */
  async save(operationLog: OperationLog): Promise<void> {
    const operationLogData = { ...operationLog };
    const newOperationLog = this.em.create('SysOperationLog', operationLogData);
    await this.em.persistAndFlush(newOperationLog);
  }
}
