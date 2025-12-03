import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { AUTHZ_ENFORCER } from '@hl8/casbin';
import type { Enforcer } from 'casbin';

import { PolicyDeleteCommand } from '../../commands/policy-delete.command';
import { CasbinPolicyWriteRepoPortToken } from '../../constants';
import type { CasbinPolicyWriteRepoPort } from '../../ports/casbin-policy.repo-port';

/**
 * 策略规则删除命令处理器
 *
 * @description
 * 处理策略规则删除命令，从数据库中删除策略规则并触发 Enforcer 重新加载。
 *
 * @implements {ICommandHandler<PolicyDeleteCommand, void>}
 */
@CommandHandler(PolicyDeleteCommand)
export class PolicyDeleteHandler
  implements ICommandHandler<PolicyDeleteCommand, void>
{
  @Inject(CasbinPolicyWriteRepoPortToken)
  private readonly repository: CasbinPolicyWriteRepoPort;

  @Inject(AUTHZ_ENFORCER)
  private readonly enforcer: Enforcer;

  /**
   * 执行策略规则删除
   *
   * @param command - 策略规则删除命令
   */
  async execute(command: PolicyDeleteCommand): Promise<void> {
    // 从数据库删除
    await this.repository.deletePolicy(command.id);

    // 触发 Enforcer 重新加载策略
    await this.enforcer.loadPolicy();
  }
}
