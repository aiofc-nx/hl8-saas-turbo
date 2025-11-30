import { ICommand } from '@nestjs/cqrs';
import { Status } from '../../../../shared/enums/status.enum';

import { RoleCreateCommand } from './role-create.command';

/**
 * 角色更新命令
 *
 * @description
 * CQRS 命令对象，用于更新现有的角色。
 * 继承自 RoleCreateCommand，添加了角色 ID 字段用于标识要更新的角色。
 *
 * @extends {RoleCreateCommand}
 * @implements {ICommand}
 */
export class RoleUpdateCommand extends RoleCreateCommand implements ICommand {
  /**
   * 构造函数
   *
   * @param id - 要更新的角色的唯一标识符
   * @param code - 角色代码
   * @param name - 角色名称
   * @param pid - 父角色 ID
   * @param status - 角色状态
   * @param description - 角色描述信息，可为空
   * @param uid - 更新者的用户 ID，用于审计追踪
   */
  constructor(
    readonly id: string,
    readonly code: string,
    readonly name: string,
    readonly pid: string,
    readonly status: Status,
    readonly description: string | null,
    readonly uid: string,
  ) {
    super(code, name, pid, status, description, uid);
  }
}
