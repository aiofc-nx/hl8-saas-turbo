import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

import { OperationLogProperties } from '@app/base-system/lib/bounded-contexts/log-audit/operation-log/domain/operation-log.read.model';

import { EVENT_OPERATION_LOG_CREATED } from '@lib/constants/event-emitter-token.constant';
import { USER_AGENT } from '@lib/constants/rest.constant';
import { LOG_KEY } from '@lib/infra/decorators/log.decorator';
import { IAuthentication } from '@lib/typings/global';

/**
 * 日志拦截器
 * 
 * @description 记录操作日志的拦截器，通过 @Log() 装饰器标记需要记录日志的路由
 * 
 * @class LogInterceptor
 * @implements {NestInterceptor}
 */
@Injectable()
export class LogInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LogInterceptor.name);

  /**
   * 构造函数
   * 
   * @param reflector - NestJS 反射器，用于获取路由元数据
   * @param eventEmitter - 事件发射器，用于发送操作日志事件
   */
  constructor(
    private readonly reflector: Reflector,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * 拦截请求和响应
   * 
   * @description 记录操作日志，包括用户信息、请求信息、响应信息和执行时间
   * 
   * @param context - 执行上下文，包含请求和响应对象
   * @param next - 下一个处理程序
   * @returns 返回响应数据流
   * 
   * @example
   * 使用 @Log() 装饰器标记需要记录日志的路由：
   * @Log('用户管理', '创建用户', { logBody: true, logResponse: true })
   * @Post('users')
   * async createUser() { ... }
   */
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const logMetadata = this.reflector.get(LOG_KEY, context.getHandler());

    if (!logMetadata) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();

    const { uid, username, domain }: IAuthentication = context
      .switchToHttp()
      .getRequest().user;

    const { moduleName, description, logParams, logBody, logResponse } =
      logMetadata;
    const startTime = new Date();

    return next.handle().pipe(
      tap((data) => {
        const endTime = new Date();
        const duration = endTime.getTime() - startTime.getTime();
        const operationLog: OperationLogProperties = {
          userId: uid,
          username: username,
          domain: domain,
          moduleName,
          description,
          requestId: 'TODO',
          method: request.method,
          url: request.routeOptions.url,
          ip: request.ip,
          userAgent: request.headers[USER_AGENT] ?? null,
          params: logParams ? request.query : null,
          body: logBody ? request.body : null,
          response: logResponse ? data : null,
          startTime,
          endTime,
          duration,
        };

        setImmediate(() => {
          this.eventEmitter.emit(EVENT_OPERATION_LOG_CREATED, operationLog);
        });
      }),
    );
  }
}
