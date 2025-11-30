import { Body, Controller, Get, Post, Request } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { FastifyRequest } from 'fastify';

import { PasswordIdentifierDTO } from '@/lib/bounded-contexts/iam/authentication/application/dto/password-identifier.dto';
import { RefreshTokenDTO } from '@/lib/bounded-contexts/iam/authentication/application/dto/refresh-token.dto';
import { AuthenticationService } from '@/lib/bounded-contexts/iam/authentication/application/service/authentication.service';

import { CacheConstant, USER_AGENT } from '@hl8/constants';
import { Public } from '@hl8/decorators';
import { Ip2regionService } from '@hl8/ip2region';
import { RedisUtility } from '@hl8/redis';
import { ApiRes } from '@hl8/rest';
import type { IAuthentication } from '@hl8/typings';
import { getClientIpAndPort } from '@hl8/utils';

import { PasswordLoginDto } from '../dto/password-login.dto';

/**
 * 认证控制器
 *
 * @description
 * 提供用户认证相关的 REST API 接口，包括密码登录、刷新令牌和获取用户信息等功能。
 * 该控制器使用认证服务处理用户身份验证，并记录登录日志。
 *
 * @example
 * ```typescript
 * // 密码登录
 * POST /auth/login
 * {
 *   "identifier": "username",
 *   "password": "password123"
 * }
 * ```
 */
@ApiTags('Authentication - Module')
@Controller('auth')
export class AuthenticationController {
  /**
   * 构造函数
   *
   * @param authenticationService - 认证服务，用于处理用户认证逻辑
   */
  constructor(private readonly authenticationService: AuthenticationService) {}

  /**
   * 密码登录
   *
   * @description
   * 通过用户名/邮箱/手机号和密码进行用户认证。认证成功后返回 JWT 访问令牌和刷新令牌。
   * 同时会记录登录日志，包括 IP 地址、地理位置、用户代理等信息。
   *
   * @param dto - 密码登录数据传输对象，包含标识符（用户名/邮箱/手机号）和密码
   * @param request - Fastify 请求对象，用于获取客户端 IP、端口、User-Agent 等信息
   * @returns 返回认证结果，包含访问令牌和刷新令牌
   *
   * @throws {HttpException} 当用户名或密码错误时抛出异常
   *
   * @example
   * ```typescript
   * POST /auth/login
   * {
   *   "identifier": "username",
   *   "password": "password123"
   * }
   * ```
   */
  @Public()
  @Post('login')
  @ApiOperation({
    summary: 'Password-based User Authentication',
    description:
      'Authenticates a user by verifying provided password credentials and issues a JSON Web Token (JWT) upon successful authentication.',
  })
  async login(
    @Body() dto: PasswordLoginDto,
    @Request() request: FastifyRequest,
  ): Promise<ApiRes<any>> {
    const { ip, port } = getClientIpAndPort(request);
    let region = 'Unknown';

    try {
      const ip2regionResult = await Ip2regionService.getSearcher().search(ip);
      region = ip2regionResult.region || region;
    } catch (_) {}
    const token = await this.authenticationService.execPasswordLogin(
      new PasswordIdentifierDTO(
        dto.identifier,
        dto.password,
        ip,
        region,
        request.headers[USER_AGENT] ?? '',
        'TODO',
        'PC',
        port,
      ),
    );
    return ApiRes.success(token);
  }

  /**
   * 刷新访问令牌
   *
   * @description
   * 使用刷新令牌获取新的访问令牌和刷新令牌。当访问令牌过期时，可以使用此接口刷新令牌。
   * 刷新过程中会验证刷新令牌的有效性，并记录新的登录日志。
   *
   * @param refreshToken - 刷新令牌字符串
   * @param request - Fastify 请求对象，用于获取客户端 IP、端口、User-Agent 等信息
   * @returns 返回新的访问令牌和刷新令牌
   *
   * @throws {HttpException} 当刷新令牌无效或已过期时抛出异常
   *
   * @example
   * ```typescript
   * POST /auth/refreshToken
   * {
   *   "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   * }
   * ```
   */
  @Public()
  @Post('refreshToken')
  async refreshToken(
    @Body('refreshToken') refreshToken: string,
    @Request() request: FastifyRequest,
  ): Promise<ApiRes<any>> {
    const { ip, port } = getClientIpAndPort(request);
    let region = 'Unknown';

    try {
      const ip2regionResult = await Ip2regionService.getSearcher().search(ip);
      region = ip2regionResult.region || region;
    } catch (_) {}
    const token = await this.authenticationService.refreshToken(
      new RefreshTokenDTO(
        refreshToken,
        ip,
        region,
        request.headers[USER_AGENT] ?? '',
        'TODO',
        'PC',
        port,
      ),
    );
    return ApiRes.success(token);
  }

  /**
   * 获取当前用户信息
   *
   * @description
   * 获取当前登录用户的基本信息，包括用户 ID、用户名和角色列表。
   * 该接口需要用户已通过认证，会从请求中提取用户信息。
   *
   * @param req - HTTP 请求对象，包含当前登录用户信息（通过认证中间件注入）
   * @returns 返回用户信息，包含用户 ID、用户名和角色列表
   *
   * @throws {HttpException} 当用户未登录或令牌无效时抛出异常
   *
   * @example
   * ```typescript
   * GET /auth/getUserInfo
   * // 返回: { userId: "user-id", userName: "username", roles: ["role1", "role2"] }
   * ```
   */
  @Get('getUserInfo')
  async getProfile(@Request() req: any): Promise<ApiRes<any>> {
    const user: IAuthentication = req.user;
    const userRoles = await RedisUtility.instance.smembers(
      `${CacheConstant.AUTH_TOKEN_PREFIX}${user.uid}`,
    );
    return ApiRes.success({
      userId: user.uid,
      userName: user.username,
      roles: userRoles,
    });
  }
}
