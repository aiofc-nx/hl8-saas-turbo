import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { AUTHZ_ENFORCER } from '@hl8/casbin';
import type { Enforcer } from 'casbin';

import { RelationCreateCommand } from '../../commands/relation-create.command';
import { CasbinPolicyWriteRepoPortToken } from '../../constants';
import { roleRelationDtoToCasbinRule } from '../../domain/policy-rule.model';
import type { CasbinPolicyWriteRepoPort } from '../../ports/casbin-policy.repo-port';

/**
 * 角色继承关系创建命令处理器
 *
 * @description
 * 处理角色继承关系创建命令，将角色继承关系保存到数据库并触发 Enforcer 重新加载。
 *
 * @implements {ICommandHandler<RelationCreateCommand, void>}
 */
@CommandHandler(RelationCreateCommand)
export class RelationCreateHandler
  implements ICommandHandler<RelationCreateCommand, void>
{
  @Inject(CasbinPolicyWriteRepoPortToken)
  private readonly repository: CasbinPolicyWriteRepoPort;

  @Inject(AUTHZ_ENFORCER)
  private readonly enforcer: Enforcer;

  /**
   * 执行角色继承关系创建
   *
   * @param command - 角色继承关系创建命令
   */
  async execute(command: RelationCreateCommand): Promise<void> {
    // 将 DTO 转换为 CasbinRule 实体字段
    const ruleFields = roleRelationDtoToCasbinRule(command.relation);

    // 保存到数据库
    await this.repository.createRelation({
      v0: ruleFields.v0,
      v1: ruleFields.v1,
      v2: ruleFields.v2,
    });

    // 触发 Enforcer 重新加载策略
    await this.enforcer.loadPolicy();
  }
}
