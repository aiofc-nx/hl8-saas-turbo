import { PaginationResult } from '@hl8/rest';

import type { UserProperties } from '../domain/user.read.model';
import { PageUsersQuery } from '../queries/page-users.query';

/**
 * 用户读取仓储端口
 *
 * @description
 * 定义用户的读取操作接口，遵循端口适配器模式。
 * 该接口由基础设施层实现，用于查询用户数据。
 *
 * @interface UserReadRepoPort
 */
export interface UserReadRepoPort {
  /**
   * 根据 ID 查找用户
   *
   * @description 从数据库中查询指定 ID 的用户信息
   *
   * @param id - 用户的唯一标识符
   * @returns 返回用户属性对象，如果不存在则返回 null
   */
  findUserById(id: string): Promise<UserProperties | null>;

  /**
   * 根据角色 ID 查找用户 ID 列表
   *
   * @description 查询拥有指定角色的所有用户 ID 列表
   *
   * @param roleId - 角色的唯一标识符
   * @returns 返回拥有该角色的用户 ID 数组
   */
  findUserIdsByRoleId(roleId: string): Promise<string[]>;

  /**
   * 根据 ID 列表查找用户
   *
   * @description 批量查询指定 ID 列表的用户信息
   *
   * @param ids - 用户 ID 数组
   * @returns 返回用户属性数组，如果某些 ID 不存在则不会包含在结果中
   */
  findUsersByIds(ids: string[]): Promise<UserProperties[]>;

  /**
   * 根据标识符查找用户
   *
   * @description
   * 根据用户名、邮箱或手机号查找用户。支持使用多种标识符进行登录。
   *
   * @param identifier - 用户标识符，可以是用户名、邮箱或手机号
   * @returns 返回用户属性对象，如果不存在则返回 null
   */
  findUserByIdentifier(identifier: string): Promise<UserProperties | null>;

  /**
   * 分页查询用户
   *
   * @description 根据查询条件分页查询用户列表，支持按用户名、昵称和状态筛选
   *
   * @param query - 分页查询对象，包含分页参数、用户名、昵称、状态等筛选条件
   * @returns 返回分页结果，包含用户列表和分页信息
   */
  pageUsers(query: PageUsersQuery): Promise<PaginationResult<UserProperties>>;

  /**
   * 根据用户名查找用户
   *
   * @description 从数据库中查询指定用户名的用户信息
   *
   * @param username - 用户的登录名
   * @returns 返回用户属性对象，如果不存在则返回 null
   */
  getUserByUsername(username: string): Promise<Readonly<UserProperties> | null>;

  /**
   * 根据用户 ID 查找角色代码集合
   *
   * @description
   * 查询指定用户拥有的所有角色代码。通过用户角色关联表查询，
   * 然后获取对应的角色信息，返回角色代码集合。
   *
   * @param userId - 用户的唯一标识符
   * @returns 返回用户拥有的角色代码集合，如果用户没有角色则返回空集合
   */
  findRolesByUserId(userId: string): Promise<Set<string>>;
}
