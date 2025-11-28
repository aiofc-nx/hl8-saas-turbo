/**
 * 令牌写入仓储端口令牌
 *
 * @description
 * 用于依赖注入的符号令牌，标识令牌写入仓储端口的实现。
 * 在基础设施层注册时使用此令牌。
 */
export const TokensWriteRepoPortToken = Symbol('TokensWriteRepoPort');

/**
 * 令牌读取仓储端口令牌
 *
 * @description
 * 用于依赖注入的符号令牌，标识令牌读取仓储端口的实现。
 * 在基础设施层注册时使用此令牌。
 */
export const TokensReadRepoPortToken = Symbol('TokensReadRepoPort');

/**
 * 令牌状态枚举
 *
 * @description 定义令牌的使用状态
 */
export enum TokenStatus {
  /**
   * 未使用
   *
   * @description 令牌尚未被使用，可以用于刷新访问令牌
   */
  UNUSED = 'unused',

  /**
   * 已使用
   *
   * @description 令牌已被使用，不能再用于刷新访问令牌
   */
  USED = 'used',
}
