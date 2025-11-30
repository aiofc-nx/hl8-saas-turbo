import { Inject, Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';

import type { IApiKeyService } from '@hl8/guard';
import {
  ComplexApiKeyServiceToken,
  SimpleApiKeyServiceToken,
} from '@hl8/guard';

import { AccessKeyCreatedEvent } from '../../domain/events/access_key-created.event';

/**
 * 访问密钥创建事件处理器
 *
 * @description
 * 处理 AccessKeyCreatedEvent 事件，当访问密钥被创建时，
 * 将密钥信息同步到 API 密钥服务中，用于后续的 API 认证。
 *
 * @implements {IEventHandler<AccessKeyCreatedEvent>}
 */
@EventsHandler(AccessKeyCreatedEvent)
export class AccessKeyCreatedHandler
  implements IEventHandler<AccessKeyCreatedEvent>
{
  /**
   * 构造函数
   *
   * @param simpleApiKeyService - 简单 API 密钥服务，用于简单的密钥验证
   * @param complexApiKeyService - 复杂 API 密钥服务，用于带密钥值的验证
   */
  constructor(
    @Inject(SimpleApiKeyServiceToken)
    private readonly simpleApiKeyService: IApiKeyService,
    @Inject(ComplexApiKeyServiceToken)
    private readonly complexApiKeyService: IApiKeyService,
  ) {}

  /**
   * 处理访问密钥创建事件
   *
   * @description
   * 当访问密钥被创建时，将密钥信息添加到 API 密钥服务中，
   * 使其可以用于后续的 API 调用认证。
   *
   * @param event - 访问密钥创建事件，包含域、密钥 ID、密钥值和状态
   * @returns Promise<void>
   */
  async handle(event: AccessKeyCreatedEvent) {
    await this.simpleApiKeyService.addKey(event.AccessKeyID);
    await this.complexApiKeyService.addKey(
      event.AccessKeyID,
      event.AccessKeySecret,
    );
    Logger.log(
      `AccessKey Created, AccessKeyCreated Event is ${JSON.stringify(event)}`,
      '[AccessKey] AccessKeyCreatedHandler',
    );
  }
}
