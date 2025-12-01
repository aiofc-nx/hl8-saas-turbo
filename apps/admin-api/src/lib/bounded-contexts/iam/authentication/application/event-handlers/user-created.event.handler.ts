import { Inject, Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';

import { CacheConstant } from '@hl8/constants';
import { MailService, RegisterSuccessMail } from '@hl8/mail';
import { RedisUtility } from '@hl8/redis';
import { APP_NAME, APP_URL } from '@repo/constants/app';

import { UserReadRepoPortToken } from '../../constants';
import { UserCreatedEvent } from '../../domain/events/user-created.event';
import type { UserReadRepoPort } from '../../ports/user.read.repo-port';

/**
 * 用户创建事件处理器
 *
 * @description
 * 处理用户创建事件，发送注册验证邮件。
 * 生成 6 位数字 OTP 验证码，存储到 Redis，并发送邮件通知用户。
 */
@EventsHandler(UserCreatedEvent)
export class UserCreatedHandler implements IEventHandler<UserCreatedEvent> {
  constructor(
    @Inject(UserReadRepoPortToken)
    private readonly userReadRepoPort: UserReadRepoPort,
    private readonly mailService: MailService,
  ) {}

  /**
   * 生成 6 位数字 OTP 验证码
   *
   * @returns 6 位数字字符串
   */
  private generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * 处理用户创建事件
   *
   * @description
   * 1. 查询用户信息（获取邮箱）
   * 2. 生成 OTP 验证码
   * 3. 将 OTP 存储到 Redis（有效期 10 分钟）
   * 4. 发送注册验证邮件
   *
   * @param event - 用户创建事件
   */
  async handle(event: UserCreatedEvent) {
    try {
      // 1. 查询用户信息，获取邮箱
      const user = await this.userReadRepoPort.findUserById(event.userId);
      if (!user || !user.email) {
        Logger.warn(
          `用户 ${event.userId} 不存在或没有邮箱，跳过邮件发送`,
          '[authentication] UserCreatedHandler',
        );
        return;
      }

      // 2. 生成 OTP 验证码
      const otp = this.generateOTP();

      // 3. 将 OTP 存储到 Redis，有效期 10 分钟
      const otpKey = `${CacheConstant.EMAIL_VERIFICATION_PREFIX}${user.email}`;
      await RedisUtility.instance.setex(otpKey, 600, otp); // 600 秒 = 10 分钟

      // 4. 发送注册验证邮件
      const html = RegisterSuccessMail({
        name: user.nickName || user.username,
        otp,
        appName: APP_NAME,
        appUrl: APP_URL,
      });

      await this.mailService.sendEmail({
        to: [user.email],
        subject: '欢迎注册 - 请验证您的邮箱',
        html,
      });

      Logger.log(
        `用户 ${event.userId} (${user.email}) 注册验证邮件已发送`,
        '[authentication] UserCreatedHandler',
      );
    } catch (error) {
      Logger.error(
        `发送注册验证邮件失败: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
        '[authentication] UserCreatedHandler',
      );
      // 不抛出异常，避免影响用户创建流程
    }
  }
}
