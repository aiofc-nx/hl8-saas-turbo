import { TokensReadModel } from '../domain/tokens.read.model';

/**
 * 令牌读取仓储端口
 *
 * @description
 * 定义令牌的读取操作接口，遵循端口适配器模式。
 * 该接口由基础设施层实现，用于查询令牌数据。
 *
 * @interface TokensReadRepoPort
 */
export interface TokensReadRepoPort {
  /**
   * 根据刷新令牌查找令牌
   *
   * @description
   * 从数据库中查询指定刷新令牌的令牌信息。
   * 用于令牌刷新流程中验证刷新令牌的有效性。
   *
   * @param refreshToken - 刷新令牌字符串
   * @returns 返回令牌读取模型，如果不存在则返回 null
   */
  findTokensByRefreshToken(
    refreshToken: string,
  ): Promise<TokensReadModel | null>;
}
