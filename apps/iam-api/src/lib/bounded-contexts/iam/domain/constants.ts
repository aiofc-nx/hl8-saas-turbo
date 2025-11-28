/**
 * 域写入仓储端口令牌
 *
 * @description
 * 用于依赖注入的符号令牌，标识域写入仓储端口的实现。
 * 在基础设施层注册时使用此令牌。
 */
export const DomainWriteRepoPortToken = Symbol('DomainWriteRepoPort');

/**
 * 域读取仓储端口令牌
 *
 * @description
 * 用于依赖注入的符号令牌，标识域读取仓储端口的实现。
 * 在基础设施层注册时使用此令牌。
 */
export const DomainReadRepoPortToken = Symbol('DomainReadRepoPort');
