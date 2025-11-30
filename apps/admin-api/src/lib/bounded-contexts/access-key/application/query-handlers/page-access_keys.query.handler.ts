import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { PaginationResult } from '@hl8/rest';

import { AccessKeyReadRepoPortToken } from '../../constants';
import { AccessKeyReadModel } from '../../domain/access_key.read.model';
import type { AccessKeyReadRepoPort } from '../../ports/access_key.read.repo-port';
import { PageAccessKeysQuery } from '../../queries/page-access_key.query';

/**
 * 访问密钥分页查询处理器
 *
 * @description
 * 处理 PageAccessKeysQuery 查询，负责分页查询访问密钥列表。
 * 支持按域和状态筛选，返回分页结果。
 *
 * @implements {IQueryHandler<PageAccessKeysQuery, PaginationResult<AccessKeyReadModel>>}
 */
@QueryHandler(PageAccessKeysQuery)
export class PageAccessKeysQueryHandler
  implements
    IQueryHandler<PageAccessKeysQuery, PaginationResult<AccessKeyReadModel>>
{
  /**
   * 访问密钥读取仓储端口
   *
   * @description 用于查询访问密钥的仓储接口
   */
  @Inject(AccessKeyReadRepoPortToken)
  private readonly repository: AccessKeyReadRepoPort;

  /**
   * 执行分页查询访问密钥
   *
   * @description
   * 根据查询条件分页查询访问密钥列表，支持按域和状态筛选。
   *
   * @param query - 分页查询对象，包含分页参数、域和状态筛选条件
   * @returns 返回分页结果，包含访问密钥列表和分页信息
   */
  async execute(
    query: PageAccessKeysQuery,
  ): Promise<PaginationResult<AccessKeyReadModel>> {
    return this.repository.pageAccessKeys(query);
  }
}
