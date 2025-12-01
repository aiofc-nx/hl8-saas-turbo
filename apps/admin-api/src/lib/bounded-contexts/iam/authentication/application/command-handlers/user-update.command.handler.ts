import { Status } from '@/lib/shared/enums/status.enum';
import { BadRequestException, Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { UserUpdateCommand } from '../../commands/user-update.command';
import { UserReadRepoPortToken, UserWriteRepoPortToken } from '../../constants';
import { User } from '../../domain/user';
import type { UserUpdateProperties } from '../../domain/user.read.model';
import type { UserReadRepoPort } from '../../ports/user.read.repo-port';
import type { UserWriteRepoPort } from '../../ports/user.write.repo-port';

@CommandHandler(UserUpdateCommand)
export class UserUpdateHandler
  implements ICommandHandler<UserUpdateCommand, void>
{
  @Inject(UserWriteRepoPortToken)
  private readonly userWriteRepository: UserWriteRepoPort;
  @Inject(UserReadRepoPortToken)
  private readonly userReadRepoPort: UserReadRepoPort;

  async execute(command: UserUpdateCommand) {
    // 检查用户名是否已被其他用户使用
    const userByUsername = await this.userReadRepoPort.getUserByUsername(
      command.username,
    );

    if (userByUsername && userByUsername.id !== command.id) {
      throw new BadRequestException(
        `A user with account ${command.username} already exists.`,
      );
    }

    // 获取现有用户信息，保留邮箱验证状态
    const existingUser = await this.userReadRepoPort.findUserById(command.id);
    if (!existingUser) {
      throw new BadRequestException('User not found.');
    }

    const userUpdateProperties: UserUpdateProperties = {
      id: command.id,
      nickName: command.nickName,
      status: Status.ENABLED,
      avatar: command.avatar,
      email: command.email,
      phoneNumber: command.phoneNumber,
      isEmailVerified: existingUser.isEmailVerified ?? false, // 保留现有验证状态
      createdAt: new Date(),
      createdBy: command.uid,
    };

    const user = new User(userUpdateProperties);
    await this.userWriteRepository.update(user);
  }
}
