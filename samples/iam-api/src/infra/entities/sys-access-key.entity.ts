import { Entity, PrimaryKey, Property } from '@mikro-orm/core';

import { Status } from '@/lib/shared/enums/status.enum';

/**
 * 访问密钥实体
 *
 * @description 用于存储 API 访问密钥的数据库实体
 *
 * @class SysAccessKey
 */
@Entity({ tableName: 'sys_access_key' })
export class SysAccessKey {
  /**
   * 主键 ID
   *
   * @description 唯一标识符
   */
  @PrimaryKey()
  id!: string;

  /**
   * 域
   *
   * @description 访问密钥所属的域
   */
  @Property()
  domain!: string;

  /**
   * 访问密钥 ID
   *
   * @description 访问密钥的唯一标识符
   */
  @Property({ columnType: 'varchar' })
  AccessKeyID!: string;

  /**
   * 访问密钥 Secret
   *
   * @description 访问密钥的密钥值
   */
  @Property({ columnType: 'varchar' })
  AccessKeySecret!: string;

  /**
   * 状态
   *
   * @description 访问密钥的状态（启用/禁用）
   */
  @Property({ type: 'string' })
  status!: Status;

  /**
   * 描述
   *
   * @description 访问密钥的描述信息
   */
  @Property({ nullable: true })
  description?: string | null;

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
}
