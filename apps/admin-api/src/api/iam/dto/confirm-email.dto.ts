import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Length,
  Matches,
} from 'class-validator';

/**
 * 邮箱确认数据传输对象
 *
 * @description
 * 用于邮箱验证的数据传输对象。用户需要提供邮箱地址和 6 位数字 OTP 验证码。
 */
export class ConfirmEmailDto {
  /**
   * 邮箱地址
   *
   * @description 需要验证的邮箱地址
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
   * OTP 验证码
   *
   * @description 6 位数字验证码，从注册邮件中获取
   */
  @ApiProperty({
    description: '6 位数字 OTP 验证码',
    example: '123456',
    minLength: 6,
    maxLength: 6,
  })
  @IsNotEmpty({ message: '验证码不能为空' })
  @IsString({ message: '验证码必须是字符串' })
  @Length(6, 6, { message: '验证码必须是 6 位数字' })
  @Matches(/^\d+$/, { message: '验证码只能包含数字' })
  readonly token: string;
}
