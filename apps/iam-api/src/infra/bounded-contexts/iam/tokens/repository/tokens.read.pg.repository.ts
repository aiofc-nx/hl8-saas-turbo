import { EntityManager, FilterQuery } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';

import { TokensReadModel } from '@/lib/bounded-contexts/iam/tokens/domain/tokens.read.model';
import type { TokensReadRepoPort } from '@/lib/bounded-contexts/iam/tokens/ports/tokens.read.repo-port';

/**
 * Tokens 读取仓储实现
 *
 * @description 使用 MikroORM EntityManager 实现 Tokens 数据的读取操作
 */
@Injectable()
export class TokensReadRepository implements TokensReadRepoPort {
  constructor(private readonly em: EntityManager) {}

  /**
   * 根据刷新令牌查找 Tokens
   *
   * @param refreshToken - 刷新令牌
   * @returns Tokens 读取模型或 null
   */
  async findTokensByRefreshToken(
    refreshToken: string,
  ): Promise<TokensReadModel | null> {
    const tokens = await this.em.findOne('SysTokens', {
      refreshToken,
    } as FilterQuery<any>);
    return tokens as TokensReadModel | null;
  }
}
