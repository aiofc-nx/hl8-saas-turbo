import { Test, TestingModule } from '@nestjs/testing';

import { PaginationResult } from '@hl8/rest';

import { ModelConfigStatus } from '@/infra/entities/casbin-model-config.entity';

import { CasbinModelReadRepoPortToken } from '../../constants';
import { CasbinModelConfigProperties } from '../../domain/casbin-model.model';
import type { CasbinModelReadRepoPort } from '../../ports/casbin-model.repo-port';
import { PageModelVersionsQuery } from '../../queries/page-model-versions.query';
import { PageModelVersionsQueryHandler } from './page-model-versions.query.handler';

/**
 * PageModelVersionsQueryHandler 单元测试
 *
 * @description
 * 测试模型配置版本分页查询处理器的业务逻辑。
 */
describe('PageModelVersionsQueryHandler', () => {
  let handler: PageModelVersionsQueryHandler;
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
        PageModelVersionsQueryHandler,
        {
          provide: CasbinModelReadRepoPortToken,
          useValue: mockRepository,
        },
      ],
    }).compile();

    handler = module.get<PageModelVersionsQueryHandler>(
      PageModelVersionsQueryHandler,
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
     * 应该成功执行分页查询
     *
     * 验证当提供有效的查询时，处理器能够正确返回分页结果。
     */
    it('应该成功执行分页查询', async () => {
      const mockResult = new PaginationResult<CasbinModelConfigProperties>(
        1,
        10,
        2,
        [
          {
            id: 1,
            content: '[request_definition]\nr = sub, obj, act',
            version: 1,
            status: ModelConfigStatus.ACTIVE,
            remark: '初始版本',
            createdBy: 'user-1',
            createdAt: new Date(),
            approvedBy: 'user-1',
            approvedAt: new Date(),
          } as CasbinModelConfigProperties,
          {
            id: 2,
            content: '[request_definition]\nr = sub, obj, act, domain',
            version: 2,
            status: ModelConfigStatus.DRAFT,
            remark: '草稿版本',
            createdBy: 'user-1',
            createdAt: new Date(),
            approvedBy: null,
            approvedAt: null,
          } as CasbinModelConfigProperties,
        ],
      );

      const query = new PageModelVersionsQuery({
        current: 1,
        size: 10,
        status: ModelConfigStatus.ACTIVE,
      });

      (repository.pageModelVersions as jest.Mock).mockResolvedValue(mockResult);

      const result = await handler.execute(query);

      expect(result).toEqual(mockResult);
      expect(repository.pageModelVersions).toHaveBeenCalledWith(query);
      expect(repository.pageModelVersions).toHaveBeenCalledTimes(1);
    });

    /**
     * 应该返回空结果当没有数据时
     *
     * 验证当没有匹配的模型配置版本时，处理器返回空结果。
     */
    it('应该返回空结果当没有数据时', async () => {
      const mockResult = new PaginationResult<CasbinModelConfigProperties>(
        1,
        10,
        0,
        [],
      );

      const query = new PageModelVersionsQuery({
        current: 1,
        size: 10,
      });

      (repository.pageModelVersions as jest.Mock).mockResolvedValue(mockResult);

      const result = await handler.execute(query);

      expect(result.records).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    /**
     * 应该正确处理查询异常
     *
     * 验证当仓储抛出异常时，处理器能够正确传播异常。
     */
    it('应该正确处理查询异常', async () => {
      const query = new PageModelVersionsQuery({
        current: 1,
        size: 10,
      });

      const error = new Error('数据库连接失败');
      (repository.pageModelVersions as jest.Mock).mockRejectedValue(error);

      await expect(handler.execute(query)).rejects.toThrow('数据库连接失败');
      expect(repository.pageModelVersions).toHaveBeenCalledWith(query);
    });
  });
});
