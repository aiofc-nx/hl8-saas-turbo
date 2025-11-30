import { Inject } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';

import { TokensWriteRepoPortToken } from '../../constants';
import { RefreshTokenUsedEvent } from '../../domain/events/refreshtoken-used.event';
import type { TokensWriteRepoPort } from '../../ports/tokens.write.repo-port';

/**
 * 刷新令牌使用事件处理器
 *
 * @description
 * 处理 RefreshTokenUsedEvent 事件，当刷新令牌被使用时，更新令牌状态为已使用。
 * 该处理器确保刷新令牌只能使用一次，提高系统安全性。
 *
 * @implements {IEventHandler<RefreshTokenUsedEvent>}
 */
@EventsHandler(RefreshTokenUsedEvent)
export class RefreshTokenUsedEventHandler
  implements IEventHandler<RefreshTokenUsedEvent>
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
   * 处理刷新令牌使用事件
   *
   * @description
   * 当刷新令牌使用事件发布时，更新数据库中对应令牌的状态为已使用。
   * 这确保刷新令牌只能使用一次，防止令牌被重复使用。
   *
   * @param event - 刷新令牌使用事件，包含刷新令牌和新的状态
   * @returns Promise<void>
   */
  async handle(event: RefreshTokenUsedEvent) {
    await this.tokensWriteRepository.updateTokensStatus(
      event.refreshToken,
      event.status,
    );
  }
}
