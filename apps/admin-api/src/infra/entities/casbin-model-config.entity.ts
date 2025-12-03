import { Entity, PrimaryKey, Property } from '@mikro-orm/core';

/**
 * 模型配置状态枚举
 *
 * @description Casbin 模型配置的版本状态
 */
export enum ModelConfigStatus {
  /** 草稿 */
  DRAFT = 'draft',
  /** 激活（当前使用） */
  ACTIVE = 'active',
  /** 已归档（历史版本） */
  ARCHIVED = 'archived',
}

/**
 * Casbin 模型配置实体
 *
 * @description 用于存储 Casbin 模型配置的版本化数据
 *
 * @class CasbinModelConfig
 */
@Entity({ tableName: 'casbin_model_config' })
export class CasbinModelConfig {
  /**
   * 主键 ID
   *
   * @description 自增主键
   */
  @PrimaryKey({ autoincrement: true })
  id!: number;

  /**
   * 模型配置内容
   *
   * @description 完整的 model.conf 文本内容
   */
  @Property({ type: 'text' })
  content!: string;

  /**
   * 版本号
   *
   * @description 自增版本号，用于标识版本顺序
   */
  @Property()
  version!: number;

  /**
   * 状态
   *
   * @description 版本状态：draft（草稿）、active（激活）、archived（已归档）
   */
  @Property({ type: 'string' })
  status!: ModelConfigStatus;

  /**
   * 备注说明
   *
   * @description 版本变更说明，用于记录变更原因
   */
  @Property({ nullable: true, type: 'text' })
  remark?: string;

  /**
   * 创建者用户 ID
   *
   * @description 创建该版本的用户 ID，用于审计追踪
   */
  @Property()
  createdBy!: string;

  /**
   * 创建时间
   *
   * @description 版本创建时间
   */
  @Property({ type: 'datetime' })
  createdAt!: Date;

  /**
   * 审批者用户 ID
   *
   * @description 审批并发布该版本的用户 ID，用于审计追踪
   */
  @Property({ nullable: true })
  approvedBy?: string;

  /**
   * 审批时间
   *
   * @description 版本审批并发布的时间
   */
  @Property({ nullable: true, type: 'datetime' })
  approvedAt?: Date;
}
