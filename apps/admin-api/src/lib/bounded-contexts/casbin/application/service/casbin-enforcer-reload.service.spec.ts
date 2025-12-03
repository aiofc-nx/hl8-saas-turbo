import { Test, TestingModule } from '@nestjs/testing';
import type { Enforcer } from 'casbin';

import { AUTHZ_ENFORCER } from '@hl8/casbin';

import { CasbinEnforcerReloadService } from './casbin-enforcer-reload.service';
import { CasbinModelService } from './casbin-model.service';

/**
 * CasbinEnforcerReloadService 单元测试
 *
 * @description
 * 测试 Casbin Enforcer 重新加载服务的业务逻辑。
 */
describe('CasbinEnforcerReloadService', () => {
  let service: CasbinEnforcerReloadService;
  let enforcer: jest.Mocked<Enforcer>;
  let modelService: jest.Mocked<CasbinModelService>;

  /**
   * 测试前准备
   *
   * 创建测试模块，Mock 所有依赖服务。
   */
  beforeEach(async () => {
    // 创建 Mock Enforcer
    const mockEnforcer = {
      loadPolicy: jest.fn().mockResolvedValue(undefined),
      setModel: jest.fn(),
      enforce: jest.fn(),
      addPolicy: jest.fn(),
      removePolicy: jest.fn(),
    } as unknown as jest.Mocked<Enforcer>;

    // 创建 Mock 模型服务
    const mockModelService = {
      getActiveModelContent: jest.fn(),
      createDraft: jest.fn(),
      updateDraft: jest.fn(),
      publishVersion: jest.fn(),
      rollbackVersion: jest.fn(),
      validateModelContent: jest.fn(),
    } as unknown as jest.Mocked<CasbinModelService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CasbinEnforcerReloadService,
        {
          provide: AUTHZ_ENFORCER,
          useValue: mockEnforcer,
        },
        {
          provide: CasbinModelService,
          useValue: mockModelService,
        },
      ],
    }).compile();

    service = module.get<CasbinEnforcerReloadService>(
      CasbinEnforcerReloadService,
    );
    enforcer = module.get(AUTHZ_ENFORCER);
    modelService = module.get(CasbinModelService);
  });

  /**
   * 测试后清理
   *
   * 重置所有 Mock 函数。
   */
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('reloadEnforcer', () => {
    /**
     * 应该成功重新加载 Enforcer（有激活版本）
     *
     * 验证当存在激活版本的模型配置时，服务能够正确重新加载 Enforcer。
     */
    it('应该成功重新加载 Enforcer（有激活版本）', async () => {
      const activeContent = `[request_definition]
r = sub, obj, act

[policy_definition]
p = sub, obj, act

[policy_effect]
e = some(where (p.eft == allow))

[matchers]
m = r.sub == p.sub && r.obj == p.obj && r.act == p.act`;

      (modelService.getActiveModelContent as jest.Mock).mockResolvedValue(
        activeContent,
      );

      const result = await service.reloadEnforcer();

      expect(result).toBe(true);
      expect(modelService.getActiveModelContent).toHaveBeenCalledTimes(1);
      expect(enforcer.setModel).toHaveBeenCalled();
      expect(enforcer.loadPolicy).toHaveBeenCalledTimes(1);
    });

    /**
     * 应该成功重新加载 Enforcer（无激活版本）
     *
     * 验证当不存在激活版本的模型配置时，服务能够只重新加载策略。
     */
    it('应该成功重新加载 Enforcer（无激活版本）', async () => {
      (modelService.getActiveModelContent as jest.Mock).mockResolvedValue(null);

      const result = await service.reloadEnforcer();

      expect(result).toBe(true);
      expect(modelService.getActiveModelContent).toHaveBeenCalledTimes(1);
      expect(enforcer.loadPolicy).toHaveBeenCalledTimes(1);
      expect(enforcer.setModel).not.toHaveBeenCalled();
    });

    /**
     * 应该返回 false 当重新加载失败时
     *
     * 验证当重新加载过程中发生错误时，服务能够返回 false 而不是抛出异常。
     */
    it('应该返回 false 当重新加载失败时', async () => {
      const activeContent = `[request_definition]
r = sub, obj, act

[policy_definition]
p = sub, obj, act

[policy_effect]
e = some(where (p.eft == allow))

[matchers]
m = r.sub == p.sub && r.obj == p.obj && r.act == p.act`;

      (modelService.getActiveModelContent as jest.Mock).mockResolvedValue(
        activeContent,
      );

      (enforcer.loadPolicy as jest.Mock).mockRejectedValue(
        new Error('加载失败'),
      );

      // Mock console.error 以避免测试输出错误信息
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      const result = await service.reloadEnforcer();

      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    /**
     * 应该返回 false 当模型解析失败时
     *
     * 验证当模型内容无法解析时，服务能够返回 false。
     */
    it('应该返回 false 当模型解析失败时', async () => {
      const activeContent = 'invalid model content';

      (modelService.getActiveModelContent as jest.Mock).mockResolvedValue(
        activeContent,
      );

      // Mock console.error
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      const result = await service.reloadEnforcer();

      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });
});
