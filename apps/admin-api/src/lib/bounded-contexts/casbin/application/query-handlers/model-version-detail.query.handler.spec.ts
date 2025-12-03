import { Test, TestingModule } from '@nestjs/testing';

import { ModelConfigStatus } from '@/infra/entities/casbin-model-config.entity';

import { CasbinModelReadRepoPortToken } from '../../constants';
import { CasbinModelConfigProperties } from '../../domain/casbin-model.model';
import type { CasbinModelReadRepoPort } from '../../ports/casbin-model.repo-port';
import { ModelVersionDetailQuery } from '../../queries/model-version-detail.query';
import { ModelVersionDetailQueryHandler } from './model-version-detail.query.handler';

/**
 * ModelVersionDetailQueryHandler 单元测试
 *
 * @description
 * 测试模型配置版本详情查询处理器的业务逻辑。
 */
describe('ModelVersionDetailQueryHandler', () => {
  let handler: ModelVersionDetailQueryHandler;
  let repository: jest.Mocked<CasbinModelReadRepoPort>;

  /**
   * 测试前准备
   *
   * 创建测试模块，Mock 所有依赖服务。
   */
  beforeEach(async () => {
    // 创建 Mock 仓储
    const mockRepository: CasbinModelReadRepoPort = {
      pageModelVersions: jest.fn(),
      getModelConfigById: jest.fn(),
      getNextVersion: jest.fn(),
      getActiveModelConfig: jest.fn(),
    } as unknown as jest.Mocked<CasbinModelReadRepoPort>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ModelVersionDetailQueryHandler,
        {
          provide: CasbinModelReadRepoPortToken,
          useValue: mockRepository,
        },
      ],
    }).compile();

    handler = module.get<ModelVersionDetailQueryHandler>(
      ModelVersionDetailQueryHandler,
    );
    repository = module.get(CasbinModelReadRepoPortToken);
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
     * 应该成功获取版本详情
     *
     * 验证当提供有效的查询时，处理器能够正确返回版本详情。
     */
    it('应该成功获取版本详情', async () => {
      const mockConfig: CasbinModelConfigProperties = {
        id: 1,
        content: '[request_definition]\nr = sub, obj, act',
        version: 1,
        status: ModelConfigStatus.ACTIVE,
        remark: '初始版本',
        createdBy: 'user-1',
        createdAt: new Date(),
        approvedBy: 'user-1',
        approvedAt: new Date(),
      };

      const query = new ModelVersionDetailQuery(1);

      (repository.getModelConfigById as jest.Mock).mockResolvedValue(
        mockConfig,
      );

      const result = await handler.execute(query);

      expect(result).toEqual(mockConfig);
      expect(repository.getModelConfigById).toHaveBeenCalledWith(1);
      expect(repository.getModelConfigById).toHaveBeenCalledTimes(1);
    });

    /**
     * 应该返回 null 当版本不存在时
     *
     * 验证当版本不存在时，处理器返回 null。
     */
    it('应该返回 null 当版本不存在时', async () => {
      const query = new ModelVersionDetailQuery(999);

      (repository.getModelConfigById as jest.Mock).mockResolvedValue(null);

      const result = await handler.execute(query);

      expect(result).toBeNull();
      expect(repository.getModelConfigById).toHaveBeenCalledWith(999);
    });

    /**
     * 应该正确处理查询异常
     *
     * 验证当仓储抛出异常时，处理器能够正确传播异常。
     */
    it('应该正确处理查询异常', async () => {
      const query = new ModelVersionDetailQuery(1);

      const error = new Error('数据库连接失败');
      (repository.getModelConfigById as jest.Mock).mockRejectedValue(error);

      await expect(handler.execute(query)).rejects.toThrow('数据库连接失败');
      expect(repository.getModelConfigById).toHaveBeenCalledWith(1);
    });
  });
});
