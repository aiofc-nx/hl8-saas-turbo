import { Test, TestingModule } from '@nestjs/testing';

import { AuthorizationService } from '@/lib/bounded-contexts/iam/authentication/application/service/authorization.service';
import { RoleAssignPermissionCommand } from '@/lib/bounded-contexts/iam/authentication/commands/role-assign-permission.command';
import { RoleAssignRouteCommand } from '@/lib/bounded-contexts/iam/authentication/commands/role-assign-route.command';
import { RoleAssignUserCommand } from '@/lib/bounded-contexts/iam/authentication/commands/role-assign-user.command';
import { UserRoute } from '@/lib/bounded-contexts/iam/menu/application/dto/route.dto';
import { MenuService } from '@/lib/bounded-contexts/iam/menu/application/service/menu.service';

import { AuthZGuard } from '@hl8/casbin';
import { RedisUtility } from '@hl8/redis';
import { ApiRes } from '@hl8/rest';
import { IAuthentication } from '@hl8/typings';
import type { FastifyRequest } from 'fastify';

import { AssignPermissionDto } from '../dto/assign-permission.dto';
import { AssignRouteDto } from '../dto/assign-route.dto';
import { AssignUserDto } from '../dto/assign-user.dto';
import { AuthorizationController } from './authorization.controller';

/**
 * AuthorizationController 单元测试
 *
 * @description
 * 测试授权控制器的实现，验证为角色分配权限、路由和用户的功能。
 */
