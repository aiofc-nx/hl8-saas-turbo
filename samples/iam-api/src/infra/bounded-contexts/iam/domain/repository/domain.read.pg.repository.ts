import { EntityManager, FilterQuery } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';

import type { DomainProperties } from '@/lib/bounded-contexts/iam/domain/domain/domain.read.model';
import type { DomainReadRepoPort } from '@/lib/bounded-contexts/iam/domain/ports/domain.read.repo-port';
import { PageDomainsQuery } from '@/lib/bounded-contexts/iam/domain/queries/page-domains.query';

import { PaginationResult } from '@hl8/rest';

/**
 * 域读取仓储实现
 *
 * @description
 * 使用 MikroORM EntityManager 实现域数据的读取操作。
 * 该实现遵循端口适配器模式，实现了 DomainReadRepoPort 接口。
 *
 * @implements {DomainReadRepoPort}
 */
@Injectable()
export class DomainReadRepository implements DomainReadRepoPort {
  /**
   * 构造函数
   *
   * @param em - MikroORM 实体管理器，用于数据库操作
   */
  constructor(private readonly em: EntityManager) {}

  /**
   * 根据 ID 获取域
   *
   * @description 从数据库中查询指定 ID 的域信息
   *
   * @param id - 域的唯一标识符
   * @returns 返回域属性对象，如果不存在则返回 null
   */
  async getDomainById(id: string): Promise<Readonly<DomainProperties> | null> {
    const domain = await this.em.findOne('SysDomain', {
      id,
    } as FilterQuery<any>);
    return domain as Readonly<DomainProperties> | null;
  }

  /**
   * 分页查询域
   *
   * @description
   * 根据查询条件分页查询域列表，支持按名称和状态筛选。
   * 结果按创建时间倒序排列。
   *
   * @param query - 分页查询参数，包含页码、页大小、名称、状态等筛选条件
   * @returns 返回分页结果，包含域列表和分页信息
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
   * 根据代码获取域
   *
   * @description 从数据库中查询指定代码的域信息。域代码是域的唯一标识符。
   *
   * @param code - 域的唯一代码
   * @returns 返回域属性对象，如果不存在则返回 null
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
