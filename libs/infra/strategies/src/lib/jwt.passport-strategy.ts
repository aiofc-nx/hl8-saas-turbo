import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ExtractJwt, Strategy } from 'passport-jwt';

import * as config from '@hl8/config';
import { IAuthentication } from '@hl8/typings';

import { AuthenticationPayloadDto } from './authentication-payload.dto';

/**
 * JWT 认证策略
 *
 * @description 实现 JWT Token 认证的 Passport 策略，从请求头中提取 Bearer Token 并验证
 *
 * @class JwtStrategy
 * @extends {PassportStrategy}
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  /**
   * 构造函数
   *
   * @param securityConfig - 安全配置对象，包含 JWT 密钥
   */
  constructor(
    @Inject(config.SecurityConfig.KEY)
    private readonly securityConfig: config.ISecurityConfig,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: securityConfig.jwtSecret,
    });
  }

  /**
   * 验证 JWT 载荷
   *
   * @description 验证并返回 JWT 载荷，确保载荷符合 IAuthentication 接口
   *
   * @param payload - JWT 载荷对象
   * @returns 返回验证后的认证信息
   *
   * @throws {UnauthorizedException} 当载荷格式无效时抛出
   */
  async validate(payload: unknown): Promise<IAuthentication> {
    return await this.validateAuthenticationPayload(payload);
  }

  /**
   * 验证认证载荷
   *
   * @description 使用 class-validator 验证载荷并返回符合 IAuthentication 接口的对象
   *
   * @param payload - 要验证的载荷对象
   * @returns 返回验证后的认证信息
   *
   * @throws {UnauthorizedException} 当载荷格式无效时抛出，包含详细的验证错误信息
   */
  async validateAuthenticationPayload(
    payload: unknown,
  ): Promise<IAuthentication> {
    // 检查 payload 是否为 null 或 undefined
    if (payload === null || payload === undefined) {
      throw new UnauthorizedException('JWT 载荷验证失败: 载荷不能为空');
    }

    // 将普通对象转换为 DTO 实例
    const dto = plainToInstance(AuthenticationPayloadDto, payload);

    // 使用 class-validator 进行验证
    const errors = await validate(dto);

    if (errors.length > 0) {
      // 收集所有验证错误消息
      const errorMessages = errors
        .flatMap((error) => Object.values(error.constraints || {}))
        .join('; ');

      throw new UnauthorizedException(
        `JWT 载荷验证失败: ${errorMessages || '载荷格式无效'}`,
      );
    }

    // 验证通过，返回符合 IAuthentication 接口的对象
    return {
      uid: dto.uid,
      username: dto.username,
      domain: dto.domain,
    };
  }
}
