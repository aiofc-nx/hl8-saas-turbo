import { IEvent } from '@nestjs/cqrs';

/**
 * 菜单删除事件
 *
 * @description
 * 当菜单被删除时发布的领域事件。该事件可以被其他有界上下文订阅，
 * 用于执行后续操作，如清理权限、更新缓存、撤销路由授权等。
 *
 * @implements {IEvent}
 */
export class MenuDeletedEvent implements IEvent {
  /**
   * 构造函数
   *
   * @param menuId - 被删除的菜单的唯一标识符
   * @param routeName - 被删除的菜单的路由名称
   */
  constructor(
    public readonly menuId: number,
    public readonly routeName: string,
  ) {}
}
