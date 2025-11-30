import { Status } from '@/lib/shared/enums/status.enum';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

import { PaginationParams } from '@hl8/rest';

/**
 * 访问密钥分页查询数据传输对象
 *
 * @description
 * 用于分页查询访问密钥列表的数据传输对象，继承自 PaginationParams，支持按域和状态筛选。
 */
export class PageAccessKeysQueryDto extends PaginationParams {
  /**
   * 域
   *
   * @description 用于按域筛选访问密钥，可选。非内置域用户只能查询自己域下的密钥
   */
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString({ message: 'domain must be a string' })
  @IsNotEmpty({ message: 'domain cannot be empty' })
  domain?: string;

  /**
   * 状态
   *
   * @description 用于按状态筛选访问密钥，可选值：ACTIVE（激活）、INACTIVE（禁用），可选
   */
  @ApiProperty({
    required: false,
    enum: Object.values(Status),
    type: String,
  })
  @IsOptional()
  @IsEnum(Status, { message: 'Status must be a valid enum value' })
  status?: Status;
}
