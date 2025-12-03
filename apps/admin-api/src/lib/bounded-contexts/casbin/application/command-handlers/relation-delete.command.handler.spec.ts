import { Test, TestingModule } from '@nestjs/testing';
import type { Enforcer } from 'casbin';

import { AUTHZ_ENFORCER } from '@hl8/casbin';

import { RelationDeleteCommand } from '../../commands/relation-delete.command';
import { CasbinPolicyWriteRepoPortToken } from '../../constants';
import type { CasbinPolicyWriteRepoPort } from '../../ports/casbin-policy.repo-port';
import { RelationDeleteHandler } from './relation-delete.command.handler';

/**
 * RelationDeleteHandler 单元测试
 *
 * @description
 * 测试角色继承关系删除命令处理器的业务逻辑。
 */
describe('RelationDeleteHandler', () => {
  let handler: RelationDeleteHandler;
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
      createPolicies: jest.fn(),
      deletePolicies: jest.fn(),
      createRelation: jest.fn(),
      deleteRelation: jest.fn().mockResolvedValue(true),
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
        RelationDeleteHandler,
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

    handler = module.get<RelationDeleteHandler>(RelationDeleteHandler);
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
     * 应该成功删除角色继承关系
     *
     * 验证当提供有效的命令时，处理器能够正确删除角色继承关系。
     */
    it('应该成功删除角色继承关系', async () => {
      const command = new RelationDeleteCommand(1, 'user-123');

      await handler.execute(command);

      expect(repository.deleteRelation).toHaveBeenCalledTimes(1);
      expect(repository.deleteRelation).toHaveBeenCalledWith(1);
    });

    /**
     * 应该触发 Enforcer 重新加载策略
     *
     * 验证删除角色继承关系后，处理器能够触发 Enforcer 重新加载策略。
     */
    it('应该触发 Enforcer 重新加载策略', async () => {
      const command = new RelationDeleteCommand(1, 'user-123');

      await handler.execute(command);

      expect(enforcer.loadPolicy).toHaveBeenCalledTimes(1);
    });

    /**
     * 应该在删除失败时抛出异常
     *
     * 验证当仓储删除操作失败时，处理器能够正确抛出异常。
     */
    it('应该在删除失败时抛出异常', async () => {
      const command = new RelationDeleteCommand(1, 'user-123');
      const error = new Error('删除失败');

      (repository.deleteRelation as jest.Mock).mockRejectedValue(error);

      await expect(handler.execute(command)).rejects.toThrow('删除失败');
      expect(enforcer.loadPolicy).not.toHaveBeenCalled();
    });

    /**
     * 应该在 Enforcer 重新加载失败时抛出异常
     *
     * 验证当 Enforcer 重新加载失败时，处理器能够正确抛出异常。
     */
    it('应该在 Enforcer 重新加载失败时抛出异常', async () => {
      const command = new RelationDeleteCommand(1, 'user-123');
      const error = new Error('加载策略失败');

      (enforcer.loadPolicy as jest.Mock).mockRejectedValue(error);

      await expect(handler.execute(command)).rejects.toThrow('加载策略失败');
      expect(repository.deleteRelation).toHaveBeenCalledTimes(1);
    });
  });
});
