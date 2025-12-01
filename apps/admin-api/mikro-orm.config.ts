import { defineConfig, PostgreSqlDriver } from '@mikro-orm/postgresql';
import { config } from 'dotenv';

import { CasbinRule } from '@hl8/casbin';

// 加载 .env 文件
config();

/**
 * MikroORM 配置文件
 *
 * @description 用于 MikroORM CLI 命令（迁移、schema 等）
 * 配置与 SharedModule 中的配置保持一致
 */
export default defineConfig({
  driver: PostgreSqlDriver,
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  dbName: process.env.DB_NAME || 'hl8-platform',
  // 实体配置
  // 开发环境：使用 TypeScript 实体文件路径
  // 生产环境：使用编译后的 JavaScript 实体文件路径
  entities: [CasbinRule],
  entitiesTs: [CasbinRule, 'src/infra/entities/**/*.entity.ts'],
  // 迁移配置
  migrations: {
    path: 'dist/migrations',
    pathTs: 'src/migrations',
    glob: '!(*.d).{js,ts}',
  },
  // 允许使用全局 EntityManager
  allowGlobalContext: true,
  // SSL 配置
  driverOptions:
    process.env.DB_SSL === 'true'
      ? {
          connection: {
            ssl: true,
          },
        }
      : {},
});
