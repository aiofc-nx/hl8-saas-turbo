import { Inject } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';

import { TokenStatus, TokensWriteRepoPortToken } from '../../constants';
import { TokenGeneratedEvent } from '../../domain/events/token-generated.event';
import { TokensEntity } from '../../domain/tokens.entity';
import type { TokensProperties } from '../../domain/tokens.read.model';
import type { TokensWriteRepoPort } from '../../ports/tokens.write.repo-port';

/**
 * 令牌生成事件处理器
 *
 * @description
 * 处理 TokenGeneratedEvent 事件，当新令牌生成时，将令牌信息保存到数据库。
 * 该处理器负责持久化令牌记录，用于后续的令牌验证和审计。
 *
 * @implements {IEventHandler<TokenGeneratedEvent>}
 */
@EventsHandler(TokenGeneratedEvent)
export class TokenGeneratedEventHandler
  implements IEventHandler<TokenGeneratedEvent>
{
  /**
   * 构造函数
   */
  constructor() {}

  /**
   * 令牌写入仓储端口
   *
   * @description 用于持久化令牌数据的仓储接口
   */
  @Inject(TokensWriteRepoPortToken)
  private readonly tokensWriteRepository: TokensWriteRepoPort;

  /**
   * 处理令牌生成事件
   *
   * @description
   * 当令牌生成事件发布时，创建令牌聚合根并保存到数据库。
   * 令牌初始状态设置为未使用（UNUSED）。
   *
   * @param event - 令牌生成事件，包含访问令牌、刷新令牌和相关信息
   * @returns Promise<void>
   */
  async handle(event: TokenGeneratedEvent) {
    const tokensProperties: TokensProperties = {
      accessToken: event.accessToken,
      refreshToken: event.refreshToken,
      status: TokenStatus.UNUSED,
      userId: event.userId,
      username: event.username,
      domain: event.domain,
      ip: event.ip,
      port: event.port,
      address: event.address,
      userAgent: event.userAgent,
      requestId: event.requestId,
      type: event.type,
      createdBy: event.userId,
    };
    const tokens = new TokensEntity(tokensProperties);

    await this.tokensWriteRepository.save(tokens);
  }
}
