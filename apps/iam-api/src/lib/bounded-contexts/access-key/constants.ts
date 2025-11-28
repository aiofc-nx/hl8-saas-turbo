/**
 * 访问密钥写入仓储端口令牌
 *
 * @description
 * 用于依赖注入的符号令牌，标识访问密钥写入仓储端口的实现。
 * 在基础设施层注册时使用此令牌。
 */
export const AccessKeyWriteRepoPortToken = Symbol('AccessKeyWriteRepoPort');

/**
 * 访问密钥读取仓储端口令牌
 *
 * @description
 * 用于依赖注入的符号令牌，标识访问密钥读取仓储端口的实现。
 * 在基础设施层注册时使用此令牌。
 */
export const AccessKeyReadRepoPortToken = Symbol('AccessKeyReadRepoPort');
