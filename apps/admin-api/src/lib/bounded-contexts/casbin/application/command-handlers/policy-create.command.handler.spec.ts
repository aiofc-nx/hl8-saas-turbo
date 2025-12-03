import { Test, TestingModule } from '@nestjs/testing';
import type { Enforcer } from 'casbin';

import { AUTHZ_ENFORCER } from '@hl8/casbin';

import { PolicyCreateCommand } from '../../commands/policy-create.command';
import { CasbinPolicyWriteRepoPortToken } from '../../constants';
import { PolicyType } from '../../domain/policy-rule.model';
import type { CasbinPolicyWriteRepoPort } from '../../ports/casbin-policy.repo-port';
import { PolicyCreateHandler } from './policy-create.command.handler';

/**
 * PolicyCreateHandler 单元测试
 *
 * 测试策略规则创建命令处理器的业务逻辑。
 */
describe('PolicyCreateHandler', () => {
  let handler: PolicyCreateHandler;
  let repository: CasbinPolicyWriteRepoPort;
  let enforcer: Enforcer;

  /**
   * 测试前准备
   *
   * 创建测试模块，Mock 所有依赖服务。
   */
  beforeEach(async () => {
    // 创建 Mock 仓储
    const mockRepository: CasbinPolicyWriteRepoPort = {
      createPolicy: jest.fn().mockResolvedValue({
        id: 1,
        ptype: 'p',
        v0: 'admin',
        v1: '/api/users',
        v2: 'GET',
      }),
      deletePolicy: jest.fn().mockResolvedValue(true),
      createPolicies: jest.fn().mockResolvedValue([]),
      deletePolicies: jest.fn().mockResolvedValue(true),
      createRelation: jest.fn().mockResolvedValue({
        id: 1,
        v0: 'user-123',
        v1: 'admin',
      }),
      deleteRelation: jest.fn().mockResolvedValue(true),
    };

    // 创建 Mock Enforcer
    const mockEnforcer = {
      loadPolicy: jest.fn().mockResolvedValue(undefined),
      enforce: jest.fn(),
      addPolicy: jest.fn(),
      removePolicy: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PolicyCreateHandler,
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

    handler = module.get<PolicyCreateHandler>(PolicyCreateHandler);
    repository = module.get<CasbinPolicyWriteRepoPort>(
      CasbinPolicyWriteRepoPortToken,
    );
    enforcer = module.get<Enforcer>(AUTHZ_ENFORCER);
  });

  /**
   * 应该成功创建策略规则
   *
   * 验证当提供有效的命令时，处理器能够正确创建策略规则。
   */
  it('应该成功创建策略规则', async () => {
    const policy = {
      id: 0, // 创建时 id 为 0
      ptype: PolicyType.POLICY,
      subject: 'admin',
      object: '/api/users',
      action: 'GET',
      domain: 'example.com',
      effect: 'allow',
    };

    const command = new PolicyCreateCommand(policy, 'user-123');

    await handler.execute(command);

    expect(repository.createPolicy).toHaveBeenCalledTimes(1);
    expect(repository.createPolicy).toHaveBeenCalledWith(
      expect.objectContaining({
        ptype: PolicyType.POLICY,
      }),
    );
  });

  /**
   * 应该触发 Enforcer 重新加载策略
   *
   * 验证创建策略后，处理器能够触发 Enforcer 重新加载策略。
   */
  it('应该触发 Enforcer 重新加载策略', async () => {
    const policy = {
      id: 0,
      ptype: PolicyType.POLICY,
      subject: 'admin',
      object: '/api/users',
      action: 'GET',
    };

    const command = new PolicyCreateCommand(policy, 'user-123');

    await handler.execute(command);

    expect(enforcer.loadPolicy).toHaveBeenCalledTimes(1);
  });

  /**
   * 应该正确处理策略类型为 ROLE_RELATION 的策略
   *
   * 验证当策略类型为角色继承关系时，处理器能够正确处理。
   */
  it('应该正确处理策略类型为 ROLE_RELATION 的策略', async () => {
    const policy = {
      id: 0,
      ptype: PolicyType.ROLE_RELATION,
      subject: 'user-123',
      object: 'admin',
      domain: 'example.com',
    };

    const command = new PolicyCreateCommand(policy, 'user-123');

    await handler.execute(command);

    expect(repository.createPolicy).toHaveBeenCalledTimes(1);
    expect(enforcer.loadPolicy).toHaveBeenCalledTimes(1);
  });

  /**
   * 应该正确处理可选字段为空的情况
   *
   * 验证当策略的可选字段为空时，处理器能够正确处理。
   */
  it('应该正确处理可选字段为空的情况', async () => {
    const policy = {
      id: 0,
      ptype: PolicyType.POLICY,
      subject: 'admin',
    };

    const command = new PolicyCreateCommand(policy, 'user-123');

    await handler.execute(command);

    expect(repository.createPolicy).toHaveBeenCalledTimes(1);
    expect(enforcer.loadPolicy).toHaveBeenCalledTimes(1);
  });

  /**
   * 应该在保存失败时抛出异常
   *
   * 验证当仓储保存操作失败时，处理器能够正确抛出异常。
   */
  it('应该在保存失败时抛出异常', async () => {
    const policy = {
      id: 0,
      ptype: PolicyType.POLICY,
      subject: 'admin',
    };

    const command = new PolicyCreateCommand(policy, 'user-123');
    const error = new Error('保存失败');

    (repository.createPolicy as jest.Mock).mockRejectedValue(error);

    await expect(handler.execute(command)).rejects.toThrow('保存失败');
    expect(enforcer.loadPolicy).not.toHaveBeenCalled();
  });

  /**
   * 应该在 Enforcer 重新加载失败时抛出异常
   *
   * 验证当 Enforcer 重新加载失败时，处理器能够正确抛出异常。
   */
  it('应该在 Enforcer 重新加载失败时抛出异常', async () => {
    const policy = {
      id: 0,
      ptype: PolicyType.POLICY,
      subject: 'admin',
    };

    const command = new PolicyCreateCommand(policy, 'user-123');
    const error = new Error('加载策略失败');

    (enforcer.loadPolicy as jest.Mock).mockRejectedValue(error);

    await expect(handler.execute(command)).rejects.toThrow('加载策略失败');
    expect(repository.createPolicy).toHaveBeenCalledTimes(1);
  });
});
