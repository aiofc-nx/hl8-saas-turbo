import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { EventEmitter2 } from '@nestjs/event-emitter';

import {
  API_KEY_AUTH_OPTIONS,
  ApiKeyAuthSource,
  ApiKeyAuthStrategy,
  EVENT_API_KEY_VALIDATED,
} from '@hl8/constants';
import { ApiKeyAuthOptions } from '@hl8/decorators';

import {
  ComplexApiKeyServiceToken,
  SimpleApiKeyServiceToken,
} from './api-key.constants';
import { ApiKeyValidationEvent } from './events/api-key-validation.event';
import * as apiKeyInterface from './services/api-key.interface';

/**
 * API Key 认证守卫
 *
 * @description 实现 API Key 认证的守卫，支持简单 API Key 和签名请求两种认证策略。可以从 Header 或 Query 参数中提取 API Key，并根据策略选择相应的验证服务进行验证。验证结果会通过事件发射器通知其他模块。
 *
 * @class ApiKeyGuard
 * @implements {CanActivate}
 *
 * @example
 * ```typescript
 * // 在控制器中使用
 * @Controller('api')
 * export class ApiController {
 *   @ApiKeyAuth({
 *     strategy: ApiKeyAuthStrategy.ApiKey,
 *     keyName: 'x-api-key',
 *     source: ApiKeyAuthSource.Header,
 *   })
 *   @Get('protected')
 *   async protectedRoute() {
 *     return { message: 'API Key authenticated' };
 *   }
 * }
 * ```
 */
@Injectable()
export class ApiKeyGuard implements CanActivate {
  /** 日志记录器 */
  private readonly logger = new Logger(ApiKeyGuard.name);

  /**
   * 构造函数
   *
   * @param reflector - NestJS 反射器，用于获取路由元数据中的认证选项
   * @param simpleApiKeyService - 简单 API Key 验证服务，用于验证普通 API Key
   * @param complexApiKeyService - 复杂签名请求验证服务，用于验证签名请求
   * @param eventEmitter - 事件发射器，用于发送 API Key 验证事件
   */
  constructor(
    private readonly reflector: Reflector,
    @Inject(SimpleApiKeyServiceToken)
    private readonly simpleApiKeyService: apiKeyInterface.IApiKeyService,
    @Inject(ComplexApiKeyServiceToken)
    private readonly complexApiKeyService: apiKeyInterface.IApiKeyService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * 检查路由是否可以访问
   *
   * @description 从路由元数据中获取 API Key 认证选项，从请求中提取 API Key，根据策略选择相应的验证服务进行验证。验证结果会通过事件发射。
   *
   * @param context - 执行上下文，包含请求和响应对象
   * @returns 返回 true 表示认证成功允许访问，false 表示认证失败拒绝访问
   *
   * @remarks
   * ## 验证流程
   *
   * 1. 从路由元数据获取 `@ApiKeyAuth()` 装饰器配置的认证选项
   * 2. 如果没有认证选项或缺少必需属性，返回 false
   * 3. 根据 `source` 配置从 Header 或 Query 中提取 API Key
   * 4. 根据 `strategy` 配置选择简单或复杂验证服务
   * 5. 从请求中提取验证所需参数（算法、时间戳、nonce、签名等）
   * 6. 调用验证服务进行验证
   * 7. 通过事件发射器发送验证结果事件
   * 8. 返回验证结果
   *
   * ## 错误处理
   *
   * - 如果验证服务抛出异常，捕获异常并返回 false
   * - 无论验证成功或失败，都会发送验证事件
   *
   * @example
   * ```typescript
   * // 简单 API Key 验证（从 Header 获取）
   * @ApiKeyAuth({
   *   strategy: ApiKeyAuthStrategy.ApiKey,
   *   keyName: 'x-api-key',
   *   source: ApiKeyAuthSource.Header,
   * })
   * @Get('simple')
   * async simpleRoute() { ... }
   *
   * // 签名请求验证（从 Query 获取）
   * @ApiKeyAuth({
   *   strategy: ApiKeyAuthStrategy.SignedRequest,
   *   keyName: 'api-key',
   *   source: ApiKeyAuthSource.Query,
   * })
   * @Get('signed')
   * async signedRoute() { ... }
   * ```
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 从路由元数据获取 API Key 认证选项
    const authOptions = this.reflector.get<ApiKeyAuthOptions>(
      API_KEY_AUTH_OPTIONS,
      context.getHandler(),
    );
    if (!authOptions) return false;

    // 确保 authOptions 有必需的属性
    if (!authOptions.strategy || !authOptions.keyName) {
      return false;
    }

    const request = context.switchToHttp().getRequest();
    // 根据 source 配置从 Header 或 Query 中提取 API Key
    // Header 中的键名不区分大小写
    const apiKey =
      authOptions.source === ApiKeyAuthSource.Header
        ? request.headers[authOptions.keyName.toLowerCase()]
        : request.query[authOptions.keyName];

    // 根据策略选择相应的验证服务
    const service =
      authOptions.strategy === ApiKeyAuthStrategy.SignedRequest
        ? this.complexApiKeyService
        : this.simpleApiKeyService;

    // 构建验证选项，包含签名请求所需的参数
    const validateOptions: apiKeyInterface.ValidateKeyOptions = {
      algorithm: request.query['Algorithm'],
      algorithmVersion: request.query['AlgorithmVersion'],
      apiVersion: request.query['ApiVersion'],
      timestamp: request.query['timestamp'],
      nonce: request.query['nonce'],
      signature: request.query['signature'],
      // 合并 query 和 body 参数作为请求参数
      requestParams: { ...request.query, ...request.body },
    };

    try {
      // 调用验证服务进行验证
      const isValid = await service.validateKey(apiKey, validateOptions);

      // 发送验证结果事件
      this.eventEmitter.emit(
        EVENT_API_KEY_VALIDATED,
        new ApiKeyValidationEvent(apiKey, validateOptions, isValid),
      );

      if (!isValid) {
        this.logger.debug(
          `API Key validation failed for key: ${apiKey?.substring(0, 8)}*** (strategy: ${authOptions.strategy})`,
        );
      }

      return isValid;
    } catch (error) {
      // 区分验证失败（BadRequestException）和系统错误
      if (error instanceof BadRequestException) {
        // 验证失败：参数错误、时间戳过期等，这是正常的验证流程
        this.logger.debug(
          `API Key validation failed: ${error.message} (key: ${apiKey?.substring(0, 8)}***)`,
        );
        this.eventEmitter.emit(
          EVENT_API_KEY_VALIDATED,
          new ApiKeyValidationEvent(apiKey, validateOptions, false),
        );
        return false;
      }

      // 系统错误：Redis 连接失败、服务异常等，记录错误日志
      this.logger.error(
        `API Key validation error: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      this.eventEmitter.emit(
        EVENT_API_KEY_VALIDATED,
        new ApiKeyValidationEvent(apiKey, validateOptions, false),
      );
      // 系统错误时也返回 false，但已记录日志便于排查
      return false;
    }
  }
}
