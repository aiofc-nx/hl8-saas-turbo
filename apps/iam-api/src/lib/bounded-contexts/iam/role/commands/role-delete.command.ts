import { ICommand } from '@nestjs/cqrs';

/**
 * 角色删除命令
 *
 * @description
 * CQRS 命令对象，用于删除指定的角色。
 * 删除角色前需要确保角色下没有关联的用户或权限，否则可能抛出异常。
 *
 * @implements {ICommand}
 */
export class RoleDeleteCommand implements ICommand {
  /**
   * 构造函数
   *
   * @param id - 要删除的角色的唯一标识符
   */
  constructor(readonly id: string) {}
}
