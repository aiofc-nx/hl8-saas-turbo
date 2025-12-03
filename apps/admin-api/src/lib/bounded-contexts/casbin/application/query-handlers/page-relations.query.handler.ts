import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { PaginationResult } from '@hl8/rest';

import { CasbinPolicyReadRepoPortToken } from '../../constants';
import type { RoleRelationProperties } from '../../domain/policy-rule.model';
import type { CasbinPolicyReadRepoPort } from '../../ports/casbin-policy.repo-port';
import { PageRelationsQuery } from '../../queries/page-relations.query';

/**
 * 角色继承关系分页查询处理器
 *
 * @description
 * 处理角色继承关系分页查询命令，从仓储中获取分页的角色继承关系数据。
 *
 * @implements {IQueryHandler<PageRelationsQuery, PaginationResult<RoleRelationProperties>>}
 */
@QueryHandler(PageRelationsQuery)
export class PageRelationsQueryHandler
  implements
    IQueryHandler<PageRelationsQuery, PaginationResult<RoleRelationProperties>>
{
  /**
   * Casbin 策略读取仓储
   * 通过依赖注入获取，用于查询角色继承关系数据
   */
  @Inject(CasbinPolicyReadRepoPortToken)
  private readonly repository: CasbinPolicyReadRepoPort;

  /**
   * 执行分页查询
   *
   * @param query - 分页查询对象
   * @returns 返回分页结果，包含角色继承关系列表和分页信息
   */
  async execute(
    query: PageRelationsQuery,
  ): Promise<PaginationResult<RoleRelationProperties>> {
    return this.repository.pageRelations(query);
  }
}
