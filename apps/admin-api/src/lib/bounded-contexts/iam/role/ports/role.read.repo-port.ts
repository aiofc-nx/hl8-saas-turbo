import { PaginationResult } from '@hl8/rest';

import type { RoleProperties } from '../domain/role.read.model';
import { PageRolesQuery } from '../queries/page-roles.query';

/**
 * 角色读取仓储端口
 *
 * @description
 * 定义角色的读取操作接口，遵循端口适配器模式。
 * 该接口由基础设施层实现，用于查询角色数据。
 *
 * @interface RoleReadRepoPort
 */
export interface RoleReadRepoPort {
  /**
   * 根据用户 ID 查找角色代码集合
   *
   * @description 查询指定用户拥有的所有角色代码
   *
   * @param userId - 用户的唯一标识符
   * @returns 返回用户拥有的角色代码集合，如果用户没有角色则返回空集合
   */
  findRolesByUserId(userId: string): Promise<Set<string>>;

  /**
   * 分页查询角色
   *
   * @description 根据查询条件分页查询角色列表，支持按角色代码、名称和状态筛选
   *
   * @param query - 分页查询对象，包含分页参数、角色代码、名称、状态等筛选条件
   * @returns 返回分页结果，包含角色列表和分页信息
   */
  pageRoles(query: PageRolesQuery): Promise<PaginationResult<RoleProperties>>;

  /**
   * 根据代码获取角色
   *
   * @description 从数据库中查询指定代码的角色信息。角色代码是角色的唯一标识符。
   *
   * @param code - 角色的唯一代码
   * @returns 返回角色属性对象，如果不存在则返回 null
   */
  getRoleByCode(code: string): Promise<Readonly<RoleProperties> | null>;

  /**
   * 根据 ID 获取角色
   *
   * @description 从数据库中查询指定 ID 的角色信息
   *
   * @param id - 角色的唯一标识符
   * @returns 返回角色属性对象，如果不存在则返回 null
   */
  getRoleById(id: string): Promise<Readonly<RoleProperties> | null>;
}
