import { Global, Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

/**
 * 全局 CQRS 模块
 * 
 * @description 提供全局的 CQRS（命令查询职责分离）功能，支持命令和查询处理
 * 
 * @class GlobalCqrsModule
 */
@Global()
@Module({
  imports: [CqrsModule],
  exports: [CqrsModule],
})
export class GlobalCqrsModule {}
