import { Status } from '@/lib/shared/enums/status.enum';
import { Inject } from '@nestjs/common';
import { CommandHandler, EventPublisher, ICommandHandler } from '@nestjs/cqrs';

import { UlidGenerator } from '@hl8/utils';

import { AccessKeyCreateCommand } from '../../commands/access_key-create.command';
import { AccessKeyWriteRepoPortToken } from '../../constants';
import { AccessKey } from '../../domain/access_key.model';
import type { AccessKeyProperties } from '../../domain/access_key.read.model';
import type { AccessKeyWriteRepoPort } from '../../ports/access_key.write.repo-port';

/**
 * 访问密钥创建命令处理器
 *
 * @description
 * 处理 AccessKeyCreateCommand 命令，负责创建新的访问密钥。
 * 该处理器会生成唯一的密钥 ID 和密钥值，保存到数据库，并发布访问密钥创建事件。
 *
 * @implements {ICommandHandler<AccessKeyCreateCommand, void>}
 */
@CommandHandler(AccessKeyCreateCommand)
export class AccessKeyCreateHandler
  implements ICommandHandler<AccessKeyCreateCommand, void>
{
  /**
   * 构造函数
   *
   * @param publisher - 事件发布器，用于发布领域事件
   */
  constructor(private readonly publisher: EventPublisher) {}

  /**
   * 访问密钥写入仓储端口
   *
   * @description 用于持久化访问密钥的仓储接口
   */
  @Inject(AccessKeyWriteRepoPortToken)
  private readonly accessKeyWriteRepository: AccessKeyWriteRepoPort;

  /**
   * 执行创建访问密钥命令
   *
   * @description
   * 创建新的访问密钥，包括：
   * 1. 生成唯一的密钥 ID 和密钥值
   * 2. 设置密钥状态为启用
   * 3. 保存到数据库
   * 4. 发布访问密钥创建事件
   *
   * @param command - 访问密钥创建命令，包含域、描述和创建者信息
   * @returns Promise<void>
   *
   * @throws {Error} 当保存失败时抛出异常
   */
  async execute(command: AccessKeyCreateCommand) {
    const accessKeyProperties: AccessKeyProperties = {
      id: UlidGenerator.generate(),
      domain: command.domain,
      AccessKeyID: UlidGenerator.generate(),
      AccessKeySecret: UlidGenerator.generate(),
      status: Status.ENABLED,
      description: command.description,
      createdAt: new Date(),
      createdBy: command.uid,
    };

    const accessKey = AccessKey.fromProp(accessKeyProperties);
    await this.accessKeyWriteRepository.save(accessKey);
    await accessKey.created();
    this.publisher.mergeObjectContext(accessKey);
    accessKey.commit();
  }
}
