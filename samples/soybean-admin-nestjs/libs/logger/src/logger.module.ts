import {
  DynamicModule,
  Global,
  Module,
  Provider,
  OnApplicationShutdown,
} from '@nestjs/common';
import { APP_INTERCEPTOR, ModuleRef } from '@nestjs/core';
import {
  WinstonModule,
  utilities as nestWinstonModuleUtilities,
  WINSTON_MODULE_PROVIDER,
} from 'nest-winston';
import * as winston from 'winston';

import { LoggerInterceptor } from './logger.interceptor';
import {
  LoggerOptions,
  LoggerAsyncOptions,
  LoggerOptionsFactory,
} from './logger.interface';

/**
 * 日志选项提供者令牌
 * 
 * @description 用于标识日志选项的提供者令牌
 */
const LOGGER_OPTIONS = 'LOGGER_OPTIONS';

/**
 * 默认日志选项
 * 
 * @description 日志模块的默认配置选项
 */
const defaultOptions: LoggerOptions = {
  console: true,
  file: true,
  filename: 'logs/app-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '14d',
  level: 'info',
};

/**
 * 日志模块
 * 
 * @description 提供日志功能的全局模块，基于 Winston 实现，支持控制台和文件输出
 * 
 * @class LoggerModule
 * @implements {OnApplicationShutdown}
 */
@Global()
@Module({})
export class LoggerModule implements OnApplicationShutdown {
  /**
   * 构造函数
   * 
   * @param moduleRef - 模块引用，用于获取模块中的提供者
   */
  constructor(private moduleRef: ModuleRef) {}

  /**
   * 应用关闭时的处理
   * 
   * @description 在应用关闭时优雅地关闭日志记录器
   * 
   * @returns Promise<void> 关闭完成时返回
   */
  async onApplicationShutdown() {
    try {
      const logger = this.moduleRef.get<winston.Logger>(
        WINSTON_MODULE_PROVIDER,
      );
      if (logger && typeof logger.end === 'function') {
        await new Promise<void>((resolve) => {
          logger.end(() => resolve());
        });
      }
    } catch (error) {
      console.error('Error shutting down logger:', error);
    }
  }

  /**
   * 注册日志模块（同步）
   * 
   * @description 使用同步方式注册日志模块，提供日志选项
   * 
   * @param options - 日志选项（可选，会与默认选项合并）
   * @returns 返回动态模块配置
   * 
   * @example
   * ```typescript
   * LoggerModule.forRoot({
   *   console: true,
   *   file: true,
   *   level: 'debug'
   * })
   * ```
   */
  static forRoot(options: Partial<LoggerOptions> = {}): DynamicModule {
    const winstonOptions = this.createWinstonModuleOptions({
      ...defaultOptions,
      ...options,
    });

    return {
      module: LoggerModule,
      imports: [WinstonModule.forRoot(winstonOptions)],
      providers: [
        {
          provide: APP_INTERCEPTOR,
          useClass: LoggerInterceptor,
        },
      ],
      exports: [WinstonModule],
    };
  }

  /**
   * 注册日志模块（异步）
   * 
   * @description 使用异步方式注册日志模块，支持动态配置
   * 
   * @param options - 日志异步选项
   * @returns 返回动态模块配置
   * 
   * @example
   * ```typescript
   * LoggerModule.forRootAsync({
   *   imports: [ConfigModule],
   *   useFactory: (config: ConfigService) => ({
   *     level: config.get('LOG_LEVEL', 'info')
   *   }),
   *   inject: [ConfigService]
   * })
   * ```
   */
  static forRootAsync(options: LoggerAsyncOptions): DynamicModule {
    const providers: Provider[] = [
      {
        provide: APP_INTERCEPTOR,
        useClass: LoggerInterceptor,
      },
    ];

    if (options.useClass) {
      providers.push(
        {
          provide: LOGGER_OPTIONS,
          useClass: options.useClass,
        },
        {
          provide: options.useClass,
          useClass: options.useClass,
        },
      );
    }

    const asyncWinstonModule = WinstonModule.forRootAsync({
      imports: options.imports,
      inject: options.inject || [],
      useFactory: async (...args: any[]) => {
        const loggerOptions = await this.resolveOptions(options, args);
        return this.createWinstonModuleOptions(loggerOptions);
      },
    });

    return {
      module: LoggerModule,
      imports: [...(options.imports || []), asyncWinstonModule],
      providers,
      exports: [WinstonModule],
    };
  }

  /**
   * 解析日志选项
   * 
   * @description 从异步选项中解析出日志配置选项
   * 
   * @param options - 日志异步选项
   * @param args - 注入的参数数组
   * @returns 返回解析后的日志选项
   */
  private static async resolveOptions(
    options: LoggerAsyncOptions,
    args: any[],
  ): Promise<LoggerOptions> {
    let loggerOptions: LoggerOptions = { ...defaultOptions };

    try {
      if (options.useFactory) {
        const factoryOptions = await options.useFactory(...args);
        loggerOptions = { ...loggerOptions, ...factoryOptions };
      } else if (options.useClass || options.useExisting) {
        const optionsFactory = await this.createLoggerOptionsFactory(options);
        const factoryOptions = await optionsFactory.createLoggerOptions();
        loggerOptions = { ...loggerOptions, ...factoryOptions };
      }
    } catch (error) {
      console.error('Failed to resolve logger options:', error);
    }

    return loggerOptions;
  }

  /**
   * 创建日志选项工厂
   * 
   * @description 根据异步选项创建日志选项工厂实例
   * 
   * @param options - 日志异步选项
   * @returns 返回日志选项工厂实例
   * @throws {Error} 当配置无效时抛出错误
   */
  private static async createLoggerOptionsFactory(
    options: LoggerAsyncOptions,
  ): Promise<LoggerOptionsFactory> {
    if (options.useClass) {
      const FactoryClass = options.useClass;
      return new FactoryClass();
    }
    if (options.useExisting) {
      return options.useExisting as any;
    }
    throw new Error('Invalid logger module configuration');
  }

  /**
   * 创建 Winston 模块选项
   * 
   * @description 将日志选项转换为 Winston 日志选项
   * 
   * @param options - 日志选项
   * @returns 返回 Winston 日志选项
   */
  private static createWinstonModuleOptions(
    options: LoggerOptions,
  ): winston.LoggerOptions {
    const transports: winston.transport[] = [];
    const formats = [
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
    ];

    if (options.console) {
      transports.push(
        new winston.transports.Console({
          format: winston.format.combine(
            ...formats,
            winston.format.ms(),
            nestWinstonModuleUtilities.format.nestLike('App', {
              prettyPrint: true,
            }),
          ),
          handleExceptions: true,
          handleRejections: true,
        }),
      );
    }

    if (options.file) {
      const DailyRotateFile = require('winston-daily-rotate-file');
      transports.push(
        new DailyRotateFile({
          filename: options.filename,
          datePattern: options.datePattern,
          zippedArchive: options.zippedArchive,
          maxSize: options.maxSize,
          maxFiles: options.maxFiles,
          level: options.level,
          format: winston.format.combine(...formats, winston.format.json()),
          handleExceptions: true,
          handleRejections: true,
          maxRetries: 3,
          retryWrites: true,
          eol: '\n',
          tailable: true,
          frequency: '24h',
          auditFile: `${options.filename}.audit.json`,
        }),
      );
    }

    return {
      transports,
      exitOnError: false,
      handleExceptions: true,
      handleRejections: true,
      format: winston.format.combine(...formats),
    };
  }
}
