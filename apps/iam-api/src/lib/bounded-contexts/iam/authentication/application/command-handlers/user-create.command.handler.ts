import { Status } from '@/lib/shared/enums/status.enum';
import { BadRequestException, Inject } from '@nestjs/common';
import { CommandHandler, EventPublisher, ICommandHandler } from '@nestjs/cqrs';

import { Password } from '../../domain/password.value-object';

import { UlidGenerator } from '@hl8/utils';

import { UserCreateCommand } from '../../commands/user-create.command';
import { UserReadRepoPortToken, UserWriteRepoPortToken } from '../../constants';
import { User } from '../../domain/user';
import type { UserCreateProperties } from '../../domain/user.read.model';
import type { UserReadRepoPort } from '../../ports/user.read.repo-port';
import type { UserWriteRepoPort } from '../../ports/user.write.repo-port';

@CommandHandler(UserCreateCommand)
export class UserCreateHandler
  implements ICommandHandler<UserCreateCommand, void>
{
  constructor(private readonly publisher: EventPublisher) {}
  @Inject(UserWriteRepoPortToken)
  private readonly userWriteRepository: UserWriteRepoPort;
  @Inject(UserReadRepoPortToken)
  private readonly userReadRepoPort: UserReadRepoPort;

  async execute(command: UserCreateCommand) {
    const existingUser = await this.userReadRepoPort.getUserByUsername(
      command.username,
    );

    if (existingUser) {
      throw new BadRequestException(
        `A user with code ${command.username} already exists.`,
      );
    }

    const hashedPassword = await Password.hash(command.password);
    const userCreateProperties: UserCreateProperties = {
      id: UlidGenerator.generate(),
      username: command.username,
      nickName: command.nickName,
      password: hashedPassword.getValue(),
      domain: command.domain,
      status: Status.ENABLED,
      avatar: command.avatar,
      email: command.email,
      phoneNumber: command.phoneNumber,
      createdAt: new Date(),
      createdBy: command.uid,
    };

    const user = new User(userCreateProperties);
    await this.userWriteRepository.save(user);
    await user.created();
    this.publisher.mergeObjectContext(user);
    user.commit();
  }
}
