import { ICommand } from '@nestjs/cqrs';

import { PolicyRuleDto } from '../domain/policy-rule.model';

/**
 * 策略规则批量操作命令
 *
 * @description
 * CQRS 命令对象，用于批量新增或删除策略规则。
 *
 * @implements {ICommand}
 */
export class PolicyBatchCommand implements ICommand {
  /**
   * 构造函数
   *
   * @param policies - 策略规则 DTO 数组
   * @param operation - 操作类型：'add' 表示批量新增，'delete' 表示批量删除
   * @param uid - 操作者的用户 ID，用于审计追踪
   */
  constructor(
    readonly policies: PolicyRuleDto[],
    readonly operation: 'add' | 'delete',
    readonly uid: string,
  ) {}
}
