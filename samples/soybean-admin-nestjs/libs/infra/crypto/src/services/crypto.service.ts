import {
  createCipheriv,
  createDecipheriv,
  privateDecrypt,
  publicEncrypt,
  randomBytes,
  constants,
} from 'crypto';

import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';

import { CryptoConfig as CryptoConfigType } from '@lib/config/crypto.config';

import {
  AESMode,
  CryptoMethod,
  PaddingMode,
  RSAPaddingMode,
  CryptoConfig,
  AESConfig,
  RSAConfig,
} from '../constants/crypto.constant';

/**
 * 加密服务
 * 
 * @description 提供数据加密和解密功能，支持 AES 和 RSA 加密方法
 * 
 * @class CryptoService
 */
@Injectable()
export class CryptoService {
  private readonly logger = new Logger(CryptoService.name);

  /**
   * 构造函数
   * 
   * @param config - 加密配置对象
   * @param moduleOptions - 模块选项，包含默认加密方法和 AES 配置
   */
  constructor(
    @Inject(CryptoConfigType.KEY)
    private readonly config: ConfigType<typeof CryptoConfigType>,
    @Inject('CRYPTO_MODULE_OPTIONS')
    private readonly moduleOptions: {
      defaultMethod: CryptoMethod;
      aes: AESConfig;
    },
  ) {}

  /**
   * 加密数据
   * 
   * @description 使用指定的加密方法加密数据，支持 AES 和 RSA
   * 
   * @param data - 待加密的数据（可以是任意类型，会自动序列化）
   * @param config - 加密配置（可选，不提供时使用默认配置）
   * @returns 返回加密后的 Base64 编码字符串
   * 
   * @throws {Error} 当加密方法不支持时抛出
   * 
   * @example
   * ```typescript
   * const encrypted = cryptoService.encrypt({ name: 'test' }, {
   *   method: CryptoMethod.AES,
   *   aes: { mode: AESMode.CBC }
   * });
   * ```
   */
  encrypt(data: any, config?: Partial<CryptoConfig>): string {
    const method = config?.method || this.moduleOptions.defaultMethod;
    this.logger.debug(`Encrypting data with method: ${method}`);

    // 序列化数据
    const serializedData = this.serializeData(data);
    this.logger.debug(`Serialized data: ${serializedData}`);

    // 加密数据
    const encrypted = this.encryptData(serializedData, method, config);
    this.logger.debug(`Encrypted data: ${encrypted}`);

    return encrypted;
  }

  /**
   * 解密数据
   * 
   * @description 使用指定的解密方法解密数据，支持 AES 和 RSA
   * 
   * @param encryptedData - 加密后的 Base64 编码字符串
   * @param config - 解密配置（可选，不提供时使用默认配置）
   * @returns 返回解密后的数据（会自动反序列化为原始类型）
   * 
   * @throws {Error} 当解密方法不支持或解密失败时抛出
   * 
   * @example
   * ```typescript
   * const decrypted = cryptoService.decrypt(encryptedString, {
   *   method: CryptoMethod.AES,
   *   aes: { mode: AESMode.CBC }
   * });
   * ```
   */
  decrypt(encryptedData: string, config?: Partial<CryptoConfig>): any {
    const method = config?.method || this.moduleOptions.defaultMethod;
    this.logger.debug(`Decrypting data with method: ${method}`);

    // 解密数据
    const decrypted = this.decryptData(encryptedData, method, config);
    this.logger.debug(`Decrypted data: ${decrypted}`);

    // 反序列化数据
    const deserialized = this.deserializeData(decrypted);
    this.logger.debug(`Deserialized data: ${JSON.stringify(deserialized)}`);

    return deserialized;
  }

  /**
   * 序列化数据
   * 
   * @description 将数据序列化为字符串，字符串直接返回，对象转为 JSON
   * 
   * @param data - 要序列化的数据
   * @returns 返回序列化后的字符串
   */
  private serializeData(data: any): string {
    if (typeof data === 'string') {
      return data;
    }
    return JSON.stringify(data);
  }

  /**
   * 反序列化数据
   * 
   * @description 将字符串反序列化为对象，如果解析失败则返回原始字符串
   * 
   * @param data - 要反序列化的字符串
   * @returns 返回反序列化后的数据或原始字符串
   */
  private deserializeData(data: string): any {
    try {
      return JSON.parse(data);
    } catch {
      return data;
    }
  }

  /**
   * 加密数据
   * 
   * @description 根据加密方法选择对应的加密实现
   * 
   * @param data - 要加密的字符串数据
   * @param method - 加密方法（AES 或 RSA）
   * @param config - 加密配置
   * @returns 返回加密后的 Base64 编码字符串
   * @throws {Error} 当加密方法不支持时抛出
   */
  private encryptData(
    data: string,
    method: CryptoMethod,
    config?: Partial<CryptoConfig>,
  ): string {
    switch (method) {
      case CryptoMethod.AES:
        return this.encryptAES(data, config?.aes);
      case CryptoMethod.RSA:
        return this.encryptRSA(data, config?.rsa);
      default:
        throw new Error(`Unsupported encryption method: ${method}`);
    }
  }

  /**
   * 解密数据
   * 
   * @description 根据解密方法选择对应的解密实现
   * 
   * @param data - 要解密的 Base64 编码字符串
   * @param method - 解密方法（AES 或 RSA）
   * @param config - 解密配置
   * @returns 返回解密后的字符串
   * @throws {Error} 当解密方法不支持时抛出
   */
  private decryptData(
    data: string,
    method: CryptoMethod,
    config?: Partial<CryptoConfig>,
  ): string {
    switch (method) {
      case CryptoMethod.AES:
        return this.decryptAES(data, config?.aes);
      case CryptoMethod.RSA:
        return this.decryptRSA(data, config?.rsa);
      default:
        throw new Error(`Unsupported decryption method: ${method}`);
    }
  }

