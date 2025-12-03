import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { CasbinModelReadRepoPortToken } from '../../constants';
import { ModelVersionDiffDto } from '../../domain/casbin-model.model';
import type { CasbinModelReadRepoPort } from '../../ports/casbin-model.repo-port';
import { ModelVersionDiffQuery } from '../../queries/model-version-diff.query';

/**
 * 简单的行差异计算函数
 *
 * @description 计算两个文本之间的行级差异
 *
 * @param source - 源文本
 * @param target - 目标文本
 * @returns 差异文本（统一差异格式）
 */
function calculateDiff(source: string, target: string): string {
  const sourceLines = source.split('\n');
  const targetLines = target.split('\n');

  const diff: string[] = [];
  let sourceIndex = 0;
  let targetIndex = 0;

  while (sourceIndex < sourceLines.length || targetIndex < targetLines.length) {
    if (sourceIndex >= sourceLines.length) {
      // 源文本已结束，剩余都是新增
      diff.push(`+ ${targetLines[targetIndex]}`);
      targetIndex++;
    } else if (targetIndex >= targetLines.length) {
      // 目标文本已结束，剩余都是删除
      diff.push(`- ${sourceLines[sourceIndex]}`);
      sourceIndex++;
    } else if (sourceLines[sourceIndex] === targetLines[targetIndex]) {
      // 行相同，保持不变
      diff.push(`  ${sourceLines[sourceIndex]}`);
      sourceIndex++;
      targetIndex++;
    } else {
      // 行不同，尝试查找匹配
      let found = false;
      for (let i = targetIndex + 1; i < targetLines.length; i++) {
        if (sourceLines[sourceIndex] === targetLines[i]) {
          // 在目标文本中找到匹配，中间的行都是新增
          for (let j = targetIndex; j < i; j++) {
            diff.push(`+ ${targetLines[j]}`);
          }
          targetIndex = i;
          found = true;
          break;
        }
      }

      if (!found) {
        // 未找到匹配，标记为删除
        diff.push(`- ${sourceLines[sourceIndex]}`);
        sourceIndex++;
      }
    }
  }

  return diff.join('\n');
}

/**
 * 模型配置版本差异查询处理器
 *
 * @description
 * 处理模型配置版本差异查询命令，计算两个版本之间的差异。
 *
 * @implements {IQueryHandler<ModelVersionDiffQuery, ModelVersionDiffDto>}
 */
@QueryHandler(ModelVersionDiffQuery)
export class ModelVersionDiffQueryHandler
  implements IQueryHandler<ModelVersionDiffQuery, ModelVersionDiffDto>
{
  /**
   * Casbin 模型配置读取仓储
   * 通过依赖注入获取，用于查询模型配置数据
   */
  @Inject(CasbinModelReadRepoPortToken)
  private readonly repository: CasbinModelReadRepoPort;

  /**
   * 执行差异查询
   *
   * @param query - 差异查询对象
   * @returns 返回版本差异 DTO
   */
  async execute(query: ModelVersionDiffQuery): Promise<ModelVersionDiffDto> {
    const sourceVersion = await this.repository.getModelConfigById(
      query.sourceVersionId,
    );
    const targetVersion = await this.repository.getModelConfigById(
      query.targetVersionId,
    );

    if (!sourceVersion || !targetVersion) {
      throw new Error('版本不存在');
    }

    // 计算差异
    const diffText = calculateDiff(
      sourceVersion.content,
      targetVersion.content,
    );

    return {
      sourceVersionId: query.sourceVersionId,
      targetVersionId: query.targetVersionId,
      diff: diffText,
    };
  }
}
