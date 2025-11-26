import { Entity, PrimaryKey, Property, Unique } from '@mikro-orm/core';

/**
 * Casbin 规则实体
 *
 * @description 用于存储 Casbin 策略规则的数据库实体
 *
 * @class CasbinRule
 */
@Entity({ tableName: 'casbin_rule' })
@Unique({ properties: ['ptype', 'v0', 'v1', 'v2', 'v3', 'v4', 'v5'] })
export class CasbinRule {
  /**
   * 主键 ID
   *
   * @description 自增主键
   */
  @PrimaryKey({ autoincrement: true })
  id!: number;

  /**
   * 策略类型
   *
   * @description 策略类型，通常为 'p'（策略）或 'g'（角色继承）
   */
  @Property()
  ptype!: string;

  /**
   * 策略规则字段 0
   *
   * @description 策略规则的第一个字段值
   */
  @Property({ nullable: true })
  v0?: string;

  /**
   * 策略规则字段 1
   *
   * @description 策略规则的第二个字段值
   */
  @Property({ nullable: true })
  v1?: string;

  /**
   * 策略规则字段 2
   *
   * @description 策略规则的第三个字段值
   */
  @Property({ nullable: true })
  v2?: string;

  /**
   * 策略规则字段 3
   *
   * @description 策略规则的第四个字段值
   */
  @Property({ nullable: true })
  v3?: string;

  /**
   * 策略规则字段 4
   *
   * @description 策略规则的第五个字段值
   */
  @Property({ nullable: true })
  v4?: string;

  /**
   * 策略规则字段 5
   *
   * @description 策略规则的第六个字段值
   */
  @Property({ nullable: true })
  v5?: string;
}
