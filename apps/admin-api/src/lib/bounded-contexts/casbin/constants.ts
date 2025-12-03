/**
 * Casbin 策略读取仓储端口令牌
 *
 * @description
 * 用于依赖注入的符号令牌，标识 Casbin 策略读取仓储端口的实现。
 * 在基础设施层注册时使用此令牌。
 */
export const CasbinPolicyReadRepoPortToken = Symbol('CasbinPolicyReadRepoPort');

/**
 * Casbin 策略写入仓储端口令牌
 *
 * @description
 * 用于依赖注入的符号令牌，标识 Casbin 策略写入仓储端口的实现。
 * 在基础设施层注册时使用此令牌。
 */
export const CasbinPolicyWriteRepoPortToken = Symbol(
  'CasbinPolicyWriteRepoPort',
);

/**
 * Casbin 模型配置读取仓储端口令牌
 *
 * @description
 * 用于依赖注入的符号令牌，标识 Casbin 模型配置读取仓储端口的实现。
 * 在基础设施层注册时使用此令牌。
 */
export const CasbinModelReadRepoPortToken = Symbol('CasbinModelReadRepoPort');

/**
 * Casbin 模型配置写入仓储端口令牌
 *
 * @description
 * 用于依赖注入的符号令牌，标识 Casbin 模型配置写入仓储端口的实现。
 * 在基础设施层注册时使用此令牌。
 */
export const CasbinModelWriteRepoPortToken = Symbol('CasbinModelWriteRepoPort');
