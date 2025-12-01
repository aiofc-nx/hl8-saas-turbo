import { Entity, PrimaryKey, Property } from '@mikro-orm/core';

import { Status } from '@/lib/shared/enums/status.enum';

/**
 * 用户实体
 *
 * @description 用于存储用户信息的数据库实体
 *
 * @class SysUser
 */
@Entity({ tableName: 'sys_user' })
export class SysUser {
  /**
   * 主键 ID
   *
   * @description 唯一标识符
   */
  @PrimaryKey()
  id!: string;

  /**
   * 用户名
   *
   * @description 用户的登录用户名
   */
  @Property()
  username!: string;

  /**
   * 域
   *
   * @description 用户所属的域
   */
  @Property()
  domain!: string;

  /**
   * 昵称
   *
   * @description 用户的显示昵称
   */
  @Property()
  nickName!: string;

  /**
   * 状态
   *
   * @description 用户的状态（启用/禁用）
   */
  @Property({ type: 'string' })
  status!: Status;

  /**
   * 密码
   *
   * @description 用户的加密密码
   */
  @Property({ nullable: true })
  password?: string;

  /**
   * 头像
   *
   * @description 用户头像 URL
   */
  @Property({ nullable: true })
  avatar?: string | null;

  /**
   * 邮箱
   *
   * @description 用户邮箱地址
   */
  @Property({ nullable: true })
  email?: string | null;

  /**
   * 手机号
   *
   * @description 用户手机号码
   */
  @Property({ nullable: true })
  phoneNumber?: string | null;

  /**
   * 邮箱是否已验证
   *
   * @description 标识用户邮箱是否已经通过验证，未验证邮箱的用户不能登录
   */
  @Property({ default: false })
  isEmailVerified!: boolean;

  /**
   * 创建时间
   *
   * @description 记录创建时间
   */
  @Property()
  createdAt!: Date;

  /**
   * 创建者
   *
   * @description 记录创建者
   */
  @Property()
  createdBy!: string;

  /**
   * 更新时间
   *
   * @description 记录最后更新时间
   */
  @Property({ nullable: true })
  updatedAt?: Date | null;

  /**
   * 更新者
   *
   * @description 记录最后更新者
   */
  @Property({ nullable: true })
  updatedBy?: string | null;
}
