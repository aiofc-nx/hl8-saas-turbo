import { Status } from '@/lib/shared/enums/status.enum';
import { AggregateRoot } from '@nestjs/cqrs';

import {
  DomainCreateProperties,
  DomainProperties,
  DomainUpdateProperties,
} from './domain.read.model';
import { DomainDeletedEvent } from './events/domain-deleted.event';

/**
 * 域接口
 *
 * @description 定义域聚合根的基本接口，包含提交领域事件的方法
 */
export interface IDomain {
  /**
   * 提交领域事件
   *
   * @description 提交所有待处理的领域事件到事件总线
   */
  commit(): void;
}

/**
 * 域聚合根
 *
 * @description
 * Casbin 域的领域模型，是域有界上下文的聚合根。
 * 负责管理域的生命周期和业务规则，并发布领域事件。
 * 域是 Casbin 权限模型中的多租户隔离单位。
 *
 * @extends {AggregateRoot}
 * @implements {IDomain}
 */
export class Domain extends AggregateRoot implements IDomain {
  /**
   * 域 ID
   *
   * @description 域的唯一标识符
   */
  id: string;

  /**
   * 域代码
   *
   * @description 域的唯一代码，用于标识不同的租户或业务域
   */
  code: string;

  /**
   * 域名称
   *
   * @description 域的显示名称
   */
  name: string;

  /**
   * 域描述
   *
   * @description 域的详细描述信息
   */
  description: string;

  /**
   * 状态
   *
   * @description 域的状态，可选值：ENABLED（启用）、DISABLED（禁用）
   */
  status: Status;

  /**
   * 创建时间
   *
   * @description 域的创建时间
   */
  createdAt: Date;

  /**
   * 创建者
   *
   * @description 创建域的用户 ID
   */
  createdBy: string;

  /**
   * 更新时间
   *
   * @description 域的最后更新时间
   */
  updatedAt?: Date | null;

  /**
   * 更新者
   *
   * @description 最后更新域的用户 ID
   */
  updatedBy?: string | null;

  /**
   * 从创建属性创建域实例
   *
   * @description 使用创建属性对象创建域聚合根实例
   *
   * @param properties - 域创建属性对象
   * @returns 域聚合根实例
   */
  static fromCreate(properties: DomainCreateProperties): Domain {
    return Object.assign(new Domain(), properties);
  }

  /**
   * 从更新属性创建域实例
   *
   * @description 使用更新属性对象创建域聚合根实例
   *
   * @param properties - 域更新属性对象
   * @returns 域聚合根实例
   */
  static fromUpdate(properties: DomainUpdateProperties): Domain {
    return Object.assign(new Domain(), properties);
  }

  /**
   * 从完整属性创建域实例
   *
   * @description 使用完整属性对象创建域聚合根实例
   *
   * @param properties - 域完整属性对象
   * @returns 域聚合根实例
   */
  static fromProp(properties: DomainProperties): Domain {
    return Object.assign(new Domain(), properties);
  }

  /**
   * 发布域删除事件
   *
   * @description
   * 当域被删除时，发布 DomainDeletedEvent 事件。
   * 该事件可以被其他有界上下文订阅，用于执行后续操作（如清理权限、通知等）。
   *
   * @returns Promise<void>
   */
  async deleted() {
    this.apply(new DomainDeletedEvent(this.id, this.code));
  }
}
