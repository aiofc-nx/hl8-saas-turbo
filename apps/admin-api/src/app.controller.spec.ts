import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  DiskHealthIndicator,
  HealthCheckService,
  HttpHealthIndicator,
  MemoryHealthIndicator,
} from '@nestjs/terminus';
import { Test, TestingModule } from '@nestjs/testing';

import type { IApiKeyService } from '@hl8/guard';
import {
  ApiKeyGuard,
  ComplexApiKeyServiceToken,
  SimpleApiKeyServiceToken,
} from '@hl8/guard';

import { AppController } from './app.controller';
import { AppService } from './app.service';

/**
 * AppController 单元测试
 *
 * 测试控制器的业务逻辑，使用 Mock 依赖，不涉及实际的 HTTP 请求和数据库操作。
 * 单元测试应该快速、独立、可重复执行。
 */
describe('AppController', () => {
  let appController: AppController;
  let appService: AppService;

  /**
   * 测试前准备
   *
   * 创建测试模块，Mock 所有依赖服务。
   */
  beforeEach(async () => {
    // 创建 Mock API Key 服务
    const mockSimpleApiKeyService: IApiKeyService = {
      loadKeys: jest.fn().mockResolvedValue(undefined),
      validateKey: jest.fn().mockResolvedValue(true),
      addKey: jest.fn().mockResolvedValue(undefined),
      removeKey: jest.fn().mockResolvedValue(undefined),
      updateKey: jest.fn().mockResolvedValue(undefined),
    };

    const mockComplexApiKeyService: IApiKeyService = {
      loadKeys: jest.fn().mockResolvedValue(undefined),
      validateKey: jest.fn().mockResolvedValue(true),
      addKey: jest.fn().mockResolvedValue(undefined),
      removeKey: jest.fn().mockResolvedValue(undefined),
      updateKey: jest.fn().mockResolvedValue(undefined),
    };

    // 创建 Mock 健康检查服务
    const mockHttpHealthIndicator = {
      pingCheck: jest.fn().mockResolvedValue({ status: 'up' }),
    };

    const mockHealthCheckService = {
      check: jest.fn().mockResolvedValue({ status: 'ok' }),
    };

    const mockMemoryHealthIndicator = {
      checkHeap: jest.fn(),
      checkRSS: jest.fn(),
    };

    const mockDiskHealthIndicator = {
      checkStorage: jest.fn(),
    };

    // 创建 Mock EventEmitter2
    const mockEventEmitter = {
      emit: jest.fn(),
      on: jest.fn(),
      once: jest.fn(),
      removeListener: jest.fn(),
      removeAllListeners: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        {
          provide: HttpHealthIndicator,
          useValue: mockHttpHealthIndicator,
        },
        {
          provide: HealthCheckService,
          useValue: mockHealthCheckService,
        },
        {
          provide: MemoryHealthIndicator,
          useValue: mockMemoryHealthIndicator,
        },
        {
          provide: DiskHealthIndicator,
          useValue: mockDiskHealthIndicator,
        },
        {
          provide: SimpleApiKeyServiceToken,
          useValue: mockSimpleApiKeyService,
        },
        {
          provide: ComplexApiKeyServiceToken,
          useValue: mockComplexApiKeyService,
        },
        {
          provide: EventEmitter2,
          useValue: mockEventEmitter,
        },
      ],
    })
      .overrideGuard(ApiKeyGuard)
      .useValue({
        canActivate: jest.fn().mockReturnValue(true),
      })
      .compile();

    appController = module.get<AppController>(AppController);
    appService = module.get<AppService>(AppService);
  });

  describe('getHello', () => {
    /**
     * 应该返回欢迎消息
     *
     * 验证控制器正确调用服务并返回结果。
     */
    it('应该返回 "Hello World!"', () => {
      const result = appController.getHello();
      expect(result).toBe('Hello World!');
    });

    /**
     * 应该调用服务的 getHello 方法
     *
     * 验证控制器正确委托给服务层处理业务逻辑。
     */
    it('应该调用服务的 getHello 方法', () => {
      const serviceSpy = jest.spyOn(appService, 'getHello');
      appController.getHello();
      expect(serviceSpy).toHaveBeenCalledTimes(1);
    });
  });
});
