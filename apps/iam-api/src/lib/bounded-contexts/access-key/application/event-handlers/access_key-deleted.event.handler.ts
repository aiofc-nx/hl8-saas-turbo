import { Inject, Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';

import type { IApiKeyService } from '@hl8/guard';
import {
  ComplexApiKeyServiceToken,
  SimpleApiKeyServiceToken,
} from '@hl8/guard';

import { AccessKeyDeletedEvent } from '../../domain/events/access_key-deleted.event';

/**
 * 访问密钥删除事件处理器
 *
 * @description
 * 处理 AccessKeyDeletedEvent 事件，当访问密钥被删除时，
 * 从 API 密钥服务中移除该密钥，使其无法再用于 API 认证。
 *
 * @implements {IEventHandler<AccessKeyDeletedEvent>}
 */
@EventsHandler(AccessKeyDeletedEvent)
export class AccessKeyDeletedHandler
  implements IEventHandler<AccessKeyDeletedEvent>
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
   * 处理访问密钥删除事件
   *
   * @description
   * 当访问密钥被删除时，从 API 密钥服务中移除该密钥，
   * 确保该密钥无法再用于 API 调用认证。
   *
   * @param event - 访问密钥删除事件，包含域、密钥 ID、密钥值和状态
   * @returns Promise<void>
   */
  async handle(event: AccessKeyDeletedEvent) {
    await this.simpleApiKeyService.removeKey(event.AccessKeyID);
    await this.complexApiKeyService.removeKey(event.AccessKeyID);
    Logger.log(
      `AccessKey deleted, AccessKeyDeleted Event is ${JSON.stringify(event)}`,
      '[AccessKey] AccessKeyDeletedHandler',
    );
  }
}
