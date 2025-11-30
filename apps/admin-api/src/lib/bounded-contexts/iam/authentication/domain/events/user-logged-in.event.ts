import { IEvent } from '@nestjs/cqrs';

/**
 * 用户登录事件
 *
 * @description
 * 当用户成功登录时发布的领域事件。该事件可以被其他有界上下文订阅，
 * 用于执行后续操作，如记录登录日志、更新最后登录时间、发送通知等。
 *
 * @implements {IEvent}
 */
export class UserLoggedInEvent implements IEvent {
  /**
   * 构造函数
   *
   * @param userId - 用户的唯一标识符
   * @param username - 用户名
   * @param domain - 用户所属的域代码
   * @param ip - 登录时的 IP 地址
   * @param address - 登录时的地理位置信息
   * @param userAgent - 登录时的用户代理信息
   * @param requestId - 请求的唯一标识符
   * @param type - 登录类型，例如：password（密码登录）、token（令牌登录）
   * @param port - 登录时的端口号，可选
   */
  constructor(
    public readonly userId: string,
    public readonly username: string,
    public readonly domain: string,
    public readonly ip: string,
    public readonly address: string,
    public readonly userAgent: string,
    public readonly requestId: string,
    public readonly type: string,
    public readonly port?: number | null,
  ) {}
}
