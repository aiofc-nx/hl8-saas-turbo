import { Test, TestingModule } from '@nestjs/testing';

import { PaginationResult } from '@hl8/rest';

import { Status } from '@/lib/shared/enums/status.enum';

import { UserReadRepoPortToken } from '../../constants';
import type { UserProperties } from '../../domain/user.read.model';
import type { UserReadRepoPort } from '../../ports/user.read.repo-port';
import { PageUsersQuery } from '../../queries/page-users.query';
import { PageUsersQueryHandler } from './page-users.query.handler';

/**
 * PageUsersQueryHandler 单元测试
 *
 * @description
 * 测试用户分页查询处理器的业务逻辑。
 */
describe('PageUsersQueryHandler', () => {
  let handler: PageUsersQueryHandler;
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
        PageUsersQueryHandler,
        {
          provide: UserReadRepoPortToken,
          useValue: mockRepository,
        },
      ],
    }).compile();

    handler = module.get<PageUsersQueryHandler>(PageUsersQueryHandler);
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
     * 应该成功执行分页查询
     *
     * 验证当提供有效的查询时，处理器能够正确返回分页结果。
     */
    it('应该成功执行分页查询', async () => {
      const mockResult = new PaginationResult<UserProperties>(1, 10, 2, [
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
      ]);

      const query = new PageUsersQuery({
        current: 1,
        size: 10,
        username: 'user',
        nickName: '用户',
        status: Status.ENABLED,
      });

      (repository.pageUsers as jest.Mock).mockResolvedValue(mockResult);

      const result = await handler.execute(query);

      expect(result).toEqual(mockResult);
      expect(repository.pageUsers).toHaveBeenCalledWith(query);
      expect(repository.pageUsers).toHaveBeenCalledTimes(1);
    });

    /**
     * 应该返回空结果当没有数据时
     *
     * 验证当没有匹配的用户时，处理器返回空结果。
     */
    it('应该返回空结果当没有数据时', async () => {
      const mockResult = new PaginationResult<UserProperties>(1, 10, 0, []);

      const query = new PageUsersQuery({
        current: 1,
        size: 10,
      });

      (repository.pageUsers as jest.Mock).mockResolvedValue(mockResult);

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
      const query = new PageUsersQuery({
        current: 1,
        size: 10,
      });

      const error = new Error('数据库连接失败');
      (repository.pageUsers as jest.Mock).mockRejectedValue(error);

      await expect(handler.execute(query)).rejects.toThrow('数据库连接失败');
      expect(repository.pageUsers).toHaveBeenCalledWith(query);
    });
  });
});
