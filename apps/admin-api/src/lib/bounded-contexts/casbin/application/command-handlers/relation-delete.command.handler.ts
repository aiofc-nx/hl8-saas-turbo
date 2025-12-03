import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { AUTHZ_ENFORCER } from '@hl8/casbin';
import type { Enforcer } from 'casbin';

import { RelationDeleteCommand } from '../../commands/relation-delete.command';
import { CasbinPolicyWriteRepoPortToken } from '../../constants';
import type { CasbinPolicyWriteRepoPort } from '../../ports/casbin-policy.repo-port';

/**
 * 角色继承关系删除命令处理器
 *
 * @description
 * 处理角色继承关系删除命令，从数据库中删除角色继承关系并触发 Enforcer 重新加载。
 *
 * @implements {ICommandHandler<RelationDeleteCommand, void>}
 */
@CommandHandler(RelationDeleteCommand)
export class RelationDeleteHandler
  implements ICommandHandler<RelationDeleteCommand, void>
{
  @Inject(CasbinPolicyWriteRepoPortToken)
  private readonly repository: CasbinPolicyWriteRepoPort;

  @Inject(AUTHZ_ENFORCER)
  private readonly enforcer: Enforcer;

  /**
   * 执行角色继承关系删除
   *
   * @param command - 角色继承关系删除命令
   */
  async execute(command: RelationDeleteCommand): Promise<void> {
    // 从数据库删除
    await this.repository.deleteRelation(command.id);

    // 触发 Enforcer 重新加载策略
    await this.enforcer.loadPolicy();
  }
}
