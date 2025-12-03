import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Test, TestingModule } from '@nestjs/testing';

import { RoleCreateCommand } from '@/lib/bounded-contexts/iam/role/commands/role-create.command';
import { RoleDeleteCommand } from '@/lib/bounded-contexts/iam/role/commands/role-delete.command';
import { RoleUpdateCommand } from '@/lib/bounded-contexts/iam/role/commands/role-update.command';
import { RoleProperties } from '@/lib/bounded-contexts/iam/role/domain/role.read.model';
import { PageRolesQuery } from '@/lib/bounded-contexts/iam/role/queries/page-roles.query';
import { ROOT_PID } from '@/lib/shared/constants/db.constant';
import { Status } from '@/lib/shared/enums/status.enum';

import { ApiRes, PaginationResult } from '@hl8/rest';
import type { IAuthentication } from '@hl8/typings';
import type { FastifyRequest } from 'fastify';

import { PageRolesDto } from '../dto/page-roles.dto';
import { RoleCreateDto, RoleUpdateDto } from '../dto/role.dto';
import { RoleController } from './role.controller';

/**
 * RoleController 单元测试
 *
 * @description
 * 测试角色控制器的实现，验证分页查询、创建、更新和删除角色的功能。
 */
describe('RoleController', () => {
  let controller: RoleController;
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
      controllers: [RoleController],
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

    controller = module.get<RoleController>(RoleController);
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
     * 应该成功分页查询角色列表
     *
     * 验证能够正确执行分页查询并返回结果。
     */
    it('应该成功分页查询角色列表', async () => {
      const queryDto = new PageRolesDto();
      queryDto.current = 1;
      queryDto.size = 10;
      queryDto.code = 'admin';
      queryDto.name = '管理员';
      queryDto.status = Status.ENABLED;

      const mockResult = new PaginationResult<RoleProperties>(1, 10, 2, [
        {
          id: 'role-1',
          code: 'admin',
          name: '管理员',
          pid: ROOT_PID,
          status: Status.ENABLED,
          description: '管理员角色',
        } as RoleProperties,
        {
          id: 'role-2',
          code: 'user',
          name: '普通用户',
          pid: ROOT_PID,
          status: Status.ENABLED,
          description: '普通用户角色',
        } as RoleProperties,
      ]);

      (queryBus.execute as jest.Mock).mockResolvedValue(mockResult);

      const result = await controller.page(queryDto);

      expect(result).toBeInstanceOf(ApiRes);
      expect(result.code).toBe(200);
      expect(result.data).toEqual(mockResult);
      expect(queryBus.execute).toHaveBeenCalledWith(expect.any(PageRolesQuery));
      expect(queryBus.execute).toHaveBeenCalledTimes(1);
    });

    /**
     * 应该正确处理查询异常
     *
     * 验证当查询失败时，能够正确传播异常。
     */
    it('应该正确处理查询异常', async () => {
      const queryDto = new PageRolesDto();
      queryDto.current = 1;
      queryDto.size = 10;

      const error = new Error('查询失败');
      (queryBus.execute as jest.Mock).mockRejectedValue(error);

      await expect(controller.page(queryDto)).rejects.toThrow('查询失败');
    });
  });

  describe('createRole', () => {
    /**
     * 应该成功创建角色
     *
     * 验证能够正确执行创建角色命令并返回成功结果。
     */
    it('应该成功创建角色', async () => {
      const dto = new RoleCreateDto();
      dto.code = 'newrole';
      dto.name = '新角色';
      dto.pid = 'parent-role-id';
      dto.status = Status.ENABLED;
      dto.description = '新角色描述';

      const mockRequest = {
        user: {
          uid: 'current-user-123',
        } as IAuthentication,
      } as FastifyRequest & { user: IAuthentication };

      (commandBus.execute as jest.Mock).mockResolvedValue(undefined);

      const result = await controller.createRole(dto, mockRequest);

      expect(result).toBeInstanceOf(ApiRes);
      expect(result.code).toBe(200);
      expect(result.data).toBeNull();
      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.any(RoleCreateCommand),
      );

      // 验证命令参数
      const command = (commandBus.execute as jest.Mock).mock.calls[0][0];
      expect(command).toBeInstanceOf(RoleCreateCommand);
      expect(command.code).toBe('newrole');
      expect(command.name).toBe('新角色');
      expect(command.pid).toBe('parent-role-id');
    });

    /**
     * 应该将空字符串 pid 转换为 ROOT_PID
     *
     * 验证当 pid 为空字符串时，能够正确转换为 ROOT_PID。
     */
    it('应该将空字符串 pid 转换为 ROOT_PID', async () => {
      const dto = new RoleCreateDto();
      dto.code = 'newrole';
      dto.name = '新角色';
      dto.pid = ''; // 空字符串应该转换为 ROOT_PID
      dto.status = Status.ENABLED;

      const mockRequest = {
        user: {
          uid: 'current-user-123',
        } as IAuthentication,
      } as FastifyRequest & { user: IAuthentication };

      (commandBus.execute as jest.Mock).mockResolvedValue(undefined);

      await controller.createRole(dto, mockRequest);

      const command = (commandBus.execute as jest.Mock).mock.calls[0][0];
      expect(command.pid).toBe(ROOT_PID);
    });

    /**
     * 应该正确处理创建异常
     *
     * 验证当创建失败时，能够正确传播异常。
     */
    it('应该正确处理创建异常', async () => {
      const dto = new RoleCreateDto();
      dto.code = 'newrole';
      dto.name = '新角色';
      dto.status = Status.ENABLED;

      const mockRequest = {
        user: {
          uid: 'current-user-123',
        } as IAuthentication,
      } as FastifyRequest & { user: IAuthentication };

      const error = new Error('创建失败');
      (commandBus.execute as jest.Mock).mockRejectedValue(error);

      await expect(controller.createRole(dto, mockRequest)).rejects.toThrow(
        '创建失败',
      );
    });
  });

  describe('updateRole', () => {
    /**
     * 应该成功更新角色
     *
     * 验证能够正确执行更新角色命令并返回成功结果。
     */
    it('应该成功更新角色', async () => {
      const dto = new RoleUpdateDto();
      dto.id = 'role-123';
      dto.code = 'admin';
      dto.name = '更新后的角色名';
      dto.pid = 'parent-role-id';
      dto.status = Status.DISABLED;
      dto.description = '更新后的描述';

      const mockRequest = {
        user: {
          uid: 'current-user-123',
        } as IAuthentication,
      } as FastifyRequest & { user: IAuthentication };

      (commandBus.execute as jest.Mock).mockResolvedValue(undefined);

      const result = await controller.updateRole(dto, mockRequest);

      expect(result).toBeInstanceOf(ApiRes);
      expect(result.code).toBe(200);
      expect(result.data).toBeNull();
      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.any(RoleUpdateCommand),
      );

      // 验证命令参数
      const command = (commandBus.execute as jest.Mock).mock.calls[0][0];
      expect(command).toBeInstanceOf(RoleUpdateCommand);
      expect(command.id).toBe('role-123');
      expect(command.name).toBe('更新后的角色名');
    });

    /**
     * 应该将空字符串 pid 转换为 ROOT_PID
     *
     * 验证当 pid 为空字符串时，能够正确转换为 ROOT_PID。
     */
    it('应该将空字符串 pid 转换为 ROOT_PID', async () => {
      const dto = new RoleUpdateDto();
      dto.id = 'role-123';
      dto.code = 'admin';
      dto.name = '更新后的角色名';
      dto.pid = ''; // 空字符串应该转换为 ROOT_PID
      dto.status = Status.ENABLED;

      const mockRequest = {
        user: {
          uid: 'current-user-123',
        } as IAuthentication,
      } as FastifyRequest & { user: IAuthentication };

      (commandBus.execute as jest.Mock).mockResolvedValue(undefined);

      await controller.updateRole(dto, mockRequest);

      const command = (commandBus.execute as jest.Mock).mock.calls[0][0];
      expect(command).toBeInstanceOf(RoleUpdateCommand);
      expect(command.pid).toBe(ROOT_PID);
    });

    /**
     * 应该正确处理更新异常
     *
     * 验证当更新失败时，能够正确传播异常。
     */
    it('应该正确处理更新异常', async () => {
      const dto = new RoleUpdateDto();
      dto.id = 'role-123';
      dto.code = 'admin';
      dto.name = '更新后的角色名';
      dto.status = Status.ENABLED;

      const mockRequest = {
        user: {
          uid: 'current-user-123',
        } as IAuthentication,
      } as FastifyRequest & { user: IAuthentication };

      const error = new Error('更新失败');
      (commandBus.execute as jest.Mock).mockRejectedValue(error);

      await expect(controller.updateRole(dto, mockRequest)).rejects.toThrow(
        '更新失败',
      );
    });
  });

  describe('deleteRole', () => {
    /**
     * 应该成功删除角色
     *
     * 验证能够正确执行删除角色命令并返回成功结果。
     */
    it('应该成功删除角色', async () => {
      const roleId = 'role-123';

      (commandBus.execute as jest.Mock).mockResolvedValue(undefined);

      const result = await controller.deleteRole(roleId);

      expect(result).toBeInstanceOf(ApiRes);
      expect(result.code).toBe(200);
      expect(result.data).toBeNull();
      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.any(RoleDeleteCommand),
      );

      // 验证命令参数
      const command = (commandBus.execute as jest.Mock).mock.calls[0][0];
      expect(command.id).toBe(roleId);
    });

    /**
     * 应该正确处理删除异常
     *
     * 验证当删除失败时，能够正确传播异常。
     */
    it('应该正确处理删除异常', async () => {
      const roleId = 'role-123';

      const error = new Error('删除失败');
      (commandBus.execute as jest.Mock).mockRejectedValue(error);

      await expect(controller.deleteRole(roleId)).rejects.toThrow('删除失败');
    });
  });
});
