import { IQuery } from '@nestjs/cqrs';

import { PaginationParams } from '@hl8/rest';

import { ModelConfigStatus } from '@/infra/entities/casbin-model-config.entity';

/**
 * 模型配置版本分页查询
 *
 * @description
 * CQRS 查询对象，用于分页查询模型配置版本列表。
 * 支持按状态筛选，继承自 PaginationParams 提供分页功能。
 *
 * @extends {PaginationParams}
 * @implements {IQuery}
 */
export class PageModelVersionsQuery extends PaginationParams implements IQuery {
  /**
   * 状态
   *
   * @description 用于按状态筛选版本，可选值：draft、active、archived，可选
   */
  readonly status?: ModelConfigStatus;

  /**
   * 构造函数
   *
   * @param options - 查询选项，包含分页参数和状态筛选条件
   */
  constructor(options: PageModelVersionsQuery) {
    super();
    Object.assign(this, options);
  }
}
