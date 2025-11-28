import { EntityManager } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';

import { Domain } from '@/lib/bounded-contexts/iam/domain/domain/domain.model';
import type { DomainWriteRepoPort } from '@/lib/bounded-contexts/iam/domain/ports/domain.write.repo-port';

/**
 * Domain 写入仓储实现
 *
 * @description 使用 MikroORM EntityManager 实现 Domain 数据的写入操作
 */
@Injectable()
export class DomainWriteRepository implements DomainWriteRepoPort {
  constructor(private readonly em: EntityManager) {}

  /**
   * 删除 Domain
   *
   * @param domain - Domain 聚合根
   * @returns Promise<void>
   */
  async delete(domain: Domain): Promise<void> {
    await this.em.nativeDelete('SysDomain', { id: domain.id });
  }

  /**
   * 保存 Domain
   *
   * @param domain - Domain 聚合根
   * @returns Promise<void>
   */
  async save(domain: Domain): Promise<void> {
    const domainData = { ...domain };
    const newDomain = this.em.create('SysDomain', domainData);
    await this.em.persistAndFlush(newDomain);
  }

  /**
   * 更新 Domain
   *
   * @param domain - Domain 聚合根
   * @returns Promise<void>
   */
  async update(domain: Domain): Promise<void> {
    await this.em.nativeUpdate('SysDomain', { id: domain.id }, { ...domain });
  }
}
