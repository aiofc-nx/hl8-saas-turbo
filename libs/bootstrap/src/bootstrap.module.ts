import { Global, Module } from '@nestjs/common';

import { ApiDataService } from './index';

/**
 * 引导模块
 *
 * @description 应用启动时的引导模块，负责收集和初始化 API 端点数据
 *
 * @class BootstrapModule
 */
@Global()
@Module({
  providers: [ApiDataService],
  exports: [ApiDataService],
})
export class BootstrapModule {}
