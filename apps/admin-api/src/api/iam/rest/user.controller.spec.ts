import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Test, TestingModule } from '@nestjs/testing';

import { UserCreateCommand } from '@/lib/bounded-contexts/iam/authentication/commands/user-create.command';
import { UserDeleteCommand } from '@/lib/bounded-contexts/iam/authentication/commands/user-delete.command';
import { UserUpdateCommand } from '@/lib/bounded-contexts/iam/authentication/commands/user-update.command';
import { UserProperties } from '@/lib/bounded-contexts/iam/authentication/domain/user.read.model';
import { PageUsersQuery } from '@/lib/bounded-contexts/iam/authentication/queries/page-users.query';
import { Status } from '@/lib/shared/enums/status.enum';

import { ApiRes, PaginationResult } from '@hl8/rest';
import type { IAuthentication } from '@hl8/typings';
import type { FastifyRequest } from 'fastify';

import { PageUsersDto } from '../dto/page-users.dto';
import { UserCreateDto, UserUpdateDto } from '../dto/user.dto';
import { UserController } from './user.controller';

/**
 * UserController 单元测试
 *
 * @description
 * 测试用户控制器的实现，验证分页查询、创建、更新和删除用户的功能。
 */
describe('UserController', () => {
  let controller: UserController;
  let queryBus: jest.Mocked<QueryBus>;
  let commandBus: jest.Mocked<CommandBus>;

  /**
   * 测试前准备
   *
   * 创建测试模块，Mock QueryBus 和 CommandBus 依赖。
   */
  beforeEach(async () => {
    // 创建 Mock QueryBus 和 CommandBus
    const mockQueryBus = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<QueryBus>;

    const mockCommandBus = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<CommandBus>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: QueryBus,
          useValue: mockQueryBus,
        },
        {
          provide: CommandBus,
          useValue: mockCommandBus,
        },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
    queryBus = module.get(QueryBus);
    commandBus = module.get(CommandBus);
  });

  /**
   * 测试后清理
   *
   * 重置所有 Mock 函数。
   */
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('page', () => {
    /**
     * 应该成功分页查询用户列表
     *
     * 验证能够正确执行分页查询并返回结果。
     */
    it('应该成功分页查询用户列表', async () => {
      const queryDto = new PageUsersDto();
      queryDto.current = 1;
      queryDto.size = 10;
      queryDto.username = 'test';
      queryDto.nickName = '测试';
      queryDto.status = Status.ENABLED;

      const mockResult = new PaginationResult<UserProperties>(1, 10, 2, [
        {
          id: 'user-1',
          username: 'testuser1',
          domain: 'example.com',
          nickName: '测试用户1',
          status: Status.ENABLED,
          password: 'hashed-password',
          avatar: null,
          email: 'test1@example.com',
          phoneNumber: null,
          isEmailVerified: true,
          createdAt: new Date(),
          createdBy: 'user-1',
        } as UserProperties,
        {
          id: 'user-2',
          username: 'testuser2',
          domain: 'example.com',
          nickName: '测试用户2',
          status: Status.ENABLED,
          password: 'hashed-password',
          avatar: null,
          email: 'test2@example.com',
          phoneNumber: null,
          isEmailVerified: false,
          createdAt: new Date(),
          createdBy: 'user-1',
        } as UserProperties,
      ]);

      (queryBus.execute as jest.Mock).mockResolvedValue(mockResult);

      const result = await controller.page(queryDto);

      expect(result).toBeInstanceOf(ApiRes);
      expect(result.code).toBe(200);
      expect(result.data).toEqual(mockResult);
      expect(queryBus.execute).toHaveBeenCalledWith(expect.any(PageUsersQuery));
      expect(queryBus.execute).toHaveBeenCalledTimes(1);
    });

    /**
     * 应该正确处理查询异常
     *
     * 验证当查询失败时，能够正确传播异常。
     */
    it('应该正确处理查询异常', async () => {
      const queryDto = new PageUsersDto();
      queryDto.current = 1;
      queryDto.size = 10;

      const error = new Error('查询失败');
      (queryBus.execute as jest.Mock).mockRejectedValue(error);

      await expect(controller.page(queryDto)).rejects.toThrow('查询失败');
    });
  });

  describe('createUser', () => {
    /**
     * 应该成功创建用户
     *
     * 验证能够正确执行创建用户命令并返回成功结果。
     */
    it('应该成功创建用户', async () => {
      const dto = new UserCreateDto();
      dto.username = 'newuser';
      dto.password = 'password123';
      dto.domain = 'example.com';
      dto.nickName = '新用户';
      dto.email = 'newuser@example.com';
      dto.phoneNumber = '13800138000';

      const mockRequest = {
        user: {
          uid: 'current-user-123',
        } as IAuthentication,
      } as FastifyRequest & { user: IAuthentication };

      (commandBus.execute as jest.Mock).mockResolvedValue(undefined);

      const result = await controller.createUser(dto, mockRequest);

      expect(result).toBeInstanceOf(ApiRes);
      expect(result.code).toBe(200);
      expect(result.data).toBeNull();
      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.any(UserCreateCommand),
      );
      expect(commandBus.execute).toHaveBeenCalledTimes(1);

      // 验证命令参数
      const command = (commandBus.execute as jest.Mock).mock.calls[0][0];
      expect(command).toBeInstanceOf(UserCreateCommand);
      expect(command.username).toBe('newuser');
      expect(command.password).toBe('password123');
      expect(command.domain).toBe('example.com');
      expect(command.nickName).toBe('新用户');
    });

    /**
     * 应该正确处理创建异常
     *
     * 验证当创建失败时，能够正确传播异常。
     */
    it('应该正确处理创建异常', async () => {
      const dto = new UserCreateDto();
      dto.username = 'newuser';
      dto.password = 'password123';
      dto.domain = 'example.com';
      dto.nickName = '新用户';

      const mockRequest = {
        user: {
          uid: 'current-user-123',
        } as IAuthentication,
      } as FastifyRequest & { user: IAuthentication };

      const error = new Error('创建失败');
      (commandBus.execute as jest.Mock).mockRejectedValue(error);

      await expect(controller.createUser(dto, mockRequest)).rejects.toThrow(
        '创建失败',
      );
    });
  });

  describe('updateUser', () => {
    /**
     * 应该成功更新用户
     *
     * 验证能够正确执行更新用户命令并返回成功结果。
     */
    it('应该成功更新用户', async () => {
      const dto = new UserUpdateDto();
      dto.id = 'user-123';
      dto.username = 'testuser';
      dto.nickName = '更新后的昵称';
      dto.email = 'updated@example.com';
      dto.phoneNumber = '13900139000';

      const mockRequest = {
        user: {
          uid: 'current-user-123',
        } as IAuthentication,
      } as FastifyRequest & { user: IAuthentication };

      (commandBus.execute as jest.Mock).mockResolvedValue(undefined);

      const result = await controller.updateUser(dto, mockRequest);

      expect(result).toBeInstanceOf(ApiRes);
      expect(result.code).toBe(200);
      expect(result.data).toBeNull();
      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.any(UserUpdateCommand),
      );

      // 验证命令参数
      const command = (commandBus.execute as jest.Mock).mock.calls[0][0];
      expect(command).toBeInstanceOf(UserUpdateCommand);
      expect(command.id).toBe('user-123');
      expect(command.nickName).toBe('更新后的昵称');
    });

    /**
     * 应该正确处理更新异常
     *
     * 验证当更新失败时，能够正确传播异常。
     */
    it('应该正确处理更新异常', async () => {
      const dto = new UserUpdateDto();
      dto.id = 'user-123';
      dto.username = 'testuser';
      dto.nickName = '更新后的昵称';

      const mockRequest = {
        user: {
          uid: 'current-user-123',
        } as IAuthentication,
      } as FastifyRequest & { user: IAuthentication };

      const error = new Error('更新失败');
      (commandBus.execute as jest.Mock).mockRejectedValue(error);

      await expect(controller.updateUser(dto, mockRequest)).rejects.toThrow(
        '更新失败',
      );
    });
  });

  describe('deleteUser', () => {
    /**
     * 应该成功删除用户
     *
     * 验证能够正确执行删除用户命令并返回成功结果。
     */
    it('应该成功删除用户', async () => {
      const userId = 'user-123';

      (commandBus.execute as jest.Mock).mockResolvedValue(undefined);

      const result = await controller.deleteUser(userId);

      expect(result).toBeInstanceOf(ApiRes);
      expect(result.code).toBe(200);
      expect(result.data).toBeNull();
      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.any(UserDeleteCommand),
      );

      // 验证命令参数
      const command = (commandBus.execute as jest.Mock).mock.calls[0][0];
      expect(command.id).toBe(userId);
    });

    /**
     * 应该正确处理删除异常
     *
     * 验证当删除失败时，能够正确传播异常。
     */
    it('应该正确处理删除异常', async () => {
      const userId = 'user-123';

      const error = new Error('删除失败');
      (commandBus.execute as jest.Mock).mockRejectedValue(error);

      await expect(controller.deleteUser(userId)).rejects.toThrow('删除失败');
    });
  });
});
