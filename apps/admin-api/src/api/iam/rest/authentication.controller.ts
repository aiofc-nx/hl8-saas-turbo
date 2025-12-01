import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Inject,
  Patch,
  Post,
  Request,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { FastifyRequest } from 'fastify';

import { PasswordIdentifierDTO } from '@/lib/bounded-contexts/iam/authentication/application/dto/password-identifier.dto';
import { RefreshTokenDTO } from '@/lib/bounded-contexts/iam/authentication/application/dto/refresh-token.dto';
import { AuthenticationService } from '@/lib/bounded-contexts/iam/authentication/application/service/authentication.service';
import { UserCreateCommand } from '@/lib/bounded-contexts/iam/authentication/commands/user-create.command';
import { UserVerifyEmailCommand } from '@/lib/bounded-contexts/iam/authentication/commands/user-verify-email.command';
import { UserReadRepoPortToken } from '@/lib/bounded-contexts/iam/authentication/constants';
import type { UserReadRepoPort } from '@/lib/bounded-contexts/iam/authentication/ports/user.read.repo-port';

import { CacheConstant, USER_AGENT } from '@hl8/constants';
import { Public } from '@hl8/decorators';
import { Ip2regionService } from '@hl8/ip2region';
import { MailService, RegisterSuccessMail } from '@hl8/mail';
import { RedisUtility } from '@hl8/redis';
import { ApiRes } from '@hl8/rest';
import type { IAuthentication } from '@hl8/typings';
import { getClientIpAndPort } from '@hl8/utils';
import { APP_NAME, APP_URL } from '@repo/constants/app';

