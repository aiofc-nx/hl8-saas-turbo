import { MenuType, Status } from '@/lib/shared/enums/status.enum';
import { AggregateRoot } from '@nestjs/cqrs';

import { MenuDeletedEvent } from './events/menu-deleted.event';
import {
  MenuCreateProperties,
  MenuProperties,
  MenuUpdateProperties,
} from './menu.read.model';

/**
 * 菜单接口
 *
 * @description 定义菜单聚合根的基本接口，包含提交领域事件的方法
 */
export interface IMenu {
  /**
   * 提交领域事件
   *
   * @description 提交所有待处理的领域事件到事件总线
   */
  commit(): void;
}

/**
 * 菜单聚合根
 *
 * @description
 * 菜单的领域模型，是菜单有界上下文的聚合根。
 * 负责管理菜单的生命周期和业务规则，并发布领域事件。
 * 菜单用于前端路由渲染和权限控制，支持树形结构。
 *
 * @extends {AggregateRoot}
 * @implements {IMenu}
 */
export class Menu extends AggregateRoot implements IMenu {
  /**
   * 菜单 ID
   *
   * @description 菜单的唯一标识符
   */
  id: number;

  /**
   * 菜单名称
   *
   * @description 菜单的显示名称
   */
  menuName: string;

  /**
   * 菜单类型
   *
   * @description 菜单的类型，可选值：MENU（菜单）、DIRECTORY（目录）、BUTTON（按钮）
   */
  menuType: MenuType;

  /**
   * 路由名称
   *
   * @description 前端路由的唯一名称
   */
  routeName: string;

  /**
   * 路由路径
   *
   * @description 前端路由的 URL 路径
   */
  routePath: string;

  /**
   * 组件路径
   *
   * @description 前端组件的路径或名称
   */
  component: string;

  /**
   * 状态
   *
   * @description 菜单的状态，可选值：ENABLED（启用）、DISABLED（禁用）
   */
  status: Status;

  /**
   * 父菜单 ID
   *
   * @description 父菜单的唯一标识符，用于构建菜单层级结构
   */
  pid: number;

  /**
   * 排序
   *
   * @description 菜单的显示顺序，数字越小越靠前
   */
  order: number;

  /**
   * 是否常量路由
   *
   * @description 是否为常量路由，常量路由不受权限控制，所有用户都可以访问
   */
  constant: boolean;

  /**
   * 用户 ID（用于权限控制）
   *
   * @description 用于权限控制的用户标识
   */
  uid: string;

  /**
   * 图标类型
   *
   * @description 图标的类型，可选
   */
  iconType?: number;

  /**
   * 图标
   *
   * @description 图标名称或路径，可选
   */
  icon?: string;

  /**
   * 路径参数
   *
   * @description 路由路径中的动态参数，可选
   */
  pathParam?: string;

  /**
   * 激活菜单
   *
   * @description 当前路由激活时高亮的菜单项路径，可选
   */
  activeMenu?: string;

  /**
   * 是否在菜单中隐藏
   *
   * @description 是否在菜单中隐藏该菜单项，可选
   */
  hideInMenu?: boolean;

  /**
   * 国际化键
   *
   * @description 用于国际化的键名，可选
   */
  i18nKey?: string;

  /**
   * 是否保持活跃
   *
   * @description 是否在路由切换时保持组件状态（keep-alive），可选
   */
  keepAlive?: boolean;

  /**
   * 外部链接
   *
   * @description 如果是外部链接，此字段存储完整的 URL，可选
   */
  href?: string;

  /**
   * 是否支持多标签
   *
   * @description 是否在标签页中打开，支持多标签页显示，可选
   */
  multiTab?: boolean;

  /**
   * 创建时间
   *
   * @description 菜单的创建时间
   */
  createdAt: Date;

  /**
   * 创建者
   *
   * @description 创建菜单的用户 ID
   */
  createdBy: string;

  /**
   * 从创建属性创建菜单实例
   *
   * @description 使用创建属性对象创建菜单聚合根实例
   *
   * @param properties - 菜单创建属性对象
   * @returns 菜单聚合根实例
   */
  static fromCreate(properties: MenuCreateProperties): Menu {
    return Object.assign(new Menu(), properties);
  }

  /**
   * 从更新属性创建菜单实例
   *
   * @description 使用更新属性对象创建菜单聚合根实例
   *
   * @param properties - 菜单更新属性对象
   * @returns 菜单聚合根实例
   */
  static fromUpdate(properties: MenuUpdateProperties): Menu {
    return Object.assign(new Menu(), properties);
  }

  /**
   * 从完整属性创建菜单实例
   *
   * @description 使用完整属性对象创建菜单聚合根实例
   *
   * @param properties - 菜单完整属性对象
   * @returns 菜单聚合根实例
   */
  static fromProp(properties: MenuProperties): Menu {
    return Object.assign(new Menu(), properties);
  }

  /**
   * 发布菜单删除事件
   *
   * @description
   * 当菜单被删除时，发布 MenuDeletedEvent 事件。
   * 该事件可以被其他有界上下文订阅，用于执行后续操作（如清理权限、更新缓存等）。
   *
   * @returns Promise<void>
   */
  async deleted() {
    this.apply(new MenuDeletedEvent(this.id, this.routeName));
  }
}
