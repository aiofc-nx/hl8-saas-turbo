import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { OssConfig } from './oss.config.interface';

/**
 * OSS 配置服务
 *
 * @description 负责从配置服务中获取 OSS 配置信息，支持多实例配置（通过 key 区分）
 *
 * @example
 * ```typescript
 * // 在服务中注入使用
 * constructor(private readonly ossConfigService: OssConfigService) {}
 *
 * // 获取默认配置
 * const config = this.ossConfigService.getOssConfig('default');
 *
 * // 获取其他配置
 * const config2 = this.ossConfigService.getOssConfig('backup');
 * ```
 */
@Injectable()
export class OssConfigService {
  /**
   * 构造函数
   *
   * @param configService - NestJS 配置服务
   */
  constructor(private readonly configService: ConfigService) {}

  /**
   * 获取 OSS 配置
   *
   * @description 根据配置键获取对应的 OSS 配置信息
   *
   * @param key - 配置键，对应配置文件中的 `oss.${key}` 路径
   * @returns 返回 OSS 配置对象
   *
   * @throws {Error} 如果配置不存在，抛出错误
   *
   * @example
   * ```typescript
   * // 获取默认配置
   * const config = this.ossConfigService.getOssConfig('default');
   * // 返回: { region: 'oss-cn-beijing', accessKeyId: '...', ... }
   * ```
   */
  getOssConfig(key: string): OssConfig {
    const config = this.configService.get<OssConfig>(`oss.${key}`);
    if (!config) {
      throw new Error(`未找到键为 '${key}' 的 OSS 配置`);
    }
    return config;
  }
}
