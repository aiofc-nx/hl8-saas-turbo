import { ICommand } from '@nestjs/cqrs';

/**
 * 用户删除命令
 *
 * @description
 * CQRS 命令对象，用于删除指定的用户。
 * 删除用户前需要确保用户没有关联的重要资源，否则可能抛出异常。
 *
 * @implements {ICommand}
 */
export class UserDeleteCommand implements ICommand {
  /**
   * 构造函数
   *
   * @param id - 要删除的用户的唯一标识符
   */
  constructor(readonly id: string) {}
}
