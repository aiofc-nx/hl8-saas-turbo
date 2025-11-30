import { Inject } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';

import { UserLoggedInEvent } from '../../../../iam/authentication/domain/events/user-logged-in.event';

import { LoginLogWriteRepoPortToken } from '../../constants';
import { LoginLogEntity } from '../../domain/login-log.entity';
import type { LoginLogWriteRepoPort } from '../../ports/login-log.write.repo-port';

/**
 * 用户登录事件处理器
 *
 * @description 处理用户登录事件，当用户成功登录时，自动创建并保存登录日志记录。
 * 该处理器遵循CQRS模式的事件处理器规范，监听UserLoggedInEvent事件并执行相应的业务逻辑。
 *
 * @example
 * ```typescript
 * // 事件发布后自动触发
 * eventBus.publish(new UserLoggedInEvent({
 *   userId: 'user-123',
 *   username: 'john.doe',
 *   domain: 'example.com',
 *   ip: '192.168.1.1',
 *   // ... 其他属性
 * }));
 * ```
 */
@EventsHandler(UserLoggedInEvent)
export class UserLoggedInHandler implements IEventHandler<UserLoggedInEvent> {
  /**
   * 创建用户登录事件处理器
   *
   * @param loginLogWriteRepo - 登录日志写入仓储端口，通过依赖注入获取
   */
  constructor(
    @Inject(LoginLogWriteRepoPortToken)
    private readonly loginLogWriteRepo: LoginLogWriteRepoPort,
  ) {}

  /**
   * 处理用户登录事件
   *
   * @description 当用户登录事件发生时，根据事件数据创建登录日志实体并保存到持久化存储中。
   * 该方法是事件驱动的，自动响应UserLoggedInEvent事件。
   *
   * @param event - 用户登录事件对象，包含登录相关的所有信息
   * @returns Promise<void> 保存操作完成后的Promise
   * @throws {Error} 当保存操作失败时抛出错误
   */
  async handle(event: UserLoggedInEvent) {
    const loginLog = new LoginLogEntity(
      event.userId,
      event.username,
      event.domain,
      event.ip,
      event.address,
      event.userAgent,
      event.requestId,
      event.type,
      event.userId,
      event.port,
    );

    return await this.loginLogWriteRepo.save(loginLog);
  }
}
