import * as cluster from 'node:cluster';

import fastifyCompress from '@fastify/compress';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { useContainer } from 'class-validator';

import { fastifyApp } from '@hl8/adapter';
import { initDocSwagger } from '@hl8/bootstrap';
import { ConfigKeyPaths, IAppConfig, ICorsConfig } from '@hl8/config';
import { RedisUtility } from '@hl8/redis';
import { isMainProcess } from '@hl8/utils';

import { BaseDemoModule } from './base-demo.module';

/**
 * 应用启动函数
 *
 * 负责初始化 NestJS 应用，配置中间件、CORS、Swagger 文档等。
 * 应用启动流程：
 * 1. 初始化 Redis 客户端连接
 * 2. 创建 NestJS Fastify 应用实例
 * 3. 配置 CORS（如果启用）
 * 4. 设置全局路由前缀为 'v1'
 * 5. 初始化 Swagger API 文档
 * 6. 注册 Fastify 压缩插件
 * 7. 启动 HTTP 服务器监听指定端口
 *
 * @throws {Error} 如果应用创建或启动过程中发生错误，将抛出异常
 *
 * @example
 * ```typescript
 * bootstrap();
 * ```
 */
async function bootstrap() {
  // 初始化 Redis 客户端，确保缓存和限流功能可用
  await RedisUtility.client();

  // 创建 NestJS Fastify 应用实例
  // abortOnError: true 表示在启动过程中遇到错误时立即终止
  const app = await NestFactory.create<NestFastifyApplication>(
    BaseDemoModule,
    fastifyApp,
    { abortOnError: true },
  );

  const configService = app.get(ConfigService<ConfigKeyPaths>);
  const { port } = configService.get<IAppConfig>('app', { infer: true });
  const corsConfig = configService.get<ICorsConfig>('cors', { infer: true });

  // 配置 class-validator 使用 NestJS 依赖注入容器
  // 这样可以在 DTO 中使用依赖注入
  useContainer(app.select(BaseDemoModule), { fallbackOnErrors: true });

  // 如果启用了 CORS，则配置跨域资源共享
  if (corsConfig.enabled) {
    app.enableCors(corsConfig.corsOptions);
  }

  // 设置全局 API 路由前缀
  const GLOBAL_PREFIX = 'v1';
  app.setGlobalPrefix(GLOBAL_PREFIX);

  // 初始化 Swagger API 文档
  initDocSwagger(app, configService);

  // 注册 Fastify 压缩插件，启用响应压缩以提升性能
  // 通过 getHttpAdapter() 获取底层 Fastify 实例来注册插件
  const httpAdapter = app.getHttpAdapter();
  await httpAdapter.getInstance().register(fastifyCompress);

  // 启动 HTTP 服务器
  // 监听所有网络接口 (0.0.0.0)，允许外部访问
  await app.listen(port, '0.0.0.0', async () => {
    const url = await app.getUrl();
    const { pid } = process;
    // 判断是否为集群主进程
    // 使用类型断言以兼容不同 Node.js 版本的类型定义
    // Node.js 16+ 使用 isPrimary，旧版本使用 isMaster
    const env =
      (cluster as unknown as { isPrimary?: boolean }).isPrimary ??
      (cluster as unknown as { isMaster?: boolean }).isMaster ??
      false;
    // 主进程使用 'P' 前缀，工作进程使用 'W' 前缀
    const prefix = env ? 'P' : 'W';

    // 如果不是主进程，不输出日志（避免重复日志）
    if (!isMainProcess) return;

    const logger = new Logger('NestApplication');
    logger.log(`[${prefix + pid}] Server running on ${url}`);
  });
}
bootstrap();
