import { Controller, Get, Inject, UseGuards } from '@nestjs/common';
import {
  DiskHealthIndicator,
  HealthCheck,
  HealthCheckService,
  HttpHealthIndicator,
  MemoryHealthIndicator,
} from '@nestjs/terminus';

import { ApiKeyAuthSource, ApiKeyAuthStrategy } from '@hl8/constants';
import { ApiKeyAuth, BypassTransform, Public } from '@hl8/decorators';
import type { IApiKeyService } from '@hl8/guard';
import {
  ApiKeyGuard,
  ComplexApiKeyServiceToken,
  SimpleApiKeyServiceToken,
} from '@hl8/guard';
import { ApiRes } from '@hl8/rest';

import { AppService } from './app.service';

/**
 * 应用控制器
 *
 * 提供应用级别的 API 端点，包括健康检查、系统信息查询和 API Key 认证示例。
 *
 * @remarks
 * - 健康检查端点用于监控应用运行状态
 * - 系统信息端点提供服务器硬件和运行时信息
 * - Redis 信息端点提供 Redis 连接状态和配置信息
 * - 包含 API Key 认证的示例实现
 */
@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly http: HttpHealthIndicator,
    private readonly health: HealthCheckService,
    private readonly memory: MemoryHealthIndicator,
    private readonly disk: DiskHealthIndicator,
    @Inject(SimpleApiKeyServiceToken)
    private readonly simpleApiKeyService: IApiKeyService,
    @Inject(ComplexApiKeyServiceToken)
    private readonly complexApiKeyService: IApiKeyService,
  ) {}

  /**
   * 获取欢迎消息
   *
   * 简单的测试端点，返回 "Hello World!" 消息。
   *
   * @returns 欢迎消息字符串
   *
   * @remarks
   * - 使用 @Public() 装饰器，无需认证即可访问
   * - 使用 @BypassTransform() 装饰器，跳过响应转换
   */
  @Get()
  @Public()
  @BypassTransform()
  getHello(): string {
    return this.appService.getHello();
  }

  /**
   * 健康检查端点
   *
   * 检查应用各项服务的健康状态，包括：
   * - HTTP 连接检查（NestJS 文档站点）
   * - 内存使用检查（堆内存和 RSS 内存）
   * - 磁盘存储检查
   *
   * @returns 健康检查结果对象
   *
   * @remarks
   * - 使用 @nestjs/terminus 提供的健康检查功能
   * - 内存阈值设置为 150MB
   * - 磁盘使用率阈值设置为 90%
   * - 数据库健康检查已移除，如需添加请参考 @nestjs/terminus 文档
   */
  @Get('/healthy')
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.http.pingCheck('nestjs-docs', 'https://docs.nestjs.com'),
      // 数据库健康检查已移除，如需添加 MikroORM 健康检查，请参考 @nestjs/terminus 文档
      () => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024),
      () => this.memory.checkRSS('memory_rss', 150 * 1024 * 1024),
      () =>
        this.disk.checkStorage('storage', {
          path: '/',
          thresholdPercent: 0.9,
        }),
    ]);
  }

  /**
   * 获取系统信息
   *
   * 返回服务器的详细系统信息，包括 CPU、内存、磁盘、操作系统、网络等。
   *
   * @returns 包含系统信息的响应对象
   *
   * @remarks
   * - 使用 systeminformation 库收集系统信息
   * - 返回的信息包括硬件规格、当前负载、网络配置等
   * - 需要适当的权限才能访问此端点
   */
  @Get('/system-info')
  async getSystemInfo() {
    const result = await this.appService.getSystemInfo();
    return ApiRes.success(result);
  }

  /**
   * 获取 Redis 信息
   *
   * 返回 Redis 服务器的连接状态和配置信息。
   *
   * @returns 包含 Redis 信息的响应对象
   *
   * @remarks
   * - 解析 Redis INFO 命令的输出
   * - 返回服务器版本、内存使用、连接数等统计信息
   * - 需要适当的权限才能访问此端点
   */
  @Get('/redis-info')
  async getRedisInfo() {
    const result = await this.appService.getRedisInfo();
    return ApiRes.success(result);
  }

  /**
   * 设置简单 API Key（示例端点）
   *
   * 用于演示如何添加简单的 API Key 到存储中。
   *
   * @remarks
   * - 仅用于测试和演示目的
   * - 使用 @Public() 装饰器，无需认证即可访问
   * - 实际生产环境应通过管理接口或配置来管理 API Key
   */
  @Get('apikey-protected-set')
  @Public()
  async apiKeySet() {
    await this.simpleApiKeyService.addKey('soybean-api-key');
  }

  /**
   * API Key 认证保护端点（示例）
   *
   * 演示如何使用简单的 API Key 进行认证。
   * 客户端需要在请求头中提供 'api-key' 字段。
   *
   * @returns 欢迎消息字符串
   *
   * @remarks
   * - 使用 ApiKeyGuard 进行 API Key 验证
   * - API Key 从请求头中读取（keyName: 'api-key'）
   * - 使用 @Public() 装饰器跳过 JWT 认证，但仍需要 API Key
   * - 仅用于演示目的
   */
  @Get('apikey-protected')
  @Public()
  @ApiKeyAuth({
    strategy: ApiKeyAuthStrategy.ApiKey,
    keyName: 'api-key',
    source: ApiKeyAuthSource.Header,
  })
  @UseGuards(ApiKeyGuard)
  async apiKey() {
    return this.appService.getHello();
  }

  /**
   * 设置签名认证的 API Key 和 Secret（示例端点）
   *
   * 用于演示如何添加需要签名验证的 API Key 和 Secret 到存储中。
   *
   * @remarks
   * - 仅用于测试和演示目的
   * - 使用 @Public() 装饰器，无需认证即可访问
   * - 实际生产环境应通过管理接口或配置来管理 API Key 和 Secret
   */
  @Get('sign-protected-set')
  @Public()
  async signProtectedSet() {
    await this.complexApiKeyService.addKey(
      'soybean-api-key',
      'soybean-api-secret',
    );
  }

  /**
   * 签名认证保护端点（示例）
   *
   * 演示如何使用 API Key 和 Secret 进行签名认证。
   * 客户端需要提供 AccessKeyId 并按照签名算法对请求进行签名。
   *
   * @returns 欢迎消息字符串
   *
   * @remarks
   * - 使用 ApiKeyGuard 进行签名验证
   * - 从请求中读取 AccessKeyId（keyName: 'AccessKeyId'）
   * - 验证请求签名的正确性，防止请求被篡改
   * - 使用 @Public() 装饰器跳过 JWT 认证，但仍需要签名认证
   * - 仅用于演示目的
   */
  @Get('sign-protected')
  @Public()
  @ApiKeyAuth({
    strategy: ApiKeyAuthStrategy.SignedRequest,
    keyName: 'AccessKeyId',
  })
  @UseGuards(ApiKeyGuard)
  async apiKeyAndSecret() {
    return this.appService.getHello();
  }
}
