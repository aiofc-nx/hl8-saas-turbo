import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventPublisher, QueryBus } from '@nestjs/cqrs';
import { JwtService } from '@nestjs/jwt';

import { TokensReadModel } from '../../../tokens/domain/tokens.read.model';
import { TokensByRefreshTokenQuery } from '../../../tokens/queries/tokens.by-refresh_token.query';

import { SecurityConfig, type ISecurityConfig } from '@hl8/config';
import { CacheConstant } from '@hl8/constants';
import { RedisUtility } from '@hl8/redis';
import { IAuthentication } from '@hl8/typings';

import { TokenGeneratedEvent } from '../../../tokens/domain/events/token-generated.event';
import { TokensEntity } from '../../../tokens/domain/tokens.entity';
import { UserReadRepoPortToken } from '../../constants';
import { UserLoggedInEvent } from '../../domain/events/user-logged-in.event';
import { User } from '../../domain/user';
import type { UserReadRepoPort } from '../../ports/user.read.repo-port';
import { PasswordIdentifierDTO } from '../dto/password-identifier.dto';
import { RefreshTokenDTO } from '../dto/refresh-token.dto';

/**
 * 认证服务
 *
 * 提供用户认证相关的业务逻辑，包括密码登录和刷新令牌功能。
 *
 * @remarks
 * - 使用 JWT 进行令牌生成和验证
 * - 通过 CQRS 模式处理查询和事件发布
 * - 使用领域模型（User、TokensEntity）进行业务逻辑处理
 * - 将用户角色信息缓存到 Redis 中以提高性能
 */
@Injectable()
export class AuthenticationService {
  constructor(
    private jwtService: JwtService,
    private readonly publisher: EventPublisher,
    @Inject(UserReadRepoPortToken)
    private readonly repository: UserReadRepoPort,
    private queryBus: QueryBus,
    @Inject(SecurityConfig.KEY) private securityConfig: ISecurityConfig,
  ) {}

  /**
   * 刷新访问令牌
   *
   * 使用刷新令牌获取新的访问令牌和刷新令牌。
   * 验证刷新令牌的有效性，检查令牌是否过期或被撤销。
   *
   * @param dto - 刷新令牌数据传输对象，包含刷新令牌、IP、地区、用户代理等信息
   * @returns 包含新的访问令牌和刷新令牌的对象
   *
   * @throws {NotFoundException} 当刷新令牌不存在时抛出
   * @throws {Error} 当刷新令牌验证失败或已过期时抛出
   *
   * @remarks
   * - 通过查询总线查找令牌详情
   * - 验证刷新令牌的签名和有效期
   * - 使用领域模型（TokensEntity）进行令牌刷新检查
   * - 生成新的访问令牌和刷新令牌
   * - 发布 TokenGeneratedEvent 事件记录令牌生成
   * - 提交领域事件到事件存储
   */
  async refreshToken(dto: RefreshTokenDTO) {
    const tokenDetails = await this.queryBus.execute<
      TokensByRefreshTokenQuery,
      TokensReadModel | null
    >(new TokensByRefreshTokenQuery(dto.refreshToken));
    if (!tokenDetails) {
      throw new NotFoundException('Refresh token not found.');
    }

    await this.jwtService.verifyAsync(tokenDetails.refreshToken, {
      secret: this.securityConfig.refreshJwtSecret,
    });

    const tokensAggregate = new TokensEntity(tokenDetails);

    await tokensAggregate.refreshTokenCheck();

    const tokens = await this.generateAccessToken(
      tokensAggregate.userId,
      tokenDetails.username,
      tokenDetails.domain,
    );

    tokensAggregate.apply(
      new TokenGeneratedEvent(
        tokens.token,
        tokens.refreshToken,
        tokensAggregate.userId,
        tokensAggregate.username,
        tokensAggregate.domain,
        dto.ip,
        dto.region,
        dto.userAgent,
        dto.requestId,
        dto.type,
        dto.port,
      ),
    );

    this.publisher.mergeObjectContext(tokensAggregate);
    tokensAggregate.commit();

    return tokens;
  }

