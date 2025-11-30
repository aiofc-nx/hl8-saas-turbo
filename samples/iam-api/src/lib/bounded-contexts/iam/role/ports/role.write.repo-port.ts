import { Role } from '../domain/role.model';

/**
 * 角色写入仓储端口
 *
 * @description
 * 定义角色的写入操作接口，遵循端口适配器模式。
 * 该接口由基础设施层实现，用于持久化角色数据。
 *
 * @interface RoleWriteRepoPort
 */
export interface RoleWriteRepoPort {
  /**
   * 根据角色 ID 删除角色菜单关联
   *
   * @description 删除指定角色的所有角色菜单关联记录
   *
   * @param roleId - 角色的唯一标识符
   * @returns Promise<void>
   */
  deleteRoleMenuByRoleId(roleId: string): Promise<void>;

  /**
   * 根据域名删除角色菜单关联
   *
   * @description 删除指定域下的所有角色菜单关联记录
   *
   * @param domain - 域代码
   * @returns Promise<void>
   */
  deleteRoleMenuByDomain(domain: string): Promise<void>;

  /**
   * 根据 ID 删除角色
   *
   * @description 从数据库中删除指定 ID 的角色记录
   *
   * @param id - 角色的唯一标识符
   * @returns Promise<void>
   *
   * @throws {Error} 当删除操作失败时抛出异常
   */
  deleteById(id: string): Promise<void>;

  /**
   * 保存角色
   *
   * @description
   * 保存或创建角色到数据库。如果是新记录则创建，如果是已存在的记录则更新。
   *
   * @param role - 要保存的角色聚合根
   * @returns Promise<void>
   *
   * @throws {Error} 当保存操作失败时抛出异常
   */
  save(role: Role): Promise<void>;

  /**
   * 更新角色
   *
   * @description 更新数据库中已存在的角色记录
   *
   * @param role - 要更新的角色聚合根
   * @returns Promise<void>
   *
   * @throws {Error} 当更新操作失败时抛出异常
   */
  update(role: Role): Promise<void>;
}
