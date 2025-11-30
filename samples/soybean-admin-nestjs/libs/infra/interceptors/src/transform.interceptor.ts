import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  RequestTimeoutException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { FastifyReply } from 'fastify';
import { Observable, TimeoutError } from 'rxjs';
import { catchError, map, timeout } from 'rxjs/operators';

import {
  RESPONSE_SUCCESS_CODE,
  RESPONSE_SUCCESS_MSG,
} from '@lib/constants/rest.constant';
import { BYPASS_TRANSFORM_KEY } from '@lib/infra/decorators/bypass-transform.decorator';
import { ApiResponse } from '@lib/typings/global';

/**
 * 响应转换拦截器
 * 
 * @description 将响应数据转换为标准化的 API 响应格式，包含 code、message 和 data 字段
 * 
 * @class TransformInterceptor
 * @implements {NestInterceptor}
 */
@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  /**
   * 构造函数
   * 
   * @param reflector - NestJS 反射器，用于获取路由元数据
   */
  constructor(private readonly reflector: Reflector) {}

  /**
   * 拦截响应
   * 
   * @description 将响应数据包装为标准格式，支持通过 @BypassTransform() 装饰器跳过转换
   * 
   * @param context - 执行上下文，包含请求和响应对象
   * @param next - 下一个处理程序
   * @returns 返回标准化的响应数据流，超时时间为 3 秒
   * 
   * @throws {RequestTimeoutException} 当请求超时时抛出
   * 
   * @example
   * 响应格式：
   * {
   *   code: 200,
   *   message: 'Success',
   *   data: <响应数据>
   * }
   */
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    const bypassTransform = this.reflector.get<boolean>(
      BYPASS_TRANSFORM_KEY,
      context.getHandler(),
    );

    if (bypassTransform) return next.handle();

    context.switchToHttp().getResponse<FastifyReply>();

    return next.handle().pipe(
      timeout(3000),
      map((data) => ({
        code: RESPONSE_SUCCESS_CODE,
        message: RESPONSE_SUCCESS_MSG,
        data: data ?? null,
      })),
      catchError((err) => {
        if (err instanceof TimeoutError) {
          throw new RequestTimeoutException('Request timed out');
        }
        throw err;
      }),
    );
  }
}
