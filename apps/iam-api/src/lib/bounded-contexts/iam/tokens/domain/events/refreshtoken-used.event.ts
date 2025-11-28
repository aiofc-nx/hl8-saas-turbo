import { IEvent } from '@nestjs/cqrs';

/**
 * 刷新令牌使用事件
 *
 * @description
 * 当刷新令牌被使用时发布的领域事件。该事件可以被其他有界上下文订阅，
 * 用于执行后续操作，如记录令牌使用日志、更新令牌状态、安全审计等。
 *
 * @implements {IEvent}
 */
export class RefreshTokenUsedEvent implements IEvent {
  /**
   * 构造函数
   *
   * @param refreshToken - 被使用的刷新令牌
   * @param status - 令牌的新状态，通常为 USED（已使用）
   */
  constructor(
    public readonly refreshToken: string,
    public readonly status: string,
  ) {}
}
