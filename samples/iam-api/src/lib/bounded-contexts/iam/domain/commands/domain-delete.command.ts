import { ICommand } from '@nestjs/cqrs';

/**
 * 域删除命令
 *
 * @description
 * CQRS 命令对象，用于删除指定的 Casbin 域。
 * 删除域前需要确保域下没有关联的用户、角色等资源，否则可能抛出异常。
 *
 * @implements {ICommand}
 */
export class DomainDeleteCommand implements ICommand {
  /**
   * 构造函数
   *
   * @param id - 要删除的域的唯一标识符
   */
  constructor(readonly id: string) {}
}
