import { Status } from '@/lib/shared/enums/status.enum';
import { IQuery } from '@nestjs/cqrs';

import { PaginationParams } from '@hl8/rest';

/**
 * 访问密钥分页查询
 *
 * @description
 * CQRS 查询对象，用于分页查询访问密钥列表。
 * 支持按域和状态筛选，继承自 PaginationParams 提供分页功能。
 *
 * @extends {PaginationParams}
 * @implements {IQuery}
 */
export class PageAccessKeysQuery extends PaginationParams implements IQuery {
  /**
   * 域
   *
   * @description 用于按域筛选访问密钥，可选。非内置域用户只能查询自己域下的密钥
   */
  readonly domain?: string;

  /**
   * 状态
   *
   * @description 用于按状态筛选访问密钥，可选值：ENABLED（启用）、DISABLED（禁用），可选
   */
  readonly status?: Status;

  /**
   * 构造函数
   *
   * @param options - 查询选项，包含分页参数、域和状态筛选条件
   */
  constructor(options: PageAccessKeysQuery) {
    super();
    Object.assign(this, options);
  }
}
