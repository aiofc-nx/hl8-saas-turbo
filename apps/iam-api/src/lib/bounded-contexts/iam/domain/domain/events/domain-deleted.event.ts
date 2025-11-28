import { IEvent } from '@nestjs/cqrs';

/**
 * 域删除事件
 *
 * @description
 * 当域被删除时发布的领域事件。该事件可以被其他有界上下文订阅，
 * 用于执行后续操作，如清理权限、删除关联数据、发送通知等。
 *
 * @implements {IEvent}
 */
export class DomainDeletedEvent implements IEvent {
  /**
   * 构造函数
   *
   * @param domainId - 被删除的域的唯一标识符
   * @param code - 被删除的域的唯一代码
   */
  constructor(
    public readonly domainId: string,
    public readonly code: string,
  ) {}
}
