import { ICommand } from '@nestjs/cqrs';

/**
 * 菜单删除命令
 *
 * @description
 * CQRS 命令对象，用于删除指定的菜单路由。
 * 删除菜单前需要确保菜单下没有子菜单，否则可能抛出异常。
 *
 * @implements {ICommand}
 */
export class MenuDeleteCommand implements ICommand {
  /**
   * 构造函数
   *
   * @param id - 要删除的菜单的唯一标识符
   */
  constructor(readonly id: number) {}
}
