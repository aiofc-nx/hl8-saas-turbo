import { SetMetadata } from '@nestjs/common';

import {
  API_KEY_AUTH_OPTIONS,
  ApiKeyAuthSource,
  ApiKeyAuthStrategy,
} from '@hl8/constants';

/**
 * API Key 认证选项接口
 *
 * @description 定义 API Key 认证的配置选项
 *
 * @property strategy - 认证策略（ApiKey 或 SignedRequest）
 * @property source - API Key 来源（Header 或 Query，SignedRequest 策略时可选）
 * @property keyName - API Key 的键名
 */
export interface ApiKeyAuthOptions {
  /** 认证策略 */
  strategy: ApiKeyAuthStrategy;
  /** API Key 来源（可选） */
  source?: ApiKeyAuthSource;
  /** API Key 的键名 */
  keyName: string;
}

/**
 * API Key 认证装饰器
 *
 * @description 标记路由需要 API Key 认证，支持简单 API Key 和签名请求两种策略
 *
 * @param options - API Key 认证选项（可选，默认使用 ApiKey 策略，键名为 'api-key'）
 * @returns 返回设置 API Key 认证元数据的装饰器
 *
 * @example
 * ```typescript
 * @ApiKeyAuth({ strategy: ApiKeyAuthStrategy.ApiKey, keyName: 'x-api-key' })
 * @Get('protected')
 * async protectedRoute() { ... }
 *
 * @ApiKeyAuth({ strategy: ApiKeyAuthStrategy.SignedRequest })
 * @Post('signed')
 * async signedRoute() { ... }
 * ```
 */
export const ApiKeyAuth = (
  options: ApiKeyAuthOptions = {
    strategy: ApiKeyAuthStrategy.ApiKey,
    keyName: 'api-key',
  },
) => {
  // 默认情况下，如果是 SignedRequest 策略且未指定 source，不设置 source
  if (
    options.strategy === ApiKeyAuthStrategy.SignedRequest &&
    !options.source
  ) {
    delete options.source;
  } else {
    // 如果未明确指定 source，且策略不是 SignedRequest，设置默认 source 为 Header
    options.source = options.source || ApiKeyAuthSource.Header;
  }
  return SetMetadata(API_KEY_AUTH_OPTIONS, options);
};
