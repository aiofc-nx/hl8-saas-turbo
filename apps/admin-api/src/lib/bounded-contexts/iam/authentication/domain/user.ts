import { AggregateRoot } from '@nestjs/cqrs';

import { Status } from '@/lib/shared/enums/status.enum';

import { UserCreatedEvent } from './events/user-created.event';
import { UserDeletedEvent } from './events/user-deleted.event';
import { Password } from './password.value-object';
import {
  UserCreateProperties,
  UserProperties,
  UserUpdateProperties,
} from './user.read.model';

/**
 * 用户接口
 *
 * @description 定义用户聚合根的基本接口，包含密码验证、登录检查和提交领域事件的方法
 */
export interface IUser {
  /**
   * 验证密码
   *
   * @description 验证提供的密码是否与用户密码匹配
   *
   * @param password - 要验证的密码
   * @returns 返回验证结果，true 表示密码正确
   */
  verifyPassword(password: string): Promise<boolean>;

  /**
   * 检查是否可以登录
   *
   * @description 检查用户状态是否允许登录
   *
   * @returns 返回检查结果，true 表示可以登录
   */
  canLogin(): Promise<boolean>;

  /**
   * 用户登录
   *
   * @description 执行用户登录逻辑，包括状态检查和密码验证
   *
   * @param password - 用户输入的密码
   * @returns 返回登录结果，包含成功标志和消息
   */
  loginUser(password: string): Promise<{ success: boolean; message: string }>;

  /**
   * 提交领域事件
   *
   * @description 提交所有待处理的领域事件到事件总线
   */
  commit(): void;
}

/**
 * 用户聚合根
 *
 * @description
 * 用户的领域模型，是用户有界上下文的聚合根。
 * 负责管理用户的生命周期和业务规则，包括密码验证、登录检查等，
 * 并发布领域事件。用户是 IAM 系统中的核心实体，每个用户属于一个域，可以拥有多个角色。
 *
 * @extends {AggregateRoot}
 * @implements {IUser}
 */
export class User extends AggregateRoot implements IUser {
  /**
   * 用户 ID
   *
   * @description 用户的唯一标识符
   */
  readonly id: string;

  /**
   * 用户名
   *
   * @description 用户的登录名，在域内必须唯一
   */
  readonly username: string;

  /**
   * 昵称
   *
   * @description 用户的显示名称
   */
  readonly nickName: string;

  /**
   * 密码
   *
   * @description 用户的密码值对象，用于密码验证和加密
   */
  readonly password: Password;

  /**
   * 状态
   *
   * @description 用户的状态，可选值：ENABLED（启用）、DISABLED（禁用）
   */
  readonly status: Status;

  /**
   * 域
   *
   * @description 用户所属的域代码，用于多租户隔离
   */
  readonly domain: string;

  /**
   * 头像
   *
   * @description 用户头像的 URL 地址
   */
  readonly avatar: string | null;

  /**
   * 邮箱
   *
   * @description 用户的邮箱地址，可用于登录和找回密码
   */
  readonly email: string | null;

  /**
   * 手机号
   *
   * @description 用户的手机号码，可用于登录和找回密码
   */
  readonly phoneNumber: string | null;

  /**
   * 创建时间
   *
   * @description 用户的创建时间
   */
  createdAt: Date;

  /**
   * 创建者
   *
   * @description 创建用户的用户 ID
   */
  createdBy: string;

  /**
   * 构造函数
   *
   * @description 创建用户聚合根实例，如果提供了密码则创建密码值对象
   *
   * @param properties - 用户属性对象，可以是创建、更新或完整属性
   */
  constructor(
    properties: UserProperties | UserCreateProperties | UserUpdateProperties,
  ) {
    super();
    Object.assign(this, properties);
    if ('password' in properties && properties.password) {
      this.password = Password.fromHashed(properties.password);
    }
  }

  /**
   * 验证密码
   *
   * @description 验证提供的密码是否与用户密码匹配
   *
   * @param password - 要验证的密码
   * @returns 返回验证结果，true 表示密码正确
   */
  async verifyPassword(password: string): Promise<boolean> {
    return this.password.compare(password);
  }

  /**
   * 检查是否可以登录
   *
   * @description 检查用户状态是否允许登录，只有启用状态的用户才能登录
   *
   * @returns 返回检查结果，true 表示可以登录
   */
  async canLogin(): Promise<boolean> {
    return this.status === Status.ENABLED;
  }

  /**
   * 用户登录
   *
   * @description
   * 执行用户登录逻辑，包括：
   * 1. 检查用户状态是否启用
   * 2. 验证密码是否正确
   * 3. 返回登录结果
   *
   * @param password - 用户输入的密码
   * @returns 返回登录结果，包含成功标志和消息
   */
  async loginUser(
    password: string,
  ): Promise<{ success: boolean; message: string }> {
    if (this.status !== Status.ENABLED) {
      return {
        success: false,
        message: `User is ${this.status.toLowerCase()}.`,
      };
    }

    const isPasswordValid = await this.verifyPassword(password);
    if (!isPasswordValid) {
      return { success: false, message: 'Invalid credentials.' };
    }

    return { success: true, message: 'Login successful' };
  }

  /**
   * 发布用户创建事件
   *
   * @description
   * 当用户被创建时，发布 UserCreatedEvent 事件。
   * 该事件可以被其他有界上下文订阅，用于执行后续操作（如初始化权限、发送通知等）。
   *
   * @returns Promise<void>
   */
  async created() {
    this.apply(new UserCreatedEvent(this.id, this.username, this.domain));
  }

  /**
   * 发布用户删除事件
   *
   * @description
   * 当用户被删除时，发布 UserDeletedEvent 事件。
   * 该事件可以被其他有界上下文订阅，用于执行后续操作（如清理权限、撤销令牌等）。
   *
   * @returns Promise<void>
   */
  async deleted() {
    this.apply(new UserDeletedEvent(this.id, this.username, this.domain));
  }
}
