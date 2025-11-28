import { MenuType, Status } from '@/lib/shared/enums/status.enum';
import { ICommand } from '@nestjs/cqrs';

/**
 * 菜单创建命令
 *
 * @description
 * CQRS 命令对象，用于创建新的菜单路由。
 * 菜单用于前端路由渲染和权限控制，支持树形结构。
 *
 * @implements {ICommand}
 */
export class MenuCreateCommand implements ICommand {
  /**
   * 构造函数
   *
   * @param menuName - 菜单名称
   * @param menuType - 菜单类型（MENU/DIRECTORY/BUTTON）
   * @param iconType - 图标类型，可为空
   * @param icon - 图标名称或路径，可为空
   * @param routeName - 路由名称
   * @param routePath - 路由路径
   * @param component - 组件路径
   * @param pathParam - 路径参数，可为空
   * @param status - 菜单状态
   * @param activeMenu - 激活菜单路径，可为空
   * @param hideInMenu - 是否在菜单中隐藏，可为空
   * @param pid - 父菜单 ID
   * @param order - 排序
   * @param i18nKey - 国际化键，可为空
   * @param keepAlive - 是否保持活跃，可为空
   * @param constant - 是否常量路由
   * @param href - 外部链接，可为空
   * @param multiTab - 是否支持多标签，可为空
   * @param uid - 创建者的用户 ID，用于审计追踪
   */
  constructor(
    readonly menuName: string,
    readonly menuType: MenuType,
    readonly iconType: number | null,
    readonly icon: string | null,
    readonly routeName: string,
    readonly routePath: string,
    readonly component: string,
    readonly pathParam: string | null,
    readonly status: Status,
    readonly activeMenu: string | null,
    readonly hideInMenu: boolean | null,
    readonly pid: number,
    readonly order: number,
    readonly i18nKey: string | null,
    readonly keepAlive: boolean | null,
    readonly constant: boolean,
    readonly href: string | null,
    readonly multiTab: boolean | null,
    readonly uid: string,
  ) {}
}
