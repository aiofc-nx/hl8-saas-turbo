import { IEvent } from '@nestjs/cqrs';

/**
 * 用户删除事件
 *
 * @description
 * 当用户被删除时发布的领域事件。该事件可以被其他有界上下文订阅，
 * 用于执行后续操作，如清理权限、撤销令牌、删除关联数据、发送通知等。
 *
 * @implements {IEvent}
 */
export class UserDeletedEvent implements IEvent {
  /**
   * 构造函数
   *
   * @param userId - 用户的唯一标识符
   * @param username - 用户名
   * @param domain - 用户所属的域代码
   */
  constructor(
    public readonly userId: string,
    public readonly username: string,
    public readonly domain: string,
  ) {}
}
