/**
 * 菜单写入仓储端口令牌
 *
 * @description
 * 用于依赖注入的符号令牌，标识菜单写入仓储端口的实现。
 * 在基础设施层注册时使用此令牌。
 */
export const MenuWriteRepoPortToken = Symbol('MenuWriteRepoPort');

/**
 * 菜单读取仓储端口令牌
 *
 * @description
 * 用于依赖注入的符号令牌，标识菜单读取仓储端口的实现。
 * 在基础设施层注册时使用此令牌。
 */
export const MenuReadRepoPortToken = Symbol('MenuReadRepoPort');
