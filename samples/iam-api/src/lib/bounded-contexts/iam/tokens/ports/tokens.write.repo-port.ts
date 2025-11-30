import { TokensEntity } from '../domain/tokens.entity';

/**
 * 令牌写入仓储端口
 *
 * @description
 * 定义令牌的写入操作接口，遵循端口适配器模式。
 * 该接口由基础设施层实现，用于持久化令牌数据。
 *
 * @interface TokensWriteRepoPort
 */
export interface TokensWriteRepoPort {
  /**
   * 保存令牌
   *
   * @description
   * 保存或创建令牌到数据库。当新令牌生成时，会调用此方法保存令牌信息。
   *
   * @param tokens - 要保存的令牌聚合根
   * @returns Promise<void>
   *
   * @throws {Error} 当保存操作失败时抛出异常
   */
  save(tokens: TokensEntity): Promise<void>;

  /**
   * 更新令牌状态
   *
   * @description
   * 更新指定刷新令牌的状态。当刷新令牌被使用时，会调用此方法将状态更新为已使用。
   *
   * @param refreshToken - 刷新令牌字符串
   * @param status - 新的令牌状态，通常为 USED（已使用）
   * @returns Promise<void>
   *
   * @throws {Error} 当更新操作失败时抛出异常
   */
  updateTokensStatus(refreshToken: string, status: string): Promise<void>;
}
