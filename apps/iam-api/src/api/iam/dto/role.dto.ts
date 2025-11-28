import { Status } from '@/lib/shared/enums/status.enum';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

/**
 * 角色创建数据传输对象
 *
 * @description
 * 用于创建新角色的数据传输对象，包含角色代码、名称、父角色、状态和描述信息。
 * 角色代码必须唯一，支持设置父角色实现角色层级结构。
 */
export class RoleCreateDto {
  /**
   * 角色代码
   *
   * @description 角色的唯一标识符，必须唯一，用于权限控制
   */
  @ApiProperty({ required: true })
  @IsString({ message: 'code must be a string' })
  @IsNotEmpty({ message: 'code cannot be empty' })
  code: string;

  /**
   * 角色名称
   *
   * @description 角色的显示名称，用于界面展示
   */
  @ApiProperty({ required: true })
  @IsString({ message: 'name must be a string' })
  @IsNotEmpty({ message: 'name cannot be empty' })
  name: string;

  /**
   * 父角色 ID
   *
   * @description 父角色的唯一标识符，用于实现角色层级结构，根角色可以为空字符串
   */
  @ApiProperty({ required: true })
  @IsString({ message: 'pid must be a string' })
  @IsNotEmpty({ message: 'pid cannot be empty' })
  pid: string;

  /**
   * 状态
   *
   * @description 角色的状态，可选值：ACTIVE（激活）、INACTIVE（禁用）
   */
  @ApiProperty({
    required: false,
    enum: Object.values(Status),
    type: String,
  })
  @IsEnum(Status, { message: 'Status must be a valid enum value' })
  status: Status;

  /**
   * 描述
   *
   * @description 角色的详细描述信息，可选
   */
  @ApiProperty({ type: 'string', required: false, nullable: true })
  @IsOptional()
  @IsString({ message: 'description must be a string or null' })
  @Type(() => String)
  description: string | null;
}

/**
 * 角色更新数据传输对象
 *
 * @description
 * 用于更新现有角色的数据传输对象，继承自 RoleCreateDto，并添加了角色 ID 字段。
 */
export class RoleUpdateDto extends RoleCreateDto {
  /**
   * 角色 ID
   *
   * @description 要更新的角色的唯一标识符
   */
  @ApiProperty({ required: true })
  @IsString({ message: 'id must be a string' })
  @IsNotEmpty({ message: 'id cannot be empty' })
  id: string;
}
