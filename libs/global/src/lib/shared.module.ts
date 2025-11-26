import { readFileSync } from 'fs';

import { HttpModule } from '@nestjs/axios';
import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import * as yaml from 'js-yaml';

import { Ip2regionModule } from '@hl8/ip2region';
import { MikroOrmModule } from '@hl8/mikro-orm-nestjs';
import { OssModule } from '@hl8/oss';
import { getConfigPath } from '@hl8/utils';
import { CacheManagerModule } from './cache-manager.module';

/**
 * OSS 配置类型
 *
 * @description 定义 OSS 对象存储配置的结构
 */
interface IOssConfig {
  /** OSS 配置对象 */
  [key: string]: unknown;
}

/**
 * IP2Region 配置类型
 *
 * @description 定义 IP2Region 地理位置配置的结构
 */
interface IIp2regionConfig {
  /** IP2Region 配置对象 */
  [key: string]: unknown;
}

/**
 * 共享模块
 *
 * @description 全局共享模块，提供应用所需的基础功能模块，包括配置、HTTP、调度、事件、缓存、数据库等。
 * 该模块使用 @Global() 装饰器，导入后在整个应用中可用。
 *
 * @example
 * ```typescript
 * // 在应用根模块中导入
 * @Module({
 *   imports: [SharedModule],
 *   // ... 其他配置
 * })
 * export class AppModule {}
 *
 * // 在其他模块中直接使用导出的功能
 * @Injectable()
 * export class MyService {
 *   constructor(
 *     private httpService: HttpService,  // HttpModule 导出
 *     @Inject(CACHE_MANAGER) private cacheManager: Cache,  // CacheManagerModule 导出
 *     private em: EntityManager,  // MikroOrmModule 导出
 *   ) {}
 * }
 * ```
 *
 * @remarks
 * - 自动加载 YAML 配置文件（oss.config.yaml, ip2region.config.yaml）
 * - EventEmitter 配置可通过环境变量自定义
 * - MikroORM 数据库配置从环境变量读取（DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_NAME, DB_SSL）
 * - 所有导入的子模块都是全局可用的
 * - 配置文件路径通过 @hl8/utils 的 getConfigPath 函数解析
 *
 * @throws {Error} 当 YAML 配置文件不存在或格式错误时，模块初始化可能失败
 *
 * @class SharedModule
 */
@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      load: [
        async () => {
          try {
            const configContent = readFileSync(
              getConfigPath('oss.config.yaml'),
              'utf8',
            );
            const config = yaml.load(configContent) as IOssConfig | undefined;
            if (!config) {
              throw new Error('OSS 配置文件为空或格式无效');
            }
            return config;
          } catch (error) {
            throw new Error(
              `加载 OSS 配置失败：${error instanceof Error ? error.message : String(error)}`,
            );
          }
        },
        async () => {
          try {
            const configContent = readFileSync(
              getConfigPath('ip2region.config.yaml'),
              'utf8',
            );
            const config = yaml.load(configContent) as
              | IIp2regionConfig
              | undefined;
            if (!config) {
              throw new Error('IP2Region 配置文件为空或格式无效');
            }
            return config;
          } catch (error) {
            throw new Error(
              `加载 IP2Region 配置失败：${error instanceof Error ? error.message : String(error)}`,
            );
          }
        },
      ],
      isGlobal: true,
    }),
    // MikroORM 数据库模块配置
    // 从环境变量读取数据库配置，支持 PostgreSQL
    MikroOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (_configService: ConfigService) => {
        // 从环境变量获取数据库配置
        const dbHost = process.env.DB_HOST || 'localhost';
        const dbPort = parseInt(process.env.DB_PORT || '5432', 10);
        const dbUsername = process.env.DB_USERNAME || 'postgres';
        const dbPassword = process.env.DB_PASSWORD || 'postgres';
        const dbName = process.env.DB_NAME || 'hl8-platform';
        const dbSsl = process.env.DB_SSL === 'true';

        return {
          type: 'postgresql',
          host: dbHost,
          port: dbPort,
          user: dbUsername,
          password: dbPassword,
          dbName: dbName,
          entities: ['dist/**/*.entity.js'],
          entitiesTs: ['src/**/*.entity.ts'],
          migrations: {
            path: 'dist/migrations',
            pathTs: 'src/migrations',
            glob: '!(*.d).{js,ts}',
          },
          autoLoadEntities: true,
          driverOptions: dbSsl
            ? {
                connection: {
                  ssl: true,
                },
              }
            : {},
        };
      },
    }),
    Ip2regionModule,
    OssModule,
    // http
    HttpModule,
    // schedule
    ScheduleModule.forRoot(),
    EventEmitterModule.forRoot({
      wildcard: process.env.EVENT_EMITTER_WILDCARD === 'true',
      delimiter: process.env.EVENT_EMITTER_DELIMITER || '.',
      newListener: process.env.EVENT_EMITTER_NEW_LISTENER === 'true',
      removeListener: process.env.EVENT_EMITTER_REMOVE_LISTENER === 'true',
      maxListeners: parseInt(
        process.env.EVENT_EMITTER_MAX_LISTENERS || '20',
        10,
      ),
      ignoreErrors: process.env.EVENT_EMITTER_IGNORE_ERRORS === 'true',
    }),
    CacheManagerModule,
  ],
  exports: [HttpModule, CacheManagerModule, MikroOrmModule],
})
export class SharedModule {}
