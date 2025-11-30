import { Status } from '@/lib/shared/enums/status.enum';
import { IQuery } from '@nestjs/cqrs';

import { PaginationParams } from '@hl8/rest';

/**
 * 域分页查询
 *
 * @description
 * CQRS 查询对象，用于分页查询 Casbin 域列表。
 * 支持按名称和状态筛选，继承自 PaginationParams 提供分页功能。
 *
 * @extends {PaginationParams}
 * @implements {IQuery}
 */
export class PageDomainsQuery extends PaginationParams implements IQuery {
  /**
   * 域名称
   *
   * @description 用于按名称模糊查询域，可选
   */
  readonly name?: string;

  /**
   * 状态
   *
   * @description 用于按状态筛选域，可选值：ENABLED（启用）、DISABLED（禁用），可选
   */
  readonly status?: Status;

  /**
   * 构造函数
   *
   * @param options - 查询选项，包含分页参数、名称和状态筛选条件
   */
  constructor(options: PageDomainsQuery) {
    super();
    Object.assign(this, options);
  }
}
