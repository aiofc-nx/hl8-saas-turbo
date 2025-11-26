import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import {
  ComplexApiKeyServiceToken,
  SimpleApiKeyServiceToken,
} from './api-key.constants';
import { ApiKeyGuard } from './api-key.guard';
import { ComplexApiKeyService } from './services/complex-api-key.service';
import { SimpleApiKeyService } from './services/simple-api-key.service';

/**
 * API Key 模块
 *
 * @description 提供 API Key 认证相关的服务和守卫。该模块是全局模块，注册后可在应用的任何位置注入相关服务。提供简单 API Key 和复杂签名请求两种验证服务，以及对应的认证守卫。
 *
 * @class ApiKeyModule
 *
 * @remarks
 * ## 提供的服务
 *
 * - `SimpleApiKeyService` - 简单 API Key 验证服务（通过 `SimpleApiKeyServiceToken` 注入）
 * - `ComplexApiKeyService` - 复杂签名请求验证服务（通过 `ComplexApiKeyServiceToken` 注入）
 * - `ApiKeyGuard` - API Key 认证守卫
 *
 * ## 使用方式
 *
 * 在应用根模块或特性模块中导入此模块：
 *
 * ```typescript
 * @Module({
 *   imports: [ApiKeyModule],
 * })
 * export class AppModule {}
 * ```
 *
 * 然后在需要的地方注入服务：
 *
 * ```typescript
 * @Injectable()
 * export class MyService {
 *   constructor(
 *     @Inject(SimpleApiKeyServiceToken)
 *     private readonly simpleService: IApiKeyService,
 *   ) {}
 * }
 * ```
 *
 * @example
 * ```typescript
 * import { Module } from '@nestjs/common';
 * import { ApiKeyModule } from '@hl8/guard';
 *
 * @Module({
 *   imports: [ApiKeyModule],
 * })
 * export class AppModule {}
 * ```
 */
@Global()
@Module({
  imports: [
    // 导入 ConfigModule 以确保 security 配置可用
    // 虽然 ConfigModule 是全局的，但显式导入可以确保依赖解析顺序正确
    ConfigModule,
  ],
  providers: [
    {
      provide: SimpleApiKeyServiceToken,
      useClass: SimpleApiKeyService,
    },
    {
      provide: ComplexApiKeyServiceToken,
      useClass: ComplexApiKeyService,
    },
    ApiKeyGuard,
  ],
  exports: [SimpleApiKeyServiceToken, ComplexApiKeyServiceToken],
})
export class ApiKeyModule {}
