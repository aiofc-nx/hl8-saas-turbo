import { Status } from '@/lib/shared/enums/status.enum';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

import { PaginationParams } from '@hl8/rest';

/**
 * 域分页查询数据传输对象
 *
 * @description
 * 用于分页查询域列表的数据传输对象，继承自 PaginationParams，支持按名称和状态筛选。
 */
export class PageDomainsDto extends PaginationParams {
  /**
   * 域名称
   *
   * @description 用于按名称模糊查询域，可选
   */
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString({ message: 'name must be a string' })
  @IsNotEmpty({ message: 'name cannot be empty' })
  name?: string;

  /**
   * 状态
   *
   * @description 用于按状态筛选域，可选值：ACTIVE（激活）、INACTIVE（禁用），可选
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
