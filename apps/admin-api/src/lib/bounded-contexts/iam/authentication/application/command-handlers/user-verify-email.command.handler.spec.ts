import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { Status } from '@/lib/shared/enums/status.enum';

import { UserVerifyEmailCommand } from '../../commands/user-verify-email.command';
import { UserReadRepoPortToken, UserWriteRepoPortToken } from '../../constants';
import type { UserProperties } from '../../domain/user.read.model';
import type { UserReadRepoPort } from '../../ports/user.read.repo-port';
import type { UserWriteRepoPort } from '../../ports/user.write.repo-port';
import { UserVerifyEmailHandler } from './user-verify-email.command.handler';

/**
 * UserVerifyEmailHandler 单元测试
 *
 * @description
 * 测试用户邮箱验证命令处理器的业务逻辑。
 */
describe('UserVerifyEmailHandler', () => {
  let handler: UserVerifyEmailHandler;
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
        UserVerifyEmailHandler,
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

    handler = module.get<UserVerifyEmailHandler>(UserVerifyEmailHandler);
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
     * 应该成功验证用户邮箱
     *
     * 验证当提供有效的命令时，处理器能够正确更新用户的邮箱验证状态。
     */
    it('应该成功验证用户邮箱', async () => {
      const userId = 'user-123';
      const command = new UserVerifyEmailCommand(userId, 'user-123');

      const existingUser: UserProperties = {
        id: userId,
        username: 'testuser',
        nickName: '测试用户',
        domain: 'example.com',
        status: Status.ENABLED,
        avatar: null,
        email: 'test@example.com',
        phoneNumber: null,
        isEmailVerified: false, // 未验证状态
        createdAt: new Date(),
        createdBy: 'user-1',
      };

      (userReadRepoPort.findUserById as jest.Mock).mockResolvedValue(
        existingUser,
      );

      await handler.execute(command);

      expect(userReadRepoPort.findUserById).toHaveBeenCalledWith(userId);
      expect(userWriteRepository.update).toHaveBeenCalledTimes(1);
      expect(userWriteRepository.update).toHaveBeenCalledWith(
        expect.objectContaining({
          id: userId,
          isEmailVerified: true, // 应该更新为已验证
        }),
      );
    });

    /**
     * 应该抛出异常当用户不存在时
     *
     * 验证当用户不存在时，处理器能够正确抛出异常。
     */
    it('应该抛出异常当用户不存在时', async () => {
      const userId = 'non-existent-user';
      const command = new UserVerifyEmailCommand(userId, 'user-123');

      (userReadRepoPort.findUserById as jest.Mock).mockResolvedValue(null);

      await expect(handler.execute(command)).rejects.toThrow(NotFoundException);
      await expect(handler.execute(command)).rejects.toThrow('User not found.');
      expect(userWriteRepository.update).not.toHaveBeenCalled();
    });
  });
});
