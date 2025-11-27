import { Injectable } from '@nestjs/common';

/**
 * 基础演示服务
 *
 * 提供基础的演示功能，用于展示应用的基本服务结构。
 * 这是一个示例服务，实际业务中应该替换为具体的业务服务。
 *
 * @example
 * ```typescript
 * const service = new BaseDemoService();
 * const message = service.getHello(); // 'Hello World!'
 * ```
 */
@Injectable()
export class BaseDemoService {
  /**
   * 获取问候消息
   *
   * 返回一个简单的问候字符串，用于演示服务的基本功能。
   *
   * @returns {string} 问候消息字符串
   *
   * @example
   * ```typescript
   * const message = service.getHello();
   * console.log(message); // 'Hello World!'
   * ```
   */
  getHello(): string {
    return 'Hello World!';
  }
}
