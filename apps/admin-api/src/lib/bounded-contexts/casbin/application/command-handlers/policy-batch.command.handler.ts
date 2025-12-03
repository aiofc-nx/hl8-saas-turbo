import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { AUTHZ_ENFORCER } from '@hl8/casbin';
import type { Enforcer } from 'casbin';

import { PolicyBatchCommand } from '../../commands/policy-batch.command';
import { CasbinPolicyWriteRepoPortToken } from '../../constants';
import { policyRuleDtoToCasbinRule } from '../../domain/policy-rule.model';
import type { CasbinPolicyWriteRepoPort } from '../../ports/casbin-policy.repo-port';

/**
 * 策略规则批量操作命令处理器
 *
 * @description
 * 处理策略规则批量操作命令，批量新增或删除策略规则并触发 Enforcer 重新加载。
 *
 * @implements {ICommandHandler<PolicyBatchCommand, void>}
 */
@CommandHandler(PolicyBatchCommand)
export class PolicyBatchHandler
  implements ICommandHandler<PolicyBatchCommand, void>
{
  @Inject(CasbinPolicyWriteRepoPortToken)
  private readonly repository: CasbinPolicyWriteRepoPort;

  @Inject(AUTHZ_ENFORCER)
  private readonly enforcer: Enforcer;

  /**
   * 执行策略规则批量操作
   *
   * @param command - 策略规则批量操作命令
   */
  async execute(command: PolicyBatchCommand): Promise<void> {
    if (command.operation === 'add') {
      // 批量新增
      const ruleFields = command.policies.map((policy) =>
        policyRuleDtoToCasbinRule(policy),
      );

      await this.repository.createPolicies(
        ruleFields.map((fields, index) => ({
          ptype: command.policies[index].ptype,
          v0: fields.v0,
          v1: fields.v1,
          v2: fields.v2,
          v3: fields.v3,
          v4: fields.v4,
          v5: fields.v5,
        })),
      );
    } else if (command.operation === 'delete') {
      // 批量删除
      const ids = command.policies.map((policy) => policy.id!);
      await this.repository.deletePolicies(ids);
    }

    // 触发 Enforcer 重新加载策略
    await this.enforcer.loadPolicy();
  }
}
