import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { OssConfig } from './oss.config.interface';
import { OssConfigService } from './oss.config.service';
import { OssService } from './oss.service';

// Mock ali-oss - 通过 moduleNameMapper 映射到 __mocks__/ali-oss.ts
import { mockOssClient } from '../__mocks__/ali-oss';

describe('OssService', () => {
  let service: OssService;
  let configService: OssConfigService;
  let mockOssClientMethods: {
    put: jest.Mock<any>;
    generateObjectUrl: jest.Mock<any>;
    signatureUrl: jest.Mock<any>;
    delete: jest.Mock<any>;
    head: jest.Mock<any>;
    list: jest.Mock<any>;
  };
  let mockLoggerLog: jest.SpiedFunction<typeof Logger.log>;
  let OSS: jest.Mock;

  const mockConfig: OssConfig = {
    region: 'oss-cn-beijing',
    accessKeyId: 'test-access-key-id',
    accessKeySecret: 'test-access-key-secret',
    bucket: 'test-bucket',
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockLoggerLog = jest.spyOn(Logger, 'log').mockImplementation(() => {});

    // 使用 mock 的 OSS client
    mockOssClientMethods = mockOssClient;

    // 动态导入 OSS mock
    const ossModule = await import('ali-oss');
    OSS = ossModule.default as jest.Mock;
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OssService,
        {
          provide: OssConfigService,
          useValue: {
            getOssConfig: jest.fn().mockReturnValue(mockConfig),
          },
        },
      ],
    }).compile();

    service = module.get<OssService>(OssService);
    configService = module.get<OssConfigService>(OssConfigService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getClient', () => {
    it('应该创建新的客户端实例', async () => {
      // Act
      await service['getClient']('default');

      // Assert
      expect(OSS).toHaveBeenCalledWith(mockConfig);
      expect(mockLoggerLog).toHaveBeenCalledWith(
        '已创建 OSS 客户端实例，配置键: default',
        'OssService',
      );
    });

    it('应该缓存客户端实例', async () => {
      // Act
      await service['getClient']('default');
      await service['getClient']('default');

      // Assert
      expect(OSS).toHaveBeenCalledTimes(1);
    });

    it('应该支持多个配置键', async () => {
      // Arrange
      const config2: OssConfig = {
        ...mockConfig,
        region: 'oss-cn-shanghai',
        bucket: 'test-bucket-2',
      };
      jest
        .spyOn(configService, 'getOssConfig')
        .mockImplementation((key: string) => {
          return key === 'default' ? mockConfig : config2;
        });

      // Act
      await service['getClient']('default');
      await service['getClient']('backup');

      // Assert
      expect(OSS).toHaveBeenCalledTimes(2);
    });
  });

  describe('uploadFile', () => {
    it('应该成功上传文件', async () => {
      // Arrange
      const fileBuffer = Buffer.from('test file content');
      const fileName = 'test/file.jpg';
      const mockResult = {
        name: fileName,
        url: 'https://test-bucket.oss-cn-beijing.aliyuncs.com/test/file.jpg',
        res: {
          status: 200,
          statusCode: 200,
          headers: {},
        },
      } as any;
      mockOssClientMethods.put.mockResolvedValue(mockResult);

      // Act
      const result = await service.uploadFile('default', fileBuffer, fileName);

      // Assert
      expect(result).toEqual(mockResult);
      expect(mockOssClientMethods.put).toHaveBeenCalledWith(
        fileName,
        fileBuffer,
        {},
      );
    });

    it('应该支持上传选项', async () => {
      // Arrange
      const fileBuffer = Buffer.from('test file content');
      const fileName = 'test/file.jpg';
      const options = {
        contentType: 'image/jpeg',
        meta: { author: 'test' },
        headers: { 'x-oss-meta-custom': 'value' },
      };
      const mockResult = {
        name: fileName,
        url: 'https://test-bucket.oss-cn-beijing.aliyuncs.com/test/file.jpg',
        res: {
          status: 200,
          statusCode: 200,
          headers: {},
        },
      } as any;
      mockOssClientMethods.put.mockResolvedValue(mockResult);

      // Act
      await service.uploadFile('default', fileBuffer, fileName, options);

      // Assert
      expect(mockOssClientMethods.put).toHaveBeenCalledWith(
        fileName,
        fileBuffer,
        {
          mime: 'image/jpeg',
          meta: { author: 'test' },
          headers: { 'x-oss-meta-custom': 'value' },
        },
      );
    });

    it('应该在文件内容为空时抛出错误', async () => {
      // Act & Assert
      await expect(
        service.uploadFile('default', Buffer.alloc(0), 'test.jpg'),
      ).rejects.toThrow('文件内容不能为空');
    });

    it('应该在文件名为空时抛出错误', async () => {
      // Act & Assert
      await expect(
        service.uploadFile('default', Buffer.from('content'), ''),
      ).rejects.toThrow('文件名不能为空');
    });

    it('应该在文件名以 "/" 开头时抛出错误', async () => {
      // Act & Assert
      await expect(
        service.uploadFile('default', Buffer.from('content'), '/test.jpg'),
      ).rejects.toThrow('文件名不能以 "/" 开头');
    });
  });

  describe('getFileUrl', () => {
    it('应该生成公开访问 URL', async () => {
      // Arrange
      const fileName = 'test/file.jpg';
      const mockUrl =
        'https://test-bucket.oss-cn-beijing.aliyuncs.com/test/file.jpg';
      mockOssClientMethods.generateObjectUrl.mockReturnValue(mockUrl);

      // Act
      const result = await service.getFileUrl('default', fileName);

      // Assert
      expect(result).toBe(mockUrl);
      expect(mockOssClientMethods.generateObjectUrl).toHaveBeenCalledWith(
        fileName,
      );
    });

    it('应该生成签名 URL', async () => {
      // Arrange
      const fileName = 'test/file.jpg';
      const mockUrl =
        'https://test-bucket.oss-cn-beijing.aliyuncs.com/test/file.jpg?signature=xxx';
      mockOssClientMethods.signatureUrl.mockReturnValue(mockUrl);

      // Act
      const result = await service.getFileUrl('default', fileName, {
        expires: 3600,
        method: 'GET',
      });

      // Assert
      expect(result).toBe(mockUrl);
      expect(mockOssClientMethods.signatureUrl).toHaveBeenCalledWith(fileName, {
        expires: 3600,
        method: 'GET',
      });
    });

    it('应该在文件名为空时抛出错误', async () => {
      // Act & Assert
      await expect(service.getFileUrl('default', '')).rejects.toThrow(
        '文件名不能为空',
      );
    });
  });

  describe('deleteFile', () => {
    it('应该成功删除文件', async () => {
      // Arrange
      const fileName = 'test/file.jpg';
      const mockResult = {
        status: 204,
        res: {
          status: 204,
          statusCode: 204,
          headers: {},
        },
      } as any;
      mockOssClientMethods.delete.mockResolvedValue(mockResult);

      // Act
      const result = await service.deleteFile('default', fileName);

      // Assert
      expect(result).toEqual(mockResult);
      expect(mockOssClientMethods.delete).toHaveBeenCalledWith(fileName);
    });

    it('应该在文件名为空时抛出错误', async () => {
      // Act & Assert
      await expect(service.deleteFile('default', '')).rejects.toThrow(
        '文件名不能为空',
      );
    });
  });

  describe('checkFileExists', () => {
    it('应该返回 true 当文件存在时', async () => {
      // Arrange
      const fileName = 'test/file.jpg';
      const mockResult = {
        res: {
          status: 200,
          statusCode: 200,
          headers: {},
        },
        meta: {},
        size: 1024,
      } as any;
      mockOssClientMethods.head.mockResolvedValue(mockResult);

      // Act
      const result = await service.checkFileExists('default', fileName);

      // Assert
      expect(result).toBe(true);
      expect(mockOssClientMethods.head).toHaveBeenCalledWith(fileName);
    });

    it('应该返回 false 当文件不存在时', async () => {
      // Arrange
      const fileName = 'test/file.jpg';
      const error = new Error('Not Found') as Error & { status?: number };
      error.status = 404;
      mockOssClientMethods.head.mockRejectedValue(error);

      // Act
      const result = await service.checkFileExists('default', fileName);

      // Assert
      expect(result).toBe(false);
    });

    it('应该抛出其他错误', async () => {
      // Arrange
      const fileName = 'test/file.jpg';
      const error = new Error('Network Error');
      mockOssClientMethods.head.mockRejectedValue(error);

      // Act & Assert
      await expect(
        service.checkFileExists('default', fileName),
      ).rejects.toThrow('Network Error');
    });

    it('应该在文件名为空时抛出错误', async () => {
      // Act & Assert
      await expect(service.checkFileExists('default', '')).rejects.toThrow(
        '文件名不能为空',
      );
    });
  });

  describe('getFileInfo', () => {
    it('应该返回文件信息', async () => {
      // Arrange
      const fileName = 'test/file.jpg';
      const mockResult = {
        res: {
          status: 200,
          statusCode: 200,
          headers: {},
        },
        meta: {
          'content-type': 'image/jpeg',
        },
        size: 1024,
      } as any;
      mockOssClientMethods.head.mockResolvedValue(mockResult);

      // Act
      const result = await service.getFileInfo('default', fileName);

      // Assert
      expect(result).toEqual(mockResult);
      expect(mockOssClientMethods.head).toHaveBeenCalledWith(fileName);
    });

    it('应该在文件名为空时抛出错误', async () => {
      // Act & Assert
      await expect(service.getFileInfo('default', '')).rejects.toThrow(
        '文件名不能为空',
      );
    });
  });

  describe('listFiles', () => {
    it('应该列出所有文件', async () => {
      // Arrange
      const mockResult = {
        objects: [
          {
            name: 'test/file1.jpg',
            url: 'https://test-bucket.oss-cn-beijing.aliyuncs.com/test/file1.jpg',
            lastModified: '2024-01-01T00:00:00.000Z',
            etag: 'etag1',
            type: 'Normal',
            size: 1024,
            storageClass: 'Standard',
            owner: {
              id: 'owner-id',
              displayName: 'owner-name',
            },
          },
        ],
        prefixes: [],
        res: {
          status: 200,
          statusCode: 200,
          headers: {},
        },
      } as any;
      mockOssClientMethods.list.mockResolvedValue(mockResult);

      // Act
      const result = await service.listFiles('default');

      // Assert
      expect(result).toEqual(mockResult);
      expect(mockOssClientMethods.list).toHaveBeenCalledWith({});
    });

    it('应该支持前缀和选项', async () => {
      // Arrange
      const prefix = 'images/';
      const options = {
        maxKeys: 50,
        marker: 'marker',
      };
      const mockResult = {
        objects: [],
        prefixes: [],
        res: {
          status: 200,
          statusCode: 200,
          headers: {},
        },
      } as any;
      mockOssClientMethods.list.mockResolvedValue(mockResult);

      // Act
      await service.listFiles('default', prefix, options);

      // Assert
      expect(mockOssClientMethods.list).toHaveBeenCalledWith({
        prefix: 'images/',
        'max-keys': 50,
        marker: 'marker',
      });
    });
  });

  describe('generatePresignedUrl', () => {
    it('应该生成预签名 URL', async () => {
      // Arrange
      const fileName = 'test/file.jpg';
      const mockUrl =
        'https://test-bucket.oss-cn-beijing.aliyuncs.com/test/file.jpg?signature=xxx';
      mockOssClientMethods.signatureUrl.mockReturnValue(mockUrl);

      // Act
      const result = await service.generatePresignedUrl(
        'default',
        fileName,
        3600,
        'GET',
      );

      // Assert
      expect(result).toBe(mockUrl);
      expect(mockOssClientMethods.signatureUrl).toHaveBeenCalledWith(fileName, {
        expires: 3600,
        method: 'GET',
      });
    });

    it('应该使用默认参数', async () => {
      // Arrange
      const fileName = 'test/file.jpg';
      const mockUrl =
        'https://test-bucket.oss-cn-beijing.aliyuncs.com/test/file.jpg?signature=xxx';
      mockOssClientMethods.signatureUrl.mockReturnValue(mockUrl);

      // Act
      await service.generatePresignedUrl('default', fileName);

      // Assert
      expect(mockOssClientMethods.signatureUrl).toHaveBeenCalledWith(fileName, {
        expires: 3600,
        method: 'GET',
      });
    });

    it('应该在文件名为空时抛出错误', async () => {
      // Act & Assert
      await expect(service.generatePresignedUrl('default', '')).rejects.toThrow(
        '文件名不能为空',
      );
    });

    it('应该在过期时间小于等于 0 时抛出错误', async () => {
      // Act & Assert
      await expect(
        service.generatePresignedUrl('default', 'test.jpg', 0),
      ).rejects.toThrow('过期时间必须大于 0');
    });

    it('应该在过期时间超过 7 天时抛出错误', async () => {
      // Act & Assert
      await expect(
        service.generatePresignedUrl('default', 'test.jpg', 604801),
      ).rejects.toThrow('过期时间不能超过 7 天（604800 秒）');
    });
  });

  describe('onModuleDestroy', () => {
    it('应该清理所有客户端缓存', () => {
      // Arrange
      // 先创建一个客户端
      service['getClient']('default');

      // Act
      service.onModuleDestroy();

      // Assert
      expect(mockLoggerLog).toHaveBeenCalledWith(
        '已清理所有 OSS 客户端缓存',
        'OssService',
      );
    });
  });
});
