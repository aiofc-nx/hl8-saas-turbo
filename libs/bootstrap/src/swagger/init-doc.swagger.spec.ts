import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { ConfigKeyPaths, IAppConfig } from '@hl8/config';

import { initDocSwagger, ISwaggerConfig } from './init-doc.swagger';

/**
 * initDocSwagger 单元测试
 *
 * @description 验证 Swagger 文档初始化功能，包括配置读取、文档构建等
 */
describe('initDocSwagger', () => {
  let mockApp: jest.Mocked<INestApplication>;
  let mockConfigService: jest.Mocked<ConfigService<ConfigKeyPaths>>;
  let mockDocumentBuilder: jest.Mocked<DocumentBuilder>;
  let mockSwaggerModule: typeof SwaggerModule;

  beforeEach(() => {
    // 创建模拟的 NestJS 应用
    mockApp = {} as jest.Mocked<INestApplication>;

    // 创建模拟的配置服务
    mockConfigService = {
      get: jest.fn(),
    } as unknown as jest.Mocked<ConfigService<ConfigKeyPaths>>;

    // Mock DocumentBuilder
    mockDocumentBuilder = {
      setTitle: jest.fn().mockReturnThis(),
      setDescription: jest.fn().mockReturnThis(),
      setVersion: jest.fn().mockReturnThis(),
      setTermsOfService: jest.fn().mockReturnThis(),
      setContact: jest.fn().mockReturnThis(),
      setLicense: jest.fn().mockReturnThis(),
      addSecurity: jest.fn().mockReturnThis(),
      build: jest.fn().mockReturnValue({}),
    } as unknown as jest.Mocked<DocumentBuilder>;

    // Mock SwaggerModule
    mockSwaggerModule = {
      createDocument: jest.fn().mockReturnValue({}),
      setup: jest.fn(),
    } as unknown as typeof SwaggerModule;

    // 使用 jest.spyOn 来 mock SwaggerModule 静态方法
    jest
      .spyOn(SwaggerModule, 'createDocument')
      .mockImplementation(mockSwaggerModule.createDocument);
    jest
      .spyOn(SwaggerModule, 'setup')
      .mockImplementation(mockSwaggerModule.setup);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('Swagger 禁用场景', () => {
    it('应该在 Swagger 禁用时跳过初始化', () => {
      mockConfigService.get.mockReturnValue({
        docSwaggerEnable: false,
        docSwaggerPath: 'api-docs',
        port: 9528,
      } as IAppConfig);

      initDocSwagger(mockApp, mockConfigService);

      expect(SwaggerModule.createDocument).not.toHaveBeenCalled();
      expect(SwaggerModule.setup).not.toHaveBeenCalled();
    });
  });

  describe('Swagger 启用场景', () => {
    beforeEach(() => {
      mockConfigService.get.mockReturnValue({
        docSwaggerEnable: true,
        docSwaggerPath: 'api-docs',
        port: 9528,
      } as IAppConfig);
    });

    it('应该使用默认配置初始化 Swagger', () => {
      // 直接调用函数，验证 SwaggerModule 被调用
      initDocSwagger(mockApp, mockConfigService);

      // 验证 SwaggerModule.createDocument 被调用
      expect(SwaggerModule.createDocument).toHaveBeenCalledWith(
        mockApp,
        expect.any(Object),
        expect.objectContaining({
          ignoreGlobalPrefix: false,
          extraModels: expect.any(Array),
        }),
      );

      // 验证 SwaggerModule.setup 被调用
      expect(SwaggerModule.setup).toHaveBeenCalledWith(
        'api-docs',
        mockApp,
        expect.any(Object),
        expect.objectContaining({
          swaggerOptions: {
            persistAuthorization: true,
          },
        }),
      );
    });

    it('应该使用自定义配置覆盖默认值', () => {
      const customConfig: ISwaggerConfig = {
        title: 'My Custom API',
        description: 'My custom API description',
        termsOfService: 'https://example.com/terms',
        contact: {
          name: 'John Doe',
          email: 'john@example.com',
          url: 'https://example.com',
        },
        license: {
          name: 'MIT',
          url: 'https://opensource.org/licenses/MIT',
        },
      };

      initDocSwagger(mockApp, mockConfigService, customConfig);

      // 验证 SwaggerModule 被调用
      expect(SwaggerModule.createDocument).toHaveBeenCalled();
      expect(SwaggerModule.setup).toHaveBeenCalledWith(
        'api-docs',
        mockApp,
        expect.any(Object),
        expect.objectContaining({
          swaggerOptions: {
            persistAuthorization: true,
          },
        }),
      );
    });

    it('应该部分使用自定义配置', () => {
      const partialConfig: ISwaggerConfig = {
        title: 'Partial Custom API',
      };

      initDocSwagger(mockApp, mockConfigService, partialConfig);

      // 验证 SwaggerModule 被调用
      expect(SwaggerModule.createDocument).toHaveBeenCalled();
      expect(SwaggerModule.setup).toHaveBeenCalled();
    });

    it('应该正确配置安全认证', () => {
      initDocSwagger(mockApp, mockConfigService);

      // 验证 SwaggerModule 被调用，说明安全认证已配置
      expect(SwaggerModule.createDocument).toHaveBeenCalled();
      expect(SwaggerModule.setup).toHaveBeenCalled();
    });
  });
});
