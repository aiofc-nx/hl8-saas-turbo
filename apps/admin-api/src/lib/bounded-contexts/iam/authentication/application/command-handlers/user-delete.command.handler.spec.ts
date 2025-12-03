import { BadRequestException } from '@nestjs/common';
import { EventPublisher } from '@nestjs/cqrs';
import { Test, TestingModule } from '@nestjs/testing';

import { Status } from '@/lib/shared/enums/status.enum';

import { UserDeleteCommand } from '../../commands/user-delete.command';
import { UserReadRepoPortToken, UserWriteRepoPortToken } from '../../constants';
import type { UserProperties } from '../../domain/user.read.model';
import type { UserReadRepoPort } from '../../ports/user.read.repo-port';
import type { UserWriteRepoPort } from '../../ports/user.write.repo-port';
import { UserDeleteHandler } from './user-delete.command.handler';

/**
 * UserDeleteHandler 单元测试
 *
 * @description
 * 测试用户删除命令处理器的业务逻辑。
 */
describe('UserDeleteHandler', () => {
  let handler: UserDeleteHandler;
  let userWriteRepository: jest.Mocked<UserWriteRepoPort>;
  let userReadRepoPort: jest.Mocked<UserReadRepoPort>;
  let publisher: jest.Mocked<EventPublisher>;

  /**
   * 测试前准备
   *
   * 创建测试模块，Mock 所有依赖服务。
   */
  beforeEach(async () => {
    // 创建 Mock 仓储
    const mockUserWriteRepository: UserWriteRepoPort = {
      save: jest.fn(),
      update: jest.fn(),
      deleteById: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<UserWriteRepoPort>;

    const mockUserReadRepoPort: UserReadRepoPort = {
      getUserByUsername: jest.fn(),
      findUserById: jest.fn(),
      pageUsers: jest.fn(),
      findUsersByIds: jest.fn(),
    } as unknown as jest.Mocked<UserReadRepoPort>;

    const mockPublisher = {
      mergeObjectContext: jest.fn().mockReturnThis(),
    } as unknown as jest.Mocked<EventPublisher>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserDeleteHandler,
        {
          provide: UserWriteRepoPortToken,
          useValue: mockUserWriteRepository,
        },
        {
          provide: UserReadRepoPortToken,
          useValue: mockUserReadRepoPort,
        },
        {
          provide: EventPublisher,
          useValue: mockPublisher,
        },
      ],
    }).compile();

    handler = module.get<UserDeleteHandler>(UserDeleteHandler);
    userWriteRepository = module.get(UserWriteRepoPortToken);
    userReadRepoPort = module.get(UserReadRepoPortToken);
    publisher = module.get(EventPublisher);
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
     * 应该成功删除用户
     *
     * 验证当提供有效的命令时，处理器能够正确删除用户。
     */
    it('应该成功删除用户', async () => {
      const command = new UserDeleteCommand('user-123');

      const existingUser: UserProperties = {
        id: 'user-123',
        username: 'testuser',
        nickName: '测试用户',
        domain: 'example.com',
        status: Status.ENABLED,
        avatar: null,
        email: null,
        phoneNumber: null,
        isEmailVerified: false,
        createdAt: new Date(),
        createdBy: 'user-1',
      };

      (userReadRepoPort.findUserById as jest.Mock).mockResolvedValue(
        existingUser,
      );

      await handler.execute(command);

      expect(userReadRepoPort.findUserById).toHaveBeenCalledWith('user-123');
      expect(userWriteRepository.deleteById).toHaveBeenCalledWith('user-123');
      expect(publisher.mergeObjectContext).toHaveBeenCalled();
    });

    /**
     * 应该抛出异常当用户不存在时
     *
     * 验证当用户不存在时，处理器能够正确抛出异常。
     */
    it('应该抛出异常当用户不存在时', async () => {
      const command = new UserDeleteCommand('non-existent-user', 'user-123');

      (userReadRepoPort.findUserById as jest.Mock).mockResolvedValue(null);

      await expect(handler.execute(command)).rejects.toThrow(
        BadRequestException,
      );
      await expect(handler.execute(command)).rejects.toThrow(
        'A user with the specified ID does not exist.',
      );
      expect(userWriteRepository.deleteById).not.toHaveBeenCalled();
    });
  });
});
