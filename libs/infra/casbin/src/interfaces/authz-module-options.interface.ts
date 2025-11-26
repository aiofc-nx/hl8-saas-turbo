/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  DynamicModule,
  ExecutionContext,
  ForwardReference,
  Provider,
  Type,
} from '@nestjs/common';

import { IAuthentication } from '@hl8/typings';

/**
 * 授权模块配置选项接口
 *
 * @description 定义授权模块的配置选项，用于注册 AuthZModule
 *
 * @property model - Casbin 模型文件路径（可选，如果提供 enforcerProvider 则不需要）
 * @property policy - Casbin 策略文件路径或策略数据（可选，如果提供 enforcerProvider 则不需要）
 * @property userFromContext - 从执行上下文中提取用户信息的函数（必填）
 * @property enforcerProvider - Casbin 执行器提供者（可选，如果提供则不需要 model 和 policy）
 * @property imports - 需要导入的模块列表（可选）
 */
export interface AuthZModuleOptions<T = any> {
  /** Casbin 模型文件路径 */
  model?: string;
  /** Casbin 策略文件路径或策略数据 */
  policy?: string | Promise<T>;
  /** 从执行上下文中提取用户信息的函数 */
  userFromContext: (context: ExecutionContext) => IAuthentication;
  /** Casbin 执行器提供者 */
  enforcerProvider?: Provider<any>;
  /**
   * 需要导入的模块列表
   *
   * @description 可选的需要导入的模块列表，这些模块导出的提供者将被本模块使用
   */
  imports?: Array<
    Type<any> | DynamicModule | Promise<DynamicModule> | ForwardReference
  >;
}
