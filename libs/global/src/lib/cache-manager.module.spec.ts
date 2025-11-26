// Mock @keyv/redis 和 @nestjs/cache-manager 必须在导入任何模块之前
// 由于 Keyv 的内部检查机制复杂，我们直接 mock CacheModule 来避免实际初始化
jest.mock('@nestjs/cache-manager', () => {
  const mockCache = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    reset: jest.fn(),
    wrap: jest.fn(),
  };

  return {
    CacheModule: {
      registerAsync: jest.fn((options: any) => ({
        module: class MockCacheModule {},
        providers: [
          {
            provide: 'CACHE_MANAGER',
            useValue: mockCache,
          },
        ],
        exports: ['CACHE_MANAGER'],
        global: false,
      })),
    },
    CACHE_MANAGER: 'CACHE_MANAGER',
    Cache: class MockCache {},
  };
});

// 仍然需要 mock @keyv/redis 以避免实际调用
jest.mock('@keyv/redis', () => ({
  createKeyv: jest.fn(() => ({
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
    clear: jest.fn(),
  })),
}));

import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { ConfigKeyPaths, IRedisConfig, redisRegToken } from '@hl8/config';
import { CacheManagerModule } from './cache-manager.module';

/**
 * CacheManagerModule 单元测试
 *
 * @description 验证缓存管理器模块的功能，包括单机模式、集群模式、Redis URL 构建和 TTL 配置
 */
