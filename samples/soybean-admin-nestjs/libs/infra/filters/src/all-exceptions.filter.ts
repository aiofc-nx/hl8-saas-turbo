import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  UnprocessableEntityException,
} from '@nestjs/common';
import { FastifyReply } from 'fastify';

import {
  BizException,
  ErrorCode,
  ErrorMessages,
} from '@lib/shared/errors/error-code.enum';
import { ApiResponse } from '@lib/typings/global';

/**
 * 全局异常过滤器
 * 
 * @description 捕获所有异常并统一处理，返回标准化的错误响应格式
 * 
 * @class AllExceptionsFilter
 * @implements {ExceptionFilter}
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  /**
   * 捕获异常
   * 
   * @description 捕获所有类型的异常，根据异常类型构建相应的错误响应
   * 
   * @param exception - 异常对象（可以是任何类型）
   * @param host - 参数宿主对象，用于获取请求和响应
   * 
   * @example
   * 支持的异常类型：
   * - UnprocessableEntityException: 验证失败异常
   * - HttpException: HTTP 异常
   * - BizException: 业务异常
   * - 其他异常: 统一处理为内部服务器错误
   */
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorDetails = {
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      message: ErrorMessages[ErrorCode.INTERNAL_SERVER_ERROR],
    };

    if (exception instanceof UnprocessableEntityException) {
      statusCode = HttpStatus.UNPROCESSABLE_ENTITY;
      const exceptionResponse = exception.getResponse() as any;
      errorDetails = {
        code: ErrorCode.UNPROCESSABLE_ENTITY,
        message: exceptionResponse.message || 'Validation failed',
        ...(exceptionResponse.errors
          ? { errors: exceptionResponse.errors }
          : {}),
      };
    } else if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      errorDetails = this.buildErrorResponse(exception);
    } else if (exception instanceof BizException) {
      statusCode = HttpStatus.BAD_REQUEST;
      errorDetails = {
        code: exception.code,
        message: exception.message,
      };
    } else if (typeof exception === 'object' && exception !== null) {
      const message = (exception as any).message
        ? (exception as any).message
        : 'Unknown error';

      errorDetails = {
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: message,
      };
    }

    const responsePayload: ApiResponse = {
      code: statusCode,
      message: errorDetails.message,
      error: errorDetails,
    };

    response.status(statusCode).send(responsePayload);
  }

  /**
   * 构建错误响应
   * 
   * @description 从 HTTP 异常中提取错误码和错误消息
   * 
   * @param exception - HTTP 异常对象
   * @returns 返回包含错误码和错误消息的对象
   */
  private buildErrorResponse(exception: HttpException): {
    code: number;
    message: string;
  } {
    const responsePayload = exception.getResponse();
    return {
      code:
        typeof responsePayload === 'object' && 'statusCode' in responsePayload
          ? (responsePayload as any).statusCode
          : exception.getStatus(),
      message:
        typeof responsePayload === 'object' && 'message' in responsePayload
          ? (responsePayload as any).message
          : (responsePayload as any).toString(),
    };
  }
}
