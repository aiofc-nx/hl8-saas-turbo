import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

import { RoleRelationDto } from '@/lib/bounded-contexts/casbin/domain/policy-rule.model';

/**
 * 角色继承关系创建数据传输对象
 *
 * @description 用于创建角色继承关系的数据传输对象
 */
export class RoleRelationCreateDto implements Omit<RoleRelationDto, 'id'> {
  @ApiProperty({
    description: '子主体（用户 ID 或子角色编码）',
    example: 'user-123',
  })
  @IsNotEmpty({ message: 'childSubject cannot be empty' })
  @IsString({ message: 'childSubject must be a string' })
  childSubject!: string;

  @ApiProperty({
    description: '父角色编码',
    example: 'admin',
  })
  @IsNotEmpty({ message: 'parentRole cannot be empty' })
  @IsString({ message: 'parentRole must be a string' })
  parentRole!: string;

  @ApiProperty({
    description: '域（Domain），用于多租户隔离',
    example: 'example.com',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'domain must be a string' })
  domain?: string;
}
