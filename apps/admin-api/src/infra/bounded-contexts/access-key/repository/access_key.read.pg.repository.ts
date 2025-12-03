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
 * 访问密钥读取仓储实现
 *
 * @description
 * 使用 MikroORM EntityManager 实现访问密钥数据的读取操作。
 * 该实现遵循端口适配器模式，实现了 AccessKeyReadRepoPort 接口。
 *
 * @implements {AccessKeyReadRepoPort}
 */
@Injectable()
export class AccessKeyReadPostgresRepository implements AccessKeyReadRepoPort {
  /**
   * 构造函数
   *
   * @param em - MikroORM 实体管理器，用于数据库操作
   */
  constructor(private readonly em: EntityManager) {}

  /**
   * 分页查询访问密钥
   *
   * @description
   * 根据查询条件分页查询访问密钥列表，支持按域和状态筛选。
   * 返回的结果不包含敏感信息（AccessKeySecret）。
   *
   * @param query - 分页查询参数，包含页码、页大小、域和状态筛选条件
   * @returns 返回分页结果，包含访问密钥列表和分页信息
   */
  async pageAccessKeys(
    query: PageAccessKeysQuery,
  ): Promise<PaginationResult<AccessKeyReadModel>> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
   * 根据 ID 获取访问密钥
   *
   * @description 从数据库中查询指定 ID 的访问密钥，返回完整的属性信息
   *
   * @param id - 访问密钥的唯一标识符
   * @returns 返回访问密钥属性对象，如果不存在则返回 null
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
   * 查询所有访问密钥
   *
   * @description 查询数据库中所有访问密钥，返回完整的属性列表
   *
   * @returns 返回所有访问密钥的属性数组
   */
  async findAll(): Promise<AccessKeyProperties[]> {
    const accessKeys = await this.em.find(
      'SysAccessKey',
      {} as FilterQuery<any>,
    );
    return accessKeys as AccessKeyProperties[];
  }
}
