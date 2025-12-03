import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';

import { PaginationParams } from '@hl8/rest';

import { ModelConfigStatus } from '@/infra/entities/casbin-model-config.entity';

/**
 * 模型配置版本分页查询数据传输对象
 *
 * @description
 * 用于分页查询模型配置版本列表的数据传输对象，继承自 PaginationParams，支持按状态筛选。
 */
export class PageModelVersionsDto extends PaginationParams {
  /**
   * 状态
   *
   * @description 用于按状态筛选版本，可选值：draft、active、archived，可选
   */
  @ApiProperty({
    required: false,
    enum: ModelConfigStatus,
    example: ModelConfigStatus.DRAFT,
  })
  @IsOptional()
  @IsEnum(ModelConfigStatus, { message: 'status must be a valid enum value' })
  status?: ModelConfigStatus;
}
