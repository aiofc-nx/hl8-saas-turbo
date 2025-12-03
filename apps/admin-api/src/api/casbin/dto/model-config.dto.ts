import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

/**
 * 模型配置草稿创建数据传输对象
 *
 * @description 用于创建模型配置草稿的数据传输对象
 */
export class ModelDraftCreateDto {
  @ApiProperty({
    description: '模型配置内容（完整的 model.conf 文本）',
    example: '[request_definition]\nr = sub, obj, act\n...',
  })
  @IsNotEmpty({ message: 'content cannot be empty' })
  @IsString({ message: 'content must be a string' })
  content!: string;

  @ApiProperty({
    description: '备注说明',
    example: '修复权限匹配逻辑',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'remark must be a string' })
  remark?: string;
}

/**
 * 模型配置草稿更新数据传输对象
 *
 * @description 用于更新模型配置草稿的数据传输对象
 */
export class ModelDraftUpdateDto {
  @ApiProperty({
    description: '模型配置内容（完整的 model.conf 文本）',
    example: '[request_definition]\nr = sub, obj, act\n...',
  })
  @IsNotEmpty({ message: 'content cannot be empty' })
  @IsString({ message: 'content must be a string' })
  content!: string;

  @ApiProperty({
    description: '备注说明',
    example: '修复权限匹配逻辑',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'remark must be a string' })
  remark?: string;
}
