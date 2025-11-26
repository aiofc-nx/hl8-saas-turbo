import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import { CallHandler, ExecutionContext, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { of } from 'rxjs';

import { ApiRes } from '@hl8/rest';

import {
  CRYPTO_HEADER,
  CryptoDirection,
  CryptoMethod,
} from '../constants/crypto.constant';
import { CryptoService } from '../services/crypto.service';
import { CryptoInterceptor } from './crypto.interceptor';

describe('CryptoInterceptor', () => {
  let interceptor: CryptoInterceptor;
  let cryptoService: jest.Mocked<CryptoService>;
  let reflector: jest.Mocked<Reflector>;
  let mockLoggerDebug: jest.SpiedFunction<typeof Logger.debug>;
  let mockLoggerError: jest.SpiedFunction<typeof Logger.error>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockLoggerDebug = jest.spyOn(Logger, 'debug').mockImplementation(() => {});
    mockLoggerError = jest.spyOn(Logger, 'error').mockImplementation(() => {});

    cryptoService = {
      encrypt: jest.fn(),
      decrypt: jest.fn(),
    } as unknown as jest.Mocked<CryptoService>;

    reflector = {
      get: jest.fn(),
    } as unknown as jest.Mocked<Reflector>;

    interceptor = new CryptoInterceptor(reflector, cryptoService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('构造函数', () => {
    it('应该正确初始化拦截器', () => {
      expect(interceptor).toBeDefined();
      expect(interceptor).toBeInstanceOf(CryptoInterceptor);
    });
  });

  describe('intercept - 无加密配置', () => {
    it('当没有加密配置时应该直接返回', (done) => {
      // Arrange
      const mockContext = createMockContext({});
      const mockHandler = createMockHandler({ data: 'test' });

      reflector.get.mockReturnValue(undefined);

      // Act
      const result = interceptor.intercept(mockContext, mockHandler);

      // Assert
      result.subscribe({
        next: (data) => {
          expect(data).toBe('test');
          expect(cryptoService.encrypt).not.toHaveBeenCalled();
          expect(cryptoService.decrypt).not.toHaveBeenCalled();
          done();
        },
      });
    });
  });

  describe('intercept - 请求解密', () => {
    it('应该在方向为 DECRYPT 时解密请求体', (done) => {
      // Arrange
      const encryptedBody = 'encrypted body';
      const decryptedBody = { name: 'test' };
      const mockContext = createMockContext({
        body: encryptedBody,
      });
      const mockHandler = createMockHandler({ data: 'response' });

      reflector.get
        .mockReturnValueOnce(CryptoMethod.AES) // method
        .mockReturnValueOnce({}) // options
        .mockReturnValueOnce(CryptoDirection.DECRYPT); // direction

      cryptoService.decrypt.mockReturnValue(decryptedBody);

      // Act
      const result = interceptor.intercept(mockContext, mockHandler);

      // Assert
      result.subscribe({
        next: (data) => {
          expect(cryptoService.decrypt).toHaveBeenCalledWith(
            encryptedBody,
            expect.objectContaining({
              method: CryptoMethod.AES,
              direction: CryptoDirection.DECRYPT,
            }),
          );
          expect(mockContext.switchToHttp().getRequest().body).toBe(
            decryptedBody,
          );
          expect(data).toBe('response');
          done();
        },
      });
    });

    it('应该在方向为 BOTH 时解密请求体', (done) => {
      // Arrange
      const encryptedBody = 'encrypted body';
      const decryptedBody = { name: 'test' };
      const mockContext = createMockContext({
        body: encryptedBody,
      });
      const mockHandler = createMockHandler({ data: 'response' });

      reflector.get
        .mockReturnValueOnce(CryptoMethod.AES) // method
        .mockReturnValueOnce({}) // options
        .mockReturnValueOnce(CryptoDirection.BOTH); // direction

      cryptoService.decrypt.mockReturnValue(decryptedBody);

      // Act
      const result = interceptor.intercept(mockContext, mockHandler);

      // Assert
      result.subscribe({
        next: () => {
          expect(cryptoService.decrypt).toHaveBeenCalled();
          expect(mockContext.switchToHttp().getRequest().body).toBe(
            decryptedBody,
          );
          done();
        },
      });
    });

    it('应该在请求体为空时跳过解密', (done) => {
      // Arrange
      const mockContext = createMockContext({
        body: null,
      });
      const mockHandler = createMockHandler({ data: 'response' });

      reflector.get
        .mockReturnValueOnce(CryptoMethod.AES) // method
        .mockReturnValueOnce({}) // options
        .mockReturnValueOnce(CryptoDirection.DECRYPT); // direction

      // Act
      const result = interceptor.intercept(mockContext, mockHandler);

      // Assert
      result.subscribe({
        next: (data) => {
          // 验证解密方法没有被调用（因为请求体为空）
          expect(cryptoService.decrypt).not.toHaveBeenCalled();
          // 验证响应数据正常返回
          expect(data).toBe('response');
          // 验证请求体仍然是 null（没有被修改）
          expect(mockContext.switchToHttp().getRequest().body).toBeNull();
          done();
        },
        error: (err) => {
          done(err);
        },
      });
    });

    it('应该在解密失败时抛出错误', () => {
      // Arrange
      const encryptedBody = 'invalid encrypted body';
      const mockContext = createMockContext({
        body: encryptedBody,
      });
      const mockHandler = createMockHandler({ data: 'response' });

      reflector.get
        .mockReturnValueOnce(CryptoMethod.AES) // method
        .mockReturnValueOnce({}) // options
        .mockReturnValueOnce(CryptoDirection.DECRYPT); // direction

      const error = new Error('Decryption failed');
      cryptoService.decrypt.mockImplementation(() => {
        throw error;
      });

      // Act & Assert
      // decryptRequest 是同步的，会在 intercept 调用时立即抛出错误
      expect(() => {
        interceptor.intercept(mockContext, mockHandler);
      }).toThrow('Decryption failed');

      // 验证解密方法被调用了（尝试解密但失败）
      expect(cryptoService.decrypt).toHaveBeenCalledWith(
        encryptedBody,
        expect.objectContaining({
          method: CryptoMethod.AES,
          direction: CryptoDirection.DECRYPT,
        }),
      );
    });
  });

  describe('intercept - 响应加密', () => {
    it('应该在方向为 ENCRYPT 时加密响应', (done) => {
      // Arrange
      const responseData = { name: 'test' };
      const encryptedData = 'encrypted response';
      const mockContext = createMockContext({});
      const mockHandler = createMockHandler({ data: responseData });

      reflector.get
        .mockReturnValueOnce(CryptoMethod.AES) // method
        .mockReturnValueOnce({}) // options
        .mockReturnValueOnce(CryptoDirection.ENCRYPT); // direction

      cryptoService.encrypt.mockReturnValue(encryptedData);

      // Act
      const result = interceptor.intercept(mockContext, mockHandler);

      // Assert
      result.subscribe({
        next: (data) => {
          expect(cryptoService.encrypt).toHaveBeenCalledWith(
            responseData,
            expect.objectContaining({
              method: CryptoMethod.AES,
              direction: CryptoDirection.ENCRYPT,
            }),
          );
          expect(data).toBe(encryptedData);
          done();
        },
      });
    });

    it('应该在方向为 BOTH 时加密响应', (done) => {
      // Arrange
      const responseData = { name: 'test' };
      const encryptedData = 'encrypted response';
      const mockContext = createMockContext({});
      const mockHandler = createMockHandler({ data: responseData });

      reflector.get
        .mockReturnValueOnce(CryptoMethod.AES) // method
        .mockReturnValueOnce({}) // options
        .mockReturnValueOnce(CryptoDirection.BOTH); // direction

      cryptoService.encrypt.mockReturnValue(encryptedData);

      // Act
      const result = interceptor.intercept(mockContext, mockHandler);

      // Assert
      result.subscribe({
        next: (data) => {
          expect(cryptoService.encrypt).toHaveBeenCalled();
          expect(data).toBe(encryptedData);
          done();
        },
      });
    });

    it('应该在方向为 DECRYPT 时不加密响应', (done) => {
      // Arrange
      const responseData = { name: 'test' };
      const mockContext = createMockContext({});
      const mockHandler = createMockHandler({ data: responseData });

      reflector.get
        .mockReturnValueOnce(CryptoMethod.AES) // method
        .mockReturnValueOnce({}) // options
        .mockReturnValueOnce(CryptoDirection.DECRYPT); // direction

      // Act
      const result = interceptor.intercept(mockContext, mockHandler);

      // Assert
      result.subscribe({
        next: (data) => {
          expect(cryptoService.encrypt).not.toHaveBeenCalled();
          expect(data).toBe(responseData);
          done();
        },
      });
    });

    it('应该加密 ApiRes 格式的响应中的 data 字段', (done) => {
      // Arrange
      const apiResponse: ApiRes<{ name: string }> = {
        code: 200,
        message: 'success',
        data: { name: 'test' },
      };
      const encryptedData = 'encrypted data';
      const mockContext = createMockContext({});
      const mockHandler = createMockHandler({ data: apiResponse });

      reflector.get
        .mockReturnValueOnce(CryptoMethod.AES) // method
        .mockReturnValueOnce({}) // options
        .mockReturnValueOnce(CryptoDirection.ENCRYPT); // direction

      cryptoService.encrypt.mockReturnValue(encryptedData);

      // Act
      const result = interceptor.intercept(mockContext, mockHandler);

      // Assert
      result.subscribe({
        next: (data) => {
          expect(cryptoService.encrypt).toHaveBeenCalledWith(
            apiResponse.data,
            expect.any(Object),
          );
          expect(data).toEqual({
            code: 200,
            message: 'success',
            data: encryptedData,
          });
          done();
        },
      });
    });

    it('应该在加密失败时抛出错误', (done) => {
      // Arrange
      const responseData = { name: 'test' };
      const mockContext = createMockContext({});
      const mockHandler = createMockHandler({ data: responseData });

      reflector.get
        .mockReturnValueOnce(CryptoMethod.AES) // method
        .mockReturnValueOnce({}) // options
        .mockReturnValueOnce(CryptoDirection.ENCRYPT); // direction

      const error = new Error('Encryption failed');
      cryptoService.encrypt.mockImplementation(() => {
        throw error;
      });

      // Act & Assert
      const result = interceptor.intercept(mockContext, mockHandler);

      result.subscribe({
        next: () => {
          done(new Error('Expected error but got success'));
        },
        error: (err) => {
          // 验证错误被正确抛出
          expect(err).toBe(error);
          // 验证加密方法被调用了（尝试加密但失败）
          expect(cryptoService.encrypt).toHaveBeenCalledWith(
            responseData,
            expect.objectContaining({
              method: CryptoMethod.AES,
              direction: CryptoDirection.ENCRYPT,
            }),
          );
          done();
        },
      });
    });
  });

  describe('getCryptoConfig - 从装饰器获取配置', () => {
    it('应该从装饰器获取加密方法', () => {
      // Arrange
      const mockContext = createMockContext({});

      reflector.get
        .mockReturnValueOnce(CryptoMethod.AES) // method
        .mockReturnValueOnce({}) // options
        .mockReturnValueOnce(CryptoDirection.BOTH); // direction

      // Act
      const config = (interceptor as any).getCryptoConfig(mockContext);

      // Assert
      // 当 options 为空对象时，options?.aes 是 undefined
      expect(config).toEqual({
        method: CryptoMethod.AES,
        direction: CryptoDirection.BOTH,
        aes: undefined,
      });
    });

    it('应该从装饰器获取 RSA 配置', () => {
      // Arrange
      const mockContext = createMockContext({});

      reflector.get
        .mockReturnValueOnce(CryptoMethod.RSA) // method
        .mockReturnValueOnce({ rsa: { padding: 'pkcs1' } }) // options (包含 rsa 字段)
        .mockReturnValueOnce(CryptoDirection.ENCRYPT); // direction

      // Act
      const config = (interceptor as any).getCryptoConfig(mockContext);

      // Assert
      expect(config).toEqual({
        method: CryptoMethod.RSA,
        direction: CryptoDirection.ENCRYPT,
        rsa: { padding: 'pkcs1' },
      });
    });
  });

  describe('getCryptoConfig - 从请求头获取配置', () => {
    it('应该从请求头获取默认配置', () => {
      // Arrange
      const mockContext = createMockContext({
        headers: {
          [CRYPTO_HEADER]: 'true',
        },
      });

      reflector.get
        .mockReturnValueOnce(undefined) // method
        .mockReturnValueOnce(undefined) // options
        .mockReturnValueOnce(undefined); // direction

      // Act
      const config = (interceptor as any).getCryptoConfig(mockContext);

      // Assert
      expect(config).toEqual({
        method: CryptoMethod.AES,
        direction: CryptoDirection.BOTH,
      });
    });
  });

  describe('shouldDecrypt', () => {
    it('应该在方向为 DECRYPT 时返回 true', () => {
      expect((interceptor as any).shouldDecrypt(CryptoDirection.DECRYPT)).toBe(
        true,
      );
    });

    it('应该在方向为 BOTH 时返回 true', () => {
      expect((interceptor as any).shouldDecrypt(CryptoDirection.BOTH)).toBe(
        true,
      );
    });

    it('应该在方向为 ENCRYPT 时返回 false', () => {
      expect((interceptor as any).shouldDecrypt(CryptoDirection.ENCRYPT)).toBe(
        false,
      );
    });

    it('应该在方向为 undefined 时返回 false', () => {
      expect((interceptor as any).shouldDecrypt(undefined)).toBe(false);
    });
  });

  describe('shouldEncrypt', () => {
    it('应该在方向为 ENCRYPT 时返回 true', () => {
      expect((interceptor as any).shouldEncrypt(CryptoDirection.ENCRYPT)).toBe(
        true,
      );
    });

    it('应该在方向为 BOTH 时返回 true', () => {
      expect((interceptor as any).shouldEncrypt(CryptoDirection.BOTH)).toBe(
        true,
      );
    });

    it('应该在方向为 DECRYPT 时返回 false', () => {
      expect((interceptor as any).shouldEncrypt(CryptoDirection.DECRYPT)).toBe(
        false,
      );
    });

    it('应该在方向为 undefined 时返回 false', () => {
      expect((interceptor as any).shouldEncrypt(undefined)).toBe(false);
    });
  });

  describe('isApiResponse', () => {
    it('应该正确识别 ApiRes 格式', () => {
      const apiResponse: ApiRes<string> = {
        code: 200,
        message: 'success',
        data: 'test',
      };

      expect((interceptor as any).isApiResponse(apiResponse)).toBe(true);
    });

    it('应该正确识别非 ApiRes 格式', () => {
      const plainObject = { name: 'test' };
      const plainString = 'test';
      const array = [1, 2, 3];

      expect((interceptor as any).isApiResponse(plainObject)).toBe(false);
      expect((interceptor as any).isApiResponse(plainString)).toBe(false);
      expect((interceptor as any).isApiResponse(array)).toBe(false);
      // null 和 undefined 在 isApiResponse 中会返回 false（因为 !data 为 true）
      // 但实际函数会先检查 data && typeof data === 'object'，所以 null 会返回 false
      expect((interceptor as any).isApiResponse(null)).toBe(false);
      expect((interceptor as any).isApiResponse(undefined)).toBe(false);
    });

    it('应该正确识别缺少字段的对象', () => {
      const incompleteResponse = {
        code: 200,
        message: 'success',
        // 缺少 data 字段
      };

      expect((interceptor as any).isApiResponse(incompleteResponse)).toBe(
        false,
      );
    });
  });
});

/**
 * 创建模拟的 ExecutionContext
 */
function createMockContext(requestOverrides: {
  body?: unknown;
  headers?: Record<string, string>;
}): ExecutionContext {
  const request = {
    body: requestOverrides.body,
    headers: requestOverrides.headers || {},
  };

  return {
    switchToHttp: jest.fn().mockReturnValue({
      getRequest: jest.fn().mockReturnValue(request),
      getResponse: jest.fn().mockReturnValue({}),
    }),
    getHandler: jest.fn().mockReturnValue(() => {}),
    getClass: jest.fn(),
  } as unknown as ExecutionContext;
}

/**
 * 创建模拟的 CallHandler
 */
function createMockHandler(response: { data: unknown }): CallHandler {
  return {
    handle: jest.fn().mockReturnValue(of(response.data)),
  } as unknown as CallHandler;
}
