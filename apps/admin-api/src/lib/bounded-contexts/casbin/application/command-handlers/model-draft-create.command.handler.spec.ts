import { Test, TestingModule } from '@nestjs/testing';

import { ModelDraftCreateCommand } from '../../commands/model-draft-create.command';
import { CasbinModelService } from '../service/casbin-model.service';
import { ModelDraftCreateHandler } from './model-draft-create.command.handler';

/**
 * ModelDraftCreateHandler 单元测试
 *
 * @description
 * 测试模型配置草稿创建命令处理器的业务逻辑。
 */
describe('ModelDraftCreateHandler', () => {
  let handler: ModelDraftCreateHandler;
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
        ModelDraftCreateHandler,
        {
          provide: CasbinModelService,
          useValue: mockModelService,
        },
      ],
    }).compile();

    handler = module.get<ModelDraftCreateHandler>(ModelDraftCreateHandler);
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
     * 应该成功创建模型配置草稿
     *
     * 验证当提供有效的命令时，处理器能够正确创建草稿。
     */
    it('应该成功创建模型配置草稿', async () => {
      const content = '[request_definition]\nr = sub, obj, act';
      const remark = '新草稿';
      const uid = 'user-123';

      const command = new ModelDraftCreateCommand(content, remark, uid);

      const mockResult = {
        id: 1,
        content,
        version: 1,
        status: 'DRAFT',
        remark,
        createdBy: uid,
        createdAt: new Date(),
      };

      (modelService.createDraft as jest.Mock).mockResolvedValue(mockResult);

      await handler.execute(command);

      expect(modelService.createDraft).toHaveBeenCalledTimes(1);
      expect(modelService.createDraft).toHaveBeenCalledWith(
        content,
        remark,
        uid,
      );
    });

    /**
     * 应该正确处理创建异常
     *
     * 验证当服务创建操作失败时，处理器能够正确传播异常。
     */
    it('应该正确处理创建异常', async () => {
      const content = '[request_definition]\nr = sub, obj, act';
      const remark = '新草稿';
      const uid = 'user-123';

      const command = new ModelDraftCreateCommand(content, remark, uid);
      const error = new Error('创建失败');

      (modelService.createDraft as jest.Mock).mockRejectedValue(error);

      await expect(handler.execute(command)).rejects.toThrow('创建失败');
    });
  });
});
