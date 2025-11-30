import { Entity, PrimaryKey, Property } from '@mikro-orm/core';

import { MenuType, Status } from '@/lib/shared/enums/status.enum';

/**
 * 菜单实体
 *
 * @description 用于存储菜单信息的数据库实体
 *
 * @class SysMenu
 */
@Entity({ tableName: 'sys_menu' })
export class SysMenu {
  /**
   * 主键 ID
   *
   * @description 唯一标识符
   */
  @PrimaryKey({ autoincrement: true })
  id!: number;

  /**
   * 菜单类型
   *
   * @description 菜单的类型（MENU/DIRECTORY/BUTTON）
   */
  @Property({ type: 'string' })
  menuType!: MenuType;

  /**
   * 菜单名称
   *
   * @description 菜单的显示名称
   */
  @Property()
  menuName!: string;

  /**
   * 路由名称
   *
   * @description 前端路由的名称
   */
  @Property()
  routeName!: string;

  /**
   * 路由路径
   *
   * @description 前端路由的路径
   */
  @Property()
  routePath!: string;

  /**
   * 组件路径
   *
   * @description 前端组件的路径
   */
  @Property()
  component!: string;

  /**
   * 状态
   *
   * @description 菜单的状态（启用/禁用）
   */
  @Property({ type: 'string' })
  status!: Status;

  /**
   * 父菜单 ID
   *
   * @description 父菜单的 ID，用于菜单层级结构
   */
  @Property()
  pid!: number;

  /**
   * 排序
   *
   * @description 菜单的显示顺序
   */
  @Property()
  order!: number;

  /**
   * 是否常量路由
   *
   * @description 是否为常量路由（不可删除）
   */
  @Property()
  constant!: boolean;

  /**
   * 图标类型
   *
   * @description 图标的类型
   */
  @Property({ nullable: true, type: 'number' })
  iconType?: number | null;

  /**
   * 图标
   *
   * @description 图标名称或路径
   */
  @Property({ nullable: true })
  icon?: string | null;

  /**
   * 路径参数
   *
   * @description 路由路径的参数
   */
  @Property({ nullable: true })
  pathParam?: string | null;

  /**
   * 激活菜单
   *
   * @description 激活的菜单项
   */
  @Property({ nullable: true })
  activeMenu?: string | null;

  /**
   * 是否在菜单中隐藏
   *
   * @description 是否在菜单中隐藏该菜单项
   */
  @Property({ nullable: true, type: 'boolean' })
  hideInMenu?: boolean | null;

  /**
   * 国际化键
   *
   * @description 国际化翻译键
   */
  @Property({ nullable: true })
  i18nKey?: string | null;

  /**
   * 是否保持 alive
   *
   * @description 是否在切换路由时保持组件状态
   */
  @Property({ nullable: true, type: 'boolean' })
  keepAlive?: boolean | null;

  /**
   * 外部链接
   *
   * @description 如果是外部链接，则使用此字段
   */
  @Property({ nullable: true })
  href?: string | null;

  /**
   * 是否多标签
   *
   * @description 是否支持多标签显示
   */
  @Property({ nullable: true, type: 'boolean' })
  multiTab?: boolean | null;

  /**
   * 创建时间
   *
   * @description 记录创建时间
   */
  @Property()
  createdAt!: Date;

  /**
   * 创建者
   *
   * @description 记录创建者
   */
  @Property()
  createdBy!: string;

  /**
   * 更新时间
   *
   * @description 记录最后更新时间
   */
  @Property({ nullable: true })
  updatedAt?: Date | null;

  /**
   * 更新者
   *
   * @description 记录最后更新者
   */
  @Property({ nullable: true })
  updatedBy?: string | null;
}
