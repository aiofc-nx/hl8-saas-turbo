/**
 * 简单 API Key 服务注入令牌
 *
 * @description 用于在依赖注入容器中标识简单 API Key 验证服务的令牌。通过此令牌可以注入 `IApiKeyService` 接口的实现（`SimpleApiKeyService`）。
 *
 * @constant
 * @type {symbol}
 *
 * @example
 * ```typescript
 * @Injectable()
 * export class MyService {
 *   constructor(
 *     @Inject(SimpleApiKeyServiceToken)
 *     private readonly apiKeyService: IApiKeyService,
 *   ) {}
 * }
 * ```
 */
export const SimpleApiKeyServiceToken = Symbol('SimpleApiKeyService');

/**
 * 复杂签名请求服务注入令牌
 *
 * @description 用于在依赖注入容器中标识复杂签名请求验证服务的令牌。通过此令牌可以注入 `IApiKeyService` 接口的实现（`ComplexApiKeyService`）。
 *
 * @constant
 * @type {symbol}
 *
 * @example
 * ```typescript
 * @Injectable()
 * export class MyService {
 *   constructor(
 *     @Inject(ComplexApiKeyServiceToken)
 *     private readonly signedService: IApiKeyService,
 *   ) {}
 * }
 * ```
 */
export const ComplexApiKeyServiceToken = Symbol('ComplexApiKeyService');
