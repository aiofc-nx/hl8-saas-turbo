import { SetMetadata, ExecutionContext } from '@nestjs/common';

import { PERMISSIONS_METADATA } from '../constants/authz.constants';
import { Permission } from '../interfaces';

const defaultIsOwn = (ctx: ExecutionContext): boolean => false;

/**
 * 权限装饰器
 * 
 * @description 标记路由所需的权限要求，可以定义多个权限，只有当所有权限都满足时才能访问该路由
 * 
 * @param permissions - 权限数组，每个权限包含资源（resource）和动作（action）
 * @returns 返回设置权限元数据的装饰器
 * 
 * @example
 * ```typescript
 * @UseGuards(AuthZGuard)
 * @UsePermissions(
 *   { resource: 'data1', action: 'read' },
 *   { resource: 'data2', action: 'write' }
 * )
 * @Get('data')
 * async getData() { ... }
 * ```
 */
export const UsePermissions = (...permissions: Permission[]) => {
  return SetMetadata(PERMISSIONS_METADATA, permissions);
};
