import { NotFoundException } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { Test, TestingModule } from '@nestjs/testing';

import { AuthZRBACService } from '@hl8/casbin';
import { EntityManager } from '@mikro-orm/core';

import { FindEndpointsByIdsQuery } from '../../../../api-endpoint/api-endpoint/queries/endpoints.by-ids.query';
import { FindDomainByCodeQuery } from '../../../domain/queries/domain.by-code.query';
import { MenusByIdsQuery } from '../../../menu/queries/menus.by-ids.query';
import { FindRoleByIdQuery } from '../../../role/queries/role.by-id.query';
import { UsersByIdsQuery } from '../../queries/users.by-ids.query';

import { RoleAssignPermissionCommand } from '../../commands/role-assign-permission.command';
import { RoleAssignRouteCommand } from '../../commands/role-assign-route.command';
import { RoleAssignUserCommand } from '../../commands/role-assign-user.command';
import { AuthorizationService } from './authorization.service';

/**
 * AuthorizationService 单元测试
 *
 * @description
 * 测试授权服务的业务逻辑，包括为角色分配权限、路由和用户。
 */
describe('AuthorizationService', () => {
  let service: AuthorizationService;
  let queryBus: jest.Mocked<QueryBus>;
  let authZRBACService: jest.Mocked<AuthZRBACService>;
  let em: jest.Mocked<EntityManager>;

  /**
   * 测试前准备
   *
   * 创建测试模块，Mock 所有依赖服务。
   */
  beforeEach(async () => {
    // Mock QueryBus
    const mockQueryBus = {
      execute: jest.fn(),
    };

    // Mock AuthZRBACService
    const mockEnforcer = {
      getFilteredPolicy: jest.fn(),
      removeFilteredPolicy: jest.fn(),
      addPermissionForUser: jest.fn(),
    };

    const mockAuthZRBACService = {
      enforcer: mockEnforcer,
    };

    // Mock EntityManager
    const mockEm = {
      transactional: jest.fn(),
      create: jest.fn(),
      persist: jest.fn(),
      nativeDelete: jest.fn(),
      flush: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthorizationService,
        {
          provide: QueryBus,
          useValue: mockQueryBus,
        },
        {
          provide: AuthZRBACService,
          useValue: mockAuthZRBACService,
        },
        {
          provide: EntityManager,
          useValue: mockEm,
        },
      ],
    }).compile();

    service = module.get<AuthorizationService>(AuthorizationService);
    queryBus = module.get(QueryBus);
    authZRBACService = module.get(AuthZRBACService);
    em = module.get(EntityManager);
  });

  /**
   * 测试后清理
   *
   * 重置所有 Mock 函数。
   */
  afterEach(() => {
    jest.clearAllMocks();
    // 清除 mock 的调用历史，但保留 mock 实现
    (queryBus.execute as jest.Mock).mockClear();
  });

  describe('assignPermission', () => {
    /**
     * 应该成功为角色分配权限
     *
     * 验证当提供有效的命令时，服务能够正确同步权限到 Casbin。
     */
    it('应该成功为角色分配权限', async () => {
      const command = new RoleAssignPermissionCommand(
        'example.com',
        'role-123',
        ['endpoint-1', 'endpoint-2'],
      );

      const mockDomain = {
        code: 'example.com',
        id: 'domain-123',
      };

      const mockRole = {
        id: 'role-123',
        code: 'admin',
      };

      const mockPermissions = [
        { id: 'endpoint-1', resource: '/api/users', action: 'GET' },
        { id: 'endpoint-2', resource: '/api/users', action: 'POST' },
      ];

      const mockExistingPermissions: string[][] = [
        ['admin', '/api/users', 'GET', 'example.com', 'allow'],
      ];

      // Mock checkDomainAndRole
      (queryBus.execute as jest.Mock)
        .mockResolvedValueOnce(mockDomain) // FindDomainByCodeQuery
        .mockResolvedValueOnce(mockRole) // FindRoleByIdQuery
        .mockResolvedValueOnce(mockPermissions) // FindEndpointsByIdsQuery
        .mockResolvedValueOnce(mockExistingPermissions); // getFilteredPolicy

      (
        authZRBACService.enforcer.getFilteredPolicy as jest.Mock
      ).mockResolvedValue(mockExistingPermissions);
      (
        authZRBACService.enforcer.removeFilteredPolicy as jest.Mock
      ).mockResolvedValue(true);
      (
        authZRBACService.enforcer.addPermissionForUser as jest.Mock
      ).mockResolvedValue(true);

      await service.assignPermission(command);

      expect(queryBus.execute).toHaveBeenCalled();
      expect(authZRBACService.enforcer.getFilteredPolicy).toHaveBeenCalled();
    });

    /**
     * 应该抛出异常当域不存在时
     *
     * 验证当域不存在时，服务能够正确抛出异常。
     */
    it('应该抛出异常当域不存在时', async () => {
      const command = new RoleAssignPermissionCommand(
        'nonexistent.com',
        'role-123',
        ['endpoint-1'],
      );

      (queryBus.execute as jest.Mock).mockResolvedValueOnce(null); // FindDomainByCodeQuery

      await expect(service.assignPermission(command)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.assignPermission(command)).rejects.toThrow(
        'Domain not found.',
      );
    });

    /**
     * 应该抛出异常当权限不存在时
     *
     * 验证当权限不存在时，服务能够正确抛出异常。
     */
    it('应该抛出异常当权限不存在时', async () => {
      const command = new RoleAssignPermissionCommand(
        'example.com',
        'role-123',
        ['nonexistent-endpoint'],
      );

      const mockDomain = {
        code: 'example.com',
        id: 'domain-123',
      };

      const mockRole = {
        id: 'role-123',
        code: 'admin',
      };

      // 使用 mockImplementation 根据查询类型返回不同的值
      (queryBus.execute as jest.Mock).mockImplementation((query) => {
        if (query instanceof FindDomainByCodeQuery) {
          return Promise.resolve(mockDomain);
        }
        if (query instanceof FindRoleByIdQuery) {
          return Promise.resolve(mockRole);
        }
        if (query instanceof FindEndpointsByIdsQuery) {
          return Promise.resolve([]); // 空数组表示权限不存在
        }
        return Promise.resolve(null);
      });

      await expect(service.assignPermission(command)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.assignPermission(command)).rejects.toThrow(
        'One or more permissions not found.',
      );
    });
  });

  describe('assignRoutes', () => {
    /**
     * 应该成功为角色分配路由
     *
     * 验证当提供有效的命令时，服务能够正确同步路由到数据库。
     */
    it('应该成功为角色分配路由', async () => {
      const command = new RoleAssignRouteCommand(
        'example.com',
        'role-123',
        [1, 2],
      );

      const mockDomain = {
        code: 'example.com',
        id: 'domain-123',
      };

      const mockRole = {
        id: 'role-123',
        code: 'admin',
      };

      const mockRoutes = [
        { id: 1, menuName: '用户管理' },
        { id: 2, menuName: '角色管理' },
      ];

      const mockExistingRouteIds: number[] = [1];

      const mockRoleMenu = {};
      const mockPersist = jest.fn().mockResolvedValue(undefined);
      const mockFlush = jest.fn().mockResolvedValue(undefined);
      const mockNativeDelete = jest.fn().mockResolvedValue(undefined);

      // Mock transactional
      (em.transactional as jest.Mock).mockImplementation(async (callback) => {
        const mockEm = {
          create: jest.fn().mockReturnValue(mockRoleMenu),
          persist: mockPersist,
          nativeDelete: mockNativeDelete,
          flush: mockFlush,
        };
        return callback(mockEm);
      });

      (queryBus.execute as jest.Mock)
        .mockResolvedValueOnce(mockDomain) // FindDomainByCodeQuery
        .mockResolvedValueOnce(mockRole) // FindRoleByIdQuery
        .mockResolvedValueOnce(mockRoutes) // MenusByIdsQuery
        .mockResolvedValueOnce(mockExistingRouteIds); // MenuIdsByUserIdAndDomainQuery

      await service.assignRoutes(command);

      expect(queryBus.execute).toHaveBeenCalled();
      expect(em.transactional).toHaveBeenCalled();
    });

    /**
     * 应该抛出异常当路由不存在时
     *
     * 验证当路由不存在时，服务能够正确抛出异常。
     */
    it('应该抛出异常当路由不存在时', async () => {
      const command = new RoleAssignRouteCommand('example.com', 'role-123', [
        999,
      ]);

      const mockDomain = {
        code: 'example.com',
        id: 'domain-123',
      };

      const mockRole = {
        id: 'role-123',
        code: 'admin',
      };

      // 使用 mockImplementation 根据查询类型返回不同的值
      (queryBus.execute as jest.Mock).mockImplementation((query) => {
        if (query instanceof FindDomainByCodeQuery) {
          return Promise.resolve(mockDomain);
        }
        if (query instanceof FindRoleByIdQuery) {
          return Promise.resolve(mockRole);
        }
        if (query instanceof MenusByIdsQuery) {
          return Promise.resolve([]); // 空数组表示路由不存在
        }
        return Promise.resolve(null);
      });

      await expect(service.assignRoutes(command)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.assignRoutes(command)).rejects.toThrow(
        'One or more routes not found.',
      );
    });
  });

  describe('assignUsers', () => {
    /**
     * 应该成功为角色分配用户
     *
     * 验证当提供有效的命令时，服务能够正确同步用户到数据库。
     */
    it('应该成功为角色分配用户', async () => {
      const command = new RoleAssignUserCommand('role-123', [
        'user-1',
        'user-2',
      ]);

      const mockRole = {
        id: 'role-123',
        code: 'admin',
      };

      const mockUsers = [
        { id: 'user-1', username: 'user1' },
        { id: 'user-2', username: 'user2' },
      ];

      const mockExistingUserIds: string[] = ['user-1'];

      const mockUserRole = {};
      const mockPersist = jest.fn().mockResolvedValue(undefined);
      const mockFlush = jest.fn().mockResolvedValue(undefined);
      const mockNativeDelete = jest.fn().mockResolvedValue(undefined);

      // Mock transactional
      (em.transactional as jest.Mock).mockImplementation(async (callback) => {
        const mockEm = {
          create: jest.fn().mockReturnValue(mockUserRole),
          persist: mockPersist,
          nativeDelete: mockNativeDelete,
          flush: mockFlush,
        };
        return callback(mockEm);
      });

      (queryBus.execute as jest.Mock)
        .mockResolvedValueOnce(mockRole) // FindRoleByIdQuery
        .mockResolvedValueOnce(mockUsers) // UsersByIdsQuery
        .mockResolvedValueOnce(mockExistingUserIds); // UserIdsByRoleIdQuery

      await service.assignUsers(command);

      expect(queryBus.execute).toHaveBeenCalled();
      expect(em.transactional).toHaveBeenCalled();
    });

    /**
     * 应该抛出异常当用户不存在时
     *
     * 验证当用户不存在时，服务能够正确抛出异常。
     */
    it('应该抛出异常当用户不存在时', async () => {
      const command = new RoleAssignUserCommand('role-123', ['nonexistent']);

      const mockRole = {
        id: 'role-123',
        code: 'admin',
      };

      // 使用 mockImplementation 根据查询类型返回不同的值
      (queryBus.execute as jest.Mock).mockImplementation((query) => {
        if (query instanceof FindRoleByIdQuery) {
          return Promise.resolve(mockRole);
        }
        if (query instanceof UsersByIdsQuery) {
          return Promise.resolve([]); // 空数组表示用户不存在
        }
        return Promise.resolve(null);
      });

      await expect(service.assignUsers(command)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.assignUsers(command)).rejects.toThrow(
        'One or more users not found.',
      );
    });

    /**
     * 应该抛出异常当角色不存在时
     *
     * 验证当角色不存在时，服务能够正确抛出异常。
     */
    it('应该抛出异常当角色不存在时', async () => {
      const command = new RoleAssignUserCommand('nonexistent-role', ['user-1']);

      (queryBus.execute as jest.Mock).mockResolvedValueOnce(null); // FindRoleByIdQuery

      await expect(service.assignUsers(command)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.assignUsers(command)).rejects.toThrow(
        'Role not found.',
      );
    });
  });
});
