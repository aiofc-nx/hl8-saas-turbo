import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { AUTHZ_ENFORCER } from '@hl8/casbin';
import type { Enforcer } from 'casbin';

import { PolicyCreateCommand } from '../../commands/policy-create.command';
import { CasbinPolicyWriteRepoPortToken } from '../../constants';
import { policyRuleDtoToCasbinRule } from '../../domain/policy-rule.model';
import type { CasbinPolicyWriteRepoPort } from '../../ports/casbin-policy.repo-port';

/**
 * 策略规则创建命令处理器
 *
 * @description
 * 处理策略规则创建命令，将策略规则保存到数据库并触发 Enforcer 重新加载。
 *
 * @implements {ICommandHandler<PolicyCreateCommand, void>}
 */
@CommandHandler(PolicyCreateCommand)
export class PolicyCreateHandler
  implements ICommandHandler<PolicyCreateCommand, void>
{
  @Inject(CasbinPolicyWriteRepoPortToken)
  private readonly repository: CasbinPolicyWriteRepoPort;

  @Inject(AUTHZ_ENFORCER)
  private readonly enforcer: Enforcer;

  /**
   * 执行策略规则创建
   *
   * @param command - 策略规则创建命令
   */
  async execute(command: PolicyCreateCommand): Promise<void> {
    // 将 DTO 转换为 CasbinRule 实体字段
    const ruleFields = policyRuleDtoToCasbinRule(command.policy);

    // 保存到数据库
    await this.repository.createPolicy({
      ptype: command.policy.ptype,
      v0: ruleFields.v0,
      v1: ruleFields.v1,
      v2: ruleFields.v2,
      v3: ruleFields.v3,
      v4: ruleFields.v4,
      v5: ruleFields.v5,
    });

    // 触发 Enforcer 重新加载策略
    await this.enforcer.loadPolicy();
  }
}
