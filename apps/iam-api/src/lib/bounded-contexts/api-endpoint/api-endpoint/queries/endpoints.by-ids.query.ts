import { IQuery } from '@nestjs/cqrs';

/**
 * 根据 ID 列表查询端点
 *
 * @description
 * CQRS 查询对象，用于根据端点 ID 列表批量查询 API 端点信息。
 * 通常用于权限分配时获取指定的端点详情。
 *
 * @implements {IQuery}
 */
export class FindEndpointsByIdsQuery implements IQuery {
  /**
   * 构造函数
   *
   * @param ids - 要查询的端点 ID 数组
   */
  constructor(readonly ids: string[]) {}
}
