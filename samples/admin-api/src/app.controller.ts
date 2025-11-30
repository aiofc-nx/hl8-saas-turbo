import { Controller, Get } from '@nestjs/common';

import { Public } from '@hl8/decorators';

import { AppService } from './app.service';

/**
 * 应用控制器
 *
 * 提供应用级别的 API 端点。
 */
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  /**
   * 获取欢迎消息
   *
   * 简单的测试端点，返回欢迎消息。
   *
   * @returns 欢迎消息字符串
   *
   * @remarks
   * - 使用 @Public() 装饰器，无需认证即可访问
   */
  @Get()
  @Public()
  getHello(): string {
    return this.appService.getHello();
  }
}
