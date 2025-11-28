import { EntityManager, FilterQuery } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';

import type { DomainProperties } from '@/lib/bounded-contexts/iam/domain/domain/domain.read.model';
import type { DomainReadRepoPort } from '@/lib/bounded-contexts/iam/domain/ports/domain.read.repo-port';
import { PageDomainsQuery } from '@/lib/bounded-contexts/iam/domain/queries/page-domains.query';

import { PaginationResult } from '@hl8/rest';

/**
 * Domain 读取仓储实现
 *
 * @description 使用 MikroORM EntityManager 实现 Domain 数据的读取操作
 */
@Injectable()
export class DomainReadRepository implements DomainReadRepoPort {
  constructor(private readonly em: EntityManager) {}

  /**
   * 根据 ID 获取 Domain
   *
   * @param id - Domain ID
   * @returns Domain 属性或 null
   */
  async getDomainById(id: string): Promise<Readonly<DomainProperties> | null> {
    const domain = await this.em.findOne('SysDomain', {
      id,
    } as FilterQuery<any>);
    return domain as Readonly<DomainProperties> | null;
  }

  /**
   * 分页查询 Domain
   *
   * @param query - 分页查询参数
   * @returns 分页结果
   */
  async pageDomains(
    query: PageDomainsQuery,
  ): Promise<PaginationResult<DomainProperties>> {
    const where: FilterQuery<any> = {};

    if (query.name) {
      where.name = { $like: `%${query.name}%` };
    }

    if (query.status) {
      where.status = query.status;
    }

    const [domains, total] = await this.em.findAndCount('SysDomain', where, {
      limit: query.size,
      offset: (query.current - 1) * query.size,
      orderBy: [{ createdAt: 'DESC' }],
    });

    return new PaginationResult<DomainProperties>(
      query.current,
      query.size,
      total,
      domains as DomainProperties[],
    );
  }

  /**
   * 根据代码获取 Domain
   *
   * @param code - Domain 代码
   * @returns Domain 属性或 null
   */
  async getDomainByCode(
    code: string,
  ): Promise<Readonly<DomainProperties> | null> {
    const domain = await this.em.findOne('SysDomain', {
      code,
    } as FilterQuery<any>);
    return domain as Readonly<DomainProperties> | null;
  }
}
