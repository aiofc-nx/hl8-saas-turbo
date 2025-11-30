import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { TokensReadRepoPortToken } from '../../constants';
import { TokensReadModel } from '../../domain/tokens.read.model';
import type { TokensReadRepoPort } from '../../ports/tokens.read.repo-port';
import { TokensByRefreshTokenQuery } from '../../queries/tokens.by-refresh_token.query';

/**
 * 根据刷新令牌查询令牌处理器
 *
 * @description
 * 处理 TokensByRefreshTokenQuery 查询，根据刷新令牌查询令牌信息。
 * 主要用于令牌刷新流程中，验证刷新令牌的有效性。
 *
 * @implements {IQueryHandler<TokensByRefreshTokenQuery, TokensReadModel | null>}
 */
@QueryHandler(TokensByRefreshTokenQuery)
export class TokensByRefreshTokenQueryHandler
  implements IQueryHandler<TokensByRefreshTokenQuery, TokensReadModel | null>
{
  /**
   * 令牌读取仓储端口
   *
   * @description 用于查询令牌数据的仓储接口
   */
  @Inject(TokensReadRepoPortToken)
  private readonly repository: TokensReadRepoPort;

  /**
   * 执行查询
   *
   * @description 根据刷新令牌查询令牌信息
   *
   * @param query - 查询对象，包含刷新令牌
   * @returns 返回令牌读取模型，如果不存在则返回 null
   */
  async execute(
    query: TokensByRefreshTokenQuery,
  ): Promise<TokensReadModel | null> {
    return this.repository.findTokensByRefreshToken(query.refreshToken);
  }
}
