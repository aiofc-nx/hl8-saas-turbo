import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { OssConfig } from './oss.config.interface';
import { OssConfigService } from './oss.config.service';

describe('OssConfigService', () => {
  let service: OssConfigService;
  let mockConfigService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    mockConfigService = {
      get: jest.fn(),
    } as unknown as jest.Mocked<ConfigService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OssConfigService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<OssConfigService>(OssConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getOssConfig', () => {
    it('应该返回配置对象', () => {
      // Arrange
      const mockConfig: OssConfig = {
        region: 'oss-cn-beijing',
        accessKeyId: 'test-access-key-id',
        accessKeySecret: 'test-access-key-secret',
        bucket: 'test-bucket',
      };
      mockConfigService.get.mockReturnValue(mockConfig);

      // Act
      const result = service.getOssConfig('default');

      // Assert
      expect(result).toBeDefined();
      expect(result.region).toBe('oss-cn-beijing');
      expect(result.accessKeyId).toBe('test-access-key-id');
      expect(result.accessKeySecret).toBe('test-access-key-secret');
      expect(result.bucket).toBe('test-bucket');
      expect(mockConfigService.get).toHaveBeenCalledWith('oss.default');
    });

    it('应该支持可选配置字段', () => {
      // Arrange
      const mockConfig: OssConfig = {
        region: 'oss-cn-shanghai',
        accessKeyId: 'test-access-key-id',
        accessKeySecret: 'test-access-key-secret',
        bucket: 'test-bucket',
        endpoint: 'https://oss-cn-shanghai.aliyuncs.com',
        secure: true,
        timeout: 30000,
        internal: false,
      };
      mockConfigService.get.mockReturnValue(mockConfig);

      // Act
      const result = service.getOssConfig('backup');

      // Assert
      expect(result).toBeDefined();
      expect(result.endpoint).toBe('https://oss-cn-shanghai.aliyuncs.com');
      expect(result.secure).toBe(true);
      expect(result.timeout).toBe(30000);
      expect(result.internal).toBe(false);
      expect(mockConfigService.get).toHaveBeenCalledWith('oss.backup');
    });

    it('应该在配置不存在时抛出错误', () => {
      // Arrange
      mockConfigService.get.mockReturnValue(undefined);

      // Act & Assert
      expect(() => service.getOssConfig('nonexistent')).toThrow(
        "未找到键为 'nonexistent' 的 OSS 配置",
      );
      expect(mockConfigService.get).toHaveBeenCalledWith('oss.nonexistent');
    });

    it('应该处理不同的配置键', () => {
      // Arrange
      const configs: Record<string, OssConfig> = {
        default: {
          region: 'oss-cn-beijing',
          accessKeyId: 'key1',
          accessKeySecret: 'secret1',
          bucket: 'bucket1',
        },
        backup: {
          region: 'oss-cn-shanghai',
          accessKeyId: 'key2',
          accessKeySecret: 'secret2',
          bucket: 'bucket2',
        },
      };

      Object.entries(configs).forEach(([key, config]) => {
        mockConfigService.get.mockReturnValue(config);

        // Act
        const result = service.getOssConfig(key);

        // Assert
        expect(result).toBeDefined();
        expect(result.region).toBe(config.region);
        expect(result.bucket).toBe(config.bucket);
        expect(mockConfigService.get).toHaveBeenCalledWith(`oss.${key}`);
      });
    });
  });
});
