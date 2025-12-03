import { IQuery } from '@nestjs/cqrs';

import { PaginationParams } from '@hl8/rest';

/**
 * 角色继承关系分页查询
 *
 * @description
 * CQRS 查询对象，用于分页查询角色继承关系列表。
 * 支持按子主体、父角色、域等筛选，继承自 PaginationParams 提供分页功能。
 *
 * @extends {PaginationParams}
 * @implements {IQuery}
 */
export class PageRelationsQuery extends PaginationParams implements IQuery {
  /**
   * 子主体（用户 ID 或子角色编码）
   *
   * @description 用于按子主体模糊查询关系，可选
   */
  readonly childSubject?: string;

  /**
   * 父角色编码
   *
   * @description 用于按父角色模糊查询关系，可选
   */
  readonly parentRole?: string;

  /**
   * 域（Domain）
   *
   * @description 用于按域筛选关系，可选
   */
  readonly domain?: string;

  /**
   * 构造函数
   *
   * @param options - 查询选项，包含分页参数、子主体、父角色、域等筛选条件
   */
  constructor(options: PageRelationsQuery) {
    super();
    Object.assign(this, options);
  }
}
