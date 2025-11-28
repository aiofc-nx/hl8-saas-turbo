import { EntityManager, FilterQuery } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';

import type { LoginLogProperties } from '@/lib/bounded-contexts/log-audit/login-log/domain/login-log.read.model';
import type { LoginLogReadRepoPort } from '@/lib/bounded-contexts/log-audit/login-log/ports/login-log.read.repo-port';
import { PageLoginLogsQuery } from '@/lib/bounded-contexts/log-audit/login-log/queries/page-login-logs.query';

import { PaginationResult } from '@hl8/rest';

/**
 * LoginLog 读取仓储实现
 *
 * @description 使用 MikroORM EntityManager 实现 LoginLog 数据的读取操作
 */
@Injectable()
export class LoginLogReadRepository implements LoginLogReadRepoPort {
  constructor(private readonly em: EntityManager) {}

  /**
   * 分页查询登录日志
   *
   * @param query - 分页查询参数
   * @returns 分页结果
   */
  async pageLoginLogs(
    query: PageLoginLogsQuery,
  ): Promise<PaginationResult<LoginLogProperties>> {
    const where: FilterQuery<any> = {};

    if (query.username) {
      where.username = { $like: `%${query.username}%` };
    }

    if (query.domain) {
      where.domain = query.domain;
    }

    if (query.address) {
      where.address = { $like: `%${query.address}%` };
    }

    if (query.type) {
      where.type = query.type;
    }

    const [loginLogs, total] = await this.em.findAndCount(
      'SysLoginLog',
      where,
      {
        limit: query.size,
        offset: (query.current - 1) * query.size,
        orderBy: [{ loginTime: 'DESC' }],
      },
    );

    return new PaginationResult<LoginLogProperties>(
      query.current,
      query.size,
      total,
      loginLogs as LoginLogProperties[],
    );
  }
}
