import { Global, Module } from '@nestjs/common';

import { Ip2regionConfigService } from './ip2region.config.service';
import { Ip2regionService } from './ip2region.service';

/**
 * IP2Region 模块
 *
 * @description 提供 IP 地址地理位置查询功能的 NestJS 模块
 * 使用 @Global() 装饰器，使模块全局可用，无需在每个模块中导入
 *
 * @example
 * ```typescript
 * // 在应用根模块中导入
 * @Module({
 *   imports: [Ip2regionModule],
 *   // ...
 * })
 * export class AppModule {}
 *
 * // 在其他模块中直接使用
 * @Injectable()
 * export class SomeService {
 *   constructor(private readonly ip2regionService: Ip2regionService) {}
 * }
 * ```
 *
 * @note 此模块为全局模块，导入一次后可在整个应用中使用
 * @note 需要配置 ip2region 配置项（xdbPath 和 mode）
 */
@Global()
@Module({
  providers: [Ip2regionService, Ip2regionConfigService],
  exports: [Ip2regionService],
})
export class Ip2regionModule {}
