import { Entity, PrimaryKey, Property } from '@mikro-orm/core';

/**
 * 角色菜单关联实体
 *
 * @description 用于存储角色与菜单关联关系的数据库实体
 *
 * @class SysRoleMenu
 */
@Entity({ tableName: 'sys_role_menu' })
export class SysRoleMenu {
  /**
   * 主键 ID
   *
   * @description 唯一标识符
   */
  @PrimaryKey()
  id!: string;

  /**
   * 角色 ID
   *
   * @description 关联的角色 ID
   */
  @Property()
  roleId!: string;

  /**
   * 菜单 ID
   *
   * @description 关联的菜单 ID
   */
  @Property({ type: 'number' })
  menuId!: number;

  /**
   * 域
   *
   * @description 关联的域代码
   */
  @Property()
  domain!: string;
}
