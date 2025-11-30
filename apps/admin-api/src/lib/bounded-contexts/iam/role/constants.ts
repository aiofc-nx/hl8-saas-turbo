/**
 * 角色写入仓储端口令牌
 *
 * @description
 * 用于依赖注入的符号令牌，标识角色写入仓储端口的实现。
 * 在基础设施层注册时使用此令牌。
 */
export const RoleWriteRepoPortToken = Symbol('RoleWriteRepoPort');

/**
 * 角色读取仓储端口令牌
 *
 * @description
 * 用于依赖注入的符号令牌，标识角色读取仓储端口的实现。
 * 在基础设施层注册时使用此令牌。
 */
export const RoleReadRepoPortToken = Symbol('RoleReadRepoPort');
