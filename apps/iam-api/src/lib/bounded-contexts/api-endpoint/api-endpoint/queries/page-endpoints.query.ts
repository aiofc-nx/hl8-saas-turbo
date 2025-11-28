import { IQuery } from '@nestjs/cqrs';

import { PaginationParams } from '@hl8/rest';

/**
 * 端点分页查询
 *
 * @description
 * CQRS 查询对象，用于分页查询 API 端点列表。
 * 支持按路径、HTTP 方法、操作和资源筛选，继承自 PaginationParams 提供分页功能。
 *
 * @extends {PaginationParams}
 * @implements {IQuery}
 */
export class PageEndpointsQuery extends PaginationParams implements IQuery {
  /**
   * 路径
   *
   * @description 用于按 API 路径模糊查询端点，可选
   */
  readonly path?: string;

  /**
   * HTTP 方法
   *
   * @description 用于按 HTTP 方法筛选端点，可选值：GET、POST、PUT、DELETE 等，可选
   */
  readonly method?: string;

  /**
   * 操作
   *
   * @description 用于按操作类型筛选端点，例如：read、write、delete，可选
   */
  readonly action?: string;

  /**
   * 资源
   *
   * @description 用于按资源类型筛选端点，例如：user、role、domain，可选
   */
  readonly resource?: string;

  /**
   * 构造函数
   *
   * @param options - 查询选项，包含分页参数、路径、方法、操作、资源等筛选条件
   */
  constructor(options: PageEndpointsQuery) {
    super();
    Object.assign(this, options);
  }
}
