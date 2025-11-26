import { Injectable, Logger, OnModuleInit } from '@nestjs/common';

import ip2region, { Searcher } from './ip2region';
import { Ip2RegionConfig, SearchMode } from './ip2region.config.interface';
import { Ip2regionConfigService } from './ip2region.config.service';

/**
 * IP2Region 服务
 *
 * @description 提供 IP 地址地理位置查询功能，支持三种查询模式：
 * - File: 文件模式，每次查询都读取文件（内存占用最小，性能较低）
 * - VectorIndex: 向量索引模式，预加载索引到内存（平衡内存和性能）
 * - Full: 全量模式，预加载整个数据库到内存（内存占用最大，性能最高）
 *
 * @example
 * ```typescript
 * // 在控制器或服务中注入使用
 * constructor(private readonly ip2regionService: Ip2regionService) {}
 *
 * // 获取查询器并查询 IP
 * const searcher = Ip2regionService.getSearcher();
 * const result = await searcher.search('1.2.3.4');
 * console.log(result.region); // 输出：中国|0|北京|北京市|联通
 * ```
 *
 * @note 此服务使用静态方法管理 Searcher 实例，确保全局单例
 * @note 如果配置缺失，服务会记录警告但不会抛出异常（某些系统可能不需要 ip2region）
 */
@Injectable()
export class Ip2regionService implements OnModuleInit {
  /** 静态 Searcher 实例，全局共享 */
  private static searcher: Searcher | null = null;

  /**
   * 构造函数
   *
   * @param ip2regionConfigService - IP2Region 配置服务
   */
  constructor(
    private readonly ip2regionConfigService: Ip2regionConfigService,
  ) {}

  /**
   * 模块初始化
   *
   * @description 在模块初始化时根据配置创建 Searcher 实例
   * 支持三种查询模式：File、VectorIndex、Full
   *
   * @returns Promise<void>
   *
   * @throws 不会抛出异常，配置缺失时仅记录警告
   *
   * @note 如果配置缺失或不完整，会记录警告并返回，不会初始化 Searcher
   * @note 如果查询模式不支持，会记录警告但不会抛出异常
   */
  async onModuleInit(): Promise<void> {
    const config: Ip2RegionConfig | undefined =
      this.ip2regionConfigService.getIp2RegionConfig();

    if (!config) {
      Logger.warn(
        'The ip2region configuration is missing or incomplete. Please check your configuration files and ensure that all required ip2region settings, including "xdbPath" and "mode", are correctly specified.',
        'Ip2regionService',
      );
      return;
    }

    switch (config.mode) {
      case SearchMode.File: {
        Ip2regionService.searcher = ip2region.newWithFileOnly(config.xdbPath);
        Logger.log(
          `Initializing ip2region with File mode using database path: ${config.xdbPath}`,
          'Ip2regionService',
        );
        break;
      }
      case SearchMode.VectorIndex: {
        const vectorIndex = ip2region.loadVectorIndexFromFile(config.xdbPath);
        Ip2regionService.searcher = ip2region.newWithVectorIndex(
          config.xdbPath,
          vectorIndex,
        );
        Logger.log(
          `Initializing ip2region with VectorIndex mode using database path: ${config.xdbPath}`,
          'Ip2regionService',
        );
        break;
      }
      case SearchMode.Full: {
        const buffer = ip2region.loadContentFromFile(config.xdbPath);
        Ip2regionService.searcher = ip2region.newWithBuffer(buffer);
        Logger.log(
          `Initializing ip2region with Full mode using database path: ${config.xdbPath}`,
          'Ip2regionService',
        );
        break;
      }
      default: {
        Logger.warn(
          `Unsupported search mode: ${config.mode}`,
          'Ip2regionService',
        );
        // 非必需异常,有些系统不需要ip2region
        // throw new Error(`Unsupported search mode: ${config.mode}`);
        break;
      }
    }
  }

  /**
   * 获取 Searcher 实例
   *
   * @description 获取全局共享的 Searcher 实例，用于执行 IP 地址查询
   *
   * @returns Searcher 实例
   *
   * @throws {Error} 如果 Searcher 未初始化，抛出错误
   *
   * @example
   * ```typescript
   * const searcher = Ip2regionService.getSearcher();
   * const result = await searcher.search('1.2.3.4');
   * ```
   *
   * @note 此方法为静态方法，可在任何地方调用
   * @note 调用前确保模块已初始化（通常在应用启动后）
   */
  public static getSearcher(): Searcher {
    if (!Ip2regionService.searcher) {
      throw new Error('Searcher is not initialized');
    }
    return Ip2regionService.searcher;
  }
}
