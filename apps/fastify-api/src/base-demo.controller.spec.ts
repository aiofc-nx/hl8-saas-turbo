import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Test, TestingModule } from '@nestjs/testing';
import { Cache } from 'cache-manager';

import { BaseDemoController } from './base-demo.controller';
import { BaseDemoService } from './base-demo.service';

/**
 * BaseDemoController 单元测试
 *
 * 测试控制器的业务逻辑，使用 Mock 依赖，不涉及实际的 HTTP 请求和数据库操作。
 * 单元测试应该快速、独立、可重复执行。
 */
describe('BaseDemoController', () => {
  let controller: BaseDemoController;
  let service: BaseDemoService;
  let cacheManager: Cache;

  /**
   * 测试前准备
   *
   * 创建测试模块，Mock 所有依赖服务。
   */
  beforeEach(async () => {
    // 创建 Mock 缓存管理器
    const mockCacheManager = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      reset: jest.fn(),
      wrap: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [BaseDemoController],
      providers: [
        BaseDemoService,
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
      ],
    }).compile();

    controller = module.get<BaseDemoController>(BaseDemoController);
    service = module.get<BaseDemoService>(BaseDemoService);
    cacheManager = module.get<Cache>(CACHE_MANAGER);
  });

  describe('getHello', () => {
    /**
     * 应该返回问候消息
     *
     * 验证控制器正确调用服务并返回结果。
     */
    it('应该返回 "Hello World!"', () => {
      const result = controller.getHello();
      expect(result).toBe('Hello World!');
    });

    /**
     * 应该调用服务的 getHello 方法
     *
     * 验证控制器正确委托给服务层处理业务逻辑。
     */
    it('应该调用服务的 getHello 方法', () => {
      const serviceSpy = jest.spyOn(service, 'getHello');
      controller.getHello();
      expect(serviceSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('getCrypto', () => {
    /**
     * 应该返回加密后的响应
     *
     * 验证加密功能正常工作。
     */
    it('应该返回包含加密数据的响应', () => {
      const result = controller.getCrypto();
      expect(result).toHaveProperty('code', 200);
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('message');
    });
  });

  describe('postCrypto', () => {
    /**
     * 应该处理加密的请求数据
     *
     * 验证双向加密功能正常工作。
     */
    it('应该处理加密的请求并返回响应', () => {
      const testData = 'test data';
      const result = controller.postCrypto(testData);
      expect(result).toHaveProperty('code', 200);
      expect(result.data).toHaveProperty('receivedData', testData);
      expect(result.data).toHaveProperty('timestamp');
    });
  });

  describe('cache', () => {
    /**
     * 应该设置和获取缓存值
     *
     * 验证缓存功能正常工作。
     */
    it('应该设置缓存并返回缓存值', async () => {
      const mockValue = 'hello cache';
      (cacheManager.set as jest.Mock).mockResolvedValue(undefined);
      (cacheManager.get as jest.Mock).mockResolvedValue(mockValue);

      const result = await controller.cache();

      expect(cacheManager.set).toHaveBeenCalledWith('key', 'hello cache');
      expect(cacheManager.get).toHaveBeenCalledWith('key');
      expect(result).toBe(mockValue);
    });
  });
});
