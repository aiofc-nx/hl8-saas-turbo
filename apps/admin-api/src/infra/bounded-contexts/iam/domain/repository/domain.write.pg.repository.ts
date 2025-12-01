import { EntityManager } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';

import { Domain } from '@/lib/bounded-contexts/iam/domain/domain/domain.model';
import type { DomainWriteRepoPort } from '@/lib/bounded-contexts/iam/domain/ports/domain.write.repo-port';

/**
 * 域写入仓储实现
 *
 * @description
 * 使用 MikroORM EntityManager 实现域数据的写入操作。
 * 该实现遵循端口适配器模式，实现了 DomainWriteRepoPort 接口。
 *
 * @implements {DomainWriteRepoPort}
 */
@Injectable()
export class DomainWriteRepository implements DomainWriteRepoPort {
  /**
   * 构造函数
   *
   * @param em - MikroORM 实体管理器，用于数据库操作
   */
  constructor(private readonly em: EntityManager) {}

  /**
   * 删除域
   *
   * @description 从数据库中删除指定的域记录
   *
   * @param domain - 要删除的域聚合根
   * @returns Promise<void>
   *
   * @throws {Error} 当删除操作失败时抛出异常
   */
  async delete(domain: Domain): Promise<void> {
    await this.em.nativeDelete('SysDomain', { id: domain.id });
  }

  /**
   * 保存域
   *
   * @description
   * 保存或创建域到数据库。如果是新记录则创建，如果是已存在的记录则更新。
   *
   * @param domain - 要保存的域聚合根
   * @returns Promise<void>
   *
   * @throws {Error} 当保存操作失败时抛出异常
   */
  async save(domain: Domain): Promise<void> {
    const domainData = { ...domain };
    const newDomain = this.em.create('SysDomain', domainData);
    await this.em.persistAndFlush(newDomain);
  }

  /**
   * 更新域
   *
   * @description 更新数据库中已存在的域记录
   *
   * @param domain - 要更新的域聚合根
   * @returns Promise<void>
   *
   * @throws {Error} 当更新操作失败时抛出异常
   */
  async update(domain: Domain): Promise<void> {
    const { id, createdAt, createdBy, ...updateData } = domain as any;
    await this.em.nativeUpdate('SysDomain', { id }, updateData);
  }
}
