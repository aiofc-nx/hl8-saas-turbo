import { IQuery } from '@nestjs/cqrs';

/**
 * 模型配置版本差异查询
 *
 * @description
 * CQRS 查询对象，用于查询两个版本之间的差异。
 *
 * @implements {IQuery}
 */
export class ModelVersionDiffQuery implements IQuery {
  /**
   * 源版本 ID
   *
   * @description 要比较的源版本 ID
   */
  readonly sourceVersionId: number;

  /**
   * 目标版本 ID
   *
   * @description 要比较的目标版本 ID
   */
  readonly targetVersionId: number;

  /**
   * 构造函数
   *
   * @param sourceVersionId - 源版本 ID
   * @param targetVersionId - 目标版本 ID
   */
  constructor(sourceVersionId: number, targetVersionId: number) {
    this.sourceVersionId = sourceVersionId;
    this.targetVersionId = targetVersionId;
  }
}
