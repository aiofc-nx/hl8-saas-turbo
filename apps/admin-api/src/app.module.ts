import { EntityManager } from '@mikro-orm/core';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import { ExecutionContext, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { TerminusModule } from '@nestjs/terminus';
import { ThrottlerModule, ThrottlerStorage } from '@nestjs/throttler';
import { ThrottlerStorageRecord } from '@nestjs/throttler/dist/throttler-storage-record.interface';
import * as casbin from 'casbin';
import { Redis } from 'ioredis';

import { BootstrapModule } from '@hl8/bootstrap';
import { AUTHZ_ENFORCER, AuthZModule, MikroORMAdapter } from '@hl8/casbin';
import config, {
  ConfigKeyPaths,
  IRedisConfig,
  ISecurityConfig,
  IThrottlerConfig,
  redisRegToken,
  securityRegToken,
  throttlerConfigToken,
} from '@hl8/config';
import { AllExceptionsFilter } from '@hl8/filters';
import { GlobalCqrsModule, SharedModule } from '@hl8/global';
import { ApiKeyModule, JwtAuthGuard } from '@hl8/guard';
import { MikroOrmModule } from '@hl8/mikro-orm-nestjs';
import { JwtStrategy } from '@hl8/strategies';
import { IAuthentication } from '@hl8/typings';
import { getConfigPath } from '@hl8/utils';

import {
  MAIL_CONFIG,
  MailModule,
  MailService,
  type MailConfig,
} from '@hl8/mail';
import { MailerModule } from '@nestjs-modules/mailer';
import { APP_NAME, APP_URL } from '@repo/constants/app';

import { ApiModule } from './api/api.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

const strategies = [JwtStrategy];

// 原nestjs-throttler-storage-redis废弃,迁移至@nest-lab/throttler-storage-redis
// https://github.com/kkoomen/nestjs-throttler-storage-redis
// https://github.com/jmcdo29/nest-lab/tree/main/packages/throttler-storage-redis

/**
 * 限流存储适配器
 *
 * 实现 ThrottlerStorage 接口，将限流存储委托给 ThrottlerStorageRedisService。
 * 用于在 Redis 中存储和管理 API 请求限流数据。
 *
 * @remarks
 * - 适配器模式，用于兼容 NestJS Throttler 模块的存储接口
 * - 底层使用 Redis 存储限流记录，支持分布式环境
 * - 所有方法调用都直接转发给 ThrottlerStorageRedisService
 */
class ThrottlerStorageAdapter implements ThrottlerStorage {
  constructor(private readonly storageService: ThrottlerStorageRedisService) {}

  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    throttlerName: string,
  ): Promise<ThrottlerStorageRecord> {
    return this.storageService.increment(
      key,
      ttl,
      limit,
      blockDuration,
      throttlerName,
    );
  }
}

