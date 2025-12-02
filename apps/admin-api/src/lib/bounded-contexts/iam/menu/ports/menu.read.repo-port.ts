import { PaginationResult } from '@hl8/rest';

import { MenuProperties, MenuTreeProperties } from '../domain/menu.read.model';
import { PageMenusQuery } from '../queries/page-menus.query';

/**
 * 菜单读取仓储端口
 *
 * @description
 * 定义菜单的读取操作接口，遵循端口适配器模式。
 * 该接口由基础设施层实现，用于查询菜单数据。
 *
 * @interface MenuReadRepoPort
 */
export interface MenuReadRepoPort {
  /**
   * 分页查询菜单
   *
   * @description 根据查询条件分页查询菜单列表，支持按菜单名称、路由名称、菜单类型和状态筛选
   *
   * @param query - 分页查询对象，包含分页参数、菜单名称、路由名称、菜单类型、状态等筛选条件
   * @returns 返回分页结果，包含菜单列表和分页信息
   */
  pageMenus(query: PageMenusQuery): Promise<PaginationResult<MenuProperties>>;
  /**
   * 获取子菜单数量
   *
   * @description 查询指定菜单下的子菜单数量，用于删除前验证
   *
   * @param id - 菜单的唯一标识符
   * @returns 返回子菜单数量
   */
  getChildrenMenuCount(id: number): Promise<number>;

  /**
   * 根据 ID 获取菜单
   *
   * @description 从数据库中查询指定 ID 的菜单信息
   *
   * @param id - 菜单的唯一标识符
   * @returns 返回菜单属性对象，如果不存在则返回 null
   */
  getMenuById(id: number): Promise<MenuProperties | null>;

  /**
   * 根据角色代码和域查找菜单
   *
   * @description 查询指定角色在指定域下可访问的菜单列表
   *
   * @param roleCode - 角色代码数组
   * @param domain - 域代码
   * @returns 返回菜单属性数组，如果没有菜单则返回空数组
   */
  findMenusByRoleCode(
    roleCode: string[],
    domain: string,
  ): Promise<Readonly<MenuProperties[]> | []>;

  /**
   * 根据角色 ID 和域查找菜单
   *
   * @description 查询指定角色在指定域下可访问的菜单列表
   *
   * @param roleId - 角色的唯一标识符
   * @param domain - 域代码
   * @returns 返回菜单属性数组，如果没有菜单则返回空数组
   */
  findMenusByRoleId(
    roleId: string,
    domain: string,
  ): Promise<Readonly<MenuProperties[]> | []>;

  /**
   * 获取常量路由
   *
   * @description 查询所有常量路由，常量路由不受权限控制，所有用户都可以访问
   *
   * @returns 返回常量路由属性数组，如果没有常量路由则返回空数组
   */
  getConstantRoutes(): Promise<Readonly<MenuProperties[]> | []>;

  /**
   * 查询所有菜单
   *
   * @description 查询所有菜单，返回树形结构
   *
   * @returns 返回菜单树形结构数组，如果没有菜单则返回空数组
   */
  findAll(): Promise<MenuTreeProperties[] | []>;

  /**
   * 查询所有常量菜单或普通菜单
   *
   * @description 根据常量标志查询所有常量菜单或普通菜单，返回树形结构
   *
   * @param constant - 是否只查询常量菜单，true 表示常量菜单，false 表示普通菜单
   * @returns 返回菜单树形结构数组，如果没有菜单则返回空数组
   */
  findAllConstantMenu(constant: boolean): Promise<MenuTreeProperties[] | []>;

  /**
   * 根据 ID 列表查找菜单
   *
   * @description 批量查询指定 ID 列表的菜单信息
   *
   * @param ids - 菜单 ID 数组
   * @returns 返回菜单属性数组，如果某些 ID 不存在则不会包含在结果中
   */
  findMenusByIds(ids: number[]): Promise<MenuProperties[]>;

  /**
   * 根据用户 ID 和域查找菜单 ID 列表
   *
   * @description 查询指定用户在指定域下可访问的菜单 ID 列表
   *
   * @param userId - 用户的唯一标识符
   * @param domain - 域代码
   * @returns 返回菜单 ID 数组
   */
  findMenuIdsByUserId(userId: string, domain: string): Promise<number[]>;
}
