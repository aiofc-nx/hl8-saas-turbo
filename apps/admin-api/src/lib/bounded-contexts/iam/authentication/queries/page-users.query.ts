import { Status } from '@/lib/shared/enums/status.enum';
import { IQuery } from '@nestjs/cqrs';

import { PaginationParams } from '@hl8/rest';

/**
 * 用户分页查询
 *
 * @description
 * CQRS 查询对象，用于分页查询用户列表。
 * 支持按用户名、昵称和状态筛选，继承自 PaginationParams 提供分页功能。
 *
 * @extends {PaginationParams}
 * @implements {IQuery}
 */
export class PageUsersQuery extends PaginationParams implements IQuery {
  /**
   * 用户名
   *
   * @description 用于按用户名模糊查询用户，可选
   */
  readonly username?: string;

  /**
   * 昵称
   *
   * @description 用于按昵称模糊查询用户，可选
   */
  readonly nickName?: string;

  /**
   * 状态
   *
   * @description 用于按状态筛选用户，可选值：ENABLED（启用）、DISABLED（禁用），可选
   */
  readonly status?: Status;

  /**
   * 构造函数
   *
   * @param options - 查询选项，包含分页参数、用户名、昵称和状态筛选条件
   */
  constructor(options: PageUsersQuery) {
    super();
    Object.assign(this, options);
  }
}