import { ConfirmEmailDto } from '../dto/confirm-email.dto';
import { PasswordLoginDto } from '../dto/password-login.dto';
import { RegisterDto } from '../dto/register.dto';
import { ResendConfirmationEmailDto } from '../dto/resend-confirmation-email.dto';
import { SignOutDto } from '../dto/sign-out.dto';

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
   * @param commandBus - CQRS 命令总线，用于执行用户创建命令
   * @param userReadRepoPort - 用户读取仓储端口，用于查询用户信息
   */
  constructor(
    private readonly authenticationService: AuthenticationService,
    private readonly commandBus: CommandBus,
    @Inject(UserReadRepoPortToken)
    private readonly userReadRepoPort: UserReadRepoPort,
    private readonly mailService: MailService,
  ) {}

  /**
   * 生成 6 位数字 OTP 验证码
   *
   * @returns 6 位数字字符串
   */
  private generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

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
   * 用户注册
   *
   * @description
   * 公开的用户注册接口，允许新用户通过邮箱和密码进行注册。
   * 注册时会自动生成用户名（如果未提供）和分配默认域。
   * 邮箱必须唯一，如果邮箱已存在则注册失败。
   *
   * @param dto - 用户注册数据传输对象，包含邮箱、密码、可选的用户名和昵称
   * @returns 返回注册成功消息
   *
   * @throws {BadRequestException} 当邮箱已存在时抛出异常
   *
   * @example
   * ```typescript
   * POST /auth/register
   * {
   *   "email": "user@example.com",
   *   "password": "password123",
   *   "username": "username", // 可选
   *   "nickName": "用户昵称"   // 可选
   * }
   * ```
   */
  @Public()
  @Post('register')
  @ApiOperation({
    summary: 'User Registration',
    description:
      'Register a new user account with email and password. Username and nickname are optional and will be auto-generated if not provided.',
  })
  async register(
    @Body() dto: RegisterDto,
  ): Promise<ApiRes<{ message: string }>> {
    // 1. 检查邮箱是否已存在
    const existingUser = await this.userReadRepoPort.findUserByIdentifier(
      dto.email,
    );
    if (existingUser) {
      throw new BadRequestException('该邮箱已被注册，请使用其他邮箱或直接登录');
    }

    // 2. 生成用户名（如果未提供）
    let username = dto.username;
    if (!username) {
      // 使用邮箱前缀作为用户名，如果长度不足 6 位则补充
      const emailPrefix = dto.email.split('@')[0];
      username =
        emailPrefix.length >= 6
          ? emailPrefix
          : `${emailPrefix}${Date.now().toString().slice(-6)}`;
    }

    // 检查用户名是否已存在，如果存在则添加时间戳
    let finalUsername = username;
    let attempts = 0;
    while (attempts < 10) {
      const userByUsername =
        await this.userReadRepoPort.getUserByUsername(finalUsername);
      if (!userByUsername) {
        break;
      }
      finalUsername = `${username}${Date.now().toString().slice(-6)}`;
      attempts++;
    }

    if (attempts >= 10) {
      throw new BadRequestException('无法生成唯一用户名，请手动指定用户名');
    }

    // 3. 生成昵称（如果未提供）
    const nickName = dto.nickName || dto.email.split('@')[0];

    // 4. 使用默认域（公开注册域）
    // TODO: 从配置中读取默认域，暂时使用 'public' 作为默认域
    const defaultDomain = process.env.PUBLIC_REGISTER_DOMAIN || 'public';

    // 5. 创建用户（使用系统用户 ID 作为创建者）
    // 对于公开注册，创建者 ID 使用 'system' 或空字符串
    const systemUserId = 'system';

    await this.commandBus.execute(
      new UserCreateCommand(
        finalUsername,
        dto.password,
        defaultDomain,
        nickName,
        null, // avatar
        dto.email,
        null, // phoneNumber
        systemUserId,
      ),
    );

    return ApiRes.success({
      message: '注册成功！验证码已发送到您的邮箱，请查收并完成邮箱验证',
    });
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

    // 从数据库获取完整用户信息
    const userInfo = await this.userReadRepoPort.findUserById(user.uid);

    // 从 Redis 缓存获取用户角色
    const userRoles = await RedisUtility.instance.smembers(
      `${CacheConstant.AUTH_TOKEN_PREFIX}${user.uid}`,
    );

    return ApiRes.success({
      userId: user.uid,
      userName: user.username,
      nickName: userInfo?.nickName || '',
      avatar: userInfo?.avatar || null,
      email: userInfo?.email || null,
      phoneNumber: userInfo?.phoneNumber || null,
      isEmailVerified: userInfo?.isEmailVerified || false,
      roles: userRoles,
    });
  }

  /**
   * 确认邮箱（邮箱验证）
   *
   * @description
   * 通过 OTP 验证码确认用户邮箱。验证成功后，用户自动登录并返回访问令牌和刷新令牌。
   * OTP 验证码从注册邮件中获取，有效期为 10 分钟。
   *
   * @param dto - 邮箱确认数据传输对象，包含邮箱和 OTP 验证码
   * @param request - Fastify 请求对象，用于获取客户端 IP、端口、User-Agent 等信息
   * @returns 返回登录令牌（访问令牌和刷新令牌）和用户信息
   *
   * @throws {BadRequestException} 当验证码错误、过期或用户不存在时抛出异常
   *
   * @example
   * ```typescript
   * PATCH /auth/confirm-email
   * {
   *   "email": "user@example.com",
   *   "token": "123456"
   * }
   * ```
   */
  @Public()
  @Patch('confirm-email')
  @ApiOperation({
    summary: 'Email Verification',
    description:
      'Verify user email with OTP code. Upon successful verification, user is automatically logged in and receives access tokens.',
  })
  async confirmEmail(
    @Body() dto: ConfirmEmailDto,
    @Request() request: FastifyRequest,
  ): Promise<ApiRes<any>> {
    // 1. 从 Redis 获取存储的 OTP 验证码
    const otpKey = `${CacheConstant.EMAIL_VERIFICATION_PREFIX}${dto.email}`;
    const storedOtp = await RedisUtility.instance.get(otpKey);

    if (!storedOtp) {
      throw new BadRequestException(
        '验证码已过期或不存在，请重新注册或重新发送验证码',
      );
    }

    // 2. 验证 OTP 是否匹配
    if (storedOtp !== dto.token) {
      throw new BadRequestException('验证码错误，请检查后重试');
    }

    // 3. 查找用户
    const user = await this.userReadRepoPort.findUserByIdentifier(dto.email);
    if (!user) {
      throw new BadRequestException('用户不存在');
    }

    // 4. 删除 Redis 中的 OTP 验证码（一次性使用）
    await RedisUtility.instance.del(otpKey);

    // 5. 更新用户的邮箱验证状态为已验证
    await this.commandBus.execute(new UserVerifyEmailCommand(user.id, user.id));

    // 6. 获取客户端信息
    const { ip, port } = getClientIpAndPort(request);
    let region = 'Unknown';

    try {
      const ip2regionResult = await Ip2regionService.getSearcher().search(ip);
      region = ip2regionResult.region || region;
    } catch (_) {}

    // 7. 生成令牌（邮箱验证后自动登录，不需要密码验证）
    const token = await this.authenticationService.verifyEmailAndLogin(
      user.id,
      user.username,
      user.domain,
      ip,
      region,
      request.headers[USER_AGENT] ?? '',
      'TODO',
      'PC',
      port || 0,
    );

    return ApiRes.success({
      message: '邮箱验证成功',
      data: {
        id: user.id,
        email: user.email || '',
        username: user.username,
        isEmailVerified: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      tokens: {
        access_token: token.token,
        refresh_token: token.refreshToken,
        session_token: token.refreshToken, // 临时使用 refreshToken
        session_refresh_time: new Date().toISOString(),
      },
    });
  }

  /**
   * 重发确认邮件
   *
   * @description
   * 为未验证邮箱的用户重新发送确认邮件。重新生成 OTP 验证码并发送到用户邮箱。
   *
   * @param dto - 重发确认邮件数据传输对象，包含邮箱地址
   * @returns 返回成功消息
   *
   * @throws {BadRequestException} 当用户不存在时抛出异常
   *
   * @example
   * ```typescript
   * POST /auth/resend-confirmation-email
   * {
   *   "email": "user@example.com"
   * }
   * ```
   */
  @Public()
  @Post('resend-confirmation-email')
  @ApiOperation({
    summary: 'Resend Confirmation Email',
    description:
      'Resend email verification code to user. A new OTP code will be generated and sent to the user email.',
  })
  async resendConfirmationEmail(
    @Body() dto: ResendConfirmationEmailDto,
  ): Promise<ApiRes<{ message: string }>> {
    // 1. 查找用户
    const user = await this.userReadRepoPort.findUserByIdentifier(dto.email);
    if (!user) {
      throw new BadRequestException('用户不存在，请先注册');
    }

    if (!user.email) {
      throw new BadRequestException('用户邮箱不存在');
    }

    // 2. 生成新的 OTP 验证码
    const otp = this.generateOTP();

    // 3. 更新 Redis 中的 OTP 验证码（覆盖旧的，有效期 10 分钟）
    const otpKey = `${CacheConstant.EMAIL_VERIFICATION_PREFIX}${user.email}`;
    await RedisUtility.instance.setex(otpKey, 600, otp); // 600 秒 = 10 分钟

    // 4. 发送注册验证邮件
    const html = RegisterSuccessMail({
      name: user.nickName || user.username,
      otp,
      appName: APP_NAME,
      appUrl: APP_URL,
    });

    await this.mailService.sendEmail({
      to: [user.email],
      subject: '欢迎注册 - 请验证您的邮箱',
      html,
    });

    return ApiRes.success({
      message: '验证码已重新发送到您的邮箱，请查收',
    });
  }

  /**
   * 用户退出登录
   *
   * @description
   * 使指定的刷新令牌失效，并清除用户角色缓存。
   * 退出后，该刷新令牌将无法再用于刷新访问令牌。
   *
   * @param dto - 退出请求数据传输对象，包含刷新令牌
   * @returns 返回成功消息
   *
   * @example
   * ```typescript
   * POST /auth/sign-out
   * {
   *   "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   * }
   * ```
   */
  @Post('sign-out')
  @ApiOperation({
    summary: 'User Sign Out',
    description:
      'Invalidates the refresh token and clears user role cache. After signing out, the refresh token can no longer be used to refresh access tokens.',
  })
  async signOut(@Body() dto: SignOutDto): Promise<ApiRes<{ message: string }>> {
    await this.authenticationService.signOut(dto.refreshToken);
    return ApiRes.success({ message: '退出成功' });
  }
}
