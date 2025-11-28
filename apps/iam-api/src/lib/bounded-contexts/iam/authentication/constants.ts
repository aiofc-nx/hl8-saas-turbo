/**
 * 用户写入仓储端口令牌
 *
 * @description
 * 用于依赖注入的符号令牌，标识用户写入仓储端口的实现。
 * 在基础设施层注册时使用此令牌。
 */
export const UserWriteRepoPortToken = Symbol('UserWriteRepoPort');

/**
 * 用户读取仓储端口令牌
 *
 * @description
 * 用于依赖注入的符号令牌，标识用户读取仓储端口的实现。
 * 在基础设施层注册时使用此令牌。
 */
export const UserReadRepoPortToken = Symbol('UserReadRepoPort');
