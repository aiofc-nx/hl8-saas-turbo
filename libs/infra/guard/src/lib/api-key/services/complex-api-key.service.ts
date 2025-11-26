import {
  BadRequestException,
  Inject,
  Injectable,
  OnModuleInit,
} from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import CryptoJS from 'crypto-js';
import type { Cluster, Redis } from 'ioredis';

import { SecurityConfig, securityRegToken } from '@hl8/config';
import { CacheConstant } from '@hl8/constants';
import { RedisUtility } from '@hl8/redis';

import { SignatureAlgorithm } from '../api-key.signature.algorithm';

import {
  IApiKeyService,
  RequestParamValue,
  ValidateKeyOptions,
} from './api-key.interface';

/**
 * 复杂签名请求验证服务
 *
 * @description 实现基于签名算法的复杂 API Key 验证逻辑，支持多种签名算法（MD5、SHA1、SHA256、HMAC_SHA256）。提供时间戳验证、Nonce 防重放、参数签名验证等安全特性。适合对外提供 API 服务，需要更高的安全性。
 *
 * @class ComplexApiKeyService
 * @implements {IApiKeyService}
 * @implements {OnModuleInit}
 *
 * @remarks
 * ## 存储方式
 *
 * - **Redis**: 使用 Hash 数据结构存储 API Key 和对应的密钥，键为 `cache:complex-api-secrets`
 * - **内存缓存**: 在服务启动时从 Redis 加载所有 Key 和密钥到内存 Map，提供快速访问
 *
 * ## 安全特性
 *
 * - ✅ 时间戳验证：防止重放攻击，可配置时间窗口
 * - ✅ Nonce 机制：防止重复请求，每个 Nonce 只能使用一次
 * - ✅ 参数签名验证：验证请求参数的完整性
 * - ✅ 多种签名算法支持：MD5、SHA1、SHA256、HMAC_SHA256
 * - ✅ 密钥轮换：支持更新密钥
 *
 * ## 签名计算流程
 *
 * 1. 排除 `signature` 参数
 * 2. 按字母顺序排序所有参数键
 * 3. 构建签名字符串（`key1=value1&key2=value2`）
 * 4. 根据算法计算签名（MD5/SHA1/SHA256 追加 `&key=secret`，HMAC_SHA256 使用密钥）
 *
 * @example
 * ```typescript
 * @Injectable()
 * export class ApiService {
 *   constructor(
 *     @Inject(ComplexApiKeyServiceToken)
 *     private readonly signedService: IApiKeyService,
 *   ) {}
 *
 *   async registerClient(apiKey: string, secret: string) {
 *     await this.signedService.addKey(apiKey, secret);
 *   }
 * }
 * ```
 */
@Injectable()
export class ComplexApiKeyService implements OnModuleInit, IApiKeyService {
  /** 内存中的 API Key 和密钥映射，用于快速验证 */
  private readonly apiSecrets: Map<string, string> = new Map();
  /** Redis 服务实例 */
  private readonly redisService: Redis | Cluster;

  /** Redis 缓存键 */
  private readonly cacheKey = `${CacheConstant.CACHE_PREFIX}complex-api-secrets`;

  /**
   * 构造函数
   *
   * @param securityConfig - 安全配置，包含时间戳偏差和 Nonce TTL 等配置项
   */
  constructor(
    @Inject(securityRegToken)
    private readonly securityConfig: ConfigType<typeof SecurityConfig>,
  ) {
    this.redisService = RedisUtility.instance;
  }

  /**
   * 模块初始化
   *
   * @description 在模块初始化时自动从 Redis 加载所有 API Key 和密钥到内存缓存。
   */
  async onModuleInit() {
    await this.loadKeys();
  }

  /**
   * 加载所有 API Key 和密钥
   *
   * @description 从 Redis Hash 中加载所有 API Key 和对应的密钥到内存缓存，用于快速验证。
   *
   * @returns Promise<void>
   */
  async loadKeys() {
    const secrets = await this.redisService.hgetall(this.cacheKey);
    Object.entries(secrets).forEach(([key, value]) => {
      if (typeof value === 'string') {
        this.apiSecrets.set(key, value);
      }
    });
  }

