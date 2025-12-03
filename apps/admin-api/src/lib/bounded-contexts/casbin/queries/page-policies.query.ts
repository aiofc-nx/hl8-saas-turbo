import { IQuery } from '@nestjs/cqrs';

import { PaginationParams } from '@hl8/rest';

import { PolicyType } from '../domain/policy-rule.model';

/**
 * 策略规则分页查询
 *
 * @description
 * CQRS 查询对象，用于分页查询策略规则列表。
 * 支持按主体、资源、操作、策略类型等筛选，继承自 PaginationParams 提供分页功能。
 *
 * @extends {PaginationParams}
 * @implements {IQuery}
 */
export class PagePoliciesQuery extends PaginationParams implements IQuery {
  /**
   * 策略类型
   *
   * @description 用于按策略类型筛选，可选值：'p'（策略）、'g'（角色继承），可选
   */
  readonly ptype?: PolicyType;

  /**
   * 主体（Subject）
   *
   * @description 用于按主体模糊查询策略，可选
   */
  readonly subject?: string;

  /**
   * 资源（Object）
   *
   * @description 用于按资源模糊查询策略，可选
   */
  readonly object?: string;

  /**
   * 操作（Action）
   *
   * @description 用于按操作模糊查询策略，可选
   */
  readonly action?: string;

  /**
   * 域（Domain）
   *
   * @description 用于按域筛选策略，可选
   */
  readonly domain?: string;

  /**
   * 构造函数
   *
   * @param options - 查询选项，包含分页参数、策略类型、主体、资源、操作、域等筛选条件
   */
  constructor(options: PagePoliciesQuery) {
    super();
    Object.assign(this, options);
  }
}
