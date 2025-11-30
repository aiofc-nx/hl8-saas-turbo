import { SetMetadata } from '@nestjs/common';

/**
 * 公开路由元数据键
 * 
 * @description 用于标识路由是否为公开访问的元数据键
 */
export const IS_PUBLIC_KEY = 'isPublic';

/**
 * 公开路由装饰器
 * 
 * @description 标记路由为公开访问，跳过 JWT 认证守卫
 * 
 * @returns 返回设置公开路由元数据的装饰器
 * 
 * @example
 * ```typescript
 * @Public()
 * @Get('public')
 * async publicRoute() { ... }
 * ```
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
