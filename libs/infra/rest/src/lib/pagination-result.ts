import { IQueryResult } from '@nestjs/cqrs';

/**
 * 分页结果类
 *
 * @description 封装分页查询的结果，包含当前页码、每页数量、总记录数和数据列表
 *
 * @class PaginationResult
 * @template T - 数据项类型
 * @implements {IQueryResult}
 */
export class PaginationResult<T> implements IQueryResult {
  /**
   * 当前页码
   *
   * @description 当前查询的页码，从 1 开始
   */
  public readonly current: number;

  /**
   * 每页数量
   *
   * @description 每页返回的记录数
   */
  public readonly size: number;

  /**
   * 总记录数
   *
   * @description 符合查询条件的总记录数
   */
  public readonly total: number;

  /**
   * 数据列表
   *
   * @description 当前页的数据记录列表
   */
  public readonly records: T[];

  /**
   * 构造函数
   *
   * @param {number} current - 当前页码
   * @param {number} size - 每页数量
   * @param {number} total - 总记录数
   * @param {T[]} records - 数据列表
   */
  constructor(current: number, size: number, total: number, records: T[]) {
    this.current = current;
    this.size = size;
    this.total = total;
    this.records = records;
  }
}