  /**
   * 签名算法处理器映射
   *
   * @description 将签名算法枚举映射到对应的计算函数。MD5、SHA1、SHA256 需要将密钥追加到数据后计算，HMAC_SHA256 使用密钥进行 HMAC 计算。
   */
  private readonly algorithmHandlers: {
    [key in SignatureAlgorithm]: (data: string, secret: string) => string;
  } = {
    [SignatureAlgorithm.MD5]: (data, secret) =>
      CryptoJS.MD5(data + `&key=${secret}`).toString(),
    [SignatureAlgorithm.SHA1]: (data, secret) =>
      CryptoJS.SHA1(data + `&key=${secret}`).toString(),
    [SignatureAlgorithm.SHA256]: (data, secret) =>
      CryptoJS.SHA256(data + `&key=${secret}`).toString(),
    [SignatureAlgorithm.HMAC_SHA256]: (data, secret) =>
      CryptoJS.HmacSHA256(data, secret).toString(),
  };

  /**
   * 验证 API Key
   *
   * @description 验证签名请求的 API Key，包括算法验证、时间戳验证、Nonce 验证和签名验证。这是一个多步骤的验证过程，每一步都必须通过。
   *
   * @param apiKey - 要验证的 API Key
   * @param options - 验证选项，必须包含算法、时间戳、nonce 和签名
   * @returns Promise<boolean> - 返回 true 表示验证成功，false 表示验证失败
   *
   * @throws {BadRequestException} 当算法未提供、算法不支持、必需字段缺失、时间戳无效或 Nonce 无效时抛出
   *
   * @remarks
   * ## 验证步骤
   *
   * 1. **算法验证**: 检查算法是否提供且受支持
   * 2. **参数验证**: 检查时间戳、nonce 和签名是否提供
   * 3. **时间戳验证**: 检查时间戳是否在允许的时间窗口内
   * 4. **Nonce 验证**: 检查 Nonce 是否已被使用或过期
   * 5. **密钥获取**: 从内存缓存获取对应的密钥
   * 6. **签名计算**: 根据算法和参数计算签名
   * 7. **签名验证**: 比较计算的签名和提供的签名
   *
   * @example
   * ```typescript
   * const isValid = await service.validateKey('api-key', {
   *   algorithm: SignatureAlgorithm.HMAC_SHA256,
   *   timestamp: String(Date.now()),
   *   nonce: 'unique-nonce',
   *   signature: 'calculated-signature',
   *   requestParams: { param1: 'value1' },
   * });
   * ```
   */
  async validateKey(
    apiKey: string,
    options: ValidateKeyOptions,
  ): Promise<boolean> {
    const { timestamp, nonce, signature, algorithm } = options;

    if (!algorithm) {
      throw new BadRequestException(
        'Algorithm is required for signature verification.',
      );
    }

    if (!Object.values(SignatureAlgorithm).includes(algorithm)) {
      throw new BadRequestException(`Unsupported algorithm: ${algorithm}`);
    }

    if (!timestamp || !nonce || !signature) {
      throw new BadRequestException(
        'Missing required fields for signature verification.',
      );
    }

    if (!this.isValidTimestamp(timestamp)) {
      throw new BadRequestException('Invalid or expired timestamp.');
    }

    if (!(await this.isValidNonce(nonce))) {
      throw new BadRequestException(
        'Nonce has already been used or is too old.',
      );
    }

    const secret = this.apiSecrets.get(apiKey);
    if (!secret) {
      return false;
    }

    const params = options.requestParams ?? {};

    // Ensure Algorithm, AlgorithmVersion, ApiVersion are included in params
    params['Algorithm'] = algorithm;
    params['AlgorithmVersion'] = options.algorithmVersion || 'v1';
    params['ApiVersion'] = options.apiVersion || 'v1';

    const calculatedSignature = this.calculateSignature(
      params,
      secret,
      algorithm,
    );

    return calculatedSignature === signature;
  }

  /**
   * 验证时间戳是否有效
   *
   * @description 检查请求时间戳是否在允许的时间窗口内。时间窗口由配置项 `signReqTimestampDisparity` 定义，默认 5 分钟。用于防止重放攻击。
   *
   * @param timestamp - 请求时间戳（毫秒字符串）
   * @returns boolean - 返回 true 表示时间戳有效，false 表示时间戳过期或无效
   *
   * @remarks
   * 时间戳验证允许一定的偏差，以应对时钟同步问题。如果请求时间戳与服务器当前时间的差值超过配置的阈值，验证将失败。
   */
  private isValidTimestamp(timestamp: string): boolean {
    const requestTime = parseInt(timestamp);
    const currentTime = Date.now();
    return (
      Math.abs(currentTime - requestTime) <
      this.securityConfig.signReqTimestampDisparity
    );
  }

