import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { PaginationResult } from '@hl8/rest';

import { CasbinModelReadRepoPortToken } from '../../constants';
import { CasbinModelConfigProperties } from '../../domain/casbin-model.model';
import type { CasbinModelReadRepoPort } from '../../ports/casbin-model.repo-port';
import { PageModelVersionsQuery } from '../../queries/page-model-versions.query';

/**
 * 模型配置版本分页查询处理器
 *
 * @description
 * 处理模型配置版本分页查询命令，从仓储中获取分页的版本数据。
 *
 * @implements {IQueryHandler<PageModelVersionsQuery, PaginationResult<CasbinModelConfigProperties>>}
 */
@QueryHandler(PageModelVersionsQuery)
export class PageModelVersionsQueryHandler
  implements
    IQueryHandler<
      PageModelVersionsQuery,
      PaginationResult<CasbinModelConfigProperties>
    >
{
  /**
   * Casbin 模型配置读取仓储
   * 通过依赖注入获取，用于查询模型配置数据
   */
  @Inject(CasbinModelReadRepoPortToken)
  private readonly repository: CasbinModelReadRepoPort;

  /**
   * 执行分页查询
   *
   * @param query - 分页查询对象
   * @returns 返回分页结果，包含模型配置版本列表和分页信息
   */
  async execute(
    query: PageModelVersionsQuery,
  ): Promise<PaginationResult<CasbinModelConfigProperties>> {
    return this.repository.pageModelVersions(query);
  }
}
