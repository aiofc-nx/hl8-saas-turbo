import { ICommand } from '@nestjs/cqrs';

/**
 * 用户邮箱验证命令
 *
 * @description
 * CQRS 命令对象，用于标记用户邮箱为已验证状态。
 * 当用户通过 OTP 验证码成功验证邮箱后，调用此命令更新用户的邮箱验证状态。
 *
 * @implements {ICommand}
 */
export class UserVerifyEmailCommand implements ICommand {
  /**
   * 构造函数
   *
   * @param userId - 要更新验证状态的用户 ID
   * @param uid - 执行验证的用户 ID（通常是用户自己），用于审计追踪
   */
  constructor(
    readonly userId: string,
    readonly uid: string,
  ) {}
}
