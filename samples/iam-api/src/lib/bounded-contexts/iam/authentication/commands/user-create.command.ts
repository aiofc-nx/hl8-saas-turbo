import { ICommand } from '@nestjs/cqrs';

/**
 * 用户创建命令
 *
 * @description
 * CQRS 命令对象，用于创建新用户。用户是 IAM 系统中的核心实体，
 * 每个用户属于一个域，可以拥有多个角色。
 *
 * @implements {ICommand}
 */
export class UserCreateCommand implements ICommand {
  /**
   * 构造函数
   *
   * @param username - 用户名，在域内必须唯一，用于登录
   * @param password - 用户密码，需要满足最小长度要求
   * @param domain - 用户所属的域代码，用于多租户隔离
   * @param nickName - 用户昵称，用于界面展示
   * @param avatar - 用户头像 URL，可为空
   * @param email - 用户邮箱，可用于登录和找回密码，可为空
   * @param phoneNumber - 用户手机号，可用于登录和找回密码，可为空
   * @param uid - 创建者的用户 ID，用于审计追踪
   */
  constructor(
    readonly username: string,
    readonly password: string,
    readonly domain: string,
    readonly nickName: string,
    readonly avatar: string | null,
    readonly email: string | null,
    readonly phoneNumber: string | null,
    readonly uid: string,
  ) {}
}
