import { Entity, PrimaryKey, Property } from '@mikro-orm/core';

/**
 * 操作日志实体
 *
 * @description 用于存储系统操作日志信息的数据库实体
 *
 * @class SysOperationLog
 */
@Entity({ tableName: 'sys_operation_log' })
export class SysOperationLog {
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
   * @description 执行操作的用户 ID
   */
  @Property()
  userId!: string;

  /**
   * 用户名
   *
   * @description 执行操作的用户名
   */
  @Property()
  username!: string;

  /**
   * 域
   *
   * @description 操作发生的域
   */
  @Property()
  domain!: string;

  /**
   * 模块名称
   *
   * @description 操作所属的模块名称
   */
  @Property()
  moduleName!: string;

  /**
   * 描述
   *
   * @description 操作的描述信息
   */
  @Property()
  description!: string;

  /**
   * 请求 ID
   *
   * @description 关联的请求 ID
   */
  @Property()
  requestId!: string;

  /**
   * HTTP 方法
   *
   * @description 请求的 HTTP 方法
   */
  @Property()
  method!: string;

  /**
   * URL
   *
   * @description 请求的 URL
   */
  @Property()
  url!: string;

  /**
   * IP 地址
   *
   * @description 请求的 IP 地址
   */
  @Property()
  ip!: string;

  /**
   * 用户代理
   *
   * @description 请求的用户代理字符串
   */
  @Property({ nullable: true })
  userAgent?: string | null;

  /**
   * 参数
   *
   * @description 请求的参数（JSON 格式）
   */
  @Property({ type: 'json', nullable: true })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params?: any;

  /**
   * 请求体
   *
   * @description 请求的请求体（JSON 格式）
   */
  @Property({ type: 'json', nullable: true })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  body?: any;

  /**
   * 响应
   *
   * @description 请求的响应（JSON 格式）
   */
  @Property({ type: 'json', nullable: true })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  response?: any;

  /**
   * 开始时间
   *
   * @description 操作开始的时间
   */
  @Property()
  startTime!: Date;

  /**
   * 结束时间
   *
   * @description 操作结束的时间
   */
  @Property()
  endTime!: Date;

  /**
   * 持续时间
   *
   * @description 操作的持续时间（毫秒）
   */
  @Property({ type: 'number' })
  duration!: number;
}
