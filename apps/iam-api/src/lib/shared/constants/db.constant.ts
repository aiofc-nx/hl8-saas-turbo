import { ApiProperty } from '@nestjs/swagger';

import type { UpdateAuditInfoProperties } from '@hl8/typings';

/**
 * 更新审计信息基类
 *
 * @description 提供更新审计信息的通用字段，包括更新时间、更新者等
 *
 * @class UpdateAuditInfo
 */
export class UpdateAuditInfo implements UpdateAuditInfoProperties {
  @ApiProperty({
    description: '更新时间',
    nullable: true,
  })
  updatedAt: Date | null;

  @ApiProperty({
    description: '更新者',
    nullable: true,
  })
  updatedBy: string | null;
}

/**
 * 根路由父 ID
 *
 * @description 用于标识根路由的父 ID 常量
 */
export const ROOT_ROUTE_PID = '0';

/**
 * 根节点父 ID
 *
 * @description 用于标识根节点的父 ID 常量
 */
export const ROOT_PID = '0';

/**
 * 内置标识
 *
 * @description 用于标识系统内置记录的常量
 */
export const BUILT_IN = 'BUILT_IN';
