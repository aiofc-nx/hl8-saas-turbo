import { IsString } from 'class-validator';

import { IAuthentication } from '@hl8/typings';

/**
 * JWT 认证载荷数据传输对象
 *
 * @description 用于验证 JWT Token 载荷的数据结构，确保载荷符合 IAuthentication 接口要求
 *
 * @class AuthenticationPayloadDto
 * @implements {IAuthentication}
 */
export class AuthenticationPayloadDto implements IAuthentication {
  /**
   * 用户唯一标识
   *
   * @description 用户的唯一标识符，必须是字符串类型
   */
  @IsString({ message: 'UID 必须是字符串类型' })
  public readonly uid: string;

  /**
   * 用户名
   *
   * @description 用户的用户名，必须是字符串类型
   */
  @IsString({ message: '用户名必须是字符串类型' })
  public readonly username: string;

  /**
   * 用户所属域
   *
   * @description 用户所属的域标识，必须是字符串类型
   */
  @IsString({ message: '域标识必须是字符串类型' })
  public readonly domain: string;
}
