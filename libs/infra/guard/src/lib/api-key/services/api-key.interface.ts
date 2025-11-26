import { SignatureAlgorithm } from '../api-key.signature.algorithm';

/**
 * API Key 服务接口
 *
 * @description 定义 API Key 验证服务的标准接口，提供密钥管理（加载、添加、删除、更新）和验证功能。简单和复杂 API Key 服务都实现此接口。
 *
 * @interface IApiKeyService
 *
 * @example
 * ```typescript
 * @Injectable()
 * export class ApiKeyManager {
 *   constructor(
 *     @Inject(SimpleApiKeyServiceToken)
 *     private readonly service: IApiKeyService,
 *   ) {}
 *
 *   async manageKey() {
 *     await this.service.addKey('new-key');
 *     const isValid = await this.service.validateKey('new-key');
 *   }
 * }
 * ```
 */
export interface IApiKeyService {
  /**
   * 加载所有 API Key
   *
   * @description 从持久化存储（如 Redis）中加载所有 API Key 到内存缓存，通常在服务初始化时调用。
   *
   * @returns Promise<void>
   */
  loadKeys(): Promise<void>;

  /**
   * 验证 API Key
   *
   * @description 验证提供的 API Key 是否有效。对于简单 API Key，只需检查 Key 是否存在；对于签名请求，需要验证时间戳、Nonce 和签名。
   *
   * @param apiKey - 要验证的 API Key
   * @param options - 可选的验证选项，包含签名算法、时间戳、nonce、签名等
   * @returns Promise<boolean> - 返回 true 表示验证成功，false 表示验证失败
   */
  validateKey(apiKey: string, options?: ValidateKeyOptions): Promise<boolean>;

  /**
   * 添加 API Key
   *
   * @description 添加新的 API Key 到持久化存储和内存缓存。对于复杂服务，需要同时提供密钥。
   *
   * @param apiKey - 要添加的 API Key
   * @param secret - 可选的密钥，复杂签名请求需要提供
   * @returns Promise<void>
   */
  addKey(apiKey: string, secret?: string): Promise<void>;

  /**
   * 删除 API Key
   *
   * @description 从持久化存储和内存缓存中删除指定的 API Key。
   *
   * @param apiKey - 要删除的 API Key
   * @returns Promise<void>
   */
  removeKey(apiKey: string): Promise<void>;

  /**
   * 更新 API Key 的密钥
   *
   * @description 更新指定 API Key 的密钥。对于简单 API Key 服务，此操作不支持。
   *
   * @param apiKey - 要更新的 API Key
   * @param newSecret - 新的密钥
   * @returns Promise<void>
   * @throws {Error} 如果服务不支持更新操作（如简单 API Key 服务）
   */
  updateKey(apiKey: string, newSecret: string): Promise<void>;
}

/**
 * 请求参数值类型
 *
 * @description 定义请求参数值的允许类型，用于签名计算
 */
export type RequestParamValue = string | number | boolean | null | undefined;

/**
 * API Key 验证选项
 *
 * @description 定义验证 API Key 时所需的选项，主要用于签名请求验证。
 *
 * @interface ValidateKeyOptions
 *
 * @property {SignatureAlgorithm} algorithm - 签名算法，用于签名请求验证
 * @property {string} [algorithmVersion] - 算法版本，可选，默认 'v1'
 * @property {string} [apiVersion] - API 版本，可选，默认 'v1'
 * @property {string} [timestamp] - 请求时间戳（毫秒），用于防止重放攻击
 * @property {string} [nonce] - 防重放的随机数，用于防止重复请求
 * @property {string} [signature] - 请求签名，用于验证请求的完整性
 * @property {Record<string, RequestParamValue>} [requestParams] - 请求参数，用于签名计算
 * @property {string} [secret] - 密钥，可选，用于验证签名
 */
export interface ValidateKeyOptions {
  /** 签名算法 */
  algorithm: SignatureAlgorithm;
  /** 算法版本 */
  algorithmVersion?: string;
  /** API 版本 */
  apiVersion?: string;
  /** 请求时间戳（毫秒） */
  timestamp?: string;
  /** 防重放的随机数 */
  nonce?: string;
  /** 请求签名 */
  signature?: string;
  /** 请求参数（用于签名计算） */
  requestParams?: Record<string, RequestParamValue>;
  /** 密钥（用于验证签名） */
  secret?: string;
}
