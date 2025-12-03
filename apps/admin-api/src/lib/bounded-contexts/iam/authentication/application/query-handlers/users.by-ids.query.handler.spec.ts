import { Test, TestingModule } from '@nestjs/testing';

import { Status } from '@/lib/shared/enums/status.enum';

import { UserReadRepoPortToken } from '../../constants';
import type { UserProperties } from '../../domain/user.read.model';
import type { UserReadRepoPort } from '../../ports/user.read.repo-port';
import { UsersByIdsQuery } from '../../queries/users.by-ids.query';
import { UsersByIdsQueryHandler } from './users.by-ids.query.handler';

/**
 * UsersByIdsQueryHandler 单元测试
 *
 * @description
 * 测试根据 ID 列表查询用户的查询处理器。
 */
describe('UsersByIdsQueryHandler', () => {
  let handler: UsersByIdsQueryHandler;
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
    } as unknown as jest.Mocked<UserReadRepoPort>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersByIdsQueryHandler,
        {
          provide: UserReadRepoPortToken,
          useValue: mockRepository,
        },
      ],
    }).compile();

    handler = module.get<UsersByIdsQueryHandler>(UsersByIdsQueryHandler);
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
     * 应该成功查询用户列表
     *
     * 验证当提供有效的查询时，处理器能够正确返回用户列表。
     */
    it('应该成功查询用户列表', async () => {
      const mockUsers: UserProperties[] = [
        {
          id: 'user-1',
          username: 'user1',
          nickName: '用户1',
          domain: 'example.com',
          status: Status.ENABLED,
          avatar: null,
          email: null,
          phoneNumber: null,
          isEmailVerified: false,
          createdAt: new Date(),
          createdBy: 'admin',
        } as UserProperties,
        {
          id: 'user-2',
          username: 'user2',
          nickName: '用户2',
          domain: 'example.com',
          status: Status.ENABLED,
          avatar: null,
          email: null,
          phoneNumber: null,
          isEmailVerified: false,
          createdAt: new Date(),
          createdBy: 'admin',
        } as UserProperties,
      ];

      const query = new UsersByIdsQuery(['user-1', 'user-2']);

      (repository.findUsersByIds as jest.Mock).mockResolvedValue(mockUsers);

      const result = await handler.execute(query);

      expect(result).toEqual(mockUsers);
      expect(repository.findUsersByIds).toHaveBeenCalledWith([
        'user-1',
        'user-2',
      ]);
      expect(repository.findUsersByIds).toHaveBeenCalledTimes(1);
    });

    /**
     * 应该返回空数组当没有匹配的用户时
     *
     * 验证当没有匹配的用户时，处理器返回空数组。
     */
    it('应该返回空数组当没有匹配的用户时', async () => {
      const query = new UsersByIdsQuery(['non-existent-user']);

      (repository.findUsersByIds as jest.Mock).mockResolvedValue([]);

      const result = await handler.execute(query);

      expect(result).toHaveLength(0);
    });

    /**
     * 应该正确处理查询异常
     *
     * 验证当仓储抛出异常时，处理器能够正确传播异常。
     */
    it('应该正确处理查询异常', async () => {
      const query = new UsersByIdsQuery(['user-1', 'user-2']);

      const error = new Error('数据库连接失败');
      (repository.findUsersByIds as jest.Mock).mockRejectedValue(error);

      await expect(handler.execute(query)).rejects.toThrow('数据库连接失败');
      expect(repository.findUsersByIds).toHaveBeenCalledWith([
        'user-1',
        'user-2',
      ]);
    });
  });
});
