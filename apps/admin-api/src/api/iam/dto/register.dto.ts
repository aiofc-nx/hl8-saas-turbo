import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

/**
 * 用户注册数据传输对象
 *
 * @description
 * 用于用户公开注册的数据传输对象。用户可以通过邮箱和密码进行注册。
 * 用户名和昵称为可选字段，如果未提供将自动生成。
 */
export class RegisterDto {
  /**
   * 邮箱地址
   *
   * @description 用户的邮箱地址，必填，用于登录和找回密码，必须唯一
   */
  @ApiProperty({
    description: '用户邮箱地址',
    example: 'user@example.com',
  })
  @IsEmail({}, { message: '邮箱格式不正确' })
  @IsNotEmpty({ message: '邮箱不能为空' })
  @IsString({ message: '邮箱必须是字符串' })
  readonly email: string;

  /**
   * 密码
   *
   * @description 用户的登录密码，最小长度为 6 个字符
   */
  @ApiProperty({
    description: '用户密码',
    example: 'password123',
    minLength: 6,
  })
  @IsString({ message: '密码必须是字符串' })
  @IsNotEmpty({ message: '密码不能为空' })
  @MinLength(6, { message: '密码长度至少为 6 个字符' })
  readonly password: string;

  /**
   * 用户名
   *
   * @description 用户的登录名，可选。如果未提供，将使用邮箱前缀作为用户名
   */
  @ApiProperty({
    description: '用户名（可选，默认使用邮箱前缀）',
    example: 'username',
    required: false,
  })
  @IsOptional()
  @IsString({ message: '用户名必须是字符串' })
  @MinLength(6, { message: '用户名长度至少为 6 个字符' })
  readonly username?: string;

  /**
   * 昵称
   *
   * @description 用户的显示名称，可选。如果未提供，将使用邮箱前缀作为昵称
   */
  @ApiProperty({
    description: '用户昵称（可选，默认使用邮箱前缀）',
    example: '用户昵称',
    required: false,
  })
  @IsOptional()
  @IsString({ message: '昵称必须是字符串' })
  readonly nickName?: string;
}
