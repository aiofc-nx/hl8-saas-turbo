import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { ISecurityConfig, SecurityConfig } from '@lib/config';
import { IAuthentication } from '@lib/typings/global';

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
    @Inject(SecurityConfig.KEY)
    private readonly securityConfig: ISecurityConfig,
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
  async validate(payload: any) {
    await this.validateAuthenticationPayload(payload);
    return payload;
  }

  /**
   * 断言载荷为 IAuthentication 类型
   * 
   * @description 使用类型守卫验证载荷是否符合 IAuthentication 接口要求
   * 
   * @param payload - 要验证的载荷对象
   * @throws {UnauthorizedException} 当载荷缺少必需字段或字段类型不正确时抛出
   * 
   * @todo 此处可用 class-validator 验证处理
   */
  assertIsIAuthentication(payload: any): asserts payload is IAuthentication {
    if (typeof payload.uid !== 'string') {
      throw new UnauthorizedException('Invalid UID');
    }
    if (typeof payload.username !== 'string') {
      throw new UnauthorizedException('Invalid username');
    }
    if (typeof payload.domain !== 'string') {
      throw new UnauthorizedException('Invalid domain');
    }
  }

  /**
   * 验证认证载荷
   * 
   * @description 验证载荷并返回符合 IAuthentication 接口的对象
   * 
   * @param payload - 要验证的载荷对象
   * @returns 返回验证后的认证信息
   * 
   * @throws {UnauthorizedException} 当载荷格式无效时抛出
   */
  async validateAuthenticationPayload(payload: any): Promise<IAuthentication> {
    this.assertIsIAuthentication(payload);
    return payload;
  }
}
