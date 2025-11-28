import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import config from '@hl8/config';

import { AppController } from './app.controller';
import { AppService } from './app.service';

/**
 * 应用根模块
 *
 * NestJS 应用的根模块，负责配置和导入所有全局模块、功能模块和中间件。
 *
 * @remarks
 * 主要功能模块包括：
 * - **配置管理**：ConfigModule 支持多环境配置加载
 *
 * @see {@link https://docs.nestjs.com/modules | NestJS 模块文档}
 */
@Module({
  imports: [
    // 全局配置模块
    // 支持从多个环境变量文件加载配置，优先级：.env.local > .env.{NODE_ENV} > .env
    ConfigModule.forRoot({
      isGlobal: true,
      expandVariables: true,
      envFilePath: ['.env.local', `.env.${process.env.NODE_ENV}`, '.env'],
      load: [...Object.values(config)],
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
