import { ICommand } from '@nestjs/cqrs';

/**
 * 域创建命令
 *
 * @description
 * CQRS 命令对象，用于创建新的 Casbin 域。域是 Casbin 权限模型中的多租户隔离单位，
 * 用于实现不同租户之间的权限隔离。
 *
 * @implements {ICommand}
 */
export class DomainCreateCommand implements ICommand {
  /**
   * 构造函数
   *
   * @param code - 域的唯一代码，用于标识不同的租户或业务域
   * @param name - 域的显示名称
   * @param description - 域的详细描述信息，可为空
   * @param uid - 创建者的用户 ID，用于审计追踪
   */
  constructor(
    readonly code: string,
    readonly name: string,
    readonly description: string | null,
    readonly uid: string,
  ) {}
}
