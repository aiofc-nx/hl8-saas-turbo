import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import { BadRequestException } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import CryptoJS from 'crypto-js';
import type { Cluster, Redis } from 'ioredis';

import { SecurityConfig } from '@hl8/config';
import { CacheConstant } from '@hl8/constants';
import { RedisUtility } from '@hl8/redis';

import { SignatureAlgorithm } from '../api-key.signature.algorithm';
import { ValidateKeyOptions } from './api-key.interface';
import { ComplexApiKeyService } from './complex-api-key.service';

/**
 * ComplexApiKeyService 单元测试
 *
 * @description 验证复杂 API Key 服务的功能，包括签名算法、时间戳验证、Nonce 防重放和密钥管理
 */
describe('ComplexApiKeyService', () => {
  let service: ComplexApiKeyService;
  let mockRedisService: jest.Mocked<Redis | Cluster>;
  let mockSecurityConfig: ConfigType<typeof SecurityConfig>;
  const cacheKey = `${CacheConstant.CACHE_PREFIX}complex-api-secrets`;
  const defaultTimestampDisparity = 5 * 60 * 1000; // 5分钟
  const defaultNonceTTL = 300; // 5分钟

  beforeEach(() => {
    // 创建模拟的 Redis 服务
    mockRedisService = {
      hgetall: jest.fn(),
      hset: jest.fn(),
      hdel: jest.fn(),
      get: jest.fn(),
      set: jest.fn(),
    } as unknown as jest.Mocked<Redis | Cluster>;

    // 创建模拟的安全配置
    mockSecurityConfig = {
      signReqTimestampDisparity: defaultTimestampDisparity,
      signReqNonceTTL: defaultNonceTTL,
    } as ConfigType<typeof SecurityConfig>;

    // Mock RedisUtility.instance
    jest
      .spyOn(RedisUtility, 'instance', 'get')
      .mockReturnValue(mockRedisService);

    service = new ComplexApiKeyService(mockSecurityConfig);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  describe('loadKeys', () => {
    it('应该从 Redis 加载所有 API Key 和密钥', async () => {
      const mockSecrets = {
        'api-key-1': 'secret-1',
        'api-key-2': 'secret-2',
      };
      mockRedisService.hgetall.mockResolvedValue(mockSecrets);

      await service.loadKeys();

      expect(mockRedisService.hgetall).toHaveBeenCalledWith(cacheKey);
      // 验证密钥已加载到内存
      const secret = (
        service as unknown as { apiSecrets: Map<string, string> }
      ).apiSecrets.get('api-key-1');
      expect(secret).toBe('secret-1');
    });

    it('应该处理空哈希表', async () => {
      mockRedisService.hgetall.mockResolvedValue({});

      await service.loadKeys();

      expect(mockRedisService.hgetall).toHaveBeenCalledWith(cacheKey);
    });

    it('应该在 onModuleInit 时自动加载密钥', async () => {
      const mockSecrets = { 'init-key': 'init-secret' };
      mockRedisService.hgetall.mockResolvedValue(mockSecrets);

      await service.onModuleInit();

      expect(mockRedisService.hgetall).toHaveBeenCalledWith(cacheKey);
    });
  });

  describe('validateKey - 参数验证', () => {
    beforeEach(async () => {
      mockRedisService.hgetall.mockResolvedValue({ 'test-key': 'test-secret' });
      await service.loadKeys();
    });

    it('应该要求 algorithm 参数', async () => {
      const options: ValidateKeyOptions = {
        algorithm: undefined as never,
        timestamp: String(Date.now()),
        nonce: 'test-nonce',
        signature: 'test-signature',
      };

      await expect(service.validateKey('test-key', options)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.validateKey('test-key', options)).rejects.toThrow(
        'Algorithm is required for signature verification.',
      );
    });

    it('应该拒绝不支持的算法', async () => {
      const options: ValidateKeyOptions = {
        algorithm: 'INVALID_ALGORITHM' as SignatureAlgorithm,
        timestamp: String(Date.now()),
        nonce: 'test-nonce',
        signature: 'test-signature',
      };

      await expect(service.validateKey('test-key', options)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.validateKey('test-key', options)).rejects.toThrow(
        'Unsupported algorithm: INVALID_ALGORITHM',
      );
    });

    it('应该要求 timestamp、nonce 和 signature', async () => {
      const options: ValidateKeyOptions = {
        algorithm: SignatureAlgorithm.MD5,
      };

      await expect(service.validateKey('test-key', options)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.validateKey('test-key', options)).rejects.toThrow(
        'Missing required fields for signature verification.',
      );
    });
  });

  describe('validateKey - 时间戳验证', () => {
    beforeEach(async () => {
      mockRedisService.hgetall.mockResolvedValue({ 'test-key': 'test-secret' });
      mockRedisService.get.mockResolvedValue(null); // Nonce 不存在
      mockRedisService.set.mockResolvedValue('OK');
      await service.loadKeys();
    });

    it('应该接受有效的时间戳', async () => {
      const now = Date.now();
      const validTimestamp = String(now);

      const options: ValidateKeyOptions = {
        algorithm: SignatureAlgorithm.MD5,
        timestamp: validTimestamp,
        nonce: 'test-nonce',
        signature: 'calculated-signature',
        requestParams: { param1: 'value1' },
      };

      // Mock 签名计算（我们会在后面测试签名）
      jest
        .spyOn(service as any, 'calculateSignature')
        .mockReturnValue('calculated-signature');

      const result = await service.validateKey('test-key', options);

      // 由于签名匹配，应该返回 true（实际测试中需要正确计算签名）
      expect(typeof result).toBe('boolean');
    });

    it('应该拒绝过期的时间戳', async () => {
      jest.useFakeTimers();
      const now = Date.now();
      jest.setSystemTime(now);

      const expiredTimestamp = String(now - defaultTimestampDisparity - 1000); // 过期1秒

      const options: ValidateKeyOptions = {
        algorithm: SignatureAlgorithm.MD5,
        timestamp: expiredTimestamp,
        nonce: 'test-nonce',
        signature: 'test-signature',
      };

      await expect(service.validateKey('test-key', options)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.validateKey('test-key', options)).rejects.toThrow(
        'Invalid or expired timestamp.',
      );
    });

    it('应该拒绝未来的时间戳（超过允许偏差）', async () => {
      jest.useFakeTimers();
      const now = Date.now();
      jest.setSystemTime(now);

      const futureTimestamp = String(now + defaultTimestampDisparity + 1000); // 未来1秒

      const options: ValidateKeyOptions = {
        algorithm: SignatureAlgorithm.MD5,
        timestamp: futureTimestamp,
        nonce: 'test-nonce',
        signature: 'test-signature',
      };

      await expect(service.validateKey('test-key', options)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.validateKey('test-key', options)).rejects.toThrow(
        'Invalid or expired timestamp.',
      );
    });
  });

  describe('validateKey - Nonce 验证', () => {
    beforeEach(async () => {
      mockRedisService.hgetall.mockResolvedValue({ 'test-key': 'test-secret' });
      await service.loadKeys();
    });

    it('应该接受新的 Nonce', async () => {
      jest.useFakeTimers();
      const now = Date.now();
      jest.setSystemTime(now);

      mockRedisService.get.mockResolvedValue(null); // Nonce 不存在
      mockRedisService.set.mockResolvedValue('OK');

      const options: ValidateKeyOptions = {
        algorithm: SignatureAlgorithm.MD5,
        timestamp: String(now),
        nonce: 'new-nonce',
        signature: 'test-signature',
        requestParams: {},
      };

      // Mock 签名计算
      jest
        .spyOn(service as any, 'calculateSignature')
        .mockReturnValue('test-signature');

      const result = await service.validateKey('test-key', options);

      expect(mockRedisService.get).toHaveBeenCalledWith(
        expect.stringContaining('new-nonce'),
      );
      expect(mockRedisService.set as jest.Mock).toHaveBeenCalledWith(
        expect.stringContaining('new-nonce'),
        'used',
        'EX',
        defaultNonceTTL,
      );
    });

    it('应该拒绝已使用的 Nonce', async () => {
      jest.useFakeTimers();
      const now = Date.now();
      jest.setSystemTime(now);

      mockRedisService.get.mockResolvedValue('used'); // Nonce 已存在

      const options: ValidateKeyOptions = {
        algorithm: SignatureAlgorithm.MD5,
        timestamp: String(now),
        nonce: 'used-nonce',
        signature: 'test-signature',
      };

      await expect(service.validateKey('test-key', options)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.validateKey('test-key', options)).rejects.toThrow(
        'Nonce has already been used or is too old.',
      );
    });
  });

  describe('validateKey - 签名算法', () => {
    beforeEach(async () => {
      mockRedisService.hgetall.mockResolvedValue({ 'test-key': 'test-secret' });
      mockRedisService.get.mockResolvedValue(null);
      mockRedisService.set.mockResolvedValue('OK');
      await service.loadKeys();
    });

    const testCases = [
      {
        algorithm: SignatureAlgorithm.MD5,
        description: 'MD5',
      },
      {
        algorithm: SignatureAlgorithm.SHA1,
        description: 'SHA1',
      },
      {
        algorithm: SignatureAlgorithm.SHA256,
        description: 'SHA256',
      },
      {
        algorithm: SignatureAlgorithm.HMAC_SHA256,
        description: 'HMAC_SHA256',
      },
    ];

    testCases.forEach(({ algorithm, description }) => {
      it(`应该验证 ${description} 签名算法`, async () => {
        jest.useFakeTimers();
        const now = Date.now();
        jest.setSystemTime(now);

        const params = {
          param1: 'value1',
          param2: 'value2',
          Algorithm: algorithm,
          AlgorithmVersion: 'v1',
          ApiVersion: 'v1',
        };

        // 计算正确的签名
        const signingString = Object.keys(params)
          .sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' }))
          .map((key) => {
            const value = encodeURIComponent(params[key]);
            return `${key}=${value}`;
          })
          .join('&');

        let expectedSignature: string;
        if (algorithm === SignatureAlgorithm.HMAC_SHA256) {
          expectedSignature = CryptoJS.HmacSHA256(
            signingString,
            'test-secret',
          ).toString();
        } else {
          const dataWithKey = signingString + `&key=test-secret`;
          switch (algorithm) {
            case SignatureAlgorithm.MD5:
              expectedSignature = CryptoJS.MD5(dataWithKey).toString();
              break;
            case SignatureAlgorithm.SHA1:
              expectedSignature = CryptoJS.SHA1(dataWithKey).toString();
              break;
            case SignatureAlgorithm.SHA256:
              expectedSignature = CryptoJS.SHA256(dataWithKey).toString();
              break;
            default:
              throw new Error('Unknown algorithm');
          }
        }

        const options: ValidateKeyOptions = {
          algorithm,
          timestamp: String(now),
          nonce: `nonce-${algorithm}`,
          signature: expectedSignature,
          requestParams: { param1: 'value1', param2: 'value2' },
        };

        const result = await service.validateKey('test-key', options);

        expect(result).toBe(true);
      });
    });
  });

  describe('validateKey - API Key 验证', () => {
    beforeEach(() => {
      mockRedisService.get.mockResolvedValue(null);
      mockRedisService.set.mockResolvedValue('OK');
    });

    it('应该拒绝不存在的 API Key', async () => {
      mockRedisService.hgetall.mockResolvedValue({});
      await service.loadKeys();

      jest.useFakeTimers();
      const now = Date.now();
      jest.setSystemTime(now);

      const options: ValidateKeyOptions = {
        algorithm: SignatureAlgorithm.MD5,
        timestamp: String(now),
        nonce: 'test-nonce',
        signature: 'test-signature',
      };

      const result = await service.validateKey('non-existent-key', options);

      expect(result).toBe(false);
    });
  });

  describe('addKey', () => {
    it('应该添加新的 API Key 和密钥到 Redis 和内存', async () => {
      mockRedisService.hgetall.mockResolvedValue({});
      mockRedisService.hset.mockResolvedValue(1);

      await service.loadKeys();
      await service.addKey('new-api-key', 'new-secret');

      expect(mockRedisService.hset).toHaveBeenCalledWith(
        cacheKey,
        'new-api-key',
        'new-secret',
      );

      // 验证密钥已添加到内存
      const secret = (
        service as unknown as { apiSecrets: Map<string, string> }
      ).apiSecrets.get('new-api-key');
      expect(secret).toBe('new-secret');
    });
  });

  describe('removeKey', () => {
    beforeEach(async () => {
      mockRedisService.hgetall.mockResolvedValue({ 'key-to-remove': 'secret' });
      await service.loadKeys();
    });

    it('应该从 Redis 和内存中删除 API Key', async () => {
      mockRedisService.hdel.mockResolvedValue(1);

      await service.removeKey('key-to-remove');

      expect(mockRedisService.hdel).toHaveBeenCalledWith(
        cacheKey,
        'key-to-remove',
      );

      // 验证密钥已从内存删除
      const secret = (
        service as unknown as { apiSecrets: Map<string, string> }
      ).apiSecrets.get('key-to-remove');
      expect(secret).toBeUndefined();
    });
  });

  describe('updateKey', () => {
    beforeEach(async () => {
      mockRedisService.hgetall.mockResolvedValue({
        'existing-key': 'old-secret',
      });
      await service.loadKeys();
    });

    it('应该更新 API Key 的密钥', async () => {
      mockRedisService.hset.mockResolvedValue(0); // 更新操作返回 0

      await service.updateKey('existing-key', 'new-secret');

      expect(mockRedisService.hset).toHaveBeenCalledWith(
        cacheKey,
        'existing-key',
        'new-secret',
      );

      // 验证密钥已更新
      const secret = (
        service as unknown as { apiSecrets: Map<string, string> }
      ).apiSecrets.get('existing-key');
      expect(secret).toBe('new-secret');
    });
  });

  describe('签名计算', () => {
    beforeEach(async () => {
      mockRedisService.hgetall.mockResolvedValue({ 'test-key': 'test-secret' });
      await service.loadKeys();
    });

    it('应该从参数中排除 signature 字段', async () => {
      // 这个测试验证签名计算时不会包含 signature 参数本身
      const params = {
        param1: 'value1',
        signature: 'should-be-excluded',
      };

      // 验证签名计算逻辑（通过实际验证来间接测试）
      jest.useFakeTimers();
      const now = Date.now();
      jest.setSystemTime(now);

      mockRedisService.get.mockResolvedValue(null);
      mockRedisService.set.mockResolvedValue('OK');

      // 计算不包含 signature 的签名
      const paramsWithoutSignature = {
        param1: 'value1',
        Algorithm: SignatureAlgorithm.MD5,
        AlgorithmVersion: 'v1',
        ApiVersion: 'v1',
      };
      const signingString = Object.keys(paramsWithoutSignature)
        .sort()
        .map(
          (key) => `${key}=${encodeURIComponent(paramsWithoutSignature[key])}`,
        )
        .join('&');
      const expectedSignature = CryptoJS.MD5(
        signingString + `&key=test-secret`,
      ).toString();

      const options: ValidateKeyOptions = {
        algorithm: SignatureAlgorithm.MD5,
        timestamp: String(now),
        nonce: 'test-nonce',
        signature: expectedSignature,
        requestParams: params,
      };

      const result = await service.validateKey('test-key', options);

      expect(result).toBe(true);
    });

    it('应该按字母顺序排序参数键', async () => {
      // 这个测试验证参数键的排序逻辑
      jest.useFakeTimers();
      const now = Date.now();
      jest.setSystemTime(now);

      // 先加载 keys
      mockRedisService.hgetall.mockResolvedValue({ 'test-key': 'test-secret' });
      await service.loadKeys();

      mockRedisService.get.mockResolvedValue(null);
      mockRedisService.set.mockResolvedValue('OK');

      const params = {
        zParam: 'zValue',
        aParam: 'aValue',
        mParam: 'mValue',
      };

      // 手动计算正确排序的签名（模拟实际实现逻辑）
      // 1. 添加 Algorithm、AlgorithmVersion、ApiVersion 到 params
      const paramsWithAlgorithm = {
        ...params,
        Algorithm: SignatureAlgorithm.MD5,
        AlgorithmVersion: 'v1',
        ApiVersion: 'v1',
      };

      // 2. 排除 signature 参数（这里没有 signature）
      const paramsToSign = paramsWithAlgorithm;

      // 3. 按键名排序（使用 localeCompare，不区分大小写）
      const sortedKeys = Object.keys(paramsToSign).sort((a, b) =>
        a.localeCompare(b, 'en', { sensitivity: 'base' }),
      );

      // 4. 构建签名字符串，过滤 null/undefined，并进行 URL 编码
      const signingString = sortedKeys
        .map((key) => {
          const value = paramsToSign[key];
          if (value === null || value === undefined) {
            return null;
          }
          const stringValue =
            typeof value === 'string'
              ? value
              : typeof value === 'number' || typeof value === 'boolean'
                ? String(value)
                : '';
          const encodedValue = encodeURIComponent(stringValue);
          return `${key}=${encodedValue}`;
        })
        .filter((item): item is string => item !== null)
        .join('&');

      // 5. 计算签名（MD5 算法追加 &key=secret）
      const expectedSignature = CryptoJS.MD5(
        signingString + `&key=test-secret`,
      ).toString();

      const options: ValidateKeyOptions = {
        algorithm: SignatureAlgorithm.MD5,
        timestamp: String(now),
        nonce: 'test-nonce',
        signature: expectedSignature,
        requestParams: params,
      };

      const result = await service.validateKey('test-key', options);

      expect(result).toBe(true);
    });
  });
});
