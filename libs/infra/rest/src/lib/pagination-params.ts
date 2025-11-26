import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

/**
 * 分页参数类
 *
 * @description 定义分页查询的参数，包括当前页码和每页数量
 *
 * @class PaginationParams
 */
export class PaginationParams {
  /**
   * 当前页码
   *
   * @description 分页查询的当前页码，最小值为 1，默认为 1
   */
  @ApiProperty({
    description: 'Current page number of the pagination',
    minimum: 1,
    default: 1,
  })
  @Min(1)
  @IsInt()
  @Expose()
  @IsOptional({ always: true })
  @Transform(({ value: val }) => (val ? Number.parseInt(val) : 1), {
    toClassOnly: true,
  })
  public readonly current: number;

  /**
   * 每页数量
   *
   * @description 每页返回的记录数，最小值为 1，最大值为 100，默认为 10
   */
  @ApiProperty({
    description: 'Number of items per page',
    minimum: 1,
    maximum: 100,
    default: 10,
  })
  @Min(1)
  @Max(100)
  @IsInt()
  @IsOptional({ always: true })
  @Expose()
  @Transform(({ value: val }) => (val ? Number.parseInt(val) : 10), {
    toClassOnly: true,
  })
  public readonly size: number;
}
