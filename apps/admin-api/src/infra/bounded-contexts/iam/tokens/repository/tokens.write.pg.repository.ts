import { EntityManager, FilterQuery } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';

import { TokensEntity } from '@/lib/bounded-contexts/iam/tokens/domain/tokens.entity';
import type { TokensWriteRepoPort } from '@/lib/bounded-contexts/iam/tokens/ports/tokens.write.repo-port';

/**
 * Tokens 写入仓储实现
 *
 * @description 使用 MikroORM EntityManager 实现 Tokens 数据的写入操作
 */
@Injectable()
export class TokensWriteRepository implements TokensWriteRepoPort {
  constructor(private readonly em: EntityManager) {}

  /**
   * 保存 Tokens
   *
   * @param tokens - Tokens 实体
   * @returns Promise<void>
   */
  async save(tokens: TokensEntity): Promise<void> {
    const tokensData = { ...tokens };
    // 使用 refreshToken 作为主键 ID（根据实体注释）
    const newTokens = this.em.create('SysTokens', {
      ...tokensData,
      id: tokens.refreshToken,
      createdAt: new Date(),
    });
    await this.em.persistAndFlush(newTokens);
  }

  /**
   * 更新 Tokens 状态
   *
   * @param refreshToken - 刷新令牌
   * @param status - 状态
   * @returns Promise<void>
   */
  async updateTokensStatus(
    refreshToken: string,
    status: string,
  ): Promise<void> {
    await this.em.nativeUpdate(
      'SysTokens',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { refreshToken } as FilterQuery<any>,
      { status },
    );
  }
}