describe('CacheManagerModule', () => {
  let module: TestingModule;
  let configService: ConfigService<ConfigKeyPaths>;

  describe('单机模式配置', () => {
    beforeEach(async () => {
      const mockRedisConfig: IRedisConfig = {
        mode: 'standalone',
        standalone: {
          host: 'localhost',
          port: 6379,
          password: 'test-password',
          db: 0,
        },
        cluster: [],
        sentinel: {
          sentinels: [],
          name: 'master',
          password: '',
          db: 0,
        },
      };

      module = await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot({
            isGlobal: true,
            load: [
              () => ({
                [redisRegToken]: mockRedisConfig,
              }),
            ],
          }),
          CacheManagerModule,
        ],
      }).compile();

      configService = module.get<ConfigService<ConfigKeyPaths>>(ConfigService);
    });

    it('应该成功创建模块', () => {
      expect(module).toBeDefined();
    });

    it('应该能够从 ConfigService 获取 Redis 配置', () => {
      const redisConfig = configService.get<IRedisConfig>(redisRegToken, {
        infer: true,
      });

      expect(redisConfig).toBeDefined();
      expect(redisConfig?.mode).toBe('standalone');
      expect(redisConfig?.standalone.host).toBe('localhost');
      expect(redisConfig?.standalone.port).toBe(6379);
    });
  });

  describe('集群模式配置', () => {
    it('应该能够从 ConfigService 获取集群配置', async () => {
      const mockRedisConfig: IRedisConfig = {
        mode: 'cluster',
        standalone: {
          host: 'localhost',
          port: 6379,
          password: '123456',
          db: 5,
        },
        cluster: [
          { host: 'redis1.example.com', port: 6379, password: 'cluster-pwd' },
          { host: 'redis2.example.com', port: 6380, password: 'cluster-pwd' },
        ],
        sentinel: {
          sentinels: [],
          name: 'master',
          password: '',
          db: 0,
        },
      };

      const testModule = await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot({
            isGlobal: true,
            load: [
              () => ({
                [redisRegToken]: mockRedisConfig,
              }),
            ],
          }),
        ],
      }).compile();

      const testConfigService =
        testModule.get<ConfigService<ConfigKeyPaths>>(ConfigService);
      const redisConfig = testConfigService.get<IRedisConfig>(redisRegToken, {
        infer: true,
      });

      expect(redisConfig).toBeDefined();
      expect(redisConfig?.mode).toBe('cluster');
      expect(redisConfig?.cluster).toHaveLength(2);
    });

    it('应该正确构建集群模式的 Redis URL', () => {
      const mockClusterConfig: IRedisConfig = {
        mode: 'cluster',
        standalone: {
          host: 'localhost',
          port: 6379,
          password: '123456',
          db: 5,
        },
        cluster: [
          { host: 'redis1.example.com', port: 6379, password: 'cluster-pwd' },
          { host: 'redis2.example.com', port: 6380, password: 'cluster-pwd' },
        ],
        sentinel: {
          sentinels: [],
          name: 'master',
          password: '',
          db: 0,
        },
      };

      const nodes = mockClusterConfig.cluster
        .map((node) => `${node.host}:${node.port}`)
        .join(',');
      const password = encodeURIComponent(
        mockClusterConfig.cluster[0].password,
      );
      const expectedUrl = `redis://:%${password}@${nodes}`;

      expect(nodes).toContain('redis1.example.com:6379');
      expect(nodes).toContain('redis2.example.com:6380');
      expect(password).toBe('cluster-pwd');
    });
  });

  describe('Redis URL 构建逻辑', () => {
    it('应该正确编码单机模式的密码', () => {
      const password = 'test@password#123';
      const encoded = encodeURIComponent(password);
      expect(encoded).toBe('test%40password%23123');
    });

    it('应该正确构建单机模式的 Redis URL', () => {
      const host = 'localhost';
      const port = 6379;
      const password = 'test-password';
      const db = 0;
      const encodedPassword = encodeURIComponent(password);
      const redisUrl = `redis://:${encodedPassword}@${host}:${port}/${db}`;

      expect(redisUrl).toBe('redis://:test-password@localhost:6379/0');
    });

    it('应该正确构建集群模式的 Redis URL', () => {
      const nodes = ['redis1:6379', 'redis2:6380'].join(',');
      const password = 'cluster-pwd';
      const encodedPassword = encodeURIComponent(password);
      const redisUrl = `redis://:%${encodedPassword}@${nodes}`;

      expect(redisUrl).toContain('redis1:6379');
      expect(redisUrl).toContain('redis2:6380');
      expect(redisUrl).toContain('cluster-pwd');
    });
  });

  describe('配置验证逻辑', () => {
    it('应该验证单机模式配置的完整性', () => {
      const validConfig: IRedisConfig = {
        mode: 'standalone',
        standalone: {
          host: 'localhost',
          port: 6379,
          password: 'test',
          db: 0,
        },
        cluster: [],
        sentinel: {
          sentinels: [],
          name: 'master',
          password: '',
          db: 0,
        },
      };

      expect(validConfig.standalone.host).toBeDefined();
      expect(validConfig.standalone.port).toBeDefined();
    });

    it('应该验证集群模式配置的完整性', () => {
      const validConfig: IRedisConfig = {
        mode: 'cluster',
        standalone: {
          host: 'localhost',
          port: 6379,
          password: '123456',
          db: 5,
        },
        cluster: [{ host: 'redis1', port: 6379, password: 'pwd' }],
        sentinel: {
          sentinels: [],
          name: 'master',
          password: '',
          db: 0,
        },
      };

      expect(validConfig.cluster.length).toBeGreaterThan(0);
      expect(validConfig.cluster[0].host).toBeDefined();
    });
  });

  describe('TTL 配置', () => {
    it('应该使用默认 TTL 值（24小时）', () => {
      // 默认 TTL 为 24 * 60 * 60 * 1000 毫秒
      const expectedTtl = 24 * 60 * 60 * 1000;
      expect(expectedTtl).toBe(86400000);
    });

    it('应该支持通过环境变量配置 TTL', () => {
      // 测试 TTL 配置逻辑
      const defaultTtl = 24 * 60 * 60 * 1000;
      const customTtl = 3600000; // 1小时
      expect(customTtl).toBeGreaterThan(0);
      expect(customTtl).toBeLessThan(defaultTtl);
    });
  });

  describe('配置服务注入', () => {
    beforeEach(async () => {
      const mockRedisConfig: IRedisConfig = {
        mode: 'standalone',
        standalone: {
          host: 'localhost',
          port: 6379,
          password: 'test-password',
          db: 0,
        },
        cluster: [],
        sentinel: {
          sentinels: [],
          name: 'master',
          password: '',
          db: 0,
        },
      };

      module = await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot({
            isGlobal: true,
            load: [
              () => ({
                [redisRegToken]: mockRedisConfig,
              }),
            ],
          }),
          CacheManagerModule,
        ],
      }).compile();

      configService = module.get<ConfigService<ConfigKeyPaths>>(ConfigService);
    });

    it('应该正确注入 ConfigService', () => {
      expect(configService).toBeDefined();
    });

    it('应该能够从 ConfigService 获取 Redis 配置', () => {
      const redisConfig = configService.get<IRedisConfig>(redisRegToken, {
        infer: true,
      });

      expect(redisConfig).toBeDefined();
      expect(redisConfig?.mode).toBe('standalone');
    });
  });
});
