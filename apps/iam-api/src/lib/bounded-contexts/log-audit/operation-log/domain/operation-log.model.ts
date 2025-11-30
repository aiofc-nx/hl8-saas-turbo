import { AggregateRoot } from '@nestjs/cqrs';

import type { OperationLogProperties } from '../../operation-log/domain/operation-log.read.model';

/**
 * 操作日志聚合根
 *
 * @description 表示用户操作日志的领域聚合根，继承自CQRS的AggregateRoot。
 * 该聚合根用于记录用户的各种操作行为，如API调用、数据修改等，支持操作审计和追踪。
 * 作为聚合根，它可以发布领域事件，支持事件溯源模式。
 *
 * @example
 * ```typescript
 * const operationLog = new OperationLog({
 *   userId: 'user-123',
 *   username: 'john.doe',
 *   domain: 'example.com',
 *   moduleName: 'user-management',
 *   description: '创建用户',
 *   requestId: 'req-456',
 *   method: 'POST',
 *   url: '/api/users',
 *   ip: '192.168.1.1',
 *   userAgent: 'Mozilla/5.0...',
 *   params: {},
 *   body: { name: 'John' },
 *   response: { id: 'user-789' },
 *   startTime: new Date(),
 *   endTime: new Date(),
 *   duration: 150
 * });
 * ```
 */
export class OperationLog extends AggregateRoot {
  /** 用户ID，执行操作的用户标识 */
  readonly userId: string;

  /** 用户名，执行操作的用户名 */
  readonly username: string;

  /** 域名，操作发生的域名 */
  readonly domain: string;

  /** 模块名称，操作所属的功能模块 */
  readonly moduleName: string;

  /** 操作描述，对操作行为的文字描述 */
  readonly description: string;

  /** 请求ID，用于追踪本次请求的唯一标识 */
  readonly requestId: string;

  /** HTTP方法，如 GET、POST、PUT、DELETE 等 */
  readonly method: string;

  /** 请求URL，操作的API端点 */
  readonly url: string;

  /** IP地址，请求来源的IP地址 */
  readonly ip: string;

  /** 用户代理，客户端浏览器的用户代理字符串 */
  readonly userAgent: string;

  /** 请求参数，URL参数或查询参数 */
  readonly params: any;

  /** 请求体，POST/PUT请求的请求体数据 */
  readonly body: any;

  /** 响应数据，操作返回的响应内容 */
  readonly response: any;

  /** 开始时间，操作开始执行的时间 */
  readonly startTime: Date;

  /** 结束时间，操作完成的时间 */
  readonly endTime: Date;

  /** 持续时间，操作执行耗时（毫秒） */
  readonly duration: number;

  /**
   * 创建操作日志聚合根
   *
   * @param properties - 操作日志属性对象，包含所有必需的操作日志信息
   */
  constructor(properties: OperationLogProperties) {
    super();
    Object.assign(this, properties);
  }
}
