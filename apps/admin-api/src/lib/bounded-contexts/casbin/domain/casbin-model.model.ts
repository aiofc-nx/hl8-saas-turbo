import { ApiProperty } from '@nestjs/swagger';

import { ModelConfigStatus } from '@/infra/entities/casbin-model-config.entity';

/**
 * 模型配置属性
 *
 * @description 模型配置的领域模型属性
 */
export type CasbinModelConfigProperties = Readonly<{
  id: number;
  content: string;
  version: number;
  status: ModelConfigStatus;
  remark?: string;
  createdBy: string;
  createdAt: Date;
  approvedBy?: string;
  approvedAt?: Date;
}>;

/**
 * 模型配置 DTO
 *
 * @description 用于前端展示和 API 传输的模型配置数据对象
 */
export class CasbinModelConfigDto {
  @ApiProperty({ description: '模型配置 ID', example: 1 })
  id!: number;

  @ApiProperty({
    description: '模型配置内容（完整的 model.conf 文本）',
    example: '[request_definition]\nr = sub, obj, act\n...',
  })
  content!: string;

  @ApiProperty({ description: '版本号', example: 1 })
  version!: number;

  @ApiProperty({
    description: '状态',
    enum: ModelConfigStatus,
    example: ModelConfigStatus.ACTIVE,
  })
  status!: ModelConfigStatus;

  @ApiProperty({
    description: '备注说明',
    example: '修复权限匹配逻辑',
    required: false,
  })
  remark?: string;

  @ApiProperty({ description: '创建者用户 ID', example: 'user-123' })
  createdBy!: string;

  @ApiProperty({ description: '创建时间', example: '2024-01-01T00:00:00Z' })
  createdAt!: Date;

  @ApiProperty({
    description: '审批者用户 ID',
    example: 'admin-456',
    required: false,
  })
  approvedBy?: string;

  @ApiProperty({
    description: '审批时间',
    example: '2024-01-01T01:00:00Z',
    required: false,
  })
  approvedAt?: Date;
}

/**
 * 版本差异 DTO
 *
 * @description 用于展示两个版本之间的差异
 */
export class ModelVersionDiffDto {
  @ApiProperty({ description: '源版本 ID', example: 1 })
  sourceVersionId!: number;

  @ApiProperty({ description: '目标版本 ID', example: 2 })
  targetVersionId!: number;

  @ApiProperty({
    description: '差异内容（统一差异格式）',
    example: '--- source\n+++ target\n@@ -1,3 +1,3 @@\n...',
  })
  diff!: string;
}
