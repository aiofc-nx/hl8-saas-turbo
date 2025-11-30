import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { ApiRes } from '@lib/infra/rest/res.response';

import {
  CRYPTO_HEADER,
  CRYPTO_METHOD_METADATA,
  CRYPTO_OPTIONS_METADATA,
  CRYPTO_DIRECTION_METADATA,
  CryptoMethod,
  CryptoDirection,
  CryptoConfig,
} from '../constants/crypto.constant';
import { CryptoService } from '../services/crypto.service';

/**
 * 加密拦截器
 * 
 * @description 处理请求解密和响应加密的拦截器，支持 AES 和 RSA 加密方法
 * 
 * @class CryptoInterceptor
 * @implements {NestInterceptor}
 */
@Injectable()
export class CryptoInterceptor implements NestInterceptor {
  private readonly logger = new Logger(CryptoInterceptor.name);

  /**
   * 构造函数
   * 
   * @param reflector - NestJS 反射器，用于获取路由元数据
   * @param cryptoService - 加密服务实例
   */
  constructor(
    private readonly reflector: Reflector,
    private readonly cryptoService: CryptoService,
  ) {}

  /**
   * 拦截请求和响应
   * 
   * @description 根据加密配置对请求进行解密，对响应进行加密
   * 
   * @param context - 执行上下文，包含请求和响应对象
   * @param next - 下一个处理程序
   * @returns 返回处理后的响应数据流
   * 
   * @example
   * 使用 @Crypto() 装饰器标记需要加密的路由
   */
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const cryptoConfig = this.getCryptoConfig(context);

    // 如果没有加密配置，直接返回
    if (!cryptoConfig) {
      return next.handle();
    }

    // 处理请求解密
    if (this.shouldDecrypt(cryptoConfig.direction)) {
      this.decryptRequest(request, cryptoConfig);
    }

    // 处理响应加密
    return next.handle().pipe(
      map((data: any) => {
        if (!this.shouldEncrypt(cryptoConfig.direction)) {
          return data;
        }
        return this.encryptResponse(data, cryptoConfig);
      }),
    );
  }

  /**
   * 获取加密配置
   * 
   * @description 从路由装饰器或请求头中获取加密配置，如果都没有则返回 null
   * 
   * @param context - 执行上下文
   * @returns 返回加密配置对象或 null
   */
  private getCryptoConfig(
    context: ExecutionContext,
  ): Partial<CryptoConfig> | null {
    const handler = context.getHandler();
    const cryptoHeader = context.switchToHttp().getRequest().headers[
      CRYPTO_HEADER
    ];

    // 获取装饰器配置
    const method = this.reflector.get<CryptoMethod>(
      CRYPTO_METHOD_METADATA,
      handler,
    );
    const options = this.reflector.get<Partial<CryptoConfig>>(
      CRYPTO_OPTIONS_METADATA,
      handler,
    );
    const direction = this.reflector.get<CryptoDirection>(
      CRYPTO_DIRECTION_METADATA,
      handler,
    );

    // 如果既没有请求头也没有装饰器，则不处理
    if (!cryptoHeader && !method) {
      return null;
    }

    // 如果有请求头但没有装饰器，使用默认配置
    const defaultConfig: Partial<CryptoConfig> = {
      method: CryptoMethod.AES,
      direction: CryptoDirection.BOTH,
    };

    const config: Partial<CryptoConfig> = method
      ? {
          method,
          direction,
          ...(method === CryptoMethod.AES
            ? { aes: options?.aes }
            : { rsa: options?.rsa }),
        }
      : defaultConfig;

    this.logger.debug(
      `Crypto config - Method: ${config.method}, Direction: ${
        config.direction
      }, Options: ${JSON.stringify(options)}`,
    );

    return config;
  }

  /**
   * 判断是否需要解密
   * 
   * @description 根据加密方向判断是否需要解密请求
   * 
   * @param direction - 加密方向（DECRYPT 或 BOTH 时需要解密）
   * @returns 返回 true 表示需要解密，false 表示不需要
   */
  private shouldDecrypt(direction?: CryptoDirection): boolean {
    return (
      direction === CryptoDirection.DECRYPT ||
      direction === CryptoDirection.BOTH
    );
  }

  /**
   * 判断是否需要加密
   * 
   * @description 根据加密方向判断是否需要加密响应
   * 
   * @param direction - 加密方向（ENCRYPT 或 BOTH 时需要加密）
   * @returns 返回 true 表示需要加密，false 表示不需要
   */
  private shouldEncrypt(direction?: CryptoDirection): boolean {
    return (
      direction === CryptoDirection.ENCRYPT ||
      direction === CryptoDirection.BOTH
    );
  }

  /**
   * 解密请求
   * 
   * @description 解密请求体中的数据
   * 
   * @param request - HTTP 请求对象
   * @param config - 加密配置
   * @throws {Error} 当解密失败时抛出错误
   */
  private decryptRequest(request: any, config: Partial<CryptoConfig>): void {
    try {
      // 如果请求体为空，则不进行解密
      if (!request.body) {
        this.logger.debug('Request body is empty, skipping decryption');
        return;
      }

      request.body = this.cryptoService.decrypt(request.body, config);
      this.logger.debug(`Request body decrypted: ${request.body}`);
    } catch (error) {
      this.logger.error(`Failed to decrypt request body: ${error.message}`);
      throw error;
    }
  }

  /**
   * 加密响应
   * 
   * @description 加密响应数据，如果是 ApiRes 格式则只加密 data 字段，否则加密整个响应
   * 
   * @param data - 响应数据
   * @param config - 加密配置
   * @returns 返回加密后的数据（字符串或 ApiRes 对象）
   * @throws {Error} 当加密失败时抛出错误
   */
  private encryptResponse(
    data: any,
    config: Partial<CryptoConfig>,
  ): string | ApiRes<any> {
    try {
      // 如果是 ApiRes 格式，只加密 data 字段
      if (this.isApiResponse(data)) {
        const encrypted = this.cryptoService.encrypt(data.data, config);
        this.logger.debug(
          `Response data encrypted: ${encrypted}, Original: ${JSON.stringify(
            data.data,
          )}`,
        );
        return {
          ...data,
          data: encrypted,
        };
      }

      // 否则加密整个响应
      const encrypted = this.cryptoService.encrypt(data, config);
      this.logger.debug(
        `Full response encrypted: ${encrypted}, Original: ${JSON.stringify(
          data,
        )}`,
      );
      return encrypted;
    } catch (error) {
      this.logger.error(`Failed to encrypt response: ${error.message}`);
      throw error;
    }
  }

  /**
   * 判断是否为 ApiRes 格式
   * 
   * @description 检查数据对象是否符合 ApiRes 格式（包含 code、message、data 字段）
   * 
   * @param data - 要检查的数据对象
   * @returns 返回 true 表示是 ApiRes 格式，false 表示不是
   */
  private isApiResponse(data: any): data is ApiRes<any> {
    return (
      data &&
      typeof data === 'object' &&
      'code' in data &&
      'message' in data &&
      'data' in data
    );
  }
}