  /**
   * 执行密码登录
   *
   * 通过用户名/邮箱/手机号等标识符和密码进行用户认证。
   * 验证用户身份后生成访问令牌和刷新令牌，并缓存用户角色信息。
   *
   * @param dto - 密码标识符数据传输对象，包含标识符、密码和请求元数据
   * @returns 访问令牌和刷新令牌对象
   *
   * @throws {NotFoundException} 当用户不存在时抛出
   * @throws {BadRequestException} 当密码验证失败时抛出
   *
   * @remarks
   * - 通过标识符查找用户
   * - 使用领域模型（User）进行密码验证
   * - 生成 JWT 访问令牌和刷新令牌
   * - 发布 UserLoggedInEvent 和 TokenGeneratedEvent 事件
   * - 将用户角色信息缓存到 Redis，键格式：`auth:token:{userId}`
   * - Redis 缓存过期时间与 JWT 过期时间一致
   */
  async execPasswordLogin(
    dto: PasswordIdentifierDTO,
  ): Promise<{ token: string; refreshToken: string }> {
    const { identifier, password } = dto;
    const user = await this.repository.findUserByIdentifier(identifier);
    if (!user) {
      throw new NotFoundException('User not found.');
    }
    const userAggregate = new User(user);
    const loginResult = await userAggregate.loginUser(password);

    if (!loginResult.success) {
      throw new BadRequestException(loginResult.message);
    }

    const tokens = await this.generateAccessToken(
      user.id,
      user.username,
      user.domain,
    );

    userAggregate.apply(
      new UserLoggedInEvent(
        user.id,
        user.username,
        user.domain,
        dto.ip,
        dto.address,
        dto.userAgent,
        dto.requestId,
        dto.type,
        dto.port,
      ),
    );
    userAggregate.apply(
      new TokenGeneratedEvent(
        tokens.token,
        tokens.refreshToken,
        user.id,
        user.username,
        user.domain,
        dto.ip,
        dto.address,
        dto.userAgent,
        dto.requestId,
        dto.type,
        dto.port,
      ),
    );
    this.publisher.mergeObjectContext(userAggregate);
    userAggregate.commit();

    const result = await this.repository.findRolesByUserId(user.id);
    const key = `${CacheConstant.AUTH_TOKEN_PREFIX}${user.id}`;
    await RedisUtility.instance.del(key);
    // 只有当角色列表不为空时才添加到 Redis
    if (result.size > 0) {
      await RedisUtility.instance.sadd(key, ...Array.from(result));
    }
    await RedisUtility.instance.expire(key, this.securityConfig.jwtExpiresIn);

    return tokens;
  }

