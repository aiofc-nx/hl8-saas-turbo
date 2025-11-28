import { EntityManager } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';

import { AccessKey } from '@/lib/bounded-contexts/access-key/domain/access_key.model';
import type { AccessKeyWriteRepoPort } from '@/lib/bounded-contexts/access-key/ports/access_key.write.repo-port';

/**
 * AccessKey 写入仓储实现
 *
 * @description 使用 MikroORM EntityManager 实现 AccessKey 数据的写入操作
 */
@Injectable()
export class AccessKeyWritePostgresRepository
  implements AccessKeyWriteRepoPort
{
  constructor(private readonly em: EntityManager) {}

  /**
   * 根据 ID 删除 AccessKey
   *
   * @param id - AccessKey ID
   * @returns Promise<void>
   */
  async deleteById(id: string): Promise<void> {
    await this.em.nativeDelete('SysAccessKey', { id });
  }

  /**
   * 保存 AccessKey
   *
   * @param accessKey - AccessKey 聚合根
   * @returns Promise<void>
   */
  async save(accessKey: AccessKey): Promise<void> {
    const accessKeyData = { ...accessKey };
    const newAccessKey = this.em.create('SysAccessKey', accessKeyData);
    await this.em.persistAndFlush(newAccessKey);
  }
}
