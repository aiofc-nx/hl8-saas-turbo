import { User } from '../domain/user';

/**
 * 用户写入仓储端口
 *
 * @description
 * 定义用户的写入操作接口，遵循端口适配器模式。
 * 该接口由基础设施层实现，用于持久化用户数据。
 *
 * @interface UserWriteRepoPort
 */
export interface UserWriteRepoPort {
  /**
   * 根据角色 ID 删除用户角色关联
   *
   * @description 删除指定角色的所有用户角色关联记录
   *
   * @param roleId - 角色的唯一标识符
   * @returns Promise<void>
   */
  deleteUserRoleByRoleId(roleId: string): Promise<void>;

  /**
   * 根据域名删除用户和用户角色关联
   *
   * @description
   * 删除指定域下的所有用户及其用户角色关联记录。
   * 使用事务确保数据一致性。
   *
   * @param domain - 域代码
   * @returns Promise<void>
   */
  deleteUserRoleByDomain(domain: string): Promise<void>;

  /**
   * 根据用户 ID 删除用户角色关联
   *
   * @description 删除指定用户的所有角色关联记录
   *
   * @param userId - 用户的唯一标识符
   * @returns Promise<void>
   */
  deleteUserRoleByUserId(userId: string): Promise<void>;

  /**
   * 根据 ID 删除用户
   *
   * @description 从数据库中删除指定 ID 的用户记录
   *
   * @param id - 用户的唯一标识符
   * @returns Promise<void>
   *
   * @throws {Error} 当删除操作失败时抛出异常
   */
  deleteById(id: string): Promise<void>;

  /**
   * 保存用户
   *
   * @description
   * 保存或创建用户到数据库。如果是新记录则创建，如果是已存在的记录则更新。
   * 密码会从值对象中提取并加密存储。
   *
   * @param role - 要保存的用户聚合根（参数名应为 user，此处可能是历史遗留）
   * @returns Promise<void>
   *
   * @throws {Error} 当保存操作失败时抛出异常
   */
  save(role: User): Promise<void>;

  /**
   * 更新用户
   *
   * @description
   * 更新数据库中已存在的用户记录。只更新允许修改的字段，
   * 不包括密码和域等敏感或不可变字段。
   *
   * @param role - 要更新的用户聚合根（参数名应为 user，此处可能是历史遗留）
   * @returns Promise<void>
   *
   * @throws {Error} 当更新操作失败时抛出异常
   */
  update(role: User): Promise<void>;
}
