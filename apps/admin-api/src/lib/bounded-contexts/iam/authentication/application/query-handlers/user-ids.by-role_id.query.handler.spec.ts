import { Test, TestingModule } from '@nestjs/testing';

import { UserReadRepoPortToken } from '../../constants';
import type { UserReadRepoPort } from '../../ports/user.read.repo-port';
import { UserIdsByRoleIdQuery } from '../../queries/user-ids.by-role_id.query';
import { UserIdsByRoleIdQueryHandler } from './user-ids.by-role_id.query.handler';

/**
 * UserIdsByRoleIdQueryHandler 单元测试
 *
 * @description
 * 测试根据角色ID查询用户ID列表的查询处理器。
 */
describe('UserIdsByRoleIdQueryHandler', () => {
  let handler: UserIdsByRoleIdQueryHandler;
  let repository: jest.Mocked<UserReadRepoPort>;

  /**
   * 测试前准备
   *
   * 创建测试模块，Mock 所有依赖服务。
   */
  beforeEach(async () => {
    // 创建 Mock 仓储
    const mockRepository: UserReadRepoPort = {
      getUserByUsername: jest.fn(),
      findUserById: jest.fn(),
      pageUsers: jest.fn(),
      findUsersByIds: jest.fn(),
      findUserIdsByRoleId: jest.fn(),
    } as unknown as jest.Mocked<UserReadRepoPort>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserIdsByRoleIdQueryHandler,
        {
          provide: UserReadRepoPortToken,
          useValue: mockRepository,
        },
      ],
    }).compile();

    handler = module.get<UserIdsByRoleIdQueryHandler>(
      UserIdsByRoleIdQueryHandler,
    );
    repository = module.get(UserReadRepoPortToken);
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
     * 应该成功查询用户ID列表
     *
     * 验证当提供有效的查询时，处理器能够正确返回用户ID列表。
     */
    it('应该成功查询用户ID列表', async () => {
      const roleId = 'role-123';
      const mockUserIds = ['user-1', 'user-2', 'user-3'];

      const query = new UserIdsByRoleIdQuery(roleId);

      (repository.findUserIdsByRoleId as jest.Mock).mockResolvedValue(
        mockUserIds,
      );

      const result = await handler.execute(query);

      expect(result).toEqual(mockUserIds);
      expect(repository.findUserIdsByRoleId).toHaveBeenCalledWith(roleId);
      expect(repository.findUserIdsByRoleId).toHaveBeenCalledTimes(1);
    });

    /**
     * 应该返回空数组当角色没有关联用户时
     *
     * 验证当角色没有关联用户时，处理器返回空数组。
     */
    it('应该返回空数组当角色没有关联用户时', async () => {
      const roleId = 'role-123';
      const query = new UserIdsByRoleIdQuery(roleId);

      (repository.findUserIdsByRoleId as jest.Mock).mockResolvedValue([]);

      const result = await handler.execute(query);

      expect(result).toHaveLength(0);
    });

    /**
     * 应该正确处理查询异常
     *
     * 验证当仓储抛出异常时，处理器能够正确传播异常。
     */
    it('应该正确处理查询异常', async () => {
      const roleId = 'role-123';
      const query = new UserIdsByRoleIdQuery(roleId);

      const error = new Error('数据库连接失败');
      (repository.findUserIdsByRoleId as jest.Mock).mockRejectedValue(error);

      await expect(handler.execute(query)).rejects.toThrow('数据库连接失败');
      expect(repository.findUserIdsByRoleId).toHaveBeenCalledWith(roleId);
    });
  });
});
