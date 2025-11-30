import { AggregateRoot } from '@nestjs/cqrs';

import { TokenStatus } from '../constants';

import { RefreshTokenUsedEvent } from './events/refreshtoken-used.event';
import type { TokensProperties } from './tokens.read.model';

/**
 * 令牌接口
 *
 * @description 定义令牌聚合根的基本接口，包含提交领域事件的方法
 */
export interface ITokens {
  /**
   * 提交领域事件
   *
   * @description 提交所有待处理的领域事件到事件总线
   */
  commit(): void;
}

/**
 * 令牌聚合根
 *
 * @description
 * 令牌的领域模型，是令牌有界上下文的聚合根。
 * 负责管理令牌的生命周期和业务规则，包括刷新令牌的使用检查，
 * 并发布领域事件。令牌用于用户认证和授权，包括访问令牌和刷新令牌。
 *
 * @extends {AggregateRoot}
 * @implements {ITokens}
 */
export class TokensEntity extends AggregateRoot implements ITokens {
  /**
   * 访问令牌
   *
   * @description JWT 访问令牌，用于 API 请求的身份验证
   */
  readonly accessToken: string;

  /**
   * 刷新令牌
   *
   * @description JWT 刷新令牌，用于获取新的访问令牌
   */
  readonly refreshToken: string;

  /**
   * 令牌状态
   *
   * @description 令牌的使用状态，可选值：UNUSED（未使用）、USED（已使用）
   */
  status: string;

  /**
   * 用户 ID
   *
   * @description 令牌所属用户的唯一标识符
   */
  readonly userId: string;

  /**
   * 用户名
   *
   * @description 令牌所属用户的用户名
   */
  readonly username: string;

  /**
   * 域
   *
   * @description 用户所属的域代码，用于多租户隔离
   */
  readonly domain: string;

  /**
   * IP 地址
   *
   * @description 生成令牌时的客户端 IP 地址
   */
  readonly ip: string;

  /**
   * 地址
   *
   * @description 生成令牌时的地理位置信息
   */
  readonly address: string;

  /**
   * 用户代理
   *
   * @description 生成令牌时的用户代理信息
   */
  readonly userAgent: string;

  /**
   * 请求 ID
   *
   * @description 生成令牌时的请求唯一标识符
   */
  readonly requestId: string;

  /**
   * 类型
   *
   * @description 令牌生成类型，例如：password（密码登录）、token（令牌刷新）
   */
  readonly type: string;

  /**
   * 创建者
   *
   * @description 创建令牌的用户 ID
   */
  readonly createdBy: string;

  /**
   * 端口
   *
   * @description 生成令牌时的端口号，可选
   */
  readonly port?: number | null;

  /**
   * 构造函数
   *
   * @description 创建令牌聚合根实例
   *
   * @param properties - 令牌属性对象
   */
  constructor(properties: TokensProperties) {
    super();
    Object.assign(this, properties);
  }

  /**
   * 检查刷新令牌是否可用
   *
   * @description
   * 验证刷新令牌是否已被使用。如果令牌状态为未使用，则发布刷新令牌使用事件，
   * 将状态标记为已使用；如果已被使用，则抛出异常。
   *
   * @returns Promise<void>
   *
   * @throws {Error} 当刷新令牌已被使用时抛出异常
   */
  async refreshTokenCheck() {
    if (this.status !== TokenStatus.UNUSED) {
      throw new Error('Token has already been used.');
    } else {
      this.apply(
        new RefreshTokenUsedEvent(this.refreshToken, TokenStatus.USED),
      );
    }
  }
}
