import { RequestParamValue } from '../services/api-key.interface';

/**
 * API Key 验证事件
 *
 * @description 当 API Key 验证完成时触发的事件对象，包含验证的 API Key、验证选项和验证结果。可以通过事件发射器订阅此事件进行审计日志、使用统计或异常监控。
 *
 * @class ApiKeyValidationEvent
 *
 * @property {string} apiKey - 被验证的 API Key
 * @property {object} validateOptions - 验证选项，包含算法、版本、时间戳、nonce、签名和请求参数等信息
 * @property {boolean} isValid - 验证结果，true 表示验证成功，false 表示验证失败
 *
 * @example
 * ```typescript
 * import { OnEvent } from '@nestjs/event-emitter';
 * import { EVENT_API_KEY_VALIDATED } from '@hl8/constants';
 * import { ApiKeyValidationEvent } from '@hl8/guard';
 *
 * @Injectable()
 * export class ApiKeyAuditService {
 *   @OnEvent(EVENT_API_KEY_VALIDATED)
 *   handleValidation(event: ApiKeyValidationEvent) {
 *     console.log(`API Key ${event.apiKey} validation: ${event.isValid}`);
 *     // 记录审计日志
 *   }
 * }
 * ```
 */
export class ApiKeyValidationEvent {
  /**
   * 构造函数
   *
   * @param apiKey - 被验证的 API Key
   * @param validateOptions - 验证选项，包含算法、版本、时间戳等验证参数
   * @param isValid - 验证结果，true 表示验证成功，false 表示验证失败
   */
  constructor(
    public readonly apiKey: string,
    public readonly validateOptions: {
      /** 签名算法 */
      algorithm?: string;
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
    },
    public readonly isValid: boolean,
  ) {}
}
