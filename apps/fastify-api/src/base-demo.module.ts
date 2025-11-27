import { EntityManager } from '@mikro-orm/core';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import { ExecutionContext, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { TerminusModule } from '@nestjs/terminus';
import {
  ThrottlerGuard,
  ThrottlerModule,
  ThrottlerStorage,
} from '@nestjs/throttler';
import { ThrottlerStorageRecord } from '@nestjs/throttler/dist/throttler-storage-record.interface';
import * as casbin from 'casbin';
import Redis from 'ioredis';

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
import { AESMode, CryptoMethod, CryptoModule, PaddingMode } from '@hl8/crypto';
import { AllExceptionsFilter } from '@hl8/filters';
import { SharedModule } from '@hl8/global';
import { ApiKeyModule, JwtAuthGuard } from '@hl8/guard';
import { MikroOrmModule } from '@hl8/mikro-orm-nestjs';
import { JwtStrategy } from '@hl8/strategies';
import { IAuthentication } from '@hl8/typings';
import { getConfigPath } from '@hl8/utils';

import { BaseDemoController } from './base-demo.controller';
import { BaseDemoService } from './base-demo.service';

/**
 * 认证策略列表
 *
 * 包含所有用于用户认证的策略，当前使用 JWT 策略。
 */
const strategies = [JwtStrategy];

/**
 * Throttler 存储适配器
 *
 * 将 ThrottlerStorageRedisService 适配为 ThrottlerStorage 接口。
 * 由于原 nestjs-throttler-storage-redis 已废弃，迁移至 @nest-lab/throttler-storage-redis。
 *
 * @see {@link https://github.com/kkoomen/nestjs-throttler-storage-redis 原仓库}
 * @see {@link https://github.com/jmcdo29/nest-lab/tree/main/packages/throttler-storage-redis 新仓库}
 */
class ThrottlerStorageAdapter implements ThrottlerStorage {
  /**
   * 构造函数
   *
   * @param {ThrottlerStorageRedisService} storageService - Redis 存储服务实例
   */
  constructor(private readonly storageService: ThrottlerStorageRedisService) {}

  /**
   * 增加限流计数
   *
   * 当请求到达时，增加对应 key 的计数，并检查是否超过限制。
   *
   * @param {string} key - 限流键，通常基于 IP 地址或用户 ID
   * @param {number} ttl - 时间窗口（秒），在此时间内的请求会被计数
   * @param {number} limit - 限制数量，超过此数量的请求将被拒绝
   * @param {number} blockDuration - 封禁时长（秒），超过限制后的封禁时间
   * @param {string} throttlerName - 限流器名称，用于区分不同的限流策略
   * @returns {Promise<ThrottlerStorageRecord>} 包含当前计数和限制信息的记录
   */
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

/**
 * 基础演示模块
 *
 * 应用的根模块，负责配置和注册所有核心功能模块：
 * - 配置管理（ConfigModule）
 * - 健康检查（TerminusModule）
 * - 授权控制（AuthZModule with Casbin）
 * - 限流保护（ThrottlerModule）
 * - 加密服务（CryptoModule）
 * - 全局异常过滤器
 * - JWT 认证守卫
 * - 限流守卫
 *
 * 模块配置说明：
 * - 使用全局配置模块，支持环境变量和配置文件
 * - 集成 Casbin 进行基于角色的访问控制（RBAC）
 * - 使用 Redis 存储限流数据，支持单机和集群模式
 * - 配置 AES 加密服务，用于敏感数据加密
 * - 全局启用 JWT 认证和限流保护
 *
 * @example
 * ```typescript
 * // 在 main.ts 中使用
 * const app = await NestFactory.create(BaseDemoModule, fastifyApp);
 * ```
 */
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

        let throttlerStorageRedisService: ThrottlerStorageRedisService;

        // 根据配置选择 Redis 模式（集群或单机）
        if (redisOpts.mode === 'cluster') {
          throttlerStorageRedisService = new ThrottlerStorageRedisService(
            new Redis.Cluster(redisOpts.cluster),
          );
        } else {
          throttlerStorageRedisService = new ThrottlerStorageRedisService(
            new Redis({
              host: redisOpts.standalone.host,
              port: redisOpts.standalone.port,
              password: redisOpts.standalone.password,
              db: redisOpts.standalone.db,
            }),
          );
        }

        // 使用适配器包装 Redis 存储服务
        const storageAdapter = new ThrottlerStorageAdapter(
          throttlerStorageRedisService,
        );

        return {
          errorMessage: errorMessage,
          throttlers: [{ ttl, limit }],
          storage: storageAdapter,
        };
      },
    }),

    // 应用启动模块，包含数据库迁移、日志等初始化逻辑
    BootstrapModule,

    // 共享模块，提供全局共享的服务和工具
    SharedModule,

    // API Key 模块，用于 API Key 认证
    ApiKeyModule,

    // 加密模块配置
    // 使用 AES-CBC 模式，PKCS7 填充，固定 IV（不推荐生产环境使用固定 IV）
    CryptoModule.register({
      isGlobal: true,
      defaultMethod: CryptoMethod.AES,
      aes: {
        mode: AESMode.CBC,
        padding: PaddingMode.PKCS7,
        useRandomIV: false,
      },
    }),
  ],
  controllers: [BaseDemoController],
  providers: [
    BaseDemoService,

    // 注册认证策略
    ...strategies,

    // 全局异常过滤器，统一处理所有异常
    { provide: APP_FILTER, useClass: AllExceptionsFilter },

    // 注意：拦截器会严重影响性能，默认不启用
    // 如果确实需要，建议使用装饰器形式在每个接口手动添加
    // 或者使用 app.use() 指定路由统一使用，相对代码量较少
    // { provide: APP_INTERCEPTOR, useClass: ClassSerializerInterceptor },
    // { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },
    // { provide: APP_INTERCEPTOR, useClass: LogInterceptor },

    // 全局 JWT 认证守卫，所有接口默认需要认证（除非使用 @Public() 装饰器）
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    // 全局限流守卫，所有接口默认启用限流保护
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class BaseDemoModule {}
