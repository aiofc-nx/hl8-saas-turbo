import { ICommand } from '@nestjs/cqrs';

/**
 * 用户更新命令
 *
 * @description
 * CQRS 命令对象，用于更新现有用户的信息。
 * 密码和域不允许通过此命令修改，只能更新昵称、头像、邮箱、手机号等字段。
 *
 * @implements {ICommand}
 */
export class UserUpdateCommand implements ICommand {
  /**
   * 构造函数
   *
   * @param id - 要更新的用户的唯一标识符
   * @param username - 用户名
   * @param nickName - 用户昵称
   * @param avatar - 用户头像 URL，可为空
   * @param email - 用户邮箱，可为空
   * @param phoneNumber - 用户手机号，可为空
   * @param uid - 更新者的用户 ID，用于审计追踪
   */
  constructor(
    readonly id: string,
    readonly username: string,
    readonly nickName: string,
    readonly avatar: string | null,
    readonly email: string | null,
    readonly phoneNumber: string | null,
    readonly uid: string,
  ) {}
}
