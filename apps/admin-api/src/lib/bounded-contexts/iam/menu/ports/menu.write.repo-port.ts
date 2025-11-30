import { Menu } from '../domain/menu.model';

/**
 * 菜单写入仓储端口
 *
 * @description
 * 定义菜单的写入操作接口，遵循端口适配器模式。
 * 该接口由基础设施层实现，用于持久化菜单数据。
 *
 * @interface MenuWriteRepoPort
 */
export interface MenuWriteRepoPort {
  /**
   * 根据 ID 删除菜单
   *
   * @description 从数据库中删除指定 ID 的菜单记录
   *
   * @param id - 菜单的唯一标识符
   * @returns Promise<void>
   *
   * @throws {Error} 当删除操作失败时抛出异常
   */
  deleteById(id: number): Promise<void>;

  /**
   * 更新菜单
   *
   * @description 更新数据库中已存在的菜单记录
   *
   * @param menu - 要更新的菜单聚合根
   * @returns Promise<void>
   *
   * @throws {Error} 当更新操作失败时抛出异常
   */
  update(menu: Menu): Promise<void>;

  /**
   * 保存菜单
   *
   * @description
   * 保存或创建菜单到数据库。如果是新记录则创建，如果是已存在的记录则更新。
   *
   * @param menu - 要保存的菜单聚合根
   * @returns Promise<void>
   *
   * @throws {Error} 当保存操作失败时抛出异常
   */
  save(menu: Menu): Promise<void>;
}
