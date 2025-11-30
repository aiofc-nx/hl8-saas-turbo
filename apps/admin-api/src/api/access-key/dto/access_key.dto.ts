import { Status } from '@/lib/shared/enums/status.enum';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsOptional, IsString } from 'class-validator';

/**
 * 访问密钥创建数据传输对象
 *
 * @description
 * 用于创建新访问密钥的数据传输对象，包含域、状态和描述信息。
 * 系统会自动生成密钥 ID 和密钥值，密钥值只在创建时返回一次。
 */
export class AccessKeyCreateDto {
  /**
   * 域
   *
   * @description 访问密钥所属的域代码，用于多租户隔离，可选。非内置域用户只能为自己域创建密钥
   */
  @ApiProperty({ type: 'string', required: false, nullable: true })
  @IsOptional()
  @IsString({ message: 'domain must be a string or null' })
  @Type(() => String)
  domain: string | null;

  /**
   * 状态
   *
   * @description 访问密钥的状态，可选值：ACTIVE（激活）、INACTIVE（禁用）
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
   * @description 访问密钥的详细描述信息，用于说明密钥的用途，可选
   */
  @ApiProperty({ type: 'string', required: false, nullable: true })
  @IsOptional()
  @IsString({ message: 'description must be a string or null' })
  @Type(() => String)
  description: string | null;
}
