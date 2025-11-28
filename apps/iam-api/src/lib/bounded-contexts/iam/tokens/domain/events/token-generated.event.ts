import { IEvent } from '@nestjs/cqrs';

/**
 * 令牌生成事件
 *
 * @description
 * 当新的访问令牌和刷新令牌被生成时发布的领域事件。该事件可以被其他有界上下文订阅，
 * 用于执行后续操作，如记录令牌生成日志、更新用户最后登录时间、发送通知等。
 *
 * @implements {IEvent}
 */
export class TokenGeneratedEvent implements IEvent {
  /**
   * 构造函数
   *
   * @param accessToken - 生成的访问令牌
   * @param refreshToken - 生成的刷新令牌
   * @param userId - 用户的唯一标识符
   * @param username - 用户名
   * @param domain - 用户所属的域代码
   * @param ip - 生成令牌时的 IP 地址
   * @param address - 生成令牌时的地理位置信息
   * @param userAgent - 生成令牌时的用户代理信息
   * @param requestId - 请求的唯一标识符
   * @param type - 令牌生成类型，例如：password（密码登录）、token（令牌刷新）
   * @param port - 生成令牌时的端口号，可选
   */
  constructor(
    public readonly accessToken: string,
    public readonly refreshToken: string,
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
