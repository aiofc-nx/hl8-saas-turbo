import { Status } from '@/lib/shared/enums/status.enum';
import { Inject } from '@nestjs/common';
import { CommandHandler, EventPublisher, ICommandHandler } from '@nestjs/cqrs';

import { UlidGenerator } from '@hl8/utils';

import { AccessKeyCreateCommand } from '../../commands/access_key-create.command';
import { AccessKeyWriteRepoPortToken } from '../../constants';
import { AccessKey } from '../../domain/access_key.model';
import type { AccessKeyProperties } from '../../domain/access_key.read.model';
import type { AccessKeyWriteRepoPort } from '../../ports/access_key.write.repo-port';

@CommandHandler(AccessKeyCreateCommand)
export class AccessKeyCreateHandler
  implements ICommandHandler<AccessKeyCreateCommand, void>
{
  constructor(private readonly publisher: EventPublisher) {}
  @Inject(AccessKeyWriteRepoPortToken)
  private readonly accessKeyWriteRepository: AccessKeyWriteRepoPort;

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
