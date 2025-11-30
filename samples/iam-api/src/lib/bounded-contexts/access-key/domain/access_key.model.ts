import { Status } from '@/lib/shared/enums/status.enum';
import { AggregateRoot } from '@nestjs/cqrs';

import type { AccessKeyProperties } from './access_key.read.model';
import { AccessKeyCreatedEvent } from './events/access_key-created.event';
import { AccessKeyDeletedEvent } from './events/access_key-deleted.event';

/**
 * 访问密钥接口
 *
 * @description 定义访问密钥聚合根的基本接口，包含提交领域事件的方法
 */
export interface IAccessKey {
  /**
   * 提交领域事件
   *
   * @description 提交所有待处理的领域事件到事件总线
   */
  commit(): void;
}

/**
 * 访问密钥聚合根
 *
 * @description
 * 访问密钥的领域模型，是访问密钥有界上下文的聚合根。
 * 负责管理访问密钥的生命周期和业务规则，并发布领域事件。
 *
 * @extends {AggregateRoot}
 * @implements {IAccessKey}
 */
export class AccessKey extends AggregateRoot implements IAccessKey {
  /**
   * 访问密钥 ID
   *
   * @description 访问密钥的唯一标识符
   */
  id: string;

  /**
   * 域
   *
   * @description 访问密钥所属的域代码，用于多租户隔离
   */
  domain: string;

  /**
   * 访问密钥 ID（用于 API 认证）
   *
   * @description 用于 API 调用认证的密钥 ID，与 AccessKeySecret 配对使用
   */
  AccessKeyID: string;

  /**
   * 访问密钥值（用于 API 认证）
   *
   * @description 用于 API 调用认证的密钥值，需要妥善保管
   */
  AccessKeySecret: string;

  /**
   * 状态
   *
   * @description 访问密钥的状态，可选值：ENABLED（启用）、DISABLED（禁用）
   */
  status: Status;

  /**
   * 创建时间
   *
   * @description 访问密钥的创建时间
   */
  createdAt: Date;

  /**
   * 创建者
   *
   * @description 创建访问密钥的用户 ID
   */
  createdBy: string;

  /**
   * 从属性创建访问密钥实例
   *
   * @description 使用属性对象创建访问密钥聚合根实例
   *
   * @param properties - 访问密钥属性对象
   * @returns 访问密钥聚合根实例
   */
  static fromProp(properties: AccessKeyProperties): AccessKey {
    return Object.assign(new AccessKey(), properties);
  }

  /**
   * 发布访问密钥创建事件
   *
   * @description
   * 当访问密钥被创建时，发布 AccessKeyCreatedEvent 事件。
   * 该事件可以被其他有界上下文订阅，用于执行后续操作（如缓存更新、通知等）。
   *
   * @returns Promise<void>
   */
  async created() {
    this.apply(
      new AccessKeyCreatedEvent(
        this.domain,
        this.AccessKeyID,
        this.AccessKeySecret,
        this.status,
      ),
    );
  }

  /**
   * 发布访问密钥删除事件
   *
   * @description
   * 当访问密钥被删除时，发布 AccessKeyDeletedEvent 事件。
   * 该事件可以被其他有界上下文订阅，用于执行后续操作（如清理缓存、撤销权限等）。
   *
   * @returns Promise<void>
   */
  async deleted() {
    this.apply(
      new AccessKeyDeletedEvent(
        this.domain,
        this.AccessKeyID,
        this.AccessKeySecret,
        this.status,
      ),
    );
  }
}
