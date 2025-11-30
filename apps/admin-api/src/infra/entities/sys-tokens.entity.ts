import { Entity, PrimaryKey, Property } from '@mikro-orm/core';

/**
 * 令牌实体
 *
 * @description 用于存储访问令牌和刷新令牌信息的数据库实体
 *
 * @class SysTokens
 */
@Entity({ tableName: 'sys_tokens' })
export class SysTokens {
  /**
   * 主键 ID
   *
   * @description 唯一标识符，使用 refreshToken 作为主键
   */
  @PrimaryKey()
  id!: string;

  /**
   * 访问令牌
   *
   * @description JWT 访问令牌
   */
  @Property()
  accessToken!: string;

  /**
   * 刷新令牌
   *
   * @description JWT 刷新令牌
   */
  @Property()
  refreshToken!: string;

  /**
   * 状态
   *
   * @description 令牌的状态（UNUSED/USED）
   */
  @Property()
  status!: string;

  /**
   * 用户 ID
   *
   * @description 令牌所属的用户 ID
   */
  @Property()
  userId!: string;

  /**
   * 用户名
   *
   * @description 令牌所属的用户名
   */
  @Property()
  username!: string;

  /**
   * 域
   *
   * @description 令牌所属的域
   */
  @Property()
  domain!: string;

  /**
   * IP 地址
   *
   * @description 请求的 IP 地址
   */
  @Property()
  ip!: string;

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
   * @description 令牌的类型
   */
  @Property()
  type!: string;

  /**
   * 创建者
   *
   * @description 记录创建者
   */
  @Property()
  createdBy!: string;

  /**
   * 端口
   *
   * @description 请求的端口号
   */
  @Property({ nullable: true, type: 'number' })
  port?: number | null;

  /**
   * 创建时间
   *
   * @description 记录创建时间
   */
  @Property()
  createdAt!: Date;
}
