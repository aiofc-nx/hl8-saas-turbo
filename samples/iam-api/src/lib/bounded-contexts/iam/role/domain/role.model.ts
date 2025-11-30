import { AggregateRoot } from '@nestjs/cqrs';
import { Status } from '../../../../shared/enums/status.enum';

import { RoleDeletedEvent } from './events/role-deleted.event';
import {
  RoleCreateProperties,
  RoleProperties,
  RoleUpdateProperties,
} from './role.read.model';

/**
 * 角色接口
 *
 * @description 定义角色聚合根的基本接口，包含提交领域事件的方法
 */
export interface IRole {
  /**
   * 提交领域事件
   *
   * @description 提交所有待处理的领域事件到事件总线
   */
  commit(): void;
}

/**
 * 角色聚合根
 *
 * @description
 * 角色的领域模型，是角色有界上下文的聚合根。
 * 负责管理角色的生命周期和业务规则，并发布领域事件。
 * 角色是权限管理的基础，通过角色可以组织和管理用户权限。
 *
 * @extends {AggregateRoot}
 * @implements {IRole}
 */
export class Role extends AggregateRoot implements IRole {
  /**
   * 角色 ID
   *
   * @description 角色的唯一标识符
   */
  id: string;

  /**
   * 角色代码
   *
   * @description 角色的唯一代码，用于标识不同的角色
   */
  code: string;

  /**
   * 角色名称
   *
   * @description 角色的显示名称
   */
  name: string;

  /**
   * 角色描述
   *
   * @description 角色的详细描述信息
   */
  description: string;

  /**
   * 父角色 ID
   *
   * @description 父角色的唯一标识符，用于实现角色层级结构
   */
  pid: string;

  /**
   * 状态
   *
   * @description 角色的状态，可选值：ENABLED（启用）、DISABLED（禁用）
   */
  status: Status;

  /**
   * 创建时间
   *
   * @description 角色的创建时间
   */
  createdAt: Date;

  /**
   * 创建者
   *
   * @description 创建角色的用户 ID
   */
  createdBy: string;

  /**
   * 从创建属性创建角色实例
   *
   * @description 使用创建属性对象创建角色聚合根实例
   *
   * @param properties - 角色创建属性对象
   * @returns 角色聚合根实例
   */
  static fromCreate(properties: RoleCreateProperties): Role {
    return Object.assign(new Role(), properties);
  }

  /**
   * 从更新属性创建角色实例
   *
   * @description 使用更新属性对象创建角色聚合根实例
   *
   * @param properties - 角色更新属性对象
   * @returns 角色聚合根实例
   */
  static fromUpdate(properties: RoleUpdateProperties): Role {
    return Object.assign(new Role(), properties);
  }

  /**
   * 从完整属性创建角色实例
   *
   * @description 使用完整属性对象创建角色聚合根实例
   *
   * @param properties - 角色完整属性对象
   * @returns 角色聚合根实例
   */
  static fromProp(properties: RoleProperties): Role {
    return Object.assign(new Role(), properties);
  }

  /**
   * 发布角色删除事件
   *
   * @description
   * 当角色被删除时，发布 RoleDeletedEvent 事件。
   * 该事件可以被其他有界上下文订阅，用于执行后续操作（如清理权限、通知等）。
   *
   * @returns Promise<void>
   */
  async deleted() {
    this.apply(new RoleDeletedEvent(this.id, this.code));
  }
}
