import { Test, TestingModule } from '@nestjs/testing';
import type { Enforcer } from 'casbin';

import { AUTHZ_ENFORCER } from '@hl8/casbin';

import { PolicyBatchCommand } from '../../commands/policy-batch.command';
import { CasbinPolicyWriteRepoPortToken } from '../../constants';
import { PolicyType } from '../../domain/policy-rule.model';
import type { CasbinPolicyWriteRepoPort } from '../../ports/casbin-policy.repo-port';
import { PolicyBatchHandler } from './policy-batch.command.handler';

/**
 * PolicyBatchHandler 单元测试
 *
 * @description
 * 测试策略规则批量操作命令处理器的业务逻辑。
 */
describe('PolicyBatchHandler', () => {
  let handler: PolicyBatchHandler;
  let repository: jest.Mocked<CasbinPolicyWriteRepoPort>;
  let enforcer: jest.Mocked<Enforcer>;

  /**
   * 测试前准备
   *
   * 创建测试模块，Mock 所有依赖服务。
   */
  beforeEach(async () => {
    // 创建 Mock 仓储
    const mockRepository: CasbinPolicyWriteRepoPort = {
      createPolicy: jest.fn(),
      deletePolicy: jest.fn(),
      createPolicies: jest.fn().mockResolvedValue([]),
      deletePolicies: jest.fn().mockResolvedValue(true),
      createRelation: jest.fn(),
      deleteRelation: jest.fn(),
    } as unknown as jest.Mocked<CasbinPolicyWriteRepoPort>;

    // 创建 Mock Enforcer
    const mockEnforcer = {
      loadPolicy: jest.fn().mockResolvedValue(undefined),
      enforce: jest.fn(),
      addPolicy: jest.fn(),
      removePolicy: jest.fn(),
    } as unknown as jest.Mocked<Enforcer>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PolicyBatchHandler,
        {
          provide: CasbinPolicyWriteRepoPortToken,
          useValue: mockRepository,
        },
        {
          provide: AUTHZ_ENFORCER,
          useValue: mockEnforcer,
        },
      ],
    }).compile();

    handler = module.get<PolicyBatchHandler>(PolicyBatchHandler);
    repository = module.get(CasbinPolicyWriteRepoPortToken);
    enforcer = module.get(AUTHZ_ENFORCER);
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
     * 应该成功批量新增策略规则
     *
     * 验证当操作类型为 'add' 时，处理器能够正确批量新增策略规则。
     */
    it('应该成功批量新增策略规则', async () => {
      const policies = [
        {
          id: 0,
          ptype: PolicyType.POLICY,
          subject: 'admin',
          object: '/api/users',
          action: 'GET',
          domain: 'example.com',
        },
        {
          id: 0,
          ptype: PolicyType.POLICY,
          subject: 'user',
          object: '/api/posts',
          action: 'POST',
          domain: 'example.com',
        },
      ];

      const command = new PolicyBatchCommand(policies, 'add', 'user-123');

      await handler.execute(command);

      expect(repository.createPolicies).toHaveBeenCalledTimes(1);
      expect(repository.createPolicies).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            ptype: PolicyType.POLICY,
          }),
        ]),
      );
      expect(enforcer.loadPolicy).toHaveBeenCalledTimes(1);
    });

    /**
     * 应该成功批量删除策略规则
     *
     * 验证当操作类型为 'delete' 时，处理器能够正确批量删除策略规则。
     */
    it('应该成功批量删除策略规则', async () => {
      const policies = [
        {
          id: 1,
          ptype: PolicyType.POLICY,
          subject: 'admin',
          object: '/api/users',
          action: 'GET',
        },
        {
          id: 2,
          ptype: PolicyType.POLICY,
          subject: 'user',
          object: '/api/posts',
          action: 'POST',
        },
      ];

      const command = new PolicyBatchCommand(policies, 'delete', 'user-123');

      await handler.execute(command);

      expect(repository.deletePolicies).toHaveBeenCalledTimes(1);
      expect(repository.deletePolicies).toHaveBeenCalledWith([1, 2]);
      expect(enforcer.loadPolicy).toHaveBeenCalledTimes(1);
    });

    /**
     * 应该触发 Enforcer 重新加载策略
     *
     * 验证批量操作后，处理器能够触发 Enforcer 重新加载策略。
     */
    it('应该触发 Enforcer 重新加载策略', async () => {
      const policies = [
        {
          id: 0,
          ptype: PolicyType.POLICY,
          subject: 'admin',
          object: '/api/users',
          action: 'GET',
        },
      ];

      const command = new PolicyBatchCommand(policies, 'add', 'user-123');

      await handler.execute(command);

      expect(enforcer.loadPolicy).toHaveBeenCalledTimes(1);
    });

    /**
     * 应该在批量新增失败时抛出异常
     *
     * 验证当批量新增操作失败时，处理器能够正确抛出异常。
     */
    it('应该在批量新增失败时抛出异常', async () => {
      const policies = [
        {
          id: 0,
          ptype: PolicyType.POLICY,
          subject: 'admin',
          object: '/api/users',
          action: 'GET',
        },
      ];

      const command = new PolicyBatchCommand(policies, 'add', 'user-123');
      const error = new Error('批量新增失败');

      (repository.createPolicies as jest.Mock).mockRejectedValue(error);

      await expect(handler.execute(command)).rejects.toThrow('批量新增失败');
      expect(enforcer.loadPolicy).not.toHaveBeenCalled();
    });

    /**
     * 应该在批量删除失败时抛出异常
     *
     * 验证当批量删除操作失败时，处理器能够正确抛出异常。
     */
    it('应该在批量删除失败时抛出异常', async () => {
      const policies = [
        {
          id: 1,
          ptype: PolicyType.POLICY,
          subject: 'admin',
          object: '/api/users',
          action: 'GET',
        },
      ];

      const command = new PolicyBatchCommand(policies, 'delete', 'user-123');
      const error = new Error('批量删除失败');

      (repository.deletePolicies as jest.Mock).mockRejectedValue(error);

      await expect(handler.execute(command)).rejects.toThrow('批量删除失败');
      expect(enforcer.loadPolicy).not.toHaveBeenCalled();
    });
  });
});
