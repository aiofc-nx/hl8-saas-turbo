import { createKeyv } from '@keyv/redis';
import { CacheModule } from '@nestjs/cache-manager';
import { Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { ConfigKeyPaths, IRedisConfig, redisRegToken } from '@hl8/config';
import { getEnvNumber } from '@hl8/utils';

/**
 * 缓存管理器模块
 *
 * @description 提供基于 Redis 的缓存功能，支持单机模式和集群模式，默认 TTL 为 24 小时。
 * 该模块使用 @keyv/redis 作为缓存存储后端，通过 ConfigService 读取 Redis 配置。
 *
 * @example
 * ```typescript
 * // 在应用模块中导入
 * @Module({
 *   imports: [CacheManagerModule],
 * })
 * export class AppModule {}
 *
 * // 在服务中使用
 * @Injectable()
 * export class MyService {
 *   constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}
 *
 *   async getData(key: string) {
 *     return await this.cacheManager.get(key);
 *   }
 *
 *   async setData(key: string, value: any, ttl?: number) {
 *     await this.cacheManager.set(key, value, ttl);
 *   }
 * }
 * ```
 *
 * @remarks
 * - 支持 Redis 单机模式和集群模式
 * - 默认 TTL 为 24 小时（86400000 毫秒），可通过环境变量 CACHE_TTL 配置（单位：毫秒）
 * - 集群模式下，密码从第一个节点获取
 * - 密码会自动进行 URL 编码处理
 * - Redis 配置通过 @hl8/config 模块读取
 * - TTL 配置验证：如果配置值无效（<=0），将使用默认值并记录警告日志
 *
 * @throws {Error} 当 Redis 配置无效或缺失时，模块初始化可能失败
 *
 * @class CacheManagerModule
 */
@Module({
  imports: [
    CacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService<ConfigKeyPaths>) => {
        const logger = new Logger('CacheManagerModule');

        try {
          const redisConfig: IRedisConfig | undefined =
            configService.get<IRedisConfig>(redisRegToken, { infer: true });

          if (!redisConfig) {
            const error = new Error(
              `Redis 配置缺失：无法从配置服务获取 ${redisRegToken} 配置`,
            );
            logger.error(error.message);
            throw error;
          }

          // 验证配置
          if (redisConfig.mode === 'cluster') {
            if (!redisConfig.cluster || redisConfig.cluster.length === 0) {
              const error = new Error('Redis 集群配置无效：集群节点列表为空');
              logger.error(error.message);
              throw error;
            }

            if (!redisConfig.cluster[0]?.password) {
              logger.warn('Redis 集群配置警告：第一个节点密码为空');
            }
          } else {
            if (!redisConfig.standalone) {
              const error = new Error(
                'Redis 单机配置无效：standalone 配置缺失',
              );
              logger.error(error.message);
              throw error;
            }

            if (!redisConfig.standalone.host || !redisConfig.standalone.port) {
              const error = new Error('Redis 单机配置无效：host 或 port 缺失');
              logger.error(error.message);
              throw error;
            }
          }

          let redisUrl = '';
          try {
            if (redisConfig.mode === 'cluster') {
              const nodes = redisConfig.cluster
                .map((node) => `${node.host}:${node.port}`)
                .join(',');
              const password = encodeURIComponent(
                redisConfig.cluster[0].password || '',
              );
              redisUrl = `redis://:%${password}@${nodes}`;
              logger.log(
                `Redis 集群模式：连接 ${redisConfig.cluster.length} 个节点`,
              );
            } else {
              const { host, port, password, db } = redisConfig.standalone;
              const encodedPassword = encodeURIComponent(password || '');
              redisUrl = `redis://:${encodedPassword}@${host}:${port}/${db}`;
              logger.log(`Redis 单机模式：${host}:${port}/${db}`);
            }
          } catch (error) {
            const urlError = new Error(
              `Redis URL 构建失败：${error instanceof Error ? error.message : String(error)}`,
            );
            logger.error(
              urlError.message,
              error instanceof Error ? error.stack : undefined,
            );
            throw urlError;
          }

          try {
            const keyvCacheStore = createKeyv(redisUrl);
            logger.log('Redis 缓存存储初始化成功');

            // 从环境变量读取 TTL 配置，默认 24 小时（毫秒）
            const defaultTtl = 24 * 60 * 60 * 1000;
            const cacheTtl = getEnvNumber('CACHE_TTL', defaultTtl);

            // 验证 TTL 值（必须为正数）
            if (cacheTtl <= 0) {
              logger.warn(
                `缓存 TTL 配置无效：${cacheTtl}，使用默认值 ${defaultTtl} 毫秒`,
              );
            }

            const finalTtl = cacheTtl > 0 ? cacheTtl : defaultTtl;
            logger.log(
              `缓存默认 TTL：${finalTtl} 毫秒（${finalTtl / 1000 / 60} 分钟）`,
            );

            return {
              stores: [keyvCacheStore],
              ttl: finalTtl,
            };
          } catch (error) {
            const storeError = new Error(
              `Redis 缓存存储创建失败：${error instanceof Error ? error.message : String(error)}`,
            );
            logger.error(
              storeError.message,
              error instanceof Error ? error.stack : undefined,
            );
            throw storeError;
          }
        } catch (error) {
          logger.error(
            `CacheManagerModule 初始化失败：${error instanceof Error ? error.message : String(error)}`,
            error instanceof Error ? error.stack : undefined,
          );
          throw error;
        }
      },
    }),
  ],
  exports: [CacheModule],
})
export class CacheManagerModule {}
