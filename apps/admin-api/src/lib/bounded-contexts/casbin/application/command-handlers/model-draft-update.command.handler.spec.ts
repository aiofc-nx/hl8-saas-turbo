import { Test, TestingModule } from '@nestjs/testing';

import { ModelDraftUpdateCommand } from '../../commands/model-draft-update.command';
import { CasbinModelService } from '../service/casbin-model.service';
import { ModelDraftUpdateHandler } from './model-draft-update.command.handler';

/**
 * ModelDraftUpdateHandler 单元测试
 *
 * @description
 * 测试模型配置草稿更新命令处理器的业务逻辑。
 */
describe('ModelDraftUpdateHandler', () => {
  let handler: ModelDraftUpdateHandler;
  let modelService: jest.Mocked<CasbinModelService>;

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
      rollbackVersion: jest.fn(),
      validateModelContent: jest.fn(),
      getActiveModelContent: jest.fn(),
    } as unknown as jest.Mocked<CasbinModelService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ModelDraftUpdateHandler,
        {
          provide: CasbinModelService,
          useValue: mockModelService,
        },
      ],
    }).compile();

    handler = module.get<ModelDraftUpdateHandler>(ModelDraftUpdateHandler);
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

  describe('execute', () => {
    /**
     * 应该成功更新模型配置草稿
     *
     * 验证当提供有效的命令时，处理器能够正确更新草稿。
     */
    it('应该成功更新模型配置草稿', async () => {
      const id = 1;
      const content = '[request_definition]\nr = sub, obj, act, domain';
      const remark = '更新后的草稿';
      const uid = 'user-123';

      const command = new ModelDraftUpdateCommand(id, content, remark, uid);

      const mockResult = {
        id,
        content,
        version: 1,
        status: 'DRAFT',
        remark,
        createdBy: uid,
        createdAt: new Date(),
      };

      (modelService.updateDraft as jest.Mock).mockResolvedValue(mockResult);

      await handler.execute(command);

      expect(modelService.updateDraft).toHaveBeenCalledTimes(1);
      expect(modelService.updateDraft).toHaveBeenCalledWith(
        id,
        content,
        remark,
      );
    });

    /**
     * 应该正确处理更新异常
     *
     * 验证当服务更新操作失败时，处理器能够正确传播异常。
     */
    it('应该正确处理更新异常', async () => {
      const id = 1;
      const content = '[request_definition]\nr = sub, obj, act';
      const remark = '更新后的草稿';
      const uid = 'user-123';

      const command = new ModelDraftUpdateCommand(id, content, remark, uid);
      const error = new Error('更新失败');

      (modelService.updateDraft as jest.Mock).mockRejectedValue(error);

      await expect(handler.execute(command)).rejects.toThrow('更新失败');
    });
  });
});
