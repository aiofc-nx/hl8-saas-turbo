import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Inject,
} from '@nestjs/common';
import { FastifyRequest, FastifyReply } from 'fastify';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Logger } from 'winston';

/**
 * 日志条目接口
 * 
 * @description 定义日志条目的数据结构
 */
interface LogEntry {
  /** 日志类型 */
  type: 'Request' | 'Response' | 'Error';
  /** 时间戳 */
  timestamp: number;
  /** HTTP 方法 */
  method: string;
  /** 请求 URL */
  url: string;
  /** 请求体 */
  body?: any;
  /** 查询参数 */
  query?: any;
  /** 路径参数 */
  params?: any;
  /** 请求头 */
  headers?: any;
  /** 状态码 */
  statusCode?: number;
  /** 错误信息 */
  error?: any;
  /** 请求持续时间（毫秒） */
  duration?: number;
}

/**
 * 日志拦截器
 * 
 * @description 记录 HTTP 请求和响应的日志拦截器，支持敏感信息脱敏和批量写入
 * 
 * @class LoggerInterceptor
 * @implements {NestInterceptor}
 */
@Injectable()
export class LoggerInterceptor implements NestInterceptor {
  /** 敏感字段列表，这些字段的值会被脱敏 */
  private static readonly SENSITIVE_FIELDS = [
    'password',
    'token',
    'secret',
    'authorization',
  ];
  /** 日志缓冲区大小 */
  private static readonly LOG_BUFFER_SIZE = 100;
  /** 日志刷新间隔（毫秒） */
  private static readonly FLUSH_INTERVAL = 5000;
  /** 日志缓冲区 */
  private readonly logBuffer: LogEntry[] = [];
  /** 刷新定时器 */
  private flushTimeout: NodeJS.Timeout | null = null;

  /**
   * 构造函数
   * 
   * @param logger - Winston 日志记录器实例
   */
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {
    process.on('beforeExit', () => this.flushLogs());
  }

  /**
   * 拦截请求和响应
   * 
   * @description 记录请求信息，并在响应或错误时记录相应的日志
   * 
   * @param context - 执行上下文
   * @param next - 下一个处理程序
   * @returns 返回响应数据流
   */
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const { method, url } = request;
    const now = Date.now();

    const sanitizedBody = this.sanitizeData(request.body);
    const sanitizedQuery = this.sanitizeData(request.query);
    const sanitizedParams = this.sanitizeData(request.params);
    const sanitizedHeaders = this.sanitizeData(request.headers);

    this.addToBuffer({
      type: 'Request',
      timestamp: now,
      method,
      url,
      body: sanitizedBody,
      query: sanitizedQuery,
      params: sanitizedParams,
      headers: sanitizedHeaders,
    });

    return next.handle().pipe(
      tap({
        next: (data: any) => {
          const response = context.switchToHttp().getResponse<FastifyReply>();
          this.addToBuffer({
            type: 'Response',
            timestamp: Date.now(),
            method,
            url,
            statusCode: response.statusCode,
            duration: Date.now() - now,
          });
        },
        error: (error: any) => {
          this.addToBuffer({
            type: 'Error',
            timestamp: Date.now(),
            method,
            url,
            error: {
              message: error.message,
              stack: error.stack,
            },
            duration: Date.now() - now,
          });
        },
      }),
    );
  }

  /**
   * 添加日志到缓冲区
   * 
   * @description 将日志条目添加到缓冲区，当缓冲区满或达到刷新间隔时自动刷新
   * 
   * @param entry - 日志条目
   */
  private addToBuffer(entry: LogEntry): void {
    this.logBuffer.push(entry);

    if (this.logBuffer.length >= LoggerInterceptor.LOG_BUFFER_SIZE) {
      setImmediate(() => this.flushLogs());
      return;
    }

    if (!this.flushTimeout) {
      this.flushTimeout = setTimeout(() => {
        this.flushLogs();
        this.flushTimeout = null;
      }, LoggerInterceptor.FLUSH_INTERVAL);
    }
  }

  /**
   * 刷新日志
   * 
   * @description 将缓冲区中的日志写入到日志记录器
   */
  private flushLogs(): void {
    if (this.logBuffer.length === 0) {
      return;
    }

    const logs = this.logBuffer.splice(0, this.logBuffer.length);

    const requests = logs.filter((log) => log.type === 'Request');
    const errors = logs.filter((log) => log.type === 'Error');

    requests.forEach((log) => {
      this.logger.info('HTTP Request', {
        method: log.method,
        url: log.url,
        body: log.body,
        query: log.query,
        params: log.params,
        timestamp: new Date(log.timestamp).toISOString(),
      });
    });

    errors.forEach((log) => {
      this.logger.error('Request Error', {
        method: log.method,
        url: log.url,
        error: log.error,
        duration: log.duration,
        timestamp: new Date(log.timestamp).toISOString(),
      });
    });
  }

  /**
   * 脱敏数据
   * 
   * @description 移除或替换敏感字段的值，防止敏感信息泄露
   * 
   * @param data - 要脱敏的数据
   * @returns 返回脱敏后的数据
   */
  private sanitizeData(data: any): any {
    if (!data) return data;

    if (Array.isArray(data)) {
      return data.map((item) => this.sanitizeData(item));
    }

    if (typeof data === 'object') {
      const sanitized = { ...data };
      for (const key of Object.keys(sanitized)) {
        if (LoggerInterceptor.SENSITIVE_FIELDS.includes(key.toLowerCase())) {
          sanitized[key] = '[REDACTED]';
        } else if (typeof sanitized[key] === 'object') {
          sanitized[key] = this.sanitizeData(sanitized[key]);
        }
      }
      return sanitized;
    }

    return data;
  }
}
