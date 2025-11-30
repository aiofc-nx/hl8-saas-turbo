import { ModuleMetadata, Type } from '@nestjs/common';

/**
 * 日志选项接口
 * 
 * @description 定义日志模块的配置选项
 * 
 * @property console - 是否启用控制台输出（默认 true）
 * @property file - 是否启用文件输出（默认 true）
 * @property filename - 日志文件名模式（默认 'logs/app-%DATE%.log'）
 * @property datePattern - 日期模式（默认 'YYYY-MM-DD'）
 * @property zippedArchive - 是否压缩归档（默认 true）
 * @property maxSize - 单个日志文件最大大小（默认 '20m'）
 * @property maxFiles - 保留日志文件的最大天数（默认 '14d'）
 * @property level - 日志级别（默认 'info'）
 */
export interface LoggerOptions {
  /** 是否启用控制台输出 */
  console?: boolean;
  /** 是否启用文件输出 */
  file?: boolean;
  /** 日志文件名模式 */
  filename?: string;
  /** 日期模式 */
  datePattern?: string;
  /** 是否压缩归档 */
  zippedArchive?: boolean;
  /** 单个日志文件最大大小 */
  maxSize?: string;
  /** 保留日志文件的最大天数 */
  maxFiles?: string;
  /** 日志级别 */
  level?: string;
}

/**
 * 日志异步选项接口
 * 
 * @description 定义日志模块的异步配置选项，支持动态配置
 * 
 * @property useFactory - 工厂函数，用于创建日志选项
 * @property useClass - 选项工厂类
 * @property useExisting - 已存在的选项工厂类
 * @property inject - 注入的依赖数组
 */
export interface LoggerAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  /** 工厂函数，用于创建日志选项 */
  useFactory?: (...args: any[]) => Promise<LoggerOptions> | LoggerOptions;
  /** 选项工厂类 */
  useClass?: Type<LoggerOptionsFactory>;
  /** 已存在的选项工厂类 */
  useExisting?: Type<LoggerOptionsFactory>;
  /** 注入的依赖数组 */
  inject?: any[];
}

/**
 * 日志选项工厂接口
 * 
 * @description 定义创建日志选项的工厂接口
 */
export interface LoggerOptionsFactory {
  /**
   * 创建日志选项
   * 
   * @returns 返回日志选项对象或 Promise
   */
  createLoggerOptions(): Promise<LoggerOptions> | LoggerOptions;
}
