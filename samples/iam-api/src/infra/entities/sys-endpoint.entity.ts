import { Entity, PrimaryKey, Property } from '@mikro-orm/core';

/**
 * API 端点实体
 *
 * @description 用于存储 API 端点信息的数据库实体
 *
 * @class SysEndpoint
 */
@Entity({ tableName: 'sys_endpoint' })
export class SysEndpoint {
  /**
   * 主键 ID
   *
   * @description 唯一标识符
   */
  @PrimaryKey()
  id!: string;

  /**
   * 路径
   *
   * @description API 端点的路径
   */
  @Property()
  path!: string;

  /**
   * HTTP 方法
   *
   * @description API 端点使用的 HTTP 方法（GET, POST, PUT, DELETE 等）
   */
  @Property()
  method!: string;

  /**
   * 操作
   *
   * @description API 端点对应的操作名称
   */
  @Property()
  action!: string;

  /**
   * 资源
   *
   * @description API 端点对应的资源名称
   */
  @Property()
  resource!: string;

  /**
   * 控制器
   *
   * @description 处理该端点的控制器名称
   */
  @Property()
  controller!: string;

  /**
   * 摘要
   *
   * @description API 端点的描述信息
   */
  @Property({ nullable: true })
  summary?: string | null;

  /**
   * 创建时间
   *
   * @description 记录创建时间
   */
  @Property()
  createdAt!: Date;

  /**
   * 更新时间
   *
   * @description 记录最后更新时间
   */
  @Property({ nullable: true })
  updatedAt?: Date | null;
}
