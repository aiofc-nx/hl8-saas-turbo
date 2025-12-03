import { Test, TestingModule } from '@nestjs/testing';

import { PaginationResult } from '@hl8/rest';

import { CasbinPolicyReadRepoPortToken } from '../../constants';
import type { RoleRelationProperties } from '../../domain/policy-rule.model';
import type { CasbinPolicyReadRepoPort } from '../../ports/casbin-policy.repo-port';
import { PageRelationsQuery } from '../../queries/page-relations.query';
import { PageRelationsQueryHandler } from './page-relations.query.handler';

/**
 * PageRelationsQueryHandler 单元测试
 *
 * @description
 * 测试角色继承关系分页查询处理器的业务逻辑。
 */
describe('PageRelationsQueryHandler', () => {
  let handler: PageRelationsQueryHandler;
  let repository: jest.Mocked<CasbinPolicyReadRepoPort>;

  /**
   * 测试前准备
   *
   * 创建测试模块，Mock 所有依赖服务。
   */
  beforeEach(async () => {
    // 创建 Mock 仓储
    const mockRepository: CasbinPolicyReadRepoPort = {
      pagePolicies: jest.fn(),
      pageRelations: jest.fn(),
      getPolicyById: jest.fn(),
      getPoliciesByType: jest.fn(),
    } as unknown as jest.Mocked<CasbinPolicyReadRepoPort>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PageRelationsQueryHandler,
        {
          provide: CasbinPolicyReadRepoPortToken,
          useValue: mockRepository,
        },
      ],
    }).compile();

    handler = module.get<PageRelationsQueryHandler>(PageRelationsQueryHandler);
    repository = module.get(CasbinPolicyReadRepoPortToken);
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
      const mockResult = new PaginationResult<RoleRelationProperties>(
        1,
        10,
        2,
        [
          {
            id: 1,
            v0: 'user-123',
            v1: 'admin',
            v2: 'example.com',
          } as RoleRelationProperties,
          {
            id: 2,
            v0: 'user-456',
            v1: 'user',
            v2: 'example.com',
          } as RoleRelationProperties,
        ],
      );

      const query = new PageRelationsQuery({
        current: 1,
        size: 10,
        childSubject: 'user-123',
        parentRole: 'admin',
        domain: 'example.com',
      });

      (repository.pageRelations as jest.Mock).mockResolvedValue(mockResult);

      const result = await handler.execute(query);

      expect(result).toEqual(mockResult);
      expect(repository.pageRelations).toHaveBeenCalledWith(query);
      expect(repository.pageRelations).toHaveBeenCalledTimes(1);
    });

    /**
     * 应该返回空结果当没有数据时
     *
     * 验证当没有匹配的角色继承关系时，处理器返回空结果。
     */
    it('应该返回空结果当没有数据时', async () => {
      const mockResult = new PaginationResult<RoleRelationProperties>(
        1,
        10,
        0,
        [],
      );

      const query = new PageRelationsQuery({
        current: 1,
        size: 10,
      });

      (repository.pageRelations as jest.Mock).mockResolvedValue(mockResult);

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
      const query = new PageRelationsQuery({
        current: 1,
        size: 10,
      });

      const error = new Error('数据库连接失败');
      (repository.pageRelations as jest.Mock).mockRejectedValue(error);

      await expect(handler.execute(query)).rejects.toThrow('数据库连接失败');
      expect(repository.pageRelations).toHaveBeenCalledWith(query);
    });

    /**
     * 应该使用正确的查询参数
     *
     * 验证处理器使用查询对象中的正确参数。
     */
    it('应该使用正确的查询参数', async () => {
      const mockResult = new PaginationResult<RoleRelationProperties>(
        2,
        20,
        0,
        [],
      );

      const query = new PageRelationsQuery({
        current: 2,
        size: 20,
        childSubject: 'user-123',
        parentRole: 'admin',
        domain: 'example.com',
      });

      (repository.pageRelations as jest.Mock).mockResolvedValue(mockResult);

      await handler.execute(query);

      expect(repository.pageRelations).toHaveBeenCalledWith(query);
      expect(repository.pageRelations).not.toHaveBeenCalledWith(
        expect.objectContaining({
          current: 1,
        }),
      );
    });
  });
});
