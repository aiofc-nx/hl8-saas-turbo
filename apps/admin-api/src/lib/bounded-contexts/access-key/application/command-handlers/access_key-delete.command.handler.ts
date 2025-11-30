import { BadRequestException, Inject } from '@nestjs/common';
import { CommandHandler, EventPublisher, ICommandHandler } from '@nestjs/cqrs';

import { AccessKeyDeleteCommand } from '../../commands/access_key-delete.command';
import {
  AccessKeyReadRepoPortToken,
  AccessKeyWriteRepoPortToken,
} from '../../constants';
import { AccessKey } from '../../domain/access_key.model';
import type { AccessKeyReadRepoPort } from '../../ports/access_key.read.repo-port';
import type { AccessKeyWriteRepoPort } from '../../ports/access_key.write.repo-port';

/**
 * 访问密钥删除命令处理器
 *
 * @description
 * 处理 AccessKeyDeleteCommand 命令，负责删除指定的访问密钥。
 * 该处理器会先验证访问密钥是否存在，然后删除并发布访问密钥删除事件。
 *
 * @implements {ICommandHandler<AccessKeyDeleteCommand, void>}
 */
@CommandHandler(AccessKeyDeleteCommand)
export class AccessKeyDeleteHandler
  implements ICommandHandler<AccessKeyDeleteCommand, void>
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
   * 访问密钥读取仓储端口
   *
   * @description 用于查询访问密钥的仓储接口
   */
  @Inject(AccessKeyReadRepoPortToken)
  private readonly accessKeyReadRepoPort: AccessKeyReadRepoPort;

  /**
   * 执行删除访问密钥命令
   *
   * @description
   * 删除指定的访问密钥，包括：
   * 1. 验证访问密钥是否存在
   * 2. 从数据库删除访问密钥
   * 3. 发布访问密钥删除事件
   *
   * @param command - 访问密钥删除命令，包含要删除的访问密钥 ID
   * @returns Promise<void>
   *
   * @throws {BadRequestException} 当访问密钥不存在时抛出异常
   */
  async execute(command: AccessKeyDeleteCommand) {
    const existingAccessKey = await this.accessKeyReadRepoPort.getAccessKeyById(
      command.id,
    );

    if (!existingAccessKey) {
      throw new BadRequestException(
        `A accessKey with the specified ID does not exist.`,
      );
    }

    const accessKey = AccessKey.fromProp(existingAccessKey);
    await this.accessKeyWriteRepository.deleteById(accessKey.id);
    await accessKey.deleted();
    this.publisher.mergeObjectContext(accessKey);
    accessKey.commit();
  }
}
