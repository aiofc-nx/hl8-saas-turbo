import { ICommand } from '@nestjs/cqrs';

/**
 * 策略规则删除命令
 *
 * @description
 * CQRS 命令对象，用于删除策略规则。
 *
 * @implements {ICommand}
 */
export class PolicyDeleteCommand implements ICommand {
  /**
   * 构造函数
   *
   * @param id - 要删除的策略规则 ID
   * @param uid - 删除者的用户 ID，用于审计追踪
   */
  constructor(
    readonly id: number,
    readonly uid: string,
  ) {}
}
