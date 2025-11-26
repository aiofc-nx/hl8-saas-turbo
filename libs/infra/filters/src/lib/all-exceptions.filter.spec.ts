import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import {
  ArgumentsHost,
  HttpException,
  HttpStatus,
  UnprocessableEntityException,
} from '@nestjs/common';
import { FastifyReply } from 'fastify';

import { BizException, ErrorCode } from '@hl8/errors';
import { ApiResponse } from '@hl8/typings';

import { AllExceptionsFilter } from './all-exceptions.filter';

/**
 * AllExceptionsFilter 单元测试
 *
 * @description 测试全局异常过滤器的各种异常处理场景
 */
describe('AllExceptionsFilter', () => {
  let filter: AllExceptionsFilter;
  let mockResponse: jest.Mocked<FastifyReply>;
  let mockArgumentsHost: jest.Mocked<ArgumentsHost>;

  beforeEach(() => {
    filter = new AllExceptionsFilter();

    // 模拟 FastifyReply
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    } as unknown as jest.Mocked<FastifyReply>;

    // 模拟 ArgumentsHost
    mockArgumentsHost = {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: jest.fn().mockReturnValue(mockResponse),
        getRequest: jest.fn(),
      }),
    } as unknown as jest.Mocked<ArgumentsHost>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('UnprocessableEntityException 处理', () => {
    it('应该正确处理验证失败异常（带 errors）', () => {
      const errors = {
        email: ['邮箱格式不正确'],
        password: ['密码长度至少8位'],
      };
      const exception = new UnprocessableEntityException({
        message: 'Validation failed',
        errors,
      });

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
      expect(mockResponse.send).toHaveBeenCalledWith(
        expect.objectContaining({
          code: HttpStatus.UNPROCESSABLE_ENTITY,
          message: 'Validation failed',
          error: {
            code: ErrorCode.UNPROCESSABLE_ENTITY,
            message: 'Validation failed',
            errors,
          },
        }),
      );
    });

    it('应该正确处理验证失败异常（不带 errors）', () => {
      const exception = new UnprocessableEntityException('Validation failed');

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
      expect(mockResponse.send).toHaveBeenCalledWith(
        expect.objectContaining({
          code: HttpStatus.UNPROCESSABLE_ENTITY,
          message: 'Validation failed',
          error: {
            code: ErrorCode.UNPROCESSABLE_ENTITY,
            message: 'Validation failed',
          },
        }),
      );
    });

    it('应该使用默认消息当异常响应中没有 message 时', () => {
      const exception = new UnprocessableEntityException({});

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.send).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            message: 'Validation failed',
          }),
        }),
      );
    });
  });

  describe('HttpException 处理', () => {
    it('应该正确处理 HTTP 异常（对象响应）', () => {
      const exception = new HttpException(
        {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Resource not found',
        },
        HttpStatus.NOT_FOUND,
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
      expect(mockResponse.send).toHaveBeenCalledWith(
        expect.objectContaining({
          code: HttpStatus.NOT_FOUND,
          message: 'Resource not found',
          error: {
            code: HttpStatus.NOT_FOUND,
            message: 'Resource not found',
          },
        }),
      );
    });

    it('应该正确处理 HTTP 异常（字符串响应）', () => {
      const exception = new HttpException(
        'Bad Request',
        HttpStatus.BAD_REQUEST,
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.send).toHaveBeenCalledWith(
        expect.objectContaining({
          code: HttpStatus.BAD_REQUEST,
          message: 'Bad Request',
          error: {
            code: HttpStatus.BAD_REQUEST,
            message: 'Bad Request',
          },
        }),
      );
    });

    it('应该正确处理 HTTP 异常（响应中没有 statusCode）', () => {
      const exception = new HttpException(
        {
          message: 'Custom error',
        },
        HttpStatus.FORBIDDEN,
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.FORBIDDEN);
      expect(mockResponse.send).toHaveBeenCalledWith(
        expect.objectContaining({
          code: HttpStatus.FORBIDDEN,
          error: {
            code: HttpStatus.FORBIDDEN,
            message: 'Custom error',
          },
        }),
      );
    });

    it('应该正确处理 HTTP 异常（响应中没有 message）', () => {
      const exception = new HttpException(
        {
          statusCode: HttpStatus.UNAUTHORIZED,
        },
        HttpStatus.UNAUTHORIZED,
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.send).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            code: HttpStatus.UNAUTHORIZED,
          }),
        }),
      );
    });
  });

  describe('BizException 处理', () => {
    it('应该正确处理业务异常', () => {
      const exception = new BizException(
        ErrorCode.INTERNAL_SERVER_ERROR,
        '业务处理失败',
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.send).toHaveBeenCalledWith(
        expect.objectContaining({
          code: HttpStatus.BAD_REQUEST,
          message: '业务处理失败',
          error: {
            code: ErrorCode.INTERNAL_SERVER_ERROR,
            message: '业务处理失败',
          },
        }),
      );
    });

    it('应该正确处理业务异常（使用默认消息）', () => {
      const exception = new BizException(ErrorCode.UNPROCESSABLE_ENTITY);

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.send).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            code: ErrorCode.UNPROCESSABLE_ENTITY,
            message: 'Validation failed',
          }),
        }),
      );
    });
  });

  describe('未知异常处理', () => {
    it('应该正确处理带有 message 属性的对象异常', () => {
      const exception = {
        message: 'Custom error message',
      };

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
      expect(mockResponse.send).toHaveBeenCalledWith(
        expect.objectContaining({
          code: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Custom error message',
          error: {
            code: ErrorCode.INTERNAL_SERVER_ERROR,
            message: 'Custom error message',
          },
        }),
      );
    });

    it('应该正确处理没有 message 属性的对象异常', () => {
      const exception = {
        someProperty: 'value',
      };

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
      expect(mockResponse.send).toHaveBeenCalledWith(
        expect.objectContaining({
          code: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Unknown error',
          error: {
            code: ErrorCode.INTERNAL_SERVER_ERROR,
            message: 'Unknown error',
          },
        }),
      );
    });

    it('应该正确处理 null 异常', () => {
      filter.catch(null, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
      expect(mockResponse.send).toHaveBeenCalledWith(
        expect.objectContaining({
          code: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Internal server error',
          error: {
            code: ErrorCode.INTERNAL_SERVER_ERROR,
            message: 'Internal server error',
          },
        }),
      );
    });

    it('应该正确处理字符串异常', () => {
      const exception = 'String error';

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
      expect(mockResponse.send).toHaveBeenCalledWith(
        expect.objectContaining({
          code: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Internal server error',
          error: {
            code: ErrorCode.INTERNAL_SERVER_ERROR,
            message: 'Internal server error',
          },
        }),
      );
    });

    it('应该正确处理数字异常', () => {
      const exception = 123;

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
      expect(mockResponse.send).toHaveBeenCalledWith(
        expect.objectContaining({
          code: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Internal server error',
          error: {
            code: ErrorCode.INTERNAL_SERVER_ERROR,
            message: 'Internal server error',
          },
        }),
      );
    });
  });

  describe('响应格式验证', () => {
    it('应该返回符合 ApiResponse 接口的响应', () => {
      const exception = new HttpException('Test error', HttpStatus.BAD_REQUEST);

      filter.catch(exception, mockArgumentsHost);

      const sentPayload = (mockResponse.send as jest.Mock).mock
        .calls[0][0] as ApiResponse;

      expect(sentPayload).toHaveProperty('code');
      expect(sentPayload).toHaveProperty('message');
      expect(sentPayload).toHaveProperty('error');
      expect(sentPayload.error).toHaveProperty('code');
      expect(sentPayload.error).toHaveProperty('message');
      expect(typeof sentPayload.code).toBe('number');
      expect(typeof sentPayload.message).toBe('string');
      expect(typeof sentPayload.error?.code).toBe('number');
      expect(typeof sentPayload.error?.message).toBe('string');
    });
  });
});
