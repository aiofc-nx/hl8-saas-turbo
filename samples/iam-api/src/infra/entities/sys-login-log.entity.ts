import { Entity, PrimaryKey, Property } from '@mikro-orm/core';

/**
 * 登录日志实体
 *
 * @description 用于存储用户登录日志信息的数据库实体
 *
 * @class SysLoginLog
 */
@Entity({ tableName: 'sys_login_log' })
export class SysLoginLog {
  /**
   * 主键 ID
   *
   * @description 唯一标识符
   */
  @PrimaryKey()
  id!: string;

  /**
   * 用户 ID
   *
   * @description 登录的用户 ID
   */
  @Property({ nullable: true })
  userId?: string;

  /**
   * 用户名
   *
   * @description 登录的用户名
   */
  @Property()
  username!: string;

  /**
   * 域
   *
   * @description 登录的域
   */
  @Property()
  domain!: string;

  /**
   * 登录时间
   *
   * @description 登录发生的时间
   */
  @Property()
  loginTime!: Date;

  /**
   * IP 地址
   *
   * @description 登录请求的 IP 地址
   */
  @Property()
  ip!: string;

  /**
   * 端口
   *
   * @description 请求的端口号
   */
  @Property({ nullable: true, type: 'number' })
  port?: number | null;

  /**
   * 地址
   *
   * @description IP 地址对应的地理位置
   */
  @Property()
  address!: string;

  /**
   * 用户代理
   *
   * @description 请求的用户代理字符串
   */
  @Property()
  userAgent!: string;

  /**
   * 请求 ID
   *
   * @description 关联的请求 ID
   */
  @Property()
  requestId!: string;

  /**
   * 类型
   *
   * @description 登录类型（成功/失败等）
   */
  @Property()
  type!: string;

  /**
   * 创建时间
   *
   * @description 记录创建时间
   */
  @Property()
  createdAt!: Date;
}
