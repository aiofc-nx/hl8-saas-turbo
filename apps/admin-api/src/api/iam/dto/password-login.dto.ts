import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

/**
 * 密码登录数据传输对象
 *
 * @description
 * 用于用户密码登录的数据传输对象，支持使用用户名、邮箱或手机号作为标识符进行登录。
 * 标识符和密码都需要满足最小长度要求。
 */
export class PasswordLoginDto {
  /**
   * 标识符
   *
   * @description 用户的登录标识符，可以是用户名、邮箱或手机号，最小长度为 6 个字符
   */
  @ApiProperty({ description: '账户/邮箱/手机号' })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  readonly identifier: string;

  /**
   * 密码
   *
   * @description 用户的登录密码，最小长度为 6 个字符
   */
  @ApiProperty({ description: '密码', example: '123456' })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  readonly password: string;
}
