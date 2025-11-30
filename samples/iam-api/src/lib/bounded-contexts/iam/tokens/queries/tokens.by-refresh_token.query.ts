import { IQuery } from '@nestjs/cqrs';

/**
 * 根据刷新令牌查询令牌
 *
 * @description
 * CQRS 查询对象，用于根据刷新令牌查询令牌信息。
 * 主要用于令牌刷新流程中，验证刷新令牌的有效性并获取令牌详情。
 *
 * @implements {IQuery}
 */
export class TokensByRefreshTokenQuery implements IQuery {
  /**
   * 构造函数
   *
   * @param refreshToken - 刷新令牌字符串
   */
  constructor(readonly refreshToken: string) {}
}
