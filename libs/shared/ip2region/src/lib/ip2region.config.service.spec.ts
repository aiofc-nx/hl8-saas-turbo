import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { Ip2RegionConfig, SearchMode } from './ip2region.config.interface';
import { Ip2regionConfigService } from './ip2region.config.service';

describe('Ip2regionConfigService', () => {
  let service: Ip2regionConfigService;
  let mockConfigService: jest.Mocked<ConfigService>;
  let mockLoggerWarn: jest.SpiedFunction<typeof Logger.warn>;

  beforeEach(() => {
    mockLoggerWarn = jest.spyOn(Logger, 'warn').mockImplementation(() => {});
  });

  beforeEach(async () => {
    mockConfigService = {
      get: jest.fn(),
    } as unknown as jest.Mocked<ConfigService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        Ip2regionConfigService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<Ip2regionConfigService>(Ip2regionConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('getIp2RegionConfig', () => {
    it('应该返回配置对象', () => {
      // Arrange
      const mockConfig: Ip2RegionConfig = {
        xdbPath: 'apps/base-system/src/resources/ip2region.xdb',
        mode: SearchMode.VectorIndex,
      };
      mockConfigService.get.mockReturnValue(mockConfig);

      // Act
      const result = service.getIp2RegionConfig();

      // Assert
      expect(result).toBeDefined();
      expect(result?.xdbPath).toBeDefined();
      expect(result?.mode).toBe(SearchMode.VectorIndex);
      expect(mockConfigService.get).toHaveBeenCalledWith('ip2region');
    });

    it('应该根据环境调整路径（注意：isDevEnvironment 是模块加载时计算的常量，此测试验证配置读取逻辑）', () => {
      // Arrange
      const mockConfig: Ip2RegionConfig = {
        xdbPath: 'apps/base-system/src/resources/ip2region.xdb',
        mode: SearchMode.VectorIndex,
      };
      mockConfigService.get.mockReturnValue(mockConfig);

      // Act
      const result = service.getIp2RegionConfig();

      // Assert
      expect(result).toBeDefined();
      // 注意：实际路径调整取决于 isDevEnvironment 的值（在模块加载时确定）
      // 这里主要验证配置读取逻辑正确
      expect(result?.xdbPath).toBeDefined();
    });

    it('应该在配置不存在时返回 undefined 并记录警告', () => {
      // Arrange
      mockConfigService.get.mockReturnValue(undefined);

      // Act
      const result = service.getIp2RegionConfig();

      // Assert
      expect(result).toBeUndefined();
      expect(mockLoggerWarn).toHaveBeenCalledWith(
        'ip2region configuration for key ip2region not found',
        'Ip2regionConfigService',
      );
    });

    it('应该处理所有三种查询模式', () => {
      // Arrange
      const modes = [SearchMode.File, SearchMode.VectorIndex, SearchMode.Full];

      modes.forEach((mode) => {
        const mockConfig: Ip2RegionConfig = {
          xdbPath: '/path/to/database.xdb',
          mode,
        };
        mockConfigService.get.mockReturnValue(mockConfig);

        // Act
        const result = service.getIp2RegionConfig();

        // Assert
        expect(result).toBeDefined();
        expect(result?.mode).toBe(mode);
      });
    });
  });
});
