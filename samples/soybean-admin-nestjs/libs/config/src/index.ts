import { RecordNamePaths } from '@lib/typings/utils';

import { AppConfig, IAppConfig, appConfigToken } from './app.config';
import { CorsConfig, corsRegToken, ICorsConfig } from './cors.config';
import { RedisConfig, IRedisConfig, redisRegToken } from './redis.config';
import {
  SecurityConfig,
  ISecurityConfig,
  securityRegToken,
} from './security.config';
import {
  ThrottlerConfig,
  IThrottlerConfig,
  throttlerConfigToken,
} from './throttler.config';

export * from './app.config';
export * from './redis.config';
export * from './security.config';
export * from './throttler.config';
export * from './cors.config';

/**
 * 所有配置类型接口
 * 
 * @description 定义所有配置模块的类型映射，用于类型安全的配置访问
 */
export interface AllConfigType {
  [appConfigToken]: IAppConfig;
  [redisRegToken]: IRedisConfig;
  [securityRegToken]: ISecurityConfig;
  [throttlerConfigToken]: IThrottlerConfig;
  [corsRegToken]: ICorsConfig;
}

/**
 * 配置键路径类型
 * 
 * @description 基于 AllConfigType 生成的配置键路径类型，用于类型安全的配置路径访问
 */
export type ConfigKeyPaths = RecordNamePaths<AllConfigType>;

/**
 * 默认导出配置对象
 * 
 * @description 导出所有配置模块的默认对象，方便统一导入
 */
export default {
  AppConfig,
  RedisConfig,
  SecurityConfig,
  ThrottlerConfig,
  CorsConfig,
};
