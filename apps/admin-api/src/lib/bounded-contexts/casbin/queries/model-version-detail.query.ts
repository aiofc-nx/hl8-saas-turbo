import { IQuery } from '@nestjs/cqrs';

/**
 * 模型配置版本详情查询
 *
 * @description
 * CQRS 查询对象，用于查询指定版本的模型配置详情。
 *
 * @implements {IQuery}
 */
export class ModelVersionDetailQuery implements IQuery {
  /**
   * 版本 ID
   *
   * @description 要查询的模型配置版本 ID
   */
  readonly id: number;

  /**
   * 构造函数
   *
   * @param id - 版本 ID
   */
  constructor(id: number) {
    this.id = id;
  }
}
