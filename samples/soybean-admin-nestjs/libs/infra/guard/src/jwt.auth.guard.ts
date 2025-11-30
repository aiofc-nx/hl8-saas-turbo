import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';

import { IS_PUBLIC_KEY } from '@lib/infra/decorators/public.decorator';

/**
 * JWT 认证守卫
 * 
 * @description 基于 Passport JWT 策略的认证守卫，用于保护需要认证的路由。支持通过 @Public() 装饰器标记公开路由
 * 
 * @class JwtAuthGuard
 * @extends {AuthGuard}
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  /**
   * 构造函数
   * 
   * @param reflector - NestJS 反射器，用于获取路由元数据
   */
  constructor(private readonly reflector: Reflector) {
    super();
  }

  /**
   * 检查路由是否需要认证
   * 
   * @description 如果路由标记为公开（@Public()），则跳过认证；否则执行 JWT 认证
   * 
   * @param context - 执行上下文，包含请求和响应对象
   * @returns 返回 true 表示允许访问（公开路由或认证成功），false 表示需要认证
   * 
   * @example
   * ```typescript
   * @UseGuards(JwtAuthGuard)
   * @Get('protected')
   * async protectedRoute() { ... }
   * 
   * @Public()
   * @Get('public')
   * async publicRoute() { ... }
   * ```
   */
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }

  /**
   * 处理认证请求结果
   * 
   * @description 当认证失败时抛出未授权异常，成功时返回用户信息
   * 
   * @param err - 认证过程中的错误对象
   * @param user - 认证成功后的用户对象
   * @param info - 认证过程中的额外信息
   * @returns 返回用户对象
   * 
   * @throws {UnauthorizedException} 当认证失败时抛出
   */
  handleRequest(err: any, user: any, info: any) {
    // You can throw an exception based on either "info" or "err" arguments
    if (err || !user) {
      throw err || new UnauthorizedException();
    }
    return user;
  }
}
