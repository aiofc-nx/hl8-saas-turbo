import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
  UnprocessableEntityException,
} from '@nestjs/common';
import { FastifyReply } from 'fastify';

import { BizException, ErrorCode, ErrorMessages } from '@hl8/errors';
import { ApiResponse } from '@hl8/typings';

/**
 * 验证失败异常响应接口
 *
 * @description 定义 UnprocessableEntityException 的响应结构
 */
interface ValidationErrorResponse {
  message?: string | string[];
  errors?: Record<string, string[]>;
  statusCode?: number;
}

/**
 * HTTP 异常响应接口
 *
 * @description 定义 HttpException 的响应结构
 */
interface HttpExceptionResponse {
  message?: string | string[];
  statusCode?: number;
  [key: string]: unknown;
}

/**
 * 错误详情接口
 *
 * @description 定义错误响应的详细信息结构
 */
interface ErrorDetails {
  code: number;
  message: string;
  errors?: Record<string, string[]>;
}

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
  private readonly logger = new Logger(AllExceptionsFilter.name);

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
    let errorDetails: ErrorDetails = {
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      message: ErrorMessages[ErrorCode.INTERNAL_SERVER_ERROR],
    };

    if (exception instanceof UnprocessableEntityException) {
      statusCode = HttpStatus.UNPROCESSABLE_ENTITY;
      errorDetails = this.handleUnprocessableEntityException(exception);
    } else if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      errorDetails = this.buildErrorResponse(exception);
    } else if (exception instanceof BizException) {
      statusCode = HttpStatus.BAD_REQUEST;
      errorDetails = {
        code: exception.code,
        message: exception.message,
      };
    } else {
      // 记录未知异常，便于调试和监控
      this.logger.error(
        '捕获到未知异常',
        exception instanceof Error ? exception.stack : String(exception),
      );
      errorDetails = this.handleUnknownException(exception);
    }

    const responsePayload: ApiResponse = {
      code: statusCode,
      message: errorDetails.message,
      error: errorDetails,
    };

    response.status(statusCode).send(responsePayload);
  }

  /**
   * 处理验证失败异常
   *
   * @description 从 UnprocessableEntityException 中提取错误信息
   *
   * @param exception - 验证失败异常对象
   * @returns 返回包含错误码、错误消息和验证错误的详细信息
   */
  private handleUnprocessableEntityException(
    exception: UnprocessableEntityException,
  ): ErrorDetails {
    const exceptionResponse = exception.getResponse() as
      | ValidationErrorResponse
      | string;

    if (typeof exceptionResponse === 'string') {
      return {
        code: ErrorCode.UNPROCESSABLE_ENTITY,
        message: exceptionResponse || 'Validation failed',
      };
    }

    const message =
      typeof exceptionResponse.message === 'string'
        ? exceptionResponse.message
        : Array.isArray(exceptionResponse.message)
          ? exceptionResponse.message.join(', ')
          : 'Validation failed';

    const errorDetails: ErrorDetails = {
      code: ErrorCode.UNPROCESSABLE_ENTITY,
      message,
    };

    if (exceptionResponse.errors) {
      errorDetails.errors = exceptionResponse.errors;
    }

    return errorDetails;
  }

  /**
   * 处理未知异常
   *
   * @description 处理非标准异常类型，提取错误消息
   *
   * @param exception - 未知类型的异常对象
   * @returns 返回包含错误码和错误消息的对象
   */
  private handleUnknownException(exception: unknown): ErrorDetails {
    if (typeof exception === 'object' && exception !== null) {
      const errorObject = exception as { message?: unknown };
      const message =
        typeof errorObject.message === 'string'
          ? errorObject.message
          : 'Unknown error';

      return {
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message,
      };
    }

    return {
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
    };
  }

  /**
   * 构建错误响应
   *
   * @description 从 HTTP 异常中提取错误码和错误消息
   *
   * @param exception - HTTP 异常对象
   * @returns 返回包含错误码和错误消息的对象
   */
  private buildErrorResponse(exception: HttpException): ErrorDetails {
    const responsePayload = exception.getResponse();
    const status = exception.getStatus();

    if (typeof responsePayload === 'string') {
      return {
        code: status,
        message: responsePayload,
      };
    }

    if (typeof responsePayload === 'object' && responsePayload !== null) {
      const httpResponse = responsePayload as HttpExceptionResponse;
      const code =
        typeof httpResponse.statusCode === 'number'
          ? httpResponse.statusCode
          : status;

      let message: string;
      if (typeof httpResponse.message === 'string') {
        message = httpResponse.message;
      } else if (Array.isArray(httpResponse.message)) {
        message = httpResponse.message.join(', ');
      } else {
        message = String(responsePayload);
      }

      return {
        code,
        message,
      };
    }

    return {
      code: status,
      message: String(responsePayload),
    };
  }
}
