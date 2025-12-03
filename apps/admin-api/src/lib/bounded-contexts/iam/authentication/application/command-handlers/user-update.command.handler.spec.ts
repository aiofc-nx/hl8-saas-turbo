import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { Status } from '@/lib/shared/enums/status.enum';

import { UserUpdateCommand } from '../../commands/user-update.command';
import { UserReadRepoPortToken, UserWriteRepoPortToken } from '../../constants';
import type { UserProperties } from '../../domain/user.read.model';
import type { UserReadRepoPort } from '../../ports/user.read.repo-port';
import type { UserWriteRepoPort } from '../../ports/user.write.repo-port';
import { UserUpdateHandler } from './user-update.command.handler';

/**
 * UserUpdateHandler 单元测试
 *
 * @description
 * 测试用户更新命令处理器的业务逻辑。
 */
describe('UserUpdateHandler', () => {
  let handler: UserUpdateHandler;
  let userWriteRepository: jest.Mocked<UserWriteRepoPort>;
  let userReadRepoPort: jest.Mocked<UserReadRepoPort>;

  /**
   * 测试前准备
   *
   * 创建测试模块，Mock 所有依赖服务。
   */
  beforeEach(async () => {
    // 创建 Mock 仓储
    const mockUserWriteRepository: UserWriteRepoPort = {
      save: jest.fn(),
      update: jest.fn().mockResolvedValue(undefined),
      deleteById: jest.fn(),
    } as unknown as jest.Mocked<UserWriteRepoPort>;

    const mockUserReadRepoPort: UserReadRepoPort = {
      getUserByUsername: jest.fn(),
      findUserById: jest.fn(),
      pageUsers: jest.fn(),
      findUsersByIds: jest.fn(),
    } as unknown as jest.Mocked<UserReadRepoPort>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserUpdateHandler,
        {
          provide: UserWriteRepoPortToken,
          useValue: mockUserWriteRepository,
        },
        {
          provide: UserReadRepoPortToken,
          useValue: mockUserReadRepoPort,
        },
      ],
    }).compile();

    handler = module.get<UserUpdateHandler>(UserUpdateHandler);
    userWriteRepository = module.get(UserWriteRepoPortToken);
    userReadRepoPort = module.get(UserReadRepoPortToken);
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
     * 应该成功更新用户
     *
     * 验证当提供有效的命令时，处理器能够正确更新用户。
     */
    it('应该成功更新用户', async () => {
      const command = new UserUpdateCommand(
        'user-123',
        'testuser',
        '更新后的昵称',
        'https://example.com/avatar.jpg',
        'test@example.com',
        '13800138000',
        'user-123',
      );

      const existingUser: UserProperties = {
        id: 'user-123',
        username: 'testuser',
        nickName: '原昵称',
        domain: 'example.com',
        status: Status.ENABLED,
        avatar: null,
        email: null,
        phoneNumber: null,
        isEmailVerified: false,
        createdAt: new Date(),
        createdBy: 'user-1',
      };

      (userReadRepoPort.getUserByUsername as jest.Mock).mockResolvedValue(
        existingUser,
      );
      (userReadRepoPort.findUserById as jest.Mock).mockResolvedValue(
        existingUser,
      );

      await handler.execute(command);

      expect(userReadRepoPort.getUserByUsername).toHaveBeenCalledWith(
        'testuser',
      );
      expect(userReadRepoPort.findUserById).toHaveBeenCalledWith('user-123');
      expect(userWriteRepository.update).toHaveBeenCalledTimes(1);
    });

    /**
     * 应该抛出异常当用户名已被其他用户使用时
     *
     * 验证当用户名已被其他用户使用时，处理器能够正确抛出异常。
     */
    it('应该抛出异常当用户名已被其他用户使用时', async () => {
      const command = new UserUpdateCommand(
        'user-123',
        'existinguser',
        '测试用户',
        null,
        null,
        null,
        'user-123',
      );

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

      const userWithSameUsername: UserProperties = {
        id: 'user-456', // 不同的用户 ID
        username: 'existinguser',
        nickName: '其他用户',
        domain: 'example.com',
        status: Status.ENABLED,
        avatar: null,
        email: null,
        phoneNumber: null,
        isEmailVerified: false,
        createdAt: new Date(),
        createdBy: 'user-2',
      };

      (userReadRepoPort.getUserByUsername as jest.Mock).mockResolvedValue(
        userWithSameUsername,
      );
      (userReadRepoPort.findUserById as jest.Mock).mockResolvedValue(
        existingUser,
      );

      await expect(handler.execute(command)).rejects.toThrow(
        BadRequestException,
      );
      await expect(handler.execute(command)).rejects.toThrow(
        'A user with account existinguser already exists.',
      );
      expect(userWriteRepository.update).not.toHaveBeenCalled();
    });

    /**
     * 应该抛出异常当用户不存在时
     *
     * 验证当用户不存在时，处理器能够正确抛出异常。
     */
    it('应该抛出异常当用户不存在时', async () => {
      const command = new UserUpdateCommand(
        'non-existent-user',
        'testuser',
        '测试用户',
        null,
        null,
        null,
        'user-123',
      );

      (userReadRepoPort.getUserByUsername as jest.Mock).mockResolvedValue(null);
      (userReadRepoPort.findUserById as jest.Mock).mockResolvedValue(null);

      await expect(handler.execute(command)).rejects.toThrow(
        BadRequestException,
      );
      await expect(handler.execute(command)).rejects.toThrow('User not found.');
      expect(userWriteRepository.update).not.toHaveBeenCalled();
    });

    /**
     * 应该保留邮箱验证状态
     *
     * 验证更新用户时，处理器能够保留原有的邮箱验证状态。
     */
    it('应该保留邮箱验证状态', async () => {
      const command = new UserUpdateCommand(
        'user-123',
        'testuser',
        '更新后的昵称',
        null,
        'newemail@example.com',
        null,
        'user-123',
      );

      const existingUser: UserProperties = {
        id: 'user-123',
        username: 'testuser',
        nickName: '原昵称',
        domain: 'example.com',
        status: Status.ENABLED,
        avatar: null,
        email: 'oldemail@example.com',
        phoneNumber: null,
        isEmailVerified: true, // 原有验证状态为 true
        createdAt: new Date(),
        createdBy: 'user-1',
      };

      (userReadRepoPort.getUserByUsername as jest.Mock).mockResolvedValue(
        existingUser,
      );
      (userReadRepoPort.findUserById as jest.Mock).mockResolvedValue(
        existingUser,
      );

      await handler.execute(command);

      expect(userWriteRepository.update).toHaveBeenCalledWith(
        expect.objectContaining({
          isEmailVerified: true, // 应该保留原有验证状态
        }),
      );
    });
  });
});
