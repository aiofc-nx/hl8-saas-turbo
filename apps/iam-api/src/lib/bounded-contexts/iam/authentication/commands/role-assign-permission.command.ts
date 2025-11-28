import { ICommand } from '@nestjs/cqrs';

/**
 * 角色分配权限命令
 *
 * @description
 * CQRS 命令对象，用于在指定域内为角色分配权限。
 * 权限格式通常为 "资源:操作"，例如 "user:read"、"user:write"。
 * 该操作会更新 Casbin 策略规则。
 *
 * @implements {ICommand}
 */
export class RoleAssignPermissionCommand implements ICommand {
  /**
   * 构造函数
   *
   * @param domain - 权限所属的域代码，用于多租户隔离
   * @param roleId - 要分配权限的角色的唯一标识符
   * @param permissions - 要分配的权限列表，格式为 "资源:操作"
   */
  constructor(
    readonly domain: string,
    readonly roleId: string,
    readonly permissions: string[],
  ) {}
}
