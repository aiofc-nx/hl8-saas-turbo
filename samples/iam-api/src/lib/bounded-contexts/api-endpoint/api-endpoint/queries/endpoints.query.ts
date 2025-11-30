import { IQuery } from '@nestjs/cqrs';

/**
 * 端点查询
 *
 * @description
 * CQRS 查询对象，用于查询所有需要权限控制的 API 端点。
 * 该查询返回树形结构的端点列表，按控制器分组。
 *
 * @implements {IQuery}
 */
export class EndpointsQuery implements IQuery {
  /**
   * 构造函数
   *
   * @description 创建端点查询实例，无需参数
   */
  constructor() {}
}
