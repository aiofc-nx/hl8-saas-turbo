import { Test, TestingModule } from '@nestjs/testing';

import { BaseDemoService } from '@/base-demo.service';

/**
 * BaseDemoService 集成测试
 *
 * 测试服务在实际运行环境中的行为，包括依赖注入、模块集成等。
 */
describe('BaseDemoService (集成测试)', () => {
  let service: BaseDemoService;
  let module: TestingModule;

  /**
   * 测试前准备
   *
   * 创建测试模块并获取服务实例。
   */
  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [BaseDemoService],
    }).compile();

    service = module.get<BaseDemoService>(BaseDemoService);
  });

  /**
   * 测试后清理
   *
   * 关闭测试模块，释放资源。
   */
  afterEach(async () => {
    await module.close();
  });

  describe('getHello', () => {
    /**
     * 应该返回正确的问候消息
     *
     * 验证服务方法在集成环境中能正常工作。
     */
    it('应该返回 "Hello World!"', () => {
      const result = service.getHello();
      expect(result).toBe('Hello World!');
      expect(typeof result).toBe('string');
    });

    /**
     * 应该每次调用都返回相同的消息
     *
     * 验证服务方法的一致性。
     */
    it('应该每次调用都返回相同的消息', () => {
      const result1 = service.getHello();
      const result2 = service.getHello();
      expect(result1).toBe(result2);
    });
  });
});
