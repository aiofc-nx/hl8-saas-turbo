import { IEvent } from '@nestjs/cqrs';

/**
 * 角色删除事件
 *
 * @description
 * 当角色被删除时发布的领域事件。该事件可以被其他有界上下文订阅，
 * 用于执行后续操作，如清理权限、撤销用户角色关联、更新缓存等。
 *
 * @implements {IEvent}
 */
export class RoleDeletedEvent implements IEvent {
  /**
   * 构造函数
   *
   * @param roleId - 被删除的角色的唯一标识符
   * @param code - 被删除的角色的代码
   */
  constructor(
    public readonly roleId: string,
    public readonly code: string,
  ) {}
}
