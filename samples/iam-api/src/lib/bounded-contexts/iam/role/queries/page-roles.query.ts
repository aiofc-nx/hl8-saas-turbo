import { IQuery } from '@nestjs/cqrs';
import { Status } from '../../../../shared/enums/status.enum';

import { PaginationParams } from '@hl8/rest';

/**
 * 角色分页查询
 *
 * @description
 * CQRS 查询对象，用于分页查询角色列表。
 * 支持按角色代码、名称和状态筛选，继承自 PaginationParams 提供分页功能。
 *
 * @extends {PaginationParams}
 * @implements {IQuery}
 */
export class PageRolesQuery extends PaginationParams implements IQuery {
  /**
   * 角色代码
   *
   * @description 用于按角色代码模糊查询角色，可选
   */
  readonly code?: string;

  /**
   * 角色名称
   *
   * @description 用于按角色名称模糊查询角色，可选
   */
  readonly name?: string;

  /**
   * 状态
   *
   * @description 用于按状态筛选角色，可选值：ENABLED（启用）、DISABLED（禁用），可选
   */
  readonly status?: Status;

  /**
   * 构造函数
   *
   * @param options - 查询选项，包含分页参数、角色代码、名称和状态筛选条件
   */
  constructor(options: PageRolesQuery) {
    super();
    Object.assign(this, options);
  }
}
