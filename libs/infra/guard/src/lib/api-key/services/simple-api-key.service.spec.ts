import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import type { Cluster, Redis } from 'ioredis';

import { CacheConstant } from '@hl8/constants';
import { RedisUtility } from '@hl8/redis';

import { SimpleApiKeyService } from './simple-api-key.service';

/**
 * SimpleApiKeyService 单元测试
 *
 * @description 验证简单 API Key 服务的功能，包括密钥加载、验证、添加和删除
 */
describe('SimpleApiKeyService', () => {
  let service: SimpleApiKeyService;
  let mockRedisService: jest.Mocked<Redis | Cluster>;
  const cacheKey = `${CacheConstant.CACHE_PREFIX}simple-api-keys`;

  beforeEach(() => {
    // 创建模拟的 Redis 服务
    mockRedisService = {
      smembers: jest.fn(),
      sadd: jest.fn(),
      srem: jest.fn(),
    } as unknown as jest.Mocked<Redis | Cluster>;

    // Mock RedisUtility.instance
    jest
      .spyOn(RedisUtility, 'instance', 'get')
      .mockReturnValue(mockRedisService);

    service = new SimpleApiKeyService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('loadKeys', () => {
    it('应该从 Redis 加载所有 API Key', async () => {
      const mockKeys = ['key1', 'key2', 'key3'];
      mockRedisService.smembers.mockResolvedValue(mockKeys);

      await service.loadKeys();

      expect(mockRedisService.smembers).toHaveBeenCalledWith(cacheKey);
      expect(await service.validateKey('key1')).toBe(true);
      expect(await service.validateKey('key2')).toBe(true);
      expect(await service.validateKey('key3')).toBe(true);
    });

    it('应该处理空列表', async () => {
      mockRedisService.smembers.mockResolvedValue([]);

      await service.loadKeys();

      expect(mockRedisService.smembers).toHaveBeenCalledWith(cacheKey);
      expect(await service.validateKey('non-existent')).toBe(false);
    });

    it('应该在 onModuleInit 时自动加载密钥', async () => {
      const mockKeys = ['init-key'];
      mockRedisService.smembers.mockResolvedValue(mockKeys);

      await service.onModuleInit();

      expect(mockRedisService.smembers).toHaveBeenCalledWith(cacheKey);
      expect(await service.validateKey('init-key')).toBe(true);
    });
  });

  describe('validateKey', () => {
    beforeEach(async () => {
      const mockKeys = ['valid-key'];
      mockRedisService.smembers.mockResolvedValue(mockKeys);
      await service.loadKeys();
    });

    it('应该验证存在的 API Key', async () => {
      const result = await service.validateKey('valid-key');

      expect(result).toBe(true);
    });

    it('应该拒绝不存在的 API Key', async () => {
      const result = await service.validateKey('invalid-key');

      expect(result).toBe(false);
    });

    it('应该忽略 ValidateKeyOptions 参数', async () => {
      const result = await service.validateKey('valid-key', {
        algorithm: 'MD5' as never,
      });

      expect(result).toBe(true);
    });
  });

  describe('addKey', () => {
    it('应该添加新的 API Key 到 Redis 和内存缓存', async () => {
      mockRedisService.smembers.mockResolvedValue([]);
      mockRedisService.sadd.mockResolvedValue(1);

      await service.loadKeys();
      await service.addKey('new-key');

      expect(mockRedisService.sadd).toHaveBeenCalledWith(cacheKey, 'new-key');
      expect(await service.validateKey('new-key')).toBe(true);
    });

    it('应该处理重复添加同一个 Key', async () => {
      mockRedisService.smembers.mockResolvedValue([]);
      mockRedisService.sadd.mockResolvedValue(0); // Redis 返回 0 表示已存在

      await service.loadKeys();
      await service.addKey('existing-key');

      expect(mockRedisService.sadd).toHaveBeenCalledWith(
        cacheKey,
        'existing-key',
      );
      // 即使 Redis 返回 0，也应该添加到内存缓存
      expect(await service.validateKey('existing-key')).toBe(true);
    });
  });

  describe('removeKey', () => {
    beforeEach(async () => {
      const mockKeys = ['key-to-remove'];
      mockRedisService.smembers.mockResolvedValue(mockKeys);
      await service.loadKeys();
    });

    it('应该从 Redis 和内存缓存中删除 API Key', async () => {
      mockRedisService.srem.mockResolvedValue(1);

      await service.removeKey('key-to-remove');

      expect(mockRedisService.srem).toHaveBeenCalledWith(
        cacheKey,
        'key-to-remove',
      );
      expect(await service.validateKey('key-to-remove')).toBe(false);
    });

    it('应该处理删除不存在的 Key', async () => {
      mockRedisService.srem.mockResolvedValue(0);

      await service.removeKey('non-existent-key');

      expect(mockRedisService.srem).toHaveBeenCalledWith(
        cacheKey,
        'non-existent-key',
      );
      expect(await service.validateKey('non-existent-key')).toBe(false);
    });
  });

  describe('updateKey', () => {
    it('应该抛出错误，因为简单 API Key 不支持更新操作', async () => {
      await expect(service.updateKey('some-key', 'new-secret')).rejects.toThrow(
        'Update operation is not supported on simple API keys.',
      );
    });
  });

  describe('Redis 集成', () => {
    it('应该使用正确的缓存键', async () => {
      mockRedisService.smembers.mockResolvedValue([]);

      await service.loadKeys();

      expect(mockRedisService.smembers).toHaveBeenCalledWith(cacheKey);
    });

    it('应该处理 Redis 错误', async () => {
      const redisError = new Error('Redis connection failed');
      mockRedisService.smembers.mockRejectedValue(redisError);

      await expect(service.loadKeys()).rejects.toThrow(
        'Redis connection failed',
      );
    });
  });

  describe('内存缓存同步', () => {
    it('应该在加载后保持内存缓存与 Redis 同步', async () => {
      const mockKeys = ['sync-key1', 'sync-key2'];
      mockRedisService.smembers.mockResolvedValue(mockKeys);

      await service.loadKeys();

      // 验证内存中有这些 key
      expect(await service.validateKey('sync-key1')).toBe(true);
      expect(await service.validateKey('sync-key2')).toBe(true);

      // 添加新 key 后，内存应该立即可用
      mockRedisService.sadd.mockResolvedValue(1);
      await service.addKey('sync-key3');
      expect(await service.validateKey('sync-key3')).toBe(true);

      // 删除 key 后，内存应该立即反映
      mockRedisService.srem.mockResolvedValue(1);
      await service.removeKey('sync-key1');
      expect(await service.validateKey('sync-key1')).toBe(false);
    });
  });
});
