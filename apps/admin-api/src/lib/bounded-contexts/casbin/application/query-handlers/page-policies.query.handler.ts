import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { PaginationResult } from '@hl8/rest';

import { CasbinPolicyReadRepoPortToken } from '../../constants';
import type { PolicyRuleProperties } from '../../domain/policy-rule.model';
import type { CasbinPolicyReadRepoPort } from '../../ports/casbin-policy.repo-port';
import { PagePoliciesQuery } from '../../queries/page-policies.query';

/**
 * 策略规则分页查询处理器
 *
 * @description
 * 处理策略规则分页查询命令，从仓储中获取分页的策略规则数据。
 *
 * @implements {IQueryHandler<PagePoliciesQuery, PaginationResult<PolicyRuleProperties>>}
 */
@QueryHandler(PagePoliciesQuery)
export class PagePoliciesQueryHandler
  implements
    IQueryHandler<PagePoliciesQuery, PaginationResult<PolicyRuleProperties>>
{
  /**
   * Casbin 策略读取仓储
   * 通过依赖注入获取，用于查询策略规则数据
   */
  @Inject(CasbinPolicyReadRepoPortToken)
  private readonly repository: CasbinPolicyReadRepoPort;

  /**
   * 执行分页查询
   *
   * @param query - 分页查询对象
   * @returns 返回分页结果，包含策略规则列表和分页信息
   */
  async execute(
    query: PagePoliciesQuery,
  ): Promise<PaginationResult<PolicyRuleProperties>> {
    return this.repository.pagePolicies(query);
  }
}
