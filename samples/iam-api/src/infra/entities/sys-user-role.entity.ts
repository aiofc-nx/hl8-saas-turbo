import { Entity, PrimaryKey, Property } from '@mikro-orm/core';

/**
 * 用户角色关联实体
 *
 * @description 用于存储用户与角色关联关系的数据库实体
 *
 * @class SysUserRole
 */
@Entity({ tableName: 'sys_user_role' })
export class SysUserRole {
  /**
   * 主键 ID
   *
   * @description 唯一标识符
   */
  @PrimaryKey()
  id!: string;

  /**
   * 角色 ID
   *
   * @description 关联的角色 ID
   */
  @Property()
  roleId!: string;

  /**
   * 用户 ID
   *
   * @description 关联的用户 ID
   */
  @Property()
  userId!: string;
}
