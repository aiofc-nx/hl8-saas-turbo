import { IQuery } from '@nestjs/cqrs';

import { PaginationParams } from '@hl8/rest';

/**
 * 分页查询登录日志查询对象
 *
 * @description 用于分页查询登录日志的查询对象，继承自分页参数基类。
 * 支持按用户名、域名、地址、登录类型等条件进行筛选，遵循CQRS模式的查询对象规范。
 *
 * @example
 * ```typescript
 * const query = new PageLoginLogsQuery({
 *   page: 1,
 *   pageSize: 10,
 *   username: 'john.doe',
 *   domain: 'example.com',
 *   address: '北京市',
 *   type: 'success'
 * });
 * ```
 */
export class PageLoginLogsQuery extends PaginationParams implements IQuery {
  /** 用户名，用于筛选特定用户的登录日志 */
  readonly username?: string;

  /** 域名，用于筛选特定域名的登录日志 */
  readonly domain?: string;

  /** 地址，用于筛选特定地理位置的登录日志 */
  readonly address?: string;

  /** 登录类型，用于筛选特定类型的登录日志（如 'success'、'failure'） */
  readonly type?: string;

  /**
   * 创建分页查询登录日志查询对象
   *
   * @param options - 查询选项，包含分页参数和筛选条件
   */
  constructor(options: PageLoginLogsQuery) {
    super();
    Object.assign(this, options);
  }
}