describe('AuthorizationController', () => {
  let controller: AuthorizationController;
  let authorizationService: jest.Mocked<AuthorizationService>;
  let menuService: jest.Mocked<MenuService>;

  /**
   * 测试前准备
   *
   * 创建测试模块，Mock AuthorizationService 和 MenuService 依赖。
   */
  beforeEach(async () => {
    // 创建 Mock AuthorizationService 和 MenuService
    const mockAuthorizationService = {
      assignPermission: jest.fn(),
      assignRoutes: jest.fn(),
      assignUsers: jest.fn(),
    } as unknown as jest.Mocked<AuthorizationService>;

    const mockMenuService = {
      getUserRoutes: jest.fn(),
    } as unknown as jest.Mocked<MenuService>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthorizationController],
      providers: [
        {
          provide: AuthorizationService,
          useValue: mockAuthorizationService,
        },
        {
          provide: MenuService,
          useValue: mockMenuService,
        },
      ],
    })
      .overrideGuard(AuthZGuard)
      .useValue({
        canActivate: jest.fn().mockReturnValue(true),
      })
      .compile();

    controller = module.get<AuthorizationController>(AuthorizationController);
    authorizationService = module.get(AuthorizationService);
    menuService = module.get(MenuService);
  });

  /**
   * 测试后清理
   *
   * 重置所有 Mock 函数。
   */
  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('assignPermission', () => {
    /**
     * 应该成功为角色分配权限
     *
     * 验证能够正确执行分配权限操作并返回成功结果。
     */
    it('应该成功为角色分配权限', async () => {
      const dto = new AssignPermissionDto();
      dto.domain = 'example.com';
      dto.roleId = 'role-123';
      dto.permissions = ['user:read', 'user:write', 'role:read'];

      (authorizationService.assignPermission as jest.Mock).mockResolvedValue(
        undefined,
      );

      const result = await controller.assignPermission(dto);

      expect(result).toBeInstanceOf(ApiRes);
      expect(result.code).toBe(200);
      expect(result.data).toBeNull();
      expect(authorizationService.assignPermission).toHaveBeenCalledWith(
        expect.any(RoleAssignPermissionCommand),
      );

      // 验证命令参数
      const command = (authorizationService.assignPermission as jest.Mock).mock
        .calls[0][0];
      expect(command).toBeInstanceOf(RoleAssignPermissionCommand);
      expect(command.domain).toBe('example.com');
      expect(command.roleId).toBe('role-123');
      expect(command.permissions).toEqual([
        'user:read',
        'user:write',
        'role:read',
      ]);
    });

    /**
     * 应该正确处理分配异常
     *
     * 验证当分配失败时，能够正确传播异常。
     */
    it('应该正确处理分配异常', async () => {
      const dto = new AssignPermissionDto();
      dto.domain = 'example.com';
      dto.roleId = 'role-123';
      dto.permissions = ['user:read'];

      const error = new Error('分配失败');
      (authorizationService.assignPermission as jest.Mock).mockRejectedValue(
        error,
      );

      await expect(controller.assignPermission(dto)).rejects.toThrow(
        '分配失败',
      );
    });
  });

  describe('assignRoutes', () => {
    /**
     * 应该成功为角色分配路由
     *
     * 验证能够正确执行分配路由操作并返回成功结果。
     */
    it('应该成功为角色分配路由', async () => {
      const dto = new AssignRouteDto();
      dto.domain = 'example.com';
      dto.roleId = 'role-123';
      dto.routeIds = [1, 2, 3];

      (authorizationService.assignRoutes as jest.Mock).mockResolvedValue(
        undefined,
      );

      const result = await controller.assignRoutes(dto);

      expect(result).toBeInstanceOf(ApiRes);
      expect(result.code).toBe(200);
      expect(result.data).toBeNull();
      expect(authorizationService.assignRoutes).toHaveBeenCalledWith(
        expect.any(RoleAssignRouteCommand),
      );

      // 验证命令参数
      const command = (authorizationService.assignRoutes as jest.Mock).mock
        .calls[0][0];
      expect(command).toBeInstanceOf(RoleAssignRouteCommand);
      expect(command.domain).toBe('example.com');
      expect(command.roleId).toBe('role-123');
      expect(command.menuIds).toEqual([1, 2, 3]);
    });

    /**
     * 应该正确处理分配异常
     *
     * 验证当分配失败时，能够正确传播异常。
     */
    it('应该正确处理分配异常', async () => {
      const dto = new AssignRouteDto();
      dto.domain = 'example.com';
      dto.roleId = 'role-123';
      dto.routeIds = [1];

      const error = new Error('分配失败');
      (authorizationService.assignRoutes as jest.Mock).mockRejectedValue(error);

      await expect(controller.assignRoutes(dto)).rejects.toThrow('分配失败');
    });
  });

  describe('assignUsers', () => {
    /**
     * 应该成功为角色分配用户
     *
     * 验证能够正确执行分配用户操作并返回成功结果。
     */
    it('应该成功为角色分配用户', async () => {
      const dto = new AssignUserDto();
      dto.roleId = 'role-123';
      dto.userIds = ['user-1', 'user-2', 'user-3'];

      (authorizationService.assignUsers as jest.Mock).mockResolvedValue(
        undefined,
      );

      const result = await controller.assignUsers(dto);

      expect(result).toBeInstanceOf(ApiRes);
      expect(result.code).toBe(200);
      expect(result.data).toBeNull();
      expect(authorizationService.assignUsers).toHaveBeenCalledWith(
        expect.any(RoleAssignUserCommand),
      );

      // 验证命令参数
      const command = (authorizationService.assignUsers as jest.Mock).mock
        .calls[0][0];
      expect(command).toBeInstanceOf(RoleAssignUserCommand);
      expect(command.roleId).toBe('role-123');
      expect(command.userIds).toEqual(['user-1', 'user-2', 'user-3']);
    });

    /**
     * 应该正确处理分配异常
     *
     * 验证当分配失败时，能够正确传播异常。
     */
    it('应该正确处理分配异常', async () => {
      const dto = new AssignUserDto();
      dto.roleId = 'role-123';
      dto.userIds = ['user-1'];

      const error = new Error('分配失败');
      (authorizationService.assignUsers as jest.Mock).mockRejectedValue(error);

      await expect(controller.assignUsers(dto)).rejects.toThrow('分配失败');
    });
  });

  describe('getUserRoutes', () => {
    /**
     * 应该成功获取用户路由
     *
     * 验证能够正确获取用户可访问的路由信息。
     */
    it('应该成功获取用户路由', async () => {
      const mockRequest = {
        user: {
          uid: 'user-123',
          domain: 'example.com',
        } as IAuthentication,
      } as FastifyRequest & { user: IAuthentication };

      const mockUserRoutes: UserRoute = {
        routes: [
          {
            path: '/user',
            name: 'user-management',
            component: 'UserManagement',
          },
        ],
        home: '/user',
      };

      // Mock Redis
      const mockRedisInstance = {
        smembers: jest.fn().mockResolvedValue(['admin', 'user']),
      };
      jest
        .spyOn(RedisUtility, 'instance', 'get')
        .mockReturnValue(mockRedisInstance as any);

      (menuService.getUserRoutes as jest.Mock).mockResolvedValue(
        mockUserRoutes,
      );

      const result = await controller.getUserRoutes(mockRequest);

      expect(result).toBeInstanceOf(ApiRes);
      expect(result.code).toBe(200);
      expect(result.data).toEqual(mockUserRoutes);
      expect(menuService.getUserRoutes).toHaveBeenCalledWith(
        ['admin', 'user'],
        'example.com',
      );
    });

    /**
     * 应该抛出异常当用户没有角色时
     *
     * 验证当用户没有分配任何角色时，能够正确抛出异常。
     */
    it('应该抛出异常当用户没有角色时', async () => {
      const mockRequest = {
        user: {
          uid: 'user-123',
          domain: 'example.com',
        } as IAuthentication,
      } as FastifyRequest & { user: IAuthentication };

      // Mock Redis 返回空数组
      const mockRedisInstance = {
        smembers: jest.fn().mockResolvedValue([]),
      };
      jest
        .spyOn(RedisUtility, 'instance', 'get')
        .mockReturnValue(mockRedisInstance as any);

      await expect(controller.getUserRoutes(mockRequest)).rejects.toThrow(
        'No roles found for the user',
      );
    });
  });
});
