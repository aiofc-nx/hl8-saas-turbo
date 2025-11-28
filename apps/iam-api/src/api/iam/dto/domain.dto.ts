import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

/**
 * 域创建数据传输对象
 *
 * @description
 * 用于创建新域的数据传输对象，包含域的代码、名称和描述信息。
 * 域代码必须唯一，用于标识不同的租户或业务域。
 */
export class DomainCreateDto {
  /**
   * 域代码
   *
   * @description 域的唯一标识符，必须唯一，用于 Casbin 权限模型中的域隔离
   */
  @ApiProperty({ required: true })
  @IsString({ message: 'code must be a string' })
  @IsNotEmpty({ message: 'code cannot be empty' })
  code: string;

  /**
   * 域名称
   *
   * @description 域的显示名称，用于界面展示
   */
  @ApiProperty({ required: true })
  @IsString({ message: 'name must be a string' })
  @IsNotEmpty({ message: 'name cannot be empty' })
  name: string;

  /**
   * 域描述
   *
   * @description 域的详细描述信息，可选
   */
  @ApiProperty({ type: 'string', required: false, nullable: true })
  @IsOptional()
  @IsString({ message: 'description must be a string or null' })
  @Type(() => String)
  description: string | null;
}

/**
 * 域更新数据传输对象
 *
 * @description
 * 用于更新现有域的数据传输对象，继承自 DomainCreateDto，并添加了域 ID 字段。
 */
export class DomainUpdateDto extends DomainCreateDto {
  /**
   * 域 ID
   *
   * @description 要更新的域的唯一标识符
   */
  @ApiProperty({ required: true })
  @IsString({ message: 'id must be a string' })
  @IsNotEmpty({ message: 'id cannot be empty' })
  id: string;
}
