import { Entity, PrimaryKey, Property } from '@mikro-orm/core';

import { Status } from '@/lib/shared/enums/status.enum';

/**
 * 域实体
 *
 * @description 用于存储域信息的数据库实体
 *
 * @class SysDomain
 */
@Entity({ tableName: 'sys_domain' })
export class SysDomain {
  /**
   * 主键 ID
   *
   * @description 唯一标识符
   */
  @PrimaryKey()
  id!: string;

  /**
   * 域代码
   *
   * @description 域的唯一代码
   */
  @Property()
  code!: string;

  /**
   * 域名称
   *
   * @description 域的显示名称
   */
  @Property()
  name!: string;

  /**
   * 描述
   *
   * @description 域的描述信息
   */
  @Property()
  description!: string;

  /**
   * 状态
   *
   * @description 域的状态（启用/禁用）
   */
  @Property({ type: 'string' })
  status!: Status;

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
