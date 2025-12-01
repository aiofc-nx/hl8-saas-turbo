import { Inject, NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { UserVerifyEmailCommand } from '../../commands/user-verify-email.command';
import { UserReadRepoPortToken, UserWriteRepoPortToken } from '../../constants';
import { User } from '../../domain/user';
import type { UserUpdateProperties } from '../../domain/user.read.model';
import type { UserReadRepoPort } from '../../ports/user.read.repo-port';
import type { UserWriteRepoPort } from '../../ports/user.write.repo-port';

/**
 * 用户邮箱验证命令处理器
 *
 * @description
 * 处理 UserVerifyEmailCommand 命令，将用户的邮箱验证状态更新为已验证。
 * 该处理器会查找用户，更新 isEmailVerified 字段为 true，然后保存到数据库。
 *
 * @implements {ICommandHandler<UserVerifyEmailCommand, void>}
 */
@CommandHandler(UserVerifyEmailCommand)
export class UserVerifyEmailHandler
  implements ICommandHandler<UserVerifyEmailCommand, void>
{
  @Inject(UserWriteRepoPortToken)
  private readonly userWriteRepository: UserWriteRepoPort;
  @Inject(UserReadRepoPortToken)
  private readonly userReadRepoPort: UserReadRepoPort;

  /**
   * 执行邮箱验证命令
   *
   * @description
   * 更新用户的邮箱验证状态为已验证。
   * 1. 查找用户
   * 2. 更新 isEmailVerified 字段为 true
   * 3. 保存到数据库
   *
   * @param command - 用户邮箱验证命令，包含用户 ID
   * @returns Promise<void>
   *
   * @throws {NotFoundException} 当用户不存在时抛出异常
   */
  async execute(command: UserVerifyEmailCommand) {
    const user = await this.userReadRepoPort.findUserById(command.userId);
    if (!user) {
      throw new NotFoundException('User not found.');
    }

    const userUpdateProperties: UserUpdateProperties = {
      id: command.userId,
      nickName: user.nickName,
      status: user.status,
      avatar: user.avatar,
      email: user.email,
      phoneNumber: user.phoneNumber,
      isEmailVerified: true, // 更新邮箱验证状态为已验证
      createdAt: new Date(),
      createdBy: command.uid,
    };

    const userAggregate = new User(userUpdateProperties);
    await this.userWriteRepository.update(userAggregate);
  }
}
