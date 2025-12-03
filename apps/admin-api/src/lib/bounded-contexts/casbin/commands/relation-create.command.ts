import { ICommand } from '@nestjs/cqrs';

import { RoleRelationDto } from '../domain/policy-rule.model';

/**
 * 角色继承关系创建命令
 *
 * @description
 * CQRS 命令对象，用于创建新的角色继承关系。
 *
 * @implements {ICommand}
 */
export class RelationCreateCommand implements ICommand {
  /**
   * 构造函数
   *
   * @param relation - 角色继承关系 DTO，包含子主体、父角色、域等信息
   * @param uid - 创建者的用户 ID，用于审计追踪
   */
  constructor(
    readonly relation: RoleRelationDto,
    readonly uid: string,
  ) {}
}
