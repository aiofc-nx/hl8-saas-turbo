import { Injectable, OnModuleInit } from '@nestjs/common';
import type { Cluster, Redis } from 'ioredis';

import { CacheConstant } from '@hl8/constants';
import { RedisUtility } from '@hl8/redis';

import { IApiKeyService, ValidateKeyOptions } from './api-key.interface';

/**
 * 简单 API Key 验证服务
 *
 * @description 实现简单 API Key 验证逻辑，基于 Redis Set 存储 API Key。适合内部服务调用或不需要复杂安全机制的场景。Key 存储在 Redis 中，同时维护内存缓存以提升性能。
 *
 * @class SimpleApiKeyService
 * @implements {IApiKeyService}
 * @implements {OnModuleInit}
 *
 * @remarks
 * ## 存储方式
 *
 * - **Redis**: 使用 Set 数据结构存储所有有效的 API Key，键为 `cache:simple-api-keys`
 * - **内存缓存**: 在服务启动时从 Redis 加载所有 Key 到内存 Set，提供快速验证
 *
 * ## 特点
 *
 * - ✅ 快速验证，只需检查 Key 是否存在
 * - ✅ 内存缓存，减少 Redis 查询
 * - ✅ 支持分布式环境（基于 Redis）
 * - ❌ 不支持密钥更新操作
 * - ❌ 无时间戳、Nonce 等安全机制
 *
 * @example
 * ```typescript
 * @Injectable()
 * export class MyService {
 *   constructor(
 *     @Inject(SimpleApiKeyServiceToken)
 *     private readonly apiKeyService: IApiKeyService,
 *   ) {}
 *
 *   async manageKeys() {
 *     await this.apiKeyService.addKey('internal-service-key');
 *     const isValid = await this.apiKeyService.validateKey('internal-service-key');
 *   }
 * }
 * ```
 */
@Injectable()
export class SimpleApiKeyService implements OnModuleInit, IApiKeyService {
  /** 内存中的 API Key 集合，用于快速验证 */
  private readonly apiKeys: Set<string> = new Set();
  /** Redis 服务实例 */
  private readonly redisService: Redis | Cluster;

  /** Redis 缓存键 */
  private readonly cacheKey = `${CacheConstant.CACHE_PREFIX}simple-api-keys`;

  /**
   * 构造函数
   *
   * @description 初始化服务，获取 Redis 实例。
   */
  constructor() {
    this.redisService = RedisUtility.instance;
  }

  /**
   * 模块初始化
   *
   * @description 在模块初始化时自动从 Redis 加载所有 API Key 到内存缓存。
   */
  async onModuleInit() {
    await this.loadKeys();
  }

  /**
   * 加载所有 API Key
   *
   * @description 从 Redis Set 中加载所有 API Key 到内存缓存，用于快速验证。
   *
   * @returns Promise<void>
   */
  async loadKeys() {
    const keys = await this.redisService.smembers(this.cacheKey);
    keys.forEach((key) => this.apiKeys.add(key));
  }

  /**
   * 验证 API Key
   *
   * @description 检查指定的 API Key 是否存在于内存缓存中。简单 API Key 验证不需要额外的选项参数。
   *
   * @param apiKey - 要验证的 API Key
   * @param _ - 未使用的验证选项（简单 API Key 不需要）
   * @returns Promise<boolean> - 返回 true 表示 Key 存在且有效，false 表示无效
   */
  async validateKey(apiKey: string, _?: ValidateKeyOptions): Promise<boolean> {
    return Promise.resolve(this.apiKeys.has(apiKey));
  }

  /**
   * 添加 API Key
   *
   * @description 将新的 API Key 添加到 Redis Set 和内存缓存中。
   *
   * @param apiKey - 要添加的 API Key
   * @returns Promise<void>
   */
  async addKey(apiKey: string): Promise<void> {
    await this.redisService.sadd(this.cacheKey, apiKey);
    this.apiKeys.add(apiKey);
  }

  /**
   * 删除 API Key
   *
   * @description 从 Redis Set 和内存缓存中删除指定的 API Key。
   *
   * @param apiKey - 要删除的 API Key
   * @returns Promise<void>
   */
  async removeKey(apiKey: string): Promise<void> {
    await this.redisService.srem(this.cacheKey, apiKey);
    this.apiKeys.delete(apiKey);
  }

  /**
   * 更新 API Key 的密钥
   *
   * @description 简单 API Key 服务不支持更新操作，调用此方法会抛出错误。
   *
   * @param _apiKey - 未使用的参数
   * @param _newSecret - 未使用的参数
   * @returns Promise<void>
   * @throws {Error} 始终抛出错误，因为简单 API Key 不支持更新操作
   */
  async updateKey(_apiKey: string, _newSecret: string): Promise<void> {
    // This method is not applicable for simple API key service.
    throw new Error('Update operation is not supported on simple API keys.');
  }
}
