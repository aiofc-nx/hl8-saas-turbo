import { Entity, PrimaryKey, Property } from '@mikro-orm/core';

import { Status } from '@/lib/shared/enums/status.enum';

/**
 * 角色实体
 *
 * @description 用于存储角色信息的数据库实体
 *
 * @class SysRole
 */
@Entity({ tableName: 'sys_role' })
export class SysRole {
  /**
   * 主键 ID
   *
   * @description 唯一标识符
   */
  @PrimaryKey()
  id!: string;

  /**
   * 角色代码
   *
   * @description 角色的唯一代码
   */
  @Property()
  code!: string;

  /**
   * 角色名称
   *
   * @description 角色的显示名称
   */
  @Property()
  name!: string;

  /**
   * 父角色 ID
   *
   * @description 父角色的 ID，用于角色层级结构
   */
  @Property()
  pid!: string;

  /**
   * 状态
   *
   * @description 角色的状态（启用/禁用）
   */
  @Property({ type: 'string' })
  status!: Status;

  /**
   * 描述
   *
   * @description 角色的描述信息
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
