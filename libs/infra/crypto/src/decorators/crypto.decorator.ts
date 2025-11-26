import { SetMetadata, applyDecorators } from '@nestjs/common';

import {
  AESConfig,
  CRYPTO_DIRECTION_METADATA,
  CRYPTO_METHOD_METADATA,
  CRYPTO_OPTIONS_METADATA,
  CryptoConfig,
  CryptoDirection,
  CryptoMethod,
  RSAConfig,
} from '../constants/crypto.constant';

/**
 * 加密装饰器
 *
 * @description 标记路由需要加密处理，可以指定加密方法、方向和配置
 *
 * @param method - 加密方法（默认 AES）
 * @param direction - 加密方向（默认 ENCRYPT，只加密响应）
 * @param config - 加密配置（AES 或 RSA 配置）
 * @returns 返回方法装饰器
 *
 * @example
 * ```typescript
 * @Crypto(CryptoMethod.AES, CryptoDirection.BOTH, { mode: AESMode.CBC })
 * @Post('encrypted')
 * async encryptedRoute() { ... }
 * ```
 */
export const Crypto = (
  method: CryptoMethod = CryptoMethod.AES,
  direction: CryptoDirection = CryptoDirection.ENCRYPT,
  config?: Partial<AESConfig | RSAConfig>,
) => {
  const options: Partial<CryptoConfig> = {
    method,
    direction,
    ...(method === CryptoMethod.AES
      ? { aes: config as AESConfig }
      : { rsa: config as RSAConfig }),
  };

  return applyDecorators(
    SetMetadata(CRYPTO_METHOD_METADATA, method),
    SetMetadata(CRYPTO_DIRECTION_METADATA, direction),
    SetMetadata(CRYPTO_OPTIONS_METADATA, options),
  );
};

/**
 * AES 加密装饰器
 *
 * @description 使用 AES 方法加密的快捷装饰器
 *
 * @param config - AES 配置（可选）
 * @param direction - 加密方向（默认 ENCRYPT）
 * @returns 返回方法装饰器
 *
 * @example
 * ```typescript
 * @AESCrypto({ mode: AESMode.CBC }, CryptoDirection.BOTH)
 * @Post('aes-encrypted')
 * async aesEncryptedRoute() { ... }
 * ```
 */
export const AESCrypto = (
  config: Partial<AESConfig> = {},
  direction: CryptoDirection = CryptoDirection.ENCRYPT,
) => Crypto(CryptoMethod.AES, direction, config);

/**
 * RSA 加密装饰器
 *
 * @description 使用 RSA 方法加密的快捷装饰器
 *
 * @param config - RSA 配置（可选）
 * @param direction - 加密方向（默认 ENCRYPT）
 * @returns 返回方法装饰器
 *
 * @example
 * ```typescript
 * @RSACrypto({ padding: RSAPaddingMode.PKCS1 }, CryptoDirection.BOTH)
 * @Post('rsa-encrypted')
 * async rsaEncryptedRoute() { ... }
 * ```
 */
export const RSACrypto = (
  config: Partial<RSAConfig> = {},
  direction: CryptoDirection = CryptoDirection.ENCRYPT,
) => Crypto(CryptoMethod.RSA, direction, config);

/**
 * 加密配置装饰器
 *
 * @description 直接使用完整的加密配置对象设置加密参数
 *
 * @param config - 加密配置对象（必须包含 method 字段）
 * @returns 返回方法装饰器
 *
 * @throws {Error} 当配置中缺少 method 字段时抛出
 *
 * @example
 * ```typescript
 * @WithCryptoConfig({
 *   method: CryptoMethod.AES,
 *   direction: CryptoDirection.BOTH,
 *   aes: { mode: AESMode.CBC }
 * })
 * @Post('custom-encrypted')
 * async customEncryptedRoute() { ... }
 * ```
 */
export const WithCryptoConfig = (config: Partial<CryptoConfig>) => {
  if (!config.method) {
    throw new Error('WithCryptoConfig: method is required');
  }
  return SetMetadata(CRYPTO_OPTIONS_METADATA, config);
};
