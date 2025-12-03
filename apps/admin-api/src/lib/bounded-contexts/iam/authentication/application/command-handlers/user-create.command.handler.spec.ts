import { BadRequestException } from '@nestjs/common';
import { EventPublisher } from '@nestjs/cqrs';
import { Test, TestingModule } from '@nestjs/testing';

import { UserCreateCommand } from '../../commands/user-create.command';
import { UserReadRepoPortToken, UserWriteRepoPortToken } from '../../constants';
import type { UserReadRepoPort } from '../../ports/user.read.repo-port';
import type { UserWriteRepoPort } from '../../ports/user.write.repo-port';
import { UserCreateHandler } from './user-create.command.handler';

/**
 * UserCreateHandler 单元测试
 *
 * @description
 * 测试用户创建命令处理器的业务逻辑。
 */
describe('UserCreateHandler', () => {
  let handler: UserCreateHandler;
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
      save: jest.fn().mockResolvedValue(undefined),
      update: jest.fn(),
      deleteById: jest.fn(),
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
        UserCreateHandler,
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

    handler = module.get<UserCreateHandler>(UserCreateHandler);
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
     * 应该成功创建用户
     *
     * 验证当提供有效的命令时，处理器能够正确创建用户。
     */
    it('应该成功创建用户', async () => {
      const command = new UserCreateCommand(
        'testuser',
        'password123',
        'example.com',
        '测试用户',
        null,
        null,
        null,
        'user-123',
      );

      (userReadRepoPort.getUserByUsername as jest.Mock).mockResolvedValue(null);
      (userWriteRepository.save as jest.Mock).mockResolvedValue(undefined);

      await handler.execute(command);

      expect(userReadRepoPort.getUserByUsername).toHaveBeenCalledWith(
        'testuser',
      );
      expect(userWriteRepository.save).toHaveBeenCalledTimes(1);
      expect(publisher.mergeObjectContext).toHaveBeenCalled();
    });

    /**
     * 应该抛出异常当用户名已存在时
     *
     * 验证当用户名已存在时，处理器能够正确抛出异常。
     */
    it('应该抛出异常当用户名已存在时', async () => {
      const command = new UserCreateCommand(
        'existinguser',
        'password123',
        'example.com',
        '测试用户',
        null,
        null,
        null,
        'user-123',
      );

      const existingUser = {
        id: 'existing-user-id',
        username: 'existinguser',
      };

      (userReadRepoPort.getUserByUsername as jest.Mock).mockResolvedValue(
        existingUser,
      );

      await expect(handler.execute(command)).rejects.toThrow(
        BadRequestException,
      );
      await expect(handler.execute(command)).rejects.toThrow(
        'A user with code existinguser already exists.',
      );
      expect(userWriteRepository.save).not.toHaveBeenCalled();
    });
  });
});
