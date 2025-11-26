import { Global, Module } from '@nestjs/common';

import { OssConfigService } from './oss.config.service';
import { OssService } from './oss.service';

/**
 * OSS 模块
 *
 * @description 提供阿里云 OSS 对象存储服务的 NestJS 模块
 * 使用 @Global() 装饰器，可在整个应用中全局使用
 *
 * @example
 * ```typescript
 * // 在应用模块中导入
 * @Module({
 *   imports: [OssModule],
 * })
 * export class AppModule {}
 *
 * // 在控制器或服务中注入使用
 * constructor(private readonly ossService: OssService) {}
 * ```
 *
 * @note 使用前需要在配置文件中配置 OSS 信息，参考 README.md
 * @note 支持多实例配置，通过配置键区分不同的 OSS 实例
 */
@Global()
@Module({
  providers: [OssService, OssConfigService],
  exports: [OssService],
})
export class OssModule {}
