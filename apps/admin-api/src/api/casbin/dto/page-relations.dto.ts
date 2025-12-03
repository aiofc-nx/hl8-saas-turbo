import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

import { PaginationParams } from '@hl8/rest';

/**
 * 角色继承关系分页查询数据传输对象
 *
 * @description
 * 用于分页查询角色继承关系列表的数据传输对象，继承自 PaginationParams，支持按子主体、父角色、域等筛选。
 */
export class PageRelationsDto extends PaginationParams {
  /**
   * 子主体（用户 ID 或子角色编码）
   *
   * @description 用于按子主体模糊查询关系，可选
   */
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString({ message: 'childSubject must be a string' })
  childSubject?: string;

  /**
   * 父角色编码
   *
   * @description 用于按父角色模糊查询关系，可选
   */
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString({ message: 'parentRole must be a string' })
  parentRole?: string;

  /**
   * 域（Domain）
   *
   * @description 用于按域筛选关系，可选
   */
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString({ message: 'domain must be a string' })
  domain?: string;
}
