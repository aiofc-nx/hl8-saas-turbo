import { ApiProperty, OmitType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

/**
 * 用户创建数据传输对象
 *
 * @description
 * 用于创建新用户的数据传输对象，包含用户名、密码、域、昵称等基本信息。
 * 用户名在域内必须唯一，密码需要满足最小长度要求。
 */
export class UserCreateDto {
  /**
   * 用户名
   *
   * @description 用户的登录名，在域内必须唯一，最小长度为 6 个字符
   */
  @ApiProperty({ required: true })
  @IsString({ message: 'username must be a string' })
  @IsNotEmpty({ message: 'username cannot be empty' })
  @MinLength(6)
  username: string;

  /**
   * 密码
   *
   * @description 用户的登录密码，最小长度为 6 个字符
   */
  @ApiProperty({ required: true })
  @IsString({ message: 'password must be a string' })
  @IsNotEmpty({ message: 'password cannot be empty' })
  @MinLength(6)
  password: string;

  /**
   * 域
   *
   * @description 用户所属的域代码，用于多租户隔离
   */
  @ApiProperty({ required: true })
  @IsString({ message: 'domain must be a string' })
  @IsNotEmpty({ message: 'domain cannot be empty' })
  domain: string;

  /**
   * 昵称
   *
   * @description 用户的显示名称，用于界面展示
   */
  @ApiProperty({ required: true })
  @IsString({ message: 'nickName must be a string' })
  @IsNotEmpty({ message: 'nickName cannot be empty' })
  nickName: string;

  /**
   * 头像
   *
   * @description 用户头像的 URL 地址，可选
   */
  @ApiProperty({ type: 'string', required: false, nullable: true })
  @IsOptional()
  @IsString({ message: 'avatar must be a string or null' })
  @Type(() => String)
  avatar: string | null;

  /**
   * 邮箱
   *
   * @description 用户的邮箱地址，可选，可用于登录和找回密码
   */
  @ApiProperty({ type: 'string', required: false, nullable: true })
  @IsOptional()
  @IsString({ message: 'email must be a string or null' })
  @Type(() => String)
  email: string | null;

  /**
   * 手机号
   *
   * @description 用户的手机号码，可选，可用于登录和找回密码
   */
  @ApiProperty({ type: 'string', required: false, nullable: true })
  @IsOptional()
  @IsString({ message: 'phoneNumber must be a string or null' })
  @Type(() => String)
  phoneNumber: string | null;
}

/**
 * 用户更新数据传输对象
 *
 * @description
 * 用于更新现有用户的数据传输对象，继承自 UserCreateDto，但排除了密码和域字段。
 * 密码和域不允许通过此接口修改。
 */
export class UserUpdateDto extends OmitType(UserCreateDto, [
  'password',
  'domain',
]) {
  /**
   * 用户 ID
   *
   * @description 要更新的用户的唯一标识符
   */
  @ApiProperty({ required: true })
  @IsString({ message: 'id must be a string' })
  @IsNotEmpty({ message: 'id cannot be empty' })
  id: string;
}
