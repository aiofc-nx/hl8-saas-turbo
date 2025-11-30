import { ICommand } from '@nestjs/cqrs';

import { DomainCreateCommand } from './domain-create.command';

/**
 * 域更新命令
 *
 * @description
 * CQRS 命令对象，用于更新现有的 Casbin 域。
 * 继承自 DomainCreateCommand，添加了域 ID 字段用于标识要更新的域。
 *
 * @extends {DomainCreateCommand}
 * @implements {ICommand}
 */
export class DomainUpdateCommand
  extends DomainCreateCommand
  implements ICommand
{
  /**
   * 构造函数
   *
   * @param id - 要更新的域的唯一标识符
   * @param code - 域的唯一代码
   * @param name - 域的显示名称
   * @param description - 域的详细描述信息，可为空
   * @param uid - 更新者的用户 ID，用于审计追踪
   */
  constructor(
    readonly id: string,
    readonly code: string,
    readonly name: string,
    readonly description: string | null,
    readonly uid: string,
  ) {
    super(code, name, description, uid);
  }
}
