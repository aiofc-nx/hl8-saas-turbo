import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

import { PaginationParams } from '@hl8/rest';

/**
 * API 端点分页查询数据传输对象
 *
 * @description
 * 用于分页查询 API 端点列表的数据传输对象，继承自 PaginationParams，支持按路径、HTTP 方法、操作和资源筛选。
 */
export class PageEndpointsQueryDto extends PaginationParams {
  /**
   * 路径
   *
   * @description 用于按 API 路径模糊查询端点，可选
   */
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString({ message: 'code must be a string' })
  @IsNotEmpty({ message: 'code cannot be empty' })
  path?: string;

  /**
   * HTTP 方法
   *
   * @description 用于按 HTTP 方法筛选端点，可选值：GET、POST、PUT、DELETE 等，可选
   */
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString({ message: 'name must be a string' })
  @IsNotEmpty({ message: 'name cannot be empty' })
  method?: string;

  /**
   * 操作
   *
   * @description 用于按操作类型筛选端点，例如：read、write、delete，可选
   */
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString({ message: 'action must be a string' })
  @IsNotEmpty({ message: 'action cannot be empty' })
  action?: string;

  /**
   * 资源
   *
   * @description 用于按资源类型筛选端点，例如：user、role、domain，可选
   */
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString({ message: 'resources must be a string' })
  @IsNotEmpty({ message: 'resources cannot be empty' })
  resource?: string;
}
