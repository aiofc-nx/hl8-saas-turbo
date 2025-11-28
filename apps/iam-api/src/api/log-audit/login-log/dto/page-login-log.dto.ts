import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

import { PaginationParams } from '@hl8/rest';

/**
 * 登录日志分页查询数据传输对象
 *
 * @description
 * 用于分页查询登录日志列表的数据传输对象，继承自 PaginationParams，支持按用户名、域、地址和登录类型筛选。
 */
export class PageLoginLogsQueryDto extends PaginationParams {
  /**
   * 用户名
   *
   * @description 用于按用户名筛选登录日志，可选
   */
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString({ message: 'username must be a string' })
  @IsNotEmpty({ message: 'username cannot be empty' })
  username?: string;

  /**
   * 域
   *
   * @description 用于按域筛选登录日志，可选
   */
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString({ message: 'domain must be a string' })
  @IsNotEmpty({ message: 'domain cannot be empty' })
  domain?: string;

  /**
   * IP 地址
   *
   * @description 用于按 IP 地址筛选登录日志，可选
   */
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString({ message: 'address must be a string' })
  @IsNotEmpty({ message: 'address cannot be empty' })
  address?: string;

  /**
   * 登录类型
   *
   * @description 用于按登录类型筛选登录日志，例如：password（密码登录）、token（令牌登录），可选
   */
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString({ message: 'type must be a string' })
  @IsNotEmpty({ message: 'type cannot be empty' })
  type?: string;
}