  /**
   * 验证 Nonce 是否有效
   *
   * @description 检查 Nonce 是否已被使用。如果未被使用，将其标记为已使用并设置 TTL。用于防止重复请求攻击。
   *
   * @param nonce - 防重放的随机数
   * @returns Promise<boolean> - 返回 true 表示 Nonce 有效（未被使用），false 表示 Nonce 已被使用
   *
   * @remarks
   * Nonce 存储在 Redis 中，键格式为 `cache:sign::nonce:{nonce}`。TTL 由配置项 `signReqNonceTTL` 定义，默认 5 分钟。一旦 Nonce 被使用，在 TTL 过期前不能再次使用。
   */
  private async isValidNonce(nonce: string): Promise<boolean> {
    const key = `${CacheConstant.CACHE_PREFIX}sign::nonce:${nonce}`;
    const exists = await this.redisService.get(key);
    if (exists) {
      return false;
    }
    await this.redisService.set(
      key,
      'used',
      'EX',
      this.securityConfig.signReqNonceTTL,
    );
    return true;
  }

  /**
   * 计算请求签名
   *
   * @description 根据参数和密钥计算请求签名。签名计算遵循标准流程：排除 signature 参数、按键名排序、构建签名字符串、根据算法计算签名。
   *
   * @param params - 请求参数，包含所有需要签名的参数
   * @param secret - 用于签名计算的密钥
   * @param algorithm - 签名算法
   * @returns string - 计算得到的签名值
   *
   * @throws {Error} 当算法不支持时抛出
   *
   * @remarks
   * ## 签名计算流程
   *
   * 1. 排除 `signature` 参数
   * 2. 按键名的字母顺序排序（不区分大小写）
   * 3. 对每个参数值进行 URL 编码
   * 4. 构建签名字符串：`key1=encoded_value1&key2=encoded_value2`
   * 5. 根据算法计算签名：
   *    - MD5/SHA1/SHA256: 将密钥追加到签名字符串后计算
   *    - HMAC_SHA256: 使用密钥进行 HMAC 计算
   */
  private calculateSignature(
    params: Record<string, RequestParamValue>,
    secret: string,
    algorithm: SignatureAlgorithm,
  ): string {
    // Exclude the 'signature' parameter from the params
    const { signature: _signature, ...paramsToSign } = params;

    // Sort the keys
    const sortedKeys = Object.keys(paramsToSign).sort((a, b) =>
      a.localeCompare(b, 'en', { sensitivity: 'base' }),
    );

    // Build the signing string
    // 过滤掉 null 和 undefined 值，它们不应该参与签名计算
    const signingString = sortedKeys
      .map((key) => {
        const value = paramsToSign[key];
        // 跳过 null 和 undefined 值
        if (value === null || value === undefined) {
          return null;
        }
        // 转换为字符串并进行 URL 编码
        const stringValue =
          typeof value === 'string'
            ? value
            : typeof value === 'number' || typeof value === 'boolean'
              ? String(value)
              : '';
        const encodedValue = encodeURIComponent(stringValue);
        return `${key}=${encodedValue}`;
      })
      .filter((item): item is string => item !== null)
      .join('&');

    const handler = this.algorithmHandlers[algorithm];
    if (!handler) {
      throw new Error(`Unsupported algorithm: ${algorithm}`);
    }

    return handler(signingString, secret);
  }

  /**
   * 添加 API Key 和密钥
   *
   * @description 将新的 API Key 和对应的密钥添加到 Redis Hash 和内存缓存中。
   *
   * @param apiKey - 要添加的 API Key
   * @param secret - 对应的密钥，用于签名验证
   * @returns Promise<void>
   */
  async addKey(apiKey: string, secret: string): Promise<void> {
    await this.redisService.hset(this.cacheKey, apiKey, secret);
    this.apiSecrets.set(apiKey, secret);
  }

  /**
   * 删除 API Key
   *
   * @description 从 Redis Hash 和内存缓存中删除指定的 API Key 和对应的密钥。
   *
   * @param apiKey - 要删除的 API Key
   * @returns Promise<void>
   */
  async removeKey(apiKey: string): Promise<void> {
    await this.redisService.hdel(this.cacheKey, apiKey);
    this.apiSecrets.delete(apiKey);
  }

  /**
   * 更新 API Key 的密钥
   *
   * @description 更新指定 API Key 的密钥，用于密钥轮换场景。同时更新 Redis 和内存缓存。
   *
   * @param apiKey - 要更新的 API Key
   * @param newSecret - 新的密钥
   * @returns Promise<void>
   */
  async updateKey(apiKey: string, newSecret: string): Promise<void> {
    await this.redisService.hset(this.cacheKey, apiKey, newSecret);
    this.apiSecrets.set(apiKey, newSecret);
  }
}
