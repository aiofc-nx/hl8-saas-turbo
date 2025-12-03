import { Test, TestingModule } from '@nestjs/testing';

import { ModelConfigStatus } from '@/infra/entities/casbin-model-config.entity';

import { CasbinModelReadRepoPortToken } from '../../constants';
import type { CasbinModelReadRepoPort } from '../../ports/casbin-model.repo-port';
import { ModelVersionDiffQuery } from '../../queries/model-version-diff.query';
import { ModelVersionDiffQueryHandler } from './model-version-diff.query.handler';

/**
 * ModelVersionDiffQueryHandler 单元测试
 *
 * @description
 * 测试模型配置版本差异查询处理器的业务逻辑。
 */
describe('ModelVersionDiffQueryHandler', () => {
  let handler: ModelVersionDiffQueryHandler;
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
        ModelVersionDiffQueryHandler,
        {
          provide: CasbinModelReadRepoPortToken,
          useValue: mockRepository,
        },
      ],
    }).compile();

    handler = module.get<ModelVersionDiffQueryHandler>(
      ModelVersionDiffQueryHandler,
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
     * 应该成功计算版本差异
     *
     * 验证当提供有效的查询时，处理器能够正确计算并返回版本差异。
     */
    it('应该成功计算版本差异', async () => {
      const sourceVersion: any = {
        id: 1,
        content: '[request_definition]\nr = sub, obj, act',
        version: 1,
        status: ModelConfigStatus.ACTIVE,
      };

      const targetVersion: any = {
        id: 2,
        content: '[request_definition]\nr = sub, obj, act, domain',
        version: 2,
        status: ModelConfigStatus.DRAFT,
      };

      const query = new ModelVersionDiffQuery(1, 2);

      (repository.getModelConfigById as jest.Mock)
        .mockResolvedValueOnce(sourceVersion)
        .mockResolvedValueOnce(targetVersion);

      const result = await handler.execute(query);

      expect(result).toBeInstanceOf(Object);
      expect(result.sourceVersionId).toBe(1);
      expect(result.targetVersionId).toBe(2);
      expect(result.diff).toBeDefined();
      expect(result.diff).toContain('domain');
      expect(repository.getModelConfigById).toHaveBeenCalledTimes(2);
    });

    /**
     * 应该抛出异常当源版本不存在时
     *
     * 验证当源版本不存在时，处理器能够正确抛出异常。
     */
    it('应该抛出异常当源版本不存在时', async () => {
      const query = new ModelVersionDiffQuery(999, 2);

      (repository.getModelConfigById as jest.Mock)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({
          id: 2,
          content: '[request_definition]\nr = sub, obj, act',
          version: 2,
        });

      await expect(handler.execute(query)).rejects.toThrow('版本不存在');
    });

    /**
     * 应该抛出异常当目标版本不存在时
     *
     * 验证当目标版本不存在时，处理器能够正确抛出异常。
     */
    it('应该抛出异常当目标版本不存在时', async () => {
      const query = new ModelVersionDiffQuery(1, 999);

      (repository.getModelConfigById as jest.Mock)
        .mockResolvedValueOnce({
          id: 1,
          content: '[request_definition]\nr = sub, obj, act',
          version: 1,
        })
        .mockResolvedValueOnce(null);

      await expect(handler.execute(query)).rejects.toThrow('版本不存在');
    });

    /**
     * 应该正确处理查询异常
     *
     * 验证当仓储抛出异常时，处理器能够正确传播异常。
     */
    it('应该正确处理查询异常', async () => {
      const query = new ModelVersionDiffQuery(1, 2);

      const error = new Error('数据库连接失败');
      (repository.getModelConfigById as jest.Mock).mockRejectedValue(error);

      await expect(handler.execute(query)).rejects.toThrow('数据库连接失败');
    });

    /**
     * 应该正确计算相同内容的差异
     *
     * 验证当两个版本内容相同时，差异文本应该只包含相同的行。
     */
    it('应该正确计算相同内容的差异', async () => {
      const content = '[request_definition]\nr = sub, obj, act';

      const sourceVersion: any = {
        id: 1,
        content,
        version: 1,
        status: ModelConfigStatus.ACTIVE,
      };

      const targetVersion: any = {
        id: 2,
        content,
        version: 2,
        status: ModelConfigStatus.DRAFT,
      };

      const query = new ModelVersionDiffQuery(1, 2);

      (repository.getModelConfigById as jest.Mock)
        .mockResolvedValueOnce(sourceVersion)
        .mockResolvedValueOnce(targetVersion);

      const result = await handler.execute(query);

      expect(result.diff).toBeDefined();
      // 相同内容时，差异应该只包含相同的行（以空格开头）
      expect(result.diff).toContain('  ');
    });
  });
});
