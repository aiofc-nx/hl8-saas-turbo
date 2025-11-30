import { Status } from '@/lib/shared/enums/status.enum';
import { BadRequestException, Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { UlidGenerator } from '@hl8/utils';

import { DomainCreateCommand } from '../../commands/domain-create.command';
import {
  DomainReadRepoPortToken,
  DomainWriteRepoPortToken,
} from '../../constants';
import { Domain } from '../../domain/domain.model';
import type { DomainCreateProperties } from '../../domain/domain.read.model';
import type { DomainReadRepoPort } from '../../ports/domain.read.repo-port';
import type { DomainWriteRepoPort } from '../../ports/domain.write.repo-port';

/**
 * 域创建命令处理器
 *
 * @description
 * 处理 DomainCreateCommand 命令，负责创建新的 Casbin 域。
 * 该处理器会验证域代码的唯一性，然后创建域并保存到数据库。
 *
 * @implements {ICommandHandler<DomainCreateCommand, void>}
 */
@CommandHandler(DomainCreateCommand)
export class DomainCreateHandler
  implements ICommandHandler<DomainCreateCommand, void>
{
  /**
   * 域写入仓储端口
   *
   * @description 用于持久化域数据的仓储接口
   */
  @Inject(DomainWriteRepoPortToken)
  private readonly domainWriteRepository: DomainWriteRepoPort;

  /**
   * 域读取仓储端口
   *
   * @description 用于查询域数据的仓储接口
   */
  @Inject(DomainReadRepoPortToken)
  private readonly domainReadRepoPort: DomainReadRepoPort;

  /**
   * 执行创建域命令
   *
   * @description
   * 创建新域，包括：
   * 1. 验证域代码是否已存在
   * 2. 生成域 ID 并创建域聚合根
   * 3. 设置域状态为启用
   * 4. 保存到数据库
   *
   * @param command - 域创建命令，包含域代码、名称、描述和创建者信息
   * @returns Promise<void>
   *
   * @throws {BadRequestException} 当域代码已存在时抛出异常
   */
  async execute(command: DomainCreateCommand) {
    const existingDomain = await this.domainReadRepoPort.getDomainByCode(
      command.code,
    );

    if (existingDomain) {
      throw new BadRequestException(
        `A domain with code ${command.code} already exists.`,
      );
    }

    const domainCreateProperties: DomainCreateProperties = {
      id: UlidGenerator.generate(),
      code: command.code,
      name: command.name,
      status: Status.ENABLED,
      description: command.description,
      createdAt: new Date(),
      createdBy: command.uid,
    };

    const domain = Domain.fromCreate(domainCreateProperties);
    await this.domainWriteRepository.save(domain);
  }
}
