import { SetMetadata } from '@nestjs/common';

/**
 * 日志选项接口
 *
 * @description 定义日志记录的选项
 */
interface LogOptions {
  /** 是否记录请求参数 */
  logParams?: boolean;
  /** 是否记录请求体 */
  logBody?: boolean;
  /** 是否记录响应数据 */
  logResponse?: boolean;
}

/**
 * 日志元数据键
 *
 * @description 用于标识路由是否需要记录操作日志的元数据键
 */
export const LOG_KEY = 'log';

/**
 * 日志装饰器
 *
 * @description 标记路由需要记录操作日志，用于审计和追踪
 *
 * @param moduleName - 模块名称，用于分类日志
 * @param description - 操作描述，说明该路由的功能
 * @param options - 日志选项（可选），控制记录哪些信息
 * @returns 返回设置日志元数据的装饰器
 *
 * @example
 * ```typescript
 * @Log('用户管理', '创建用户', { logBody: true, logResponse: true })
 * @Post('users')
 * async createUser() { ... }
 * ```
 */
export const Log = (
  moduleName: string,
  description: string,
  options?: LogOptions,
) => SetMetadata(LOG_KEY, { moduleName, description, ...options });
