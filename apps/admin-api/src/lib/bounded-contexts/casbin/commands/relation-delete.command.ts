import { ICommand } from '@nestjs/cqrs';

/**
 * 角色继承关系删除命令
 *
 * @description
 * CQRS 命令对象，用于删除角色继承关系。
 *
 * @implements {ICommand}
 */
export class RelationDeleteCommand implements ICommand {
  /**
   * 构造函数
   *
   * @param id - 要删除的角色继承关系 ID
   * @param uid - 删除者的用户 ID，用于审计追踪
   */
  constructor(
    readonly id: number,
    readonly uid: string,
  ) {}
}
