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

/**
 * 用户创建命令处理器
 *
 * @description
 * 处理 UserCreateCommand 命令，负责创建新用户。
 * 该处理器会验证用户名的唯一性，加密密码，然后创建用户并保存到数据库，最后发布用户创建事件。
 *
 * @implements {ICommandHandler<UserCreateCommand, void>}
 */
@CommandHandler(UserCreateCommand)
export class UserCreateHandler
  implements ICommandHandler<UserCreateCommand, void>
{
  /**
   * 构造函数
   *
   * @param publisher - 事件发布器，用于发布领域事件
   */
  constructor(private readonly publisher: EventPublisher) {}

  /**
   * 用户写入仓储端口
   *
   * @description 用于持久化用户数据的仓储接口
   */
  @Inject(UserWriteRepoPortToken)
  private readonly userWriteRepository: UserWriteRepoPort;

  /**
   * 用户读取仓储端口
   *
   * @description 用于查询用户数据的仓储接口
   */
  @Inject(UserReadRepoPortToken)
  private readonly userReadRepoPort: UserReadRepoPort;

  /**
   * 执行创建用户命令
   *
   * @description
   * 创建新用户，包括：
   * 1. 验证用户名是否已存在
   * 2. 加密用户密码
   * 3. 生成用户 ID 并创建用户聚合根
   * 4. 设置用户状态为启用
   * 5. 保存到数据库
   * 6. 发布用户创建事件
   *
   * @param command - 用户创建命令，包含用户名、密码、域、昵称等信息
   * @returns Promise<void>
   *
   * @throws {BadRequestException} 当用户名已存在时抛出异常
   */
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
      isEmailVerified: false, // 新注册用户邮箱默认为未验证状态
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
