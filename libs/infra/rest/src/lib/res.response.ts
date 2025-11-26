import { ApiProperty } from '@nestjs/swagger';

import { RESPONSE_SUCCESS_CODE, RESPONSE_SUCCESS_MSG } from '@hl8/constants';

/**
 * API 响应类
 *
 * @description 标准化的 API 响应格式，包含 code、message 和 data 字段
 *
 * @class ApiRes
 * @template T - 响应数据类型
 */
export class ApiRes<T> {
  /** 响应数据 */
  @ApiProperty({ description: 'data' })
  data?: T;

  /** 响应状态码 */
  @ApiProperty({
    type: 'number',
    default: RESPONSE_SUCCESS_CODE,
    description: 'code',
  })
  code: number;

  /** 响应消息 */
  @ApiProperty({
    type: 'string',
    default: RESPONSE_SUCCESS_MSG,
    description: 'message',
  })
  message: string;

  /**
   * 私有构造函数
   *
   * @param code - 响应状态码
   * @param data - 响应数据
   * @param message - 响应消息
   */
  private constructor(
    code: number,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any,
    message: string = RESPONSE_SUCCESS_MSG,
  ) {
    this.code = code;
    this.data = data;
    this.message = message;
  }

  /**
   * 创建成功响应
   *
   * @description 创建包含数据的成功响应
   *
   * @param data - 响应数据
   * @param message - 响应消息（可选，默认使用成功消息）
   * @returns 返回成功响应对象
   *
   * @example
   * ```typescript
   * return ApiRes.success({ id: 1, name: 'test' }, '操作成功');
   * ```
   */
  static success<T>(
    data: T,
    message: string = RESPONSE_SUCCESS_MSG,
  ): ApiRes<T> {
    return new ApiRes(RESPONSE_SUCCESS_CODE, data, message);
  }

  /**
   * 创建空成功响应
   *
   * @description 创建不包含数据的成功响应（仅表示操作成功）
   *
   * @returns 返回空成功响应对象
   *
   * @example
   * ```typescript
   * return ApiRes.ok();
   * ```
   */
  static ok(): ApiRes<null> {
    return new ApiRes(RESPONSE_SUCCESS_CODE, null, RESPONSE_SUCCESS_MSG);
  }

  /**
   * 创建错误响应
   *
   * @description 创建包含错误码和错误消息的响应
   *
   * @param code - 错误状态码
   * @param message - 错误消息
   * @returns 返回错误响应对象
   *
   * @example
   * ```typescript
   * return ApiRes.error(400, '参数错误');
   * ```
   */
  static error<T = null>(code: number, message: string): ApiRes<T> {
    return new ApiRes(code, null, message);
  }

  /**
   * 创建自定义响应
   *
   * @description 创建包含自定义状态码、数据和消息的响应
   *
   * @param code - 状态码
   * @param data - 响应数据
   * @param message - 响应消息
   * @returns 返回自定义响应对象
   *
   * @example
   * ```typescript
   * return ApiRes.custom(201, { id: 1 }, '创建成功');
   * ```
   */
  static custom<T>(code: number, data: T, message: string): ApiRes<T> {
    return new ApiRes(code, data, message);
  }
}
