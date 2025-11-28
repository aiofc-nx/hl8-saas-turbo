import { ICommand } from '@nestjs/cqrs';

/**
 * 角色分配路由命令
 *
 * @description
 * CQRS 命令对象，用于在指定域内为角色分配菜单路由。
 * 路由是前端菜单项，分配后该角色的用户可以看到对应的菜单。
 *
 * @implements {ICommand}
 */
export class RoleAssignRouteCommand implements ICommand {
  /**
   * 构造函数
   *
   * @param domain - 路由所属的域代码，用于多租户隔离
   * @param roleId - 要分配路由的角色的唯一标识符
   * @param menuIds - 要分配的菜单 ID 数组
   */
  constructor(
    readonly domain: string,
    readonly roleId: string,
    readonly menuIds: number[],
  ) {}
}
