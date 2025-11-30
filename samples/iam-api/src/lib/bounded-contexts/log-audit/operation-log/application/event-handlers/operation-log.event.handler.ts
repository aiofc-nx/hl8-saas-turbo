import { Inject } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import { EVENT_OPERATION_LOG_CREATED } from '@hl8/constants';

import { OperationLogWriteRepoPortToken } from '../../constants';
import { OperationLog } from '../../domain/operation-log.model';
import type { OperationLogProperties } from '../../domain/operation-log.read.model';
import type { OperationLogWriteRepoPort } from '../../ports/operation-log.write.repo-port';

/**
 * 操作日志事件处理器
 *
 * @description 处理操作日志创建事件，当操作日志需要被记录时，自动创建并保存操作日志记录。
 * 该处理器使用NestJS的事件发射器机制，监听EVENT_OPERATION_LOG_CREATED事件并执行相应的业务逻辑。
 *
 * @example
 * ```typescript
 * // 事件发布后自动触发
 * eventEmitter.emit(EVENT_OPERATION_LOG_CREATED, {
 *   userId: 'user-123',
 *   username: 'john.doe',
 *   domain: 'example.com',
 *   moduleName: 'user-management',
 *   // ... 其他属性
 * });
 * ```
 */
export class OperationLogEventHandler {
  /**
   * 创建操作日志事件处理器
   *
   * @param operationLogWriteRepo - 操作日志写入仓储端口，通过依赖注入获取
   */
  constructor(
    @Inject(OperationLogWriteRepoPortToken)
    private readonly operationLogWriteRepo: OperationLogWriteRepoPort,
  ) {}

  /**
   * 处理操作日志创建事件
   *
   * @description 当操作日志创建事件发生时，根据事件数据创建操作日志聚合根并保存到持久化存储中。
   * 该方法是事件驱动的，自动响应EVENT_OPERATION_LOG_CREATED事件。
   *
   * @param operationLogProperties - 操作日志属性对象，包含操作相关的所有信息
   * @returns Promise<void> 保存操作完成后的Promise
   * @throws {Error} 当保存操作失败时抛出错误
   */
  @OnEvent(EVENT_OPERATION_LOG_CREATED)
  async handle(operationLogProperties: OperationLogProperties) {
    const operationLog = new OperationLog(operationLogProperties);
    await this.operationLogWriteRepo.save(operationLog);
  }
}
