import { applyDecorators, HttpStatus, Type } from '@nestjs/common';
import { ApiExtraModels, ApiResponse, getSchemaPath } from '@nestjs/swagger';

import { RESPONSE_SUCCESS_CODE, RESPONSE_SUCCESS_MSG } from '@hl8/constants';

/**
 * API 响应文档装饰器
 *
 * @description 为 Swagger 自动生成响应 Schema，支持单个对象、数组和分页响应
 *
 * @param options - 响应文档配置选项
 * @param options.type - 响应数据类型（类构造函数）
 * @param options.isArray - 是否为数组响应（默认 false）
 * @param options.isPaged - 是否为分页响应（默认 false）
 * @param options.status - HTTP 状态码（默认 200）
 * @returns 返回组合装饰器
 *
 * @example
 * ```typescript
 * @ApiResponseDoc({ type: UserDto })
 * @Get('user')
 * async getUser() { ... }
 *
 * @ApiResponseDoc({ type: UserDto, isArray: true })
 * @Get('users')
 * async getUsers() { ... }
 *
 * @ApiResponseDoc({ type: UserDto, isPaged: true })
 * @Get('users/paged')
 * async getPagedUsers() { ... }
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function ApiResponseDoc<T extends new (...args: any[]) => any>({
  type,
  isArray = false,
  isPaged = false,
  status = HttpStatus.OK,
}: {
  type: T;
  isArray?: boolean;
  isPaged?: boolean;
  status?: HttpStatus;
}) {
  const schema = getResponseSchema(type, isArray, isPaged);

  return applyDecorators(
    ApiExtraModels(type),
    ApiResponse({
      status: status,
      description: 'Auto-generated response schema',
      schema: schema,
    }),
  );
}

/**
 * 获取响应 Schema
 *
 * @description 根据类型、是否数组、是否分页生成对应的响应 Schema
 *
 * @param type - 响应数据类型
 * @param isArray - 是否为数组
 * @param isPaged - 是否为分页
 * @returns 返回响应 Schema 对象
 */
function getResponseSchema<T extends Type>(
  type: T,
  isArray: boolean,
  isPaged: boolean,
) {
  const dataSchema = isArray
    ? { type: 'array', items: { $ref: getSchemaPath(type) } }
    : { $ref: getSchemaPath(type) };

  const resultSchema = isPaged
    ? {
        type: 'object',
        properties: {
          current: { type: 'integer', example: 1 },
          size: { type: 'integer', example: 10 },
          total: { type: 'integer', example: 100 },
          records: { type: 'array', items: { $ref: getSchemaPath(type) } },
        },
      }
    : dataSchema;

  return {
    type: 'object',
    properties: {
      code: {
        type: 'integer',
        example: RESPONSE_SUCCESS_CODE,
        description: 'Status code of the response',
      },
      message: {
        type: 'string',
        example: RESPONSE_SUCCESS_MSG,
        description: 'Description of the response',
      },
      timestamp: {
        type: 'string',
        format: 'date-time',
        example: new Date().toISOString(),
        description: 'Timestamp of the response',
      },
      requestId: {
        type: 'string',
        example: 'req1',
        description: 'Request ID from the header',
      },
      path: {
        type: 'string',
        example: '/api/path',
        description: 'Request path',
      },
      data: resultSchema,
    },
  };
}
