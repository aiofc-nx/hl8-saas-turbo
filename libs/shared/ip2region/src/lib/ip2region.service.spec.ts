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

import ip2region from './ip2region';
import { Ip2RegionConfig, SearchMode } from './ip2region.config.interface';
import { Ip2regionConfigService } from './ip2region.config.service';
import { Ip2regionService } from './ip2region.service';

// Mock 依赖
jest.mock('./ip2region');

describe('Ip2regionService', () => {
  let service: Ip2regionService;
  let configService: Ip2regionConfigService;
  let mockConfigService: jest.Mocked<ConfigService>;
  let mockLoggerWarn: jest.SpiedFunction<typeof Logger.warn>;
  let mockLoggerLog: jest.SpiedFunction<typeof Logger.log>;

  // 重置静态 searcher
  beforeEach(() => {
    // @ts-expect-error - 访问私有静态属性进行测试
    Ip2regionService.searcher = null;
    jest.clearAllMocks();
    mockLoggerWarn = jest.spyOn(Logger, 'warn').mockImplementation(() => {});
    mockLoggerLog = jest.spyOn(Logger, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  beforeEach(async () => {
    mockConfigService = {
      get: jest.fn(),
    } as unknown as jest.Mocked<ConfigService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        Ip2regionService,
        {
          provide: Ip2regionConfigService,
          useValue: {
            getIp2RegionConfig: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<Ip2regionService>(Ip2regionService);
    configService = module.get<Ip2regionConfigService>(Ip2regionConfigService);
  });

  describe('onModuleInit', () => {
    it('应该在配置缺失时记录警告并返回', async () => {
      // Arrange
      jest
        .spyOn(configService, 'getIp2RegionConfig')
        .mockReturnValue(undefined);
      const mockNewWithFileOnly = jest.spyOn(ip2region, 'newWithFileOnly');

      // Act
      await service.onModuleInit();

      // Assert
      expect(mockLoggerWarn).toHaveBeenCalledWith(
        expect.stringContaining('ip2region configuration is missing'),
        'Ip2regionService',
      );
      expect(mockNewWithFileOnly).not.toHaveBeenCalled();
    });

    it('应该使用 File 模式初始化 Searcher', async () => {
      // Arrange
      const config: Ip2RegionConfig = {
        xdbPath: '/path/to/database.xdb',
        mode: SearchMode.File,
      };
      const mockSearcher = { search: jest.fn() };
      jest.spyOn(configService, 'getIp2RegionConfig').mockReturnValue(config);
      jest
        .spyOn(ip2region, 'newWithFileOnly')
        .mockReturnValue(mockSearcher as any);

      // Act
      await service.onModuleInit();

      // Assert
      expect(ip2region.newWithFileOnly).toHaveBeenCalledWith(config.xdbPath);
      expect(mockLoggerLog).toHaveBeenCalledWith(
        expect.stringContaining('File mode'),
        'Ip2regionService',
      );
    });

    it('应该使用 VectorIndex 模式初始化 Searcher', async () => {
      // Arrange
      const config: Ip2RegionConfig = {
        xdbPath: '/path/to/database.xdb',
        mode: SearchMode.VectorIndex,
      };
      const mockSearcher = { search: jest.fn() };
      const mockVectorIndex = Buffer.from('mock-index');
      jest.spyOn(configService, 'getIp2RegionConfig').mockReturnValue(config);
      jest
        .spyOn(ip2region, 'loadVectorIndexFromFile')
        .mockReturnValue(mockVectorIndex);
      jest
        .spyOn(ip2region, 'newWithVectorIndex')
        .mockReturnValue(mockSearcher as any);

      // Act
      await service.onModuleInit();

      // Assert
      expect(ip2region.loadVectorIndexFromFile).toHaveBeenCalledWith(
        config.xdbPath,
      );
      expect(ip2region.newWithVectorIndex).toHaveBeenCalledWith(
        config.xdbPath,
        mockVectorIndex,
      );
      expect(mockLoggerLog).toHaveBeenCalledWith(
        expect.stringContaining('VectorIndex mode'),
        'Ip2regionService',
      );
    });

    it('应该使用 Full 模式初始化 Searcher', async () => {
      // Arrange
      const config: Ip2RegionConfig = {
        xdbPath: '/path/to/database.xdb',
        mode: SearchMode.Full,
      };
      const mockSearcher = { search: jest.fn() };
      const mockBuffer = Buffer.from('mock-buffer');
      jest.spyOn(configService, 'getIp2RegionConfig').mockReturnValue(config);
      jest.spyOn(ip2region, 'loadContentFromFile').mockReturnValue(mockBuffer);
      jest
        .spyOn(ip2region, 'newWithBuffer')
        .mockReturnValue(mockSearcher as any);

      // Act
      await service.onModuleInit();

      // Assert
      expect(ip2region.loadContentFromFile).toHaveBeenCalledWith(
        config.xdbPath,
      );
      expect(ip2region.newWithBuffer).toHaveBeenCalledWith(mockBuffer);
      expect(mockLoggerLog).toHaveBeenCalledWith(
        expect.stringContaining('Full mode'),
        'Ip2regionService',
      );
    });

    it('应该在模式不支持时记录警告', async () => {
      // Arrange
      const config = {
        xdbPath: '/path/to/database.xdb',
        mode: 'UNSUPPORTED_MODE' as SearchMode,
      };
      jest
        .spyOn(configService, 'getIp2RegionConfig')
        .mockReturnValue(config as Ip2RegionConfig);
      const mockNewWithFileOnly = jest.spyOn(ip2region, 'newWithFileOnly');

      // Act
      await service.onModuleInit();

      // Assert
      expect(mockLoggerWarn).toHaveBeenCalledWith(
        expect.stringContaining('Unsupported search mode'),
        'Ip2regionService',
      );
      expect(mockNewWithFileOnly).not.toHaveBeenCalled();
    });
  });

  describe('getSearcher', () => {
    it('应该在 Searcher 已初始化时返回实例', () => {
      // Arrange
      const mockSearcher = { search: jest.fn() };
      // @ts-expect-error - 访问私有静态属性进行测试
      Ip2regionService.searcher = mockSearcher as any;

      // Act
      const result = Ip2regionService.getSearcher();

      // Assert
      expect(result).toBe(mockSearcher);
    });

    it('应该在 Searcher 未初始化时抛出错误', () => {
      // Arrange
      // @ts-expect-error - 访问私有静态属性进行测试
      Ip2regionService.searcher = null;

      // Act & Assert
      expect(() => Ip2regionService.getSearcher()).toThrow(
        'Searcher is not initialized',
      );
    });
  });
});
