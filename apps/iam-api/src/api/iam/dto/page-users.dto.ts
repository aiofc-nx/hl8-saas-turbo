import { Status } from '@/lib/shared/enums/status.enum';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

import { PaginationParams } from '@hl8/rest';

/**
 * 用户分页查询数据传输对象
 *
 * @description
 * 用于分页查询用户列表的数据传输对象，继承自 PaginationParams，支持按用户名、昵称和状态筛选。
 */
export class PageUsersDto extends PaginationParams {
  /**
   * 用户名
   *
   * @description 用于按用户名模糊查询用户，可选
   */
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString({ message: 'Username must be a string' })
  @IsNotEmpty({ message: 'Username cannot be empty' })
  username?: string;

  /**
   * 昵称
   *
   * @description 用于按昵称模糊查询用户，可选
   */
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString({ message: 'Nickname must be a string' })
  @IsNotEmpty({ message: 'Nickname cannot be empty' })
  nickName?: string;

  /**
   * 状态
   *
   * @description 用于按状态筛选用户，可选值：ACTIVE（激活）、INACTIVE（禁用），可选
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
