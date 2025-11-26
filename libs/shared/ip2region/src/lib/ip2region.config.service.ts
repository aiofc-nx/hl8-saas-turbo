import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { isDevEnvironment } from '@hl8/utils';

import { Ip2RegionConfig } from './ip2region.config.interface';

/**
 * IP2Region 配置服务
 *
 * @description 从 NestJS ConfigService 中读取 ip2region 配置
 * 并根据运行环境（开发/生产）调整数据库文件路径
 *
 * @example
 * ```typescript
 * // 在配置文件中定义
 * ip2region:
 *   xdbPath: 'apps/base-system/src/resources/ip2region.xdb'
 *   mode: VECTOR_INDEX
 * ```
 */
@Injectable()
export class Ip2regionConfigService {
  /**
   * 构造函数
   *
   * @param configService - NestJS 配置服务
   */
  constructor(private readonly configService: ConfigService) {}

  /**
   * 获取 IP2Region 配置
   *
   * @description 从配置服务中读取 ip2region 配置
   * 在生产环境下，会自动将路径调整为 `./dist/${xdbPath}`
   *
   * @returns IP2Region 配置对象，如果配置不存在则返回 undefined
   *
   * @example
   * ```typescript
   * const config = ip2regionConfigService.getIp2RegionConfig();
   * if (config) {
   *   console.log(config.xdbPath); // 输出数据库文件路径
   *   console.log(config.mode); // 输出查询模式
   * }
   * ```
   *
   * @note 如果配置不存在，会记录警告但不会抛出异常（某些系统可能不需要 ip2region）
   * @note 在生产环境下，路径会自动添加 `./dist/` 前缀
   */
  getIp2RegionConfig(): Ip2RegionConfig | undefined {
    const config = this.configService.get<Ip2RegionConfig>(`ip2region`);
    if (!config) {
      Logger.warn(
        'ip2region configuration for key ip2region not found',
        'Ip2regionConfigService',
      );
      // 非必需异常,有些系统不需要ip2region
      // throw new Error(
      //   'ip2region configuration for key ip2region not found',
      // );
      return undefined;
    }
    if (!isDevEnvironment) {
      config.xdbPath = `./dist/${config.xdbPath}`;
    }
    return config;
  }
}
