import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { CasbinModelReadRepoPortToken } from '../../constants';
import { CasbinModelConfigProperties } from '../../domain/casbin-model.model';
import type { CasbinModelReadRepoPort } from '../../ports/casbin-model.repo-port';
import { ModelVersionDetailQuery } from '../../queries/model-version-detail.query';

/**
 * 模型配置版本详情查询处理器
 *
 * @description
 * 处理模型配置版本详情查询命令，从仓储中获取指定版本的详细信息。
 *
 * @implements {IQueryHandler<ModelVersionDetailQuery, CasbinModelConfigProperties | null>}
 */
@QueryHandler(ModelVersionDetailQuery)
export class ModelVersionDetailQueryHandler
  implements
    IQueryHandler<ModelVersionDetailQuery, CasbinModelConfigProperties | null>
{
  /**
   * Casbin 模型配置读取仓储
   * 通过依赖注入获取，用于查询模型配置数据
   */
  @Inject(CasbinModelReadRepoPortToken)
  private readonly repository: CasbinModelReadRepoPort;

  /**
   * 执行详情查询
   *
   * @param query - 详情查询对象
   * @returns 返回模型配置属性对象，如果不存在则返回 null
   */
  async execute(
    query: ModelVersionDetailQuery,
  ): Promise<CasbinModelConfigProperties | null> {
    return this.repository.getModelConfigById(query.id);
  }
}
