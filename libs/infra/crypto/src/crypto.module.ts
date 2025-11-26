import { DynamicModule, Global, Module, Provider } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';

import { CryptoConfig as CryptoConfigRegister } from '@hl8/config';

import {
  AESMode,
  CryptoMethod,
  PaddingMode,
} from './constants/crypto.constant';
import { CryptoInterceptor } from './interceptors/crypto.interceptor';
import { CryptoService } from './services/crypto.service';

/**
 * 加密模块配置选项
 *
 * @description 定义加密模块的配置选项
 */
export interface CryptoModuleOptions {
  /**
   * 是否全局启用
   *
   * @default true
   */
  isGlobal?: boolean;

  /**
   * 默认加密方法
   *
   * @default CryptoMethod.AES
   */
  defaultMethod?: CryptoMethod;

  /**
   * AES 配置
   */
  aes?: {
    /**
     * 加密模式
     *
     * @default AESMode.CBC
     */
    mode?: AESMode;
    /**
     * 填充模式
     *
     * @default PaddingMode.PKCS7
     */
    padding?: PaddingMode;
    /**
     * 是否使用随机 IV
     *
     * @default false
     */
    useRandomIV?: boolean;
  };
}

/**
 * 加密模块
 *
 * @description 提供数据加密和解密功能，支持 AES 和 RSA 加密方法，可全局启用加密拦截器
 *
 * @class CryptoModule
 */
@Global()
@Module({
  imports: [ConfigModule.forFeature(CryptoConfigRegister)],
  providers: [CryptoService],
  exports: [CryptoService],
})
export class CryptoModule {
  /**
   * 注册动态模块
   *
   * @description 动态注册加密模块，配置加密方法和选项，并可选择是否全局启用拦截器
   *
   * @param options - 模块配置选项
   * @returns 返回动态模块配置
   *
   * @example
   * ```typescript
   * CryptoModule.register({
   *   isGlobal: true,
   *   defaultMethod: CryptoMethod.AES,
   *   aes: {
   *     mode: AESMode.CBC,
   *     padding: PaddingMode.PKCS7,
   *     useRandomIV: false
   *   }
   * })
   * ```
   */
  static register(options: CryptoModuleOptions = {}): DynamicModule {
    const {
      isGlobal = true,
      defaultMethod = CryptoMethod.AES,
      aes = {
        mode: AESMode.CBC,
        padding: PaddingMode.PKCS7,
        useRandomIV: false,
      },
    } = options;

    const optionsProvider: Provider = {
      provide: 'CRYPTO_MODULE_OPTIONS',
      useValue: {
        defaultMethod,
        aes,
      },
    };

    return {
      module: CryptoModule,
      global: isGlobal,
      imports: [ConfigModule.forFeature(CryptoConfigRegister)],
      providers: [
        optionsProvider,
        CryptoService,
        {
          provide: APP_INTERCEPTOR,
          useClass: CryptoInterceptor,
        },
      ],
      exports: [CryptoService],
    };
  }
}
