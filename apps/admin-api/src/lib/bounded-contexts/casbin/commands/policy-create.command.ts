import { ICommand } from '@nestjs/cqrs';

import { PolicyRuleDto } from '../domain/policy-rule.model';

/**
 * 策略规则创建命令
 *
 * @description
 * CQRS 命令对象，用于创建新的策略规则。
 *
 * @implements {ICommand}
 */
export class PolicyCreateCommand implements ICommand {
  /**
   * 构造函数
   *
   * @param policy - 策略规则 DTO，包含策略类型、主体、资源、操作等信息
   * @param uid - 创建者的用户 ID，用于审计追踪
   */
  constructor(
    readonly policy: PolicyRuleDto,
    readonly uid: string,
  ) {}
}
