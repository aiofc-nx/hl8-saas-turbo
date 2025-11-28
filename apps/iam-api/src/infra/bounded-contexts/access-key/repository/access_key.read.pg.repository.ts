import { EntityManager, FilterQuery } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';

import {
  AccessKeyProperties,
  AccessKeyReadModel,
} from '@/lib/bounded-contexts/access-key/domain/access_key.read.model';
import type { AccessKeyReadRepoPort } from '@/lib/bounded-contexts/access-key/ports/access_key.read.repo-port';
import { PageAccessKeysQuery } from '@/lib/bounded-contexts/access-key/queries/page-access_key.query';

import { PaginationResult } from '@hl8/rest';

/**
 * AccessKey 读取仓储实现
 *
 * @description 使用 MikroORM EntityManager 实现 AccessKey 数据的读取操作
 */
@Injectable()
export class AccessKeyReadPostgresRepository implements AccessKeyReadRepoPort {
  constructor(private readonly em: EntityManager) {}

  /**
   * 分页查询 AccessKey
   *
   * @param query - 分页查询参数
   * @returns 分页结果
   */
  async pageAccessKeys(
    query: PageAccessKeysQuery,
  ): Promise<PaginationResult<AccessKeyReadModel>> {
    const where: FilterQuery<any> = {};

    if (query.domain) {
      where.domain = { $like: `%${query.domain}%` };
    }

    if (query.status) {
      where.status = query.status;
    }

    const [accessKeys, total] = await this.em.findAndCount(
      'SysAccessKey',
      where,
      {
        limit: query.size,
        offset: (query.current - 1) * query.size,
        fields: [
          'id',
          'domain',
          'AccessKeyID',
          'status',
          'description',
          'createdAt',
          'createdBy',
        ],
      },
    );

    return new PaginationResult<AccessKeyReadModel>(
      query.current,
      query.size,
      total,
      accessKeys as AccessKeyReadModel[],
    );
  }

  /**
   * 根据 ID 获取 AccessKey
   *
   * @param id - AccessKey ID
   * @returns AccessKey 属性或 null
   */
  async getAccessKeyById(
    id: string,
  ): Promise<Readonly<AccessKeyProperties> | null> {
    const accessKey = await this.em.findOne('SysAccessKey', {
      id,
    } as FilterQuery<any>);
    return accessKey as Readonly<AccessKeyProperties> | null;
  }

  /**
   * 查询所有 AccessKey
   *
   * @returns AccessKey 属性列表
   */
  async findAll(): Promise<AccessKeyProperties[]> {
    const accessKeys = await this.em.find(
      'SysAccessKey',
      {} as FilterQuery<any>,
    );
    return accessKeys as AccessKeyProperties[];
  }
}
