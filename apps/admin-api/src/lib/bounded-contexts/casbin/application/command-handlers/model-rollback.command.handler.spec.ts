import { Test, TestingModule } from '@nestjs/testing';

import { ModelRollbackCommand } from '../../commands/model-rollback.command';
import { CasbinEnforcerReloadService } from '../service/casbin-enforcer-reload.service';
import { CasbinModelService } from '../service/casbin-model.service';
import { ModelRollbackHandler } from './model-rollback.command.handler';

/**
 * ModelRollbackHandler 单元测试
 *
 * @description
 * 测试模型配置回滚命令处理器的业务逻辑。
 */
describe('ModelRollbackHandler', () => {
  let handler: ModelRollbackHandler;
  let modelService: jest.Mocked<CasbinModelService>;
  let enforcerReloadService: jest.Mocked<CasbinEnforcerReloadService>;

  /**
   * 测试前准备
   *
   * 创建测试模块，Mock 所有依赖服务。
   */
  beforeEach(async () => {
    // 创建 Mock 服务
    const mockModelService = {
      createDraft: jest.fn(),
      updateDraft: jest.fn(),
      publishVersion: jest.fn(),
      rollbackVersion: jest.fn().mockResolvedValue(true),
      validateModelContent: jest.fn(),
      getActiveModelContent: jest.fn(),
    } as unknown as jest.Mocked<CasbinModelService>;

    const mockEnforcerReloadService = {
      reloadEnforcer: jest.fn().mockResolvedValue(true),
    } as unknown as jest.Mocked<CasbinEnforcerReloadService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ModelRollbackHandler,
        {
          provide: CasbinModelService,
          useValue: mockModelService,
        },
        {
          provide: CasbinEnforcerReloadService,
          useValue: mockEnforcerReloadService,
        },
      ],
    }).compile();

    handler = module.get<ModelRollbackHandler>(ModelRollbackHandler);
    modelService = module.get(CasbinModelService);
    enforcerReloadService = module.get(CasbinEnforcerReloadService);
  });

  /**
   * 测试后清理
   *
   * 重置所有 Mock 函数。
   */
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    /**
     * 应该成功回滚模型配置版本
     *
     * 验证当提供有效的命令时，处理器能够正确回滚版本并重新加载 Enforcer。
     */
    it('应该成功回滚模型配置版本', async () => {
      const id = 1;
      const uid = 'user-123';

      const command = new ModelRollbackCommand(id, uid);

      await handler.execute(command);

      expect(modelService.rollbackVersion).toHaveBeenCalledTimes(1);
      expect(modelService.rollbackVersion).toHaveBeenCalledWith(id, uid);
      expect(enforcerReloadService.reloadEnforcer).toHaveBeenCalledTimes(1);
    });

    /**
     * 应该在回滚失败时抛出异常
     *
     * 验证当服务回滚操作失败时，处理器能够正确抛出异常。
     */
    it('应该在回滚失败时抛出异常', async () => {
      const id = 1;
      const uid = 'user-123';

      const command = new ModelRollbackCommand(id, uid);
      const error = new Error('回滚失败');

      (modelService.rollbackVersion as jest.Mock).mockRejectedValue(error);

      await expect(handler.execute(command)).rejects.toThrow('回滚失败');
      expect(enforcerReloadService.reloadEnforcer).not.toHaveBeenCalled();
    });

    /**
     * 应该在重新加载失败时抛出异常
     *
     * 验证当 Enforcer 重新加载失败时，处理器能够正确抛出异常。
     */
    it('应该在重新加载失败时抛出异常', async () => {
      const id = 1;
      const uid = 'user-123';

      const command = new ModelRollbackCommand(id, uid);
      const error = new Error('重新加载失败');

      (enforcerReloadService.reloadEnforcer as jest.Mock).mockRejectedValue(
        error,
      );

      await expect(handler.execute(command)).rejects.toThrow('重新加载失败');
      expect(modelService.rollbackVersion).toHaveBeenCalledTimes(1);
    });
  });
});
