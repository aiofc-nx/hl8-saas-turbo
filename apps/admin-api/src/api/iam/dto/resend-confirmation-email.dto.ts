import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

/**
 * 重发确认邮件数据传输对象
 *
 * @description
 * 用于重新发送邮箱验证邮件的数据传输对象。用户需要提供邮箱地址。
 */
export class ResendConfirmationEmailDto {
  /**
   * 邮箱地址
   *
   * @description 需要重新发送验证邮件的邮箱地址
   */
  @ApiProperty({
    description: '用户邮箱地址',
    example: 'user@example.com',
  })
  @IsEmail({}, { message: '邮箱格式不正确' })
  @IsNotEmpty({ message: '邮箱不能为空' })
  @IsString({ message: '邮箱必须是字符串' })
  readonly email: string;
}
