import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

import {
  PolicyRuleDto,
  PolicyType,
} from '@/lib/bounded-contexts/casbin/domain/policy-rule.model';

/**
 * 策略规则创建数据传输对象
 *
 * @description 用于创建策略规则的数据传输对象
 */
export class PolicyRuleCreateDto implements Omit<PolicyRuleDto, 'id'> {
  @ApiProperty({
    description: '策略类型',
    enum: PolicyType,
    example: PolicyType.POLICY,
  })
  @IsEnum(PolicyType, { message: 'ptype must be a valid enum value' })
  @IsNotEmpty({ message: 'ptype cannot be empty' })
  ptype!: PolicyType;

  @ApiProperty({
    description: '主体（Subject），通常是角色编码或用户标识',
    example: 'admin',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'subject must be a string' })
  subject?: string;

  @ApiProperty({
    description: '资源（Object），通常是接口路径或资源编码',
    example: '/api/users',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'object must be a string' })
  object?: string;

  @ApiProperty({
    description: '操作（Action），通常是 HTTP 方法或动作枚举',
    example: 'GET',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'action must be a string' })
  action?: string;

  @ApiProperty({
    description: '域（Domain），用于多租户隔离',
    example: 'example.com',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'domain must be a string' })
  domain?: string;

  @ApiProperty({
    description: '效果（Effect），allow 或 deny',
    example: 'allow',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'effect must be a string' })
  effect?: string;

  @ApiProperty({
    description: '扩展字段 v4',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'v4 must be a string' })
  v4?: string;

  @ApiProperty({
    description: '扩展字段 v5',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'v5 must be a string' })
  v5?: string;
}

/**
 * 策略规则批量操作数据传输对象
 *
 * @description 用于批量新增或删除策略规则的数据传输对象
 */
export class PolicyBatchDto {
  @ApiProperty({
    description: '策略规则数组',
    type: [PolicyRuleCreateDto],
  })
  @IsNotEmpty({ message: 'policies cannot be empty' })
  policies!: PolicyRuleCreateDto[];

  @ApiProperty({
    description: '操作类型：add 表示批量新增，delete 表示批量删除',
    enum: ['add', 'delete'],
    example: 'add',
  })
  @IsEnum(['add', 'delete'], { message: 'operation must be add or delete' })
  @IsNotEmpty({ message: 'operation cannot be empty' })
  operation!: 'add' | 'delete';
}
