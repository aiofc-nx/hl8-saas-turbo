import cluster from 'node:cluster';
// import { constants } from 'zlib';

import fastifyCompress from '@fastify/compress';
import fastifyCsrf from '@fastify/csrf-protection';
import {
  HttpStatus,
  Logger,
  UnprocessableEntityException,
  ValidationError,
  ValidationPipe,
  ValidationPipeOptions,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { useContainer } from 'class-validator';

import { fastifyApp } from '@hl8/adapter';
import { initDocSwagger } from '@hl8/bootstrap';
import { ConfigKeyPaths, IAppConfig, ICorsConfig } from '@hl8/config';
import { RedisUtility } from '@hl8/redis';
import { isMainProcess } from '@hl8/utils';

import { AppModule } from './app.module';

/**
 * 验证错误结构接口
 *
 * 用于格式化验证错误信息，支持嵌套的验证错误结构。
 * 键为属性路径（支持点号分隔的嵌套路径），值为错误消息数组或嵌套的错误对象。
 *
 * @example
 * ```typescript
 * {
 *   "username": ["用户名不能为空", "用户名长度必须在3-20之间"],
 *   "address.city": ["城市不能为空"],
 *   "profile": {
 *     "email": ["邮箱格式不正确"]
 *   }
 * }
 * ```
 */
interface ValidationErrors {
  [key: string]: string[] | ValidationErrors;
}

const validationPipeOptions: ValidationPipeOptions = {
  transform: true,
  whitelist: true,
  transformOptions: { enableImplicitConversion: true },
  errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
  exceptionFactory: (errors: ValidationError[]) => {
    const formattedErrors = formatErrors(errors);
    return new UnprocessableEntityException({
      message: 'Validation failed',
      errors: formattedErrors,
    });
  },
};

/**
 * 格式化验证错误信息
 *
 * 将 NestJS ValidationError 数组转换为结构化的错误对象，支持嵌套属性的错误信息。
 *
 * @param errors - 验证错误数组，来自 class-validator
 * @param parentPath - 父级属性路径，用于构建嵌套属性的完整路径，默认为空字符串
 * @returns 格式化后的验证错误对象，键为属性路径，值为错误消息数组或嵌套错误对象
 *
 * @example
 * ```typescript
 * const errors = [
 *   { property: 'username', constraints: { isNotEmpty: '用户名不能为空' } },
 *   { property: 'address', children: [
 *     { property: 'city', constraints: { isNotEmpty: '城市不能为空' } }
 *   ]}
 * ];
 * const formatted = formatErrors(errors);
 * // 结果: { username: ['用户名不能为空'], 'address.city': ['城市不能为空'] }
 * ```
 */
function formatErrors(
  errors: ValidationError[],
  parentPath: string = '',
): ValidationErrors {
  return errors.reduce((acc, error) => {
    const property = parentPath
      ? `${parentPath}.${error.property}`
      : error.property;

    if (error.constraints) {
      acc[property] = Object.values(error.constraints);
    }

    if (error.children && error.children.length > 0) {
      const nestedErrors = formatErrors(error.children, property);
      // 合并嵌套错误
      acc[property] = { ...acc[property], ...nestedErrors };
    }

    return acc;
  }, {} as ValidationErrors);
}

/**
 * 应用启动函数
 *
 * 初始化并启动 NestJS 应用，包括：
 * - 初始化 Redis 客户端连接
 * - 创建 NestJS 应用实例（基于 Fastify）
 * - 配置全局中间件（CORS、验证管道、Swagger 文档等）
 * - 注册 Fastify 插件（压缩、CSRF 保护等）
 * - 启动 HTTP 服务器
 *
 * @throws {Error} 当应用启动失败时抛出错误
 *
 * @remarks
 * - 使用 Fastify 作为底层 HTTP 服务器，性能优于 Express
 * - 全局 API 前缀设置为 'v1'
 * - 支持集群模式运行（通过 node:cluster）
 * - 仅在主进程中输出启动日志
 */
async function bootstrap() {
  // 初始化 Redis 客户端，确保缓存和限流功能可用
  await RedisUtility.client();

  // 创建 NestJS Fastify 应用实例
  // abortOnError: true 表示在启动过程中遇到错误时立即终止
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    fastifyApp,
    { abortOnError: true },
  );

  // 获取配置服务
  const configService = app.get(ConfigService<ConfigKeyPaths>);
  // 获取应用配置
  const { port } = configService.get<IAppConfig>('app', { infer: true });
  // 获取 CORS 配置
  const corsConfig = configService.get<ICorsConfig>('cors', { infer: true });

  // 使用 NestJS 依赖注入容器
  useContainer(app.select(AppModule), { fallbackOnErrors: true });

  // 启用 CORS
  if (corsConfig.enabled) {
    app.enableCors(corsConfig.corsOptions);
  }

  // 设置全局 API 前缀
  const GLOBAL_PREFIX = 'v1';
  app.setGlobalPrefix(GLOBAL_PREFIX);

  app.useGlobalPipes(new ValidationPipe(validationPipeOptions));
  // 初始化 Swagger 文档
  initDocSwagger(app, configService);

  // 注册 Fastify 压缩插件
  await app.register(fastifyCompress, { encodings: ['gzip', 'deflate'] });
  // await app.register(fastifyCompress, { brotliOptions: { params: { [constants.BROTLI_PARAM_QUALITY]: 4 } } });
  // TODO 注册 CSRF 保护插件
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await app.register(fastifyCsrf as any);

  // 注册 Helmet 安全中间件
  // @description 提供基本的安全防护，包括 XSS、CSP、HSTS 等
  // @link https://github.com/helmetjs/helmet
  // @link https://github.com/fastify/fastify-helmet
  // 本地环境不开启，具体配置请参考官方文档
  // 注意：需要从 @hl8/adapter 导入 registerHelmet
  // await registerHelmet(fastifyApp.getInstance(), {
  //   contentSecurityPolicy: isDevEnvironment
  //     ? false
  //     : {
  //         directives: {
  //           defaultSrc: ["'self'"],
  //           styleSrc: ["'self'", "'unsafe-inline'", 'https:'],
  //           scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'https:'],
  //           imgSrc: ["'self'", 'data:', 'https:'],
  //           connectSrc: ["'self'", 'https:', 'wss:'],
  //         },
  //       },
  // });

  // 启动 HTTP 服务器
  await app.listen(port, '0.0.0.0', async () => {
    const url = await app.getUrl();
    const { pid } = process;
    const env = cluster.isPrimary;
    const prefix = env ? 'P' : 'W';

    // 如果当前不是主进程，则直接返回
    if (!isMainProcess) return;

    // 创建日志记录器
    const logger = new Logger('NestApplication');
    // 输出启动日志
    logger.log(`[${prefix + pid}] Server running on ${url}`);
  });
}

bootstrap();
