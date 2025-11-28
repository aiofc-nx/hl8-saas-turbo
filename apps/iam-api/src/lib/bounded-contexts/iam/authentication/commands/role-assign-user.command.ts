import { ICommand } from '@nestjs/cqrs';

/**
 * 角色分配用户命令
 *
 * @description
 * CQRS 命令对象，用于将一组用户分配给指定角色。
 * 用户获得角色后，将拥有该角色的所有权限和路由访问权限。
 *
 * @implements {ICommand}
 */
export class RoleAssignUserCommand implements ICommand {
  /**
   * 构造函数
   *
   * @param roleId - 要分配用户的角色的唯一标识符
   * @param userIds - 要分配给角色的用户 ID 数组
   */
  constructor(
    readonly roleId: string,
    readonly userIds: string[],
  ) {}
}