@Module({
  imports: [
    // 健康检查模块，用于监控应用状态
    TerminusModule,

    // 全局配置模块
    // 支持从多个环境变量文件加载配置，优先级：.env.local > .env.{NODE_ENV} > .env
    ConfigModule.forRoot({
      isGlobal: true,
      expandVariables: true,
      envFilePath: ['.env.local', `.env.${process.env.NODE_ENV}`, '.env'],
      load: [...Object.values(config)],
    }),

    // Casbin 授权模块
    // 使用 MikroORM 适配器从数据库加载权限策略
    // 注意：虽然 SharedModule 是全局的，但动态模块仍需要在 imports 中显式导入 MikroOrmModule
    AuthZModule.register({
      imports: [ConfigModule, MikroOrmModule],
      enforcerProvider: {
        provide: AUTHZ_ENFORCER,
        useFactory: async (configService: ConfigService, em: EntityManager) => {
          // 创建 MikroORM 适配器，用于从数据库加载权限策略
          const adapter = MikroORMAdapter.newAdapter(em);

          // 优先从数据库加载激活版本的模型配置
          try {
            // 使用字符串表名查询，避免循环依赖

            const activeConfig = await em.findOne('CasbinModelConfig', {
              status: 'active',
            } as any);

            if (
              activeConfig &&
              (activeConfig as { content?: string }).content
            ) {
              // 从数据库加载模型配置
              const model = casbin.newModelFromString(
                (activeConfig as { content: string }).content,
              );
              // 创建 Casbin 执行器，使用数据库中的模型配置
              return casbin.newEnforcer(model, adapter);
            }
          } catch (error) {
            // 如果数据库中没有激活版本或查询失败，回退到文件配置
            console.warn(
              'Failed to load model from database, falling back to file config:',
              error instanceof Error ? error.message : String(error),
            );
          }

          // 回退到文件配置
          const { casbinModel } = configService.get<ISecurityConfig>(
            securityRegToken,
            {
              infer: true,
            },
          );
          // 获取 Casbin 模型配置文件路径
          const casbinModelPath = getConfigPath(casbinModel);
          // 创建 Casbin 执行器
          return casbin.newEnforcer(casbinModelPath, adapter);
        },
        inject: [ConfigService, EntityManager],
      },
      // 从请求上下文中提取用户信息，用于权限检查
      userFromContext: (ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest();
        const user: IAuthentication = request.user;
        return user;
      },
    }),
    // 限流模块配置
    // 使用 Redis 存储限流数据，支持单机和集群模式
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService<ConfigKeyPaths>) => {
        // 获取限流配置
        const { ttl, limit, errorMessage } =
          configService.get<IThrottlerConfig>(throttlerConfigToken, {
            infer: true,
          });

        // 获取 Redis 配置
        const redisOpts = configService.get<IRedisConfig>(redisRegToken, {
          infer: true,
        });

        // 创建限流存储 Redis 服务
        let throttlerStorageRedisService: ThrottlerStorageRedisService;

        // 如果 Redis 配置为集群模式，则创建集群模式的限流存储 Redis 服务
        if (redisOpts.mode === 'cluster') {
          throttlerStorageRedisService = new ThrottlerStorageRedisService(
            new Redis.Cluster(redisOpts.cluster),
          );
        } else {
          // 如果 Redis 配置为单机模式，则创建单机模式的限流存储 Redis 服务
          throttlerStorageRedisService = new ThrottlerStorageRedisService(
            new Redis({
              host: redisOpts.standalone.host,
              port: redisOpts.standalone.port,
              password: redisOpts.standalone.password,
              db: redisOpts.standalone.db,
            }),
          );
        }

        // 创建限流存储适配器
        const storageAdapter = new ThrottlerStorageAdapter(
          throttlerStorageRedisService,
        );

        // 返回限流模块配置
        return {
          // 设置错误消息
          errorMessage: errorMessage,
          // 设置限流器配置
          throttlers: [{ ttl, limit }],
          // 设置限流存储适配器
          storage: storageAdapter,
        };
      },
    }),

    // CQRS 模块
    GlobalCqrsModule,

    // API 模块
    ApiModule,

    // 共享模块
    SharedModule,

    // API Key 模块
    ApiKeyModule,

    // 邮件模块配置
    // 配置 MailerModule（底层邮件发送模块）
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (_configService: ConfigService<ConfigKeyPaths>) => {
        const mailHost = process.env.MAIL_HOST || 'smtp.gmail.com';
        const mailPort = parseInt(process.env.MAIL_PORT || '587', 10);
        const mailSecure = process.env.MAIL_SECURE === 'true';
        const mailUsername = process.env.MAIL_USERNAME || '';
        const mailPassword = process.env.MAIL_PASSWORD || '';

        // 验证邮件配置
        if (mailHost === 'smtp.example.com' || !mailUsername || !mailPassword) {
          console.warn(
            '⚠️  邮件配置未正确设置。请在 .env 文件中配置以下环境变量：',
          );
          console.warn('   - MAIL_HOST: SMTP 服务器地址（如 smtp.gmail.com）');
          console.warn('   - MAIL_PORT: SMTP 端口（默认 587）');
          console.warn('   - MAIL_SECURE: 是否使用 SSL/TLS（true/false）');
          console.warn('   - MAIL_USERNAME: 发件人邮箱地址');
          console.warn('   - MAIL_PASSWORD: 邮箱密码或授权码');
          console.warn('   邮件发送功能将不可用，直到配置完成。');
        }

        return {
          transport: {
            host: mailHost,
            port: mailPort,
            secure: mailSecure,
            auth: {
              user: mailUsername,
              pass: mailPassword,
            },
          },
        };
      },
    }),
    // 配置 MailModule（邮件服务封装模块，来自 @hl8/mail）
    {
      module: MailModule,
      providers: [
        MailService,
        {
          provide: MAIL_CONFIG,
          useClass: class MailConfigProvider implements MailConfig {
            get MAIL_USERNAME(): string {
              return process.env.MAIL_USERNAME || '';
            }

            get APP_NAME(): string {
              return APP_NAME;
            }

            get APP_URL(): string {
              return APP_URL;
            }
          },
        },
      ],
      exports: [MailService],
      global: true,
    },

    // 引导模块
    BootstrapModule,
  ],
  // 控制器
  controllers: [AppController],
  // 提供者
  providers: [
    AppService,

    // 认证策略
    ...strategies,

    // 全局异常过滤器
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    // JWT 认证守卫

    //TODO 拦截器极度影响性能 有需要自行开启 对性能有要求使用decorator形式 每个接口手动加虽然麻烦点或者app.use指定路由统一使用相对代码量少
    // { provide: APP_INTERCEPTOR, useClass: ClassSerializerInterceptor },
    // { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },
    // { provide: APP_INTERCEPTOR, useClass: LogInterceptor },

    // JWT 认证守卫
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    // 限流守卫
    // { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
/**
 * 应用根模块
 *
 * NestJS 应用的根模块，负责配置和导入所有全局模块、功能模块和中间件。
 *
 * @remarks
 * 主要功能模块包括：
 * - **健康检查**：TerminusModule 提供应用健康状态监控
 * - **配置管理**：ConfigModule 支持多环境配置加载
 * - **日志系统**：LoggerModule 提供结构化日志记录
 * - **权限控制**：AuthZModule 基于 Casbin 实现 RBAC/ABAC 授权
 * - **限流保护**：ThrottlerModule 防止 API 滥用
 * - **CQRS 支持**：GlobalCqrsModule 提供命令查询职责分离
 * - **API 路由**：ApiModule 包含所有业务 API 端点
 * - **共享服务**：SharedModule 提供全局共享服务
 * - **API Key 认证**：ApiKeyModule 支持 API Key 和签名认证
 *
 * 全局守卫和过滤器：
 * - JwtAuthGuard：JWT 认证守卫（全局启用）
 * - AllExceptionsFilter：全局异常过滤器
 *
 * @see {@link https://docs.nestjs.com/modules | NestJS 模块文档}
 */
export class AppModule {}
