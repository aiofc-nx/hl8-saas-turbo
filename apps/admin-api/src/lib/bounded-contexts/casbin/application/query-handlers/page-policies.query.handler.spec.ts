import { Test, TestingModule } from '@nestjs/testing';

import { PaginationResult } from '@hl8/rest';

import { CasbinPolicyReadRepoPortToken } from '../../constants';
import type { PolicyRuleProperties } from '../../domain/policy-rule.model';
import type { CasbinPolicyReadRepoPort } from '../../ports/casbin-policy.repo-port';
import { PagePoliciesQuery } from '../../queries/page-policies.query';
import { PagePoliciesQueryHandler } from './page-policies.query.handler';

/**
 * PagePoliciesQueryHandler 单元测试
 *
 * 测试策略规则分页查询处理器的业务逻辑。
 */
describe('PagePoliciesQueryHandler', () => {
  let handler: PagePoliciesQueryHandler;
  let repository: CasbinPolicyReadRepoPort;

  /**
   * 测试前准备
   *
   * 创建测试模块，Mock 所有依赖服务。
   */
  beforeEach(async () => {
    // 创建 Mock 仓储
    const mockRepository: CasbinPolicyReadRepoPort = {
      pagePolicies: jest.fn(),
      getPolicyById: jest.fn(),
      getPoliciesByType: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PagePoliciesQueryHandler,
        {
          provide: CasbinPolicyReadRepoPortToken,
          useValue: mockRepository,
        },
      ],
    }).compile();

    handler = module.get<PagePoliciesQueryHandler>(PagePoliciesQueryHandler);
    repository = module.get<CasbinPolicyReadRepoPort>(
      CasbinPolicyReadRepoPortToken,
    );
  });

  /**
   * 应该成功执行分页查询
   *
   * 验证当提供有效的查询时，处理器能够正确返回分页结果。
   */
  it('应该成功执行分页查询', async () => {
    const mockResult: PaginationResult<PolicyRuleProperties> = {
      items: [
        {
          id: 1,
          ptype: 'p',
          v0: 'admin',
          v1: '/api/users',
          v2: 'GET',
        },
      ],
      total: 1,
      page: 1,
      pageSize: 10,
      totalPages: 1,
    };

    const query = new PagePoliciesQuery({
      page: 1,
      pageSize: 10,
    });

    (repository.pagePolicies as jest.Mock).mockResolvedValue(mockResult);

    const result = await handler.execute(query);

    expect(result).toEqual(mockResult);
    expect(repository.pagePolicies).toHaveBeenCalledWith(query);
    expect(repository.pagePolicies).toHaveBeenCalledTimes(1);
  });

  /**
   * 应该返回空结果当没有数据时
   *
   * 验证当没有匹配的策略规则时，处理器返回空结果。
   */
  it('应该返回空结果当没有数据时', async () => {
    const mockResult: PaginationResult<PolicyRuleProperties> = {
      items: [],
      total: 0,
      page: 1,
      pageSize: 10,
      totalPages: 0,
    };

    const query = new PagePoliciesQuery({
      page: 1,
      pageSize: 10,
    });

    (repository.pagePolicies as jest.Mock).mockResolvedValue(mockResult);

    const result = await handler.execute(query);

    expect(result.items).toHaveLength(0);
    expect(result.total).toBe(0);
  });

  /**
   * 应该正确处理查询异常
   *
   * 验证当仓储抛出异常时，处理器能够正确传播异常。
   */
  it('应该正确处理查询异常', async () => {
    const query = new PagePoliciesQuery({
      page: 1,
      pageSize: 10,
    });

    const error = new Error('数据库连接失败');
    (repository.pagePolicies as jest.Mock).mockRejectedValue(error);

    await expect(handler.execute(query)).rejects.toThrow('数据库连接失败');
    expect(repository.pagePolicies).toHaveBeenCalledWith(query);
  });

  /**
   * 应该使用正确的查询参数
   *
   * 验证处理器使用查询对象中的正确参数。
   */
  it('应该使用正确的查询参数', async () => {
    const mockResult: PaginationResult<PolicyRuleProperties> = {
      items: [],
      total: 0,
      page: 2,
      pageSize: 20,
      totalPages: 0,
    };

    const query = new PagePoliciesQuery({
      page: 2,
      pageSize: 20,
      ptype: 'p',
      subject: 'admin',
    });

    (repository.pagePolicies as jest.Mock).mockResolvedValue(mockResult);

    await handler.execute(query);

    expect(repository.pagePolicies).toHaveBeenCalledWith(query);
    expect(repository.pagePolicies).not.toHaveBeenCalledWith(
      expect.objectContaining({
        page: 1,
      }),
    );
  });
});
