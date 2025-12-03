import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';

import { PaginationParams } from '@hl8/rest';

import { PolicyType } from '@/lib/bounded-contexts/casbin/domain/policy-rule.model';

/**
 * 策略规则分页查询数据传输对象
 *
 * @description
 * 用于分页查询策略规则列表的数据传输对象，继承自 PaginationParams，支持按策略类型、主体、资源、操作、域等筛选。
 */
export class PagePoliciesDto extends PaginationParams {
  /**
   * 策略类型
   *
   * @description 用于按策略类型筛选，可选值：'p'（策略）、'g'（角色继承），可选
   */
  @ApiProperty({
    required: false,
    enum: PolicyType,
    example: PolicyType.POLICY,
  })
  @IsOptional()
  @IsEnum(PolicyType, { message: 'ptype must be a valid enum value' })
  ptype?: PolicyType;

  /**
   * 主体（Subject）
   *
   * @description 用于按主体模糊查询策略，可选
   */
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString({ message: 'subject must be a string' })
  subject?: string;

  /**
   * 资源（Object）
   *
   * @description 用于按资源模糊查询策略，可选
   */
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString({ message: 'object must be a string' })
  object?: string;

  /**
   * 操作（Action）
   *
   * @description 用于按操作模糊查询策略，可选
   */
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString({ message: 'action must be a string' })
  action?: string;

  /**
   * 域（Domain）
   *
   * @description 用于按域筛选策略，可选
   */
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString({ message: 'domain must be a string' })
  domain?: string;
}