  /**
   * AES 加密
   * 
   * @description 使用 AES 算法加密数据，支持 CBC 模式、PKCS7 填充和随机 IV
   * 
   * @param data - 要加密的字符串数据
   * @param config - AES 配置（可选）
   * @returns 返回加密后的 Base64 编码字符串（如果使用随机 IV，IV 会拼接在数据前面）
   */
  private encryptAES(data: string, config?: Partial<AESConfig>): string {
    const {
      mode = this.moduleOptions.aes.mode,
      padding = this.moduleOptions.aes.padding,
      useRandomIV = this.moduleOptions.aes.useRandomIV,
    } = config || {};

    this.logger.debug(
      `AES encryption config - Mode: ${mode}, Padding: ${padding}, UseRandomIV: ${useRandomIV}`,
    );

    const iv = useRandomIV ? randomBytes(16) : Buffer.from(this.config.aesIv);
    const key = Buffer.from(config?.key || this.config.aesKey);

    this.logger.debug(
      `Using key length: ${key.length}, IV length: ${iv.length}`,
    );

    const cipher = createCipheriv(mode, key, iv);
    cipher.setAutoPadding(padding !== PaddingMode.NoPadding);

    const encrypted = Buffer.concat([
      cipher.update(Buffer.from(data)),
      cipher.final(),
    ]);

    // 如果使用随机IV，将IV和加密数据拼接
    const result = useRandomIV
      ? Buffer.concat([iv, encrypted]).toString('base64')
      : encrypted.toString('base64');

    return result;
  }

  /**
   * AES 解密
   * 
   * @description 使用 AES 算法解密数据，支持 CBC 模式、PKCS7 填充和随机 IV
   * 
   * @param encryptedData - 加密后的 Base64 编码字符串
   * @param config - AES 配置（可选）
   * @returns 返回解密后的字符串
   * @throws {Error} 当加密数据格式无效时抛出
   */
  private decryptAES(
    encryptedData: string,
    config?: Partial<AESConfig>,
  ): string {
    const {
      mode = this.moduleOptions.aes.mode,
      padding = this.moduleOptions.aes.padding,
      useRandomIV = this.moduleOptions.aes.useRandomIV,
    } = config || {};

    this.logger.debug(
      `AES decryption config - Mode: ${mode}, Padding: ${padding}, UseRandomIV: ${useRandomIV}`,
    );

    const encryptedBuffer = Buffer.from(encryptedData, 'base64');

    let iv: Buffer;
    let dataToDecrypt: Buffer;

    if (useRandomIV) {
      if (encryptedBuffer.length < 16) {
        throw new Error('Invalid encrypted data: too short for IV');
      }
      iv = encryptedBuffer.subarray(0, 16);
      dataToDecrypt = encryptedBuffer.subarray(16);
    } else {
      iv = Buffer.from(this.config.aesIv);
      dataToDecrypt = encryptedBuffer;
    }

    const key = Buffer.from(config?.key || this.config.aesKey);

    this.logger.debug(
      `Using key length: ${key.length}, IV length: ${iv.length}, Data length: ${dataToDecrypt.length}`,
    );

    const decipher = createDecipheriv(mode, key, iv);
    decipher.setAutoPadding(padding !== PaddingMode.NoPadding);

    const decrypted = Buffer.concat([
      decipher.update(dataToDecrypt),
      decipher.final(),
    ]);

    return decrypted.toString('utf8');
  }

  /**
   * RSA 加密
   * 
   * @description 使用 RSA 公钥加密数据，支持 PKCS1 和 PKCS1_OAEP 填充模式
   * 
   * @param data - 要加密的字符串数据
   * @param config - RSA 配置（可选）
   * @returns 返回加密后的 Base64 编码字符串
   * @throws {Error} 当 RSA 公钥不存在时抛出
   */
  private encryptRSA(data: string, config?: Partial<RSAConfig>): string {
    const publicKey = config?.publicKey || this.config.rsaPublicKey;
    if (!publicKey) {
      throw new Error('RSA public key is required');
    }

    const encrypted = publicEncrypt(
      {
        key: publicKey,
        padding:
          config?.padding === RSAPaddingMode.PKCS1
            ? constants.RSA_PKCS1_PADDING
            : constants.RSA_PKCS1_OAEP_PADDING,
      },
      Buffer.from(data),
    );

    return encrypted.toString('base64');
  }

  /**
   * RSA 解密
   * 
   * @description 使用 RSA 私钥解密数据，支持 PKCS1 和 PKCS1_OAEP 填充模式
   * 
   * @param encryptedData - 加密后的 Base64 编码字符串
   * @param config - RSA 配置（可选）
   * @returns 返回解密后的字符串
   * @throws {Error} 当 RSA 私钥不存在时抛出
   */
  private decryptRSA(
    encryptedData: string,
    config?: Partial<RSAConfig>,
  ): string {
    const privateKey = config?.privateKey || this.config.rsaPrivateKey;
    if (!privateKey) {
      throw new Error('RSA private key is required');
    }

    const decrypted = privateDecrypt(
      {
        key: privateKey,
        padding:
          config?.padding === RSAPaddingMode.PKCS1
            ? constants.RSA_PKCS1_PADDING
            : constants.RSA_PKCS1_OAEP_PADDING,
      },
      Buffer.from(encryptedData, 'base64'),
    );

    return decrypted.toString('utf8');
  }
}
