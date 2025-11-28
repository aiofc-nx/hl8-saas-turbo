import { IEvent } from '@nestjs/cqrs';

/**
 * 用户创建事件
 *
 * @description
 * 当用户被创建时发布的领域事件。该事件可以被其他有界上下文订阅，
 * 用于执行后续操作，如初始化权限、发送欢迎邮件、创建默认配置等。
 *
 * @implements {IEvent}
 */
export class UserCreatedEvent implements IEvent {
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
