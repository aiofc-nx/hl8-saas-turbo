import { ApiProperty } from '@nestjs/swagger';

import type { UpdateAuditInfoProperties } from '@hl8/typings';

/**
 * 更新审计信息基类
 *
 * @description
 * 提供更新审计信息的通用字段，包括更新时间和更新者。
 * 所有需要记录更新审计信息的实体可以继承此类。
 *
 * @class UpdateAuditInfo
 * @implements {UpdateAuditInfoProperties}
 */
export class UpdateAuditInfo implements UpdateAuditInfoProperties {
  /**
   * 更新时间
   *
   * @description 记录实体最后更新的时间，如果从未更新则为 null
   */
  @ApiProperty({
    description: '更新时间',
    nullable: true,
  })
  updatedAt: Date | null;

  /**
   * 更新者
   *
   * @description 记录最后更新实体的用户 ID，如果从未更新则为 null
   */
  @ApiProperty({
    description: '更新者',
    nullable: true,
  })
  updatedBy: string | null;
}

/**
 * 根路由父 ID
 *
 * @description
 * 用于标识根路由的父 ID 常量。当路由的父 ID 为此值时，表示该路由是顶级路由。
 */
export const ROOT_ROUTE_PID = '0';

/**
 * 根节点父 ID
 *
 * @description
 * 用于标识根节点的父 ID 常量。当节点的父 ID 为此值时，表示该节点是顶级节点。
 */
export const ROOT_PID = '0';

/**
 * 内置标识
 *
 * @description
 * 用于标识系统内置记录的常量。系统内置记录通常不允许删除或修改，
 * 用于区分用户创建的数据和系统预置的数据。
 */
export const BUILT_IN = 'BUILT_IN';
