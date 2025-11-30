import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

import { PaginationParams } from '@hl8/rest';

/**
 * 操作日志分页查询数据传输对象
 *
 * @description
 * 用于分页查询操作日志列表的数据传输对象，继承自 PaginationParams，支持按用户名、域、模块名称和 HTTP 方法筛选。
 */
export class PageOperationLogsQueryDto extends PaginationParams {
  /**
   * 用户名
   *
   * @description 用于按用户名筛选操作日志，可选
   */
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString({ message: 'username must be a string' })
  @IsNotEmpty({ message: 'username cannot be empty' })
  username?: string;

  /**
   * 域
   *
   * @description 用于按域筛选操作日志，可选
   */
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString({ message: 'domain must be a string' })
  @IsNotEmpty({ message: 'domain cannot be empty' })
  domain?: string;

  /**
   * 模块名称
   *
   * @description 用于按模块名称筛选操作日志，例如：user、role、domain，可选
   */
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString({ message: 'moduleName must be a string' })
  @IsNotEmpty({ message: 'moduleName cannot be empty' })
  moduleName?: string;

  /**
   * HTTP 方法
   *
   * @description 用于按 HTTP 方法筛选操作日志，可选值：GET、POST、PUT、DELETE 等，可选
   */
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString({ message: 'method must be a string' })
  @IsNotEmpty({ message: 'method cannot be empty' })
  method?: string;
}
