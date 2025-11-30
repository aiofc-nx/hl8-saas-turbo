import { EntityManager } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';

import { LoginLogEntity } from '@/lib/bounded-contexts/log-audit/login-log/domain/login-log.entity';
import type { LoginLogWriteRepoPort } from '@/lib/bounded-contexts/log-audit/login-log/ports/login-log.write.repo-port';

/**
 * LoginLog 写入仓储实现
 *
 * @description 使用 MikroORM EntityManager 实现 LoginLog 数据的写入操作
 */
@Injectable()
export class LoginLogWriteRepository implements LoginLogWriteRepoPort {
  constructor(private readonly em: EntityManager) {}

  /**
   * 保存登录日志
   *
   * @param loginLog - 登录日志实体
   * @returns Promise<void>
   */
  async save(loginLog: LoginLogEntity): Promise<void> {
    const loginLogData = {
      userId: loginLog.userId,
      username: loginLog.username,
      domain: loginLog.domain,
      loginTime: new Date(),
      ip: loginLog.ip,
      port: loginLog.port,
      address: loginLog.address,
      userAgent: loginLog.userAgent,
      requestId: loginLog.requestId,
      type: loginLog.type,
      createdAt: new Date(),
      createdBy: loginLog.userId,
    };
    const newLoginLog = this.em.create('SysLoginLog', loginLogData);
    await this.em.persistAndFlush(newLoginLog);
  }
}
