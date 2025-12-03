import { Test, TestingModule } from '@nestjs/testing';

import { RoleReadRepoPortToken } from '../../constants';
import type { RoleReadRepoPort } from '../../ports/role.read.repo-port';
import { RoleCodesByUserIdQuery } from '../../queries/role_codes_by_user_id_query';
import { FindRolesQueryHandler } from './find-roles-query.handler';

/**
 * FindRolesQueryHandler 单元测试
 *
 * @description
 * 测试根据用户ID查询角色代码的查询处理器。
 */
describe('FindRolesQueryHandler', () => {
  let handler: FindRolesQueryHandler;
  let repository: jest.Mocked<RoleReadRepoPort>;

  /**
   * 测试前准备
   *
   * 创建测试模块，Mock 所有依赖服务。
   */
  beforeEach(async () => {
    // 创建 Mock 仓储
    const mockRepository: RoleReadRepoPort = {
      getRoleById: jest.fn(),
      getRoleByCode: jest.fn(),
      getRolesByDomain: jest.fn(),
      getRolesByCodes: jest.fn(),
      getRoleCodesByUserId: jest.fn(),
      findRolesByUserId: jest.fn(),
      pageRoles: jest.fn(),
    } as unknown as jest.Mocked<RoleReadRepoPort>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FindRolesQueryHandler,
        {
          provide: RoleReadRepoPortToken,
          useValue: mockRepository,
        },
      ],
    }).compile();

    handler = module.get<FindRolesQueryHandler>(FindRolesQueryHandler);
    repository = module.get(RoleReadRepoPortToken);
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
     * 应该成功查询角色代码集合
     *
     * 验证当提供有效的查询时，处理器能够正确返回角色代码集合。
     */
    it('应该成功查询角色代码集合', async () => {
      const userId = 'user-123';
      const mockRoleCodes = new Set<string>(['admin', 'user']);

      const query = new RoleCodesByUserIdQuery(userId);

      (repository.findRolesByUserId as jest.Mock).mockResolvedValue(
        mockRoleCodes,
      );

      const result = await handler.execute(query);

      expect(result).toEqual(mockRoleCodes);
      expect(repository.findRolesByUserId).toHaveBeenCalledWith(userId);
      expect(repository.findRolesByUserId).toHaveBeenCalledTimes(1);
    });

    /**
     * 应该返回空集合当用户没有角色时
     *
     * 验证当用户没有角色时，处理器返回空集合。
     */
    it('应该返回空集合当用户没有角色时', async () => {
      const userId = 'user-123';
      const query = new RoleCodesByUserIdQuery(userId);

      (repository.findRolesByUserId as jest.Mock).mockResolvedValue(
        new Set<string>(),
      );

      const result = await handler.execute(query);

      expect(result.size).toBe(0);
    });

    /**
     * 应该正确处理查询异常
     *
     * 验证当仓储抛出异常时，处理器能够正确传播异常。
     */
    it('应该正确处理查询异常', async () => {
      const userId = 'user-123';
      const query = new RoleCodesByUserIdQuery(userId);

      const error = new Error('数据库连接失败');
      (repository.findRolesByUserId as jest.Mock).mockRejectedValue(error);

      await expect(handler.execute(query)).rejects.toThrow('数据库连接失败');
      expect(repository.findRolesByUserId).toHaveBeenCalledWith(userId);
    });
  });
});