  /**
   * 邮箱验证后自动登录
   *
   * 在用户通过邮箱验证后，自动生成访问令牌和刷新令牌，无需密码验证。
   * 此方法用于邮箱验证流程，用户已经通过 OTP 验证码验证了邮箱所有权。
   *
   * @param userId - 用户 ID
   * @param username - 用户名
   * @param domain - 用户所属域
   * @param ip - 客户端 IP 地址
   * @param region - 客户端地理位置
   * @param userAgent - 用户代理字符串
   * @param requestId - 请求 ID
   * @param type - 设备类型
   * @param port - 客户端端口
   * @returns 包含访问令牌和刷新令牌的对象
   *
   * @remarks
   * - 此方法跳过密码验证，因为用户已经通过邮箱验证
   * - 会发布 UserLoggedInEvent 和 TokenGeneratedEvent 事件
   * - 会将用户角色信息缓存到 Redis
   */
  async verifyEmailAndLogin(
    userId: string,
    username: string,
    domain: string,
    ip: string,
    region: string,
    userAgent: string,
    requestId: string,
    type: string,
    port: number,
  ): Promise<{ token: string; refreshToken: string }> {
    const tokens = await this.generateAccessToken(userId, username, domain);

    const user = await this.repository.findUserById(userId);
    if (!user) {
      throw new NotFoundException('User not found.');
    }

    const userAggregate = new User(user);
    userAggregate.apply(
      new UserLoggedInEvent(
        userId,
        username,
        domain,
        ip,
        region,
        userAgent,
        requestId,
        type,
        port,
      ),
    );
    userAggregate.apply(
      new TokenGeneratedEvent(
        tokens.token,
        tokens.refreshToken,
        userId,
        username,
        domain,
        ip,
        region,
        userAgent,
        requestId,
        type,
        port,
      ),
    );
    this.publisher.mergeObjectContext(userAggregate);
    userAggregate.commit();

    const result = await this.repository.findRolesByUserId(userId);
    const key = `${CacheConstant.AUTH_TOKEN_PREFIX}${userId}`;
    await RedisUtility.instance.del(key);
    // 只有当角色列表不为空时才添加到 Redis
    if (result.size > 0) {
      await RedisUtility.instance.sadd(key, ...Array.from(result));
    }
    await RedisUtility.instance.expire(key, this.securityConfig.jwtExpiresIn);

    return tokens;
  }

  /**
   * 用户退出登录
   *
   * 使指定的刷新令牌失效，并清除用户角色缓存。
   * 退出后，该刷新令牌将无法再用于刷新访问令牌。
   *
   * @param refreshToken - 刷新令牌字符串
   * @returns Promise<void>
   *
   * @throws {NotFoundException} 当刷新令牌不存在时抛出
   *
   * @remarks
   * - 通过查询总线查找令牌详情
   * - 将令牌状态更新为已使用（USED），使其失效
   * - 清除 Redis 中该用户的角色缓存
   * - 即使令牌不存在或已失效，也尝试清除缓存（幂等性）
   */
  async signOut(refreshToken: string): Promise<void> {
    // 尝试查找令牌详情
    const tokenDetails = await this.queryBus.execute<
      TokensByRefreshTokenQuery,
      TokensReadModel | null
    >(new TokensByRefreshTokenQuery(refreshToken));

    if (tokenDetails) {
      // 将令牌状态更新为已使用，使其失效
      const tokensAggregate = new TokensEntity(tokenDetails);
      await tokensAggregate.refreshTokenCheck();
      this.publisher.mergeObjectContext(tokensAggregate);
      tokensAggregate.commit();

      // 清除 Redis 中该用户的角色缓存
      const key = `${CacheConstant.AUTH_TOKEN_PREFIX}${tokenDetails.userId}`;
      await RedisUtility.instance.del(key);
    }
    // 如果令牌不存在，也尝试清除缓存（基于 refreshToken 中的用户信息）
    // 注意：这里无法从 refreshToken 直接解析用户信息，因为需要密钥
    // 所以只在找到令牌时才清除缓存
  }

  /**
   * 生成访问令牌和刷新令牌
   *
   * 根据用户信息生成 JWT 访问令牌和刷新令牌。
   *
   * @param userId - 用户 ID
   * @param username - 用户名
   * @param domain - 用户所属域
   * @returns 包含访问令牌和刷新令牌的对象
   *
   * @remarks
   * - 访问令牌使用默认 JWT 配置和密钥
   * - 刷新令牌使用独立的密钥和更长的过期时间
   * - 令牌负载包含用户 ID、用户名和域信息
   * - 这是私有方法，仅由服务内部调用
   */
  private async generateAccessToken(
    userId: string,
    username: string,
    domain: string,
  ): Promise<{ token: string; refreshToken: string }> {
    const payload: IAuthentication = {
      uid: userId,
      username: username,
      domain: domain,
    };
    const accessToken = await this.jwtService.signAsync(payload);
    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: this.securityConfig.refreshJwtSecret,
      expiresIn: this.securityConfig.refreshJwtExpiresIn,
    });

    return { token: accessToken, refreshToken };
  }
}
