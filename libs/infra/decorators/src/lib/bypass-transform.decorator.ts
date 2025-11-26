import { SetMetadata } from '@nestjs/common';

/**
 * 跳过转换元数据键
 *
 * @description 用于标识路由是否跳过响应转换的元数据键
 */
export const BYPASS_TRANSFORM_KEY = 'bypassTransform';

/**
 * 跳过转换装饰器
 *
 * @description 标记路由跳过响应转换拦截器，直接返回原始响应数据
 *
 * @returns 返回设置跳过转换元数据的装饰器
 *
 * @example
 * ```typescript
 * @BypassTransform()
 * @Get('raw')
 * async getRawData() {
 *   return { custom: 'format' };
 * }
 * ```
 */
export const BypassTransform = () => SetMetadata(BYPASS_TRANSFORM_KEY, true);
