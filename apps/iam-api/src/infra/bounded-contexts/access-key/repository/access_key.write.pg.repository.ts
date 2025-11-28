import { EntityManager } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';

import { AccessKey } from '@/lib/bounded-contexts/access-key/domain/access_key.model';
import type { AccessKeyWriteRepoPort } from '@/lib/bounded-contexts/access-key/ports/access_key.write.repo-port';

/**
 * 访问密钥写入仓储实现
 *
 * @description
 * 使用 MikroORM EntityManager 实现访问密钥数据的写入操作。
 * 该实现遵循端口适配器模式，实现了 AccessKeyWriteRepoPort 接口。
 *
 * @implements {AccessKeyWriteRepoPort}
 */
@Injectable()
export class AccessKeyWritePostgresRepository
  implements AccessKeyWriteRepoPort
{
  /**
   * 构造函数
   *
   * @param em - MikroORM 实体管理器，用于数据库操作
   */
  constructor(private readonly em: EntityManager) {}

  /**
   * 根据 ID 删除访问密钥
   *
   * @description 从数据库中删除指定 ID 的访问密钥记录
   *
   * @param id - 要删除的访问密钥的唯一标识符
   * @returns Promise<void>
   *
   * @throws {Error} 当删除操作失败时抛出异常
   */
  async deleteById(id: string): Promise<void> {
    await this.em.nativeDelete('SysAccessKey', { id });
  }

  /**
   * 保存访问密钥
   *
   * @description
   * 保存或创建访问密钥到数据库。如果是新记录则创建，如果是已存在的记录则更新。
   *
   * @param accessKey - 要保存的访问密钥聚合根
   * @returns Promise<void>
   *
   * @throws {Error} 当保存操作失败时抛出异常
   */
  async save(accessKey: AccessKey): Promise<void> {
    const accessKeyData = { ...accessKey };
    const newAccessKey = this.em.create('SysAccessKey', accessKeyData);
    await this.em.persistAndFlush(newAccessKey);
  }
}
