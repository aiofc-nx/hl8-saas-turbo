import { Test, TestingModule } from '@nestjs/testing';

import { UserWriteRepoPortToken } from '../../constants';
import { UserDeletedEvent } from '../../domain/events/user-deleted.event';
import type { UserWriteRepoPort } from '../../ports/user.write.repo-port';
import { UserDeletedHandler } from './user-deleted.event.handler';

/**
 * UserDeletedHandler 单元测试
 *
 * @description
 * 测试用户删除事件处理器的业务逻辑。
 */
describe('UserDeletedHandler', () => {
  let handler: UserDeletedHandler;
  let userWriteRepository: jest.Mocked<UserWriteRepoPort>;

  /**
   * 测试前准备
   *
   * 创建测试模块，Mock 所有依赖服务。
   */
  beforeEach(async () => {
    // 创建 Mock 用户写入仓储
    const mockUserWriteRepository: UserWriteRepoPort = {
      save: jest.fn(),
      update: jest.fn(),
      deleteById: jest.fn(),
      deleteUserRoleByUserId: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<UserWriteRepoPort>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserDeletedHandler,
        {
          provide: UserWriteRepoPortToken,
          useValue: mockUserWriteRepository,
        },
      ],
    }).compile();

    handler = module.get<UserDeletedHandler>(UserDeletedHandler);
    userWriteRepository = module.get(UserWriteRepoPortToken);
  });

  /**
   * 测试后清理
   *
   * 重置所有 Mock 函数。
   */
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handle', () => {
    /**
     * 应该成功处理用户删除事件
     *
     * 验证当用户删除事件发生时，处理器能够正确删除用户角色关联。
     */
    it('应该成功处理用户删除事件', async () => {
      const event = new UserDeletedEvent('user-123', 'testuser', 'example.com');

      await handler.handle(event);

      expect(userWriteRepository.deleteUserRoleByUserId).toHaveBeenCalledWith(
        'user-123',
      );
      expect(userWriteRepository.deleteUserRoleByUserId).toHaveBeenCalledTimes(
        1,
      );
    });

    /**
     * 应该正确处理删除操作异常
     *
     * 验证当删除操作失败时，处理器能够正确传播异常。
     */
    it('应该正确处理删除操作异常', async () => {
      const event = new UserDeletedEvent('user-123', 'testuser', 'example.com');

      const error = new Error('数据库连接失败');
      (
        userWriteRepository.deleteUserRoleByUserId as jest.Mock
      ).mockRejectedValue(error);

      await expect(handler.handle(event)).rejects.toThrow('数据库连接失败');
      expect(userWriteRepository.deleteUserRoleByUserId).toHaveBeenCalledWith(
        'user-123',
      );
    });

    /**
     * 应该使用事件中的用户ID
     *
     * 验证处理器使用事件中提供的用户ID进行删除操作。
     */
    it('应该使用事件中的用户ID', async () => {
      const userId = 'user-456';
      const event = new UserDeletedEvent(userId, 'anotheruser', 'example.com');

      await handler.handle(event);

      expect(userWriteRepository.deleteUserRoleByUserId).toHaveBeenCalledWith(
        userId,
      );
    });
  });
});
