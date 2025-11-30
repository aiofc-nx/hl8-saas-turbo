import { IQuery } from '@nestjs/cqrs';

import { PaginationParams } from '@hl8/rest';

/**
 * 分页查询操作日志查询对象
 *
 * @description 用于分页查询操作日志的查询对象，继承自分页参数基类。
 * 支持按用户名、域名、模块名、HTTP方法等条件进行筛选，遵循CQRS模式的查询对象规范。
 *
 * @example
 * ```typescript
 * const query = new PageOperationLogsQuery({
 *   page: 1,
 *   pageSize: 10,
 *   username: 'john.doe',
 *   domain: 'example.com',
 *   moduleName: 'user-management',
 *   method: 'POST'
 * });
 * ```
 */
export class PageOperationLogsQuery extends PaginationParams implements IQuery {
  /** 用户名，用于筛选特定用户的操作日志 */
  readonly username?: string;

  /** 域名，用于筛选特定域名的操作日志 */
  readonly domain?: string;

  /** 模块名称，用于筛选特定功能模块的操作日志 */
  readonly moduleName?: string;

  /** HTTP方法，用于筛选特定HTTP方法的操作日志（如 GET、POST、PUT、DELETE） */
  readonly method?: string;

  /**
   * 创建分页查询操作日志查询对象
   *
   * @param options - 查询选项，包含分页参数和筛选条件
   */
  constructor(options: PageOperationLogsQuery) {
    super();
    Object.assign(this, options);
  }
}
