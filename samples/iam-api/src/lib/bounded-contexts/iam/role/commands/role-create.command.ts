import { ICommand } from '@nestjs/cqrs';
import { Status } from '../../../../shared/enums/status.enum';

/**
 * 角色创建命令
 *
 * CQRS 模式中的命令对象，用于创建新角色。
 * 包含创建角色所需的所有信息，包括角色代码、名称、父角色、状态等。
 *
 * @remarks
 * - 实现 ICommand 接口，符合 CQRS 命令规范
 * - 通过命令处理器（Command Handler）执行
 * - 所有字段通过构造函数传入，确保不可变性
 */
export class RoleCreateCommand implements ICommand {
  /**
   * 创建角色命令构造函数
   *
   * @param code - 角色代码，唯一标识符
   * @param name - 角色名称，用于显示
   * @param pid - 父角色 ID，用于构建角色层级关系
   * @param status - 角色状态（启用/禁用）
   * @param description - 角色描述信息，可为空
   * @param uid - 创建者用户 ID
   */
  constructor(
    readonly code: string,
    readonly name: string,
    readonly pid: string,
    readonly status: Status,
    readonly description: string | null,
    readonly uid: string,
  ) {}
}
