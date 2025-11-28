import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import * as casbin from 'casbin';

import { AuthZRBACService } from './authz-rbac.service';

/**
 * AuthZRBACService 单元测试
 *
 * @description 验证已废弃的授权 RBAC 服务的功能（为了向后兼容性保留测试）
 */
describe('AuthZRBACService', () => {
  let service: AuthZRBACService;
  let mockEnforcer: jest.Mocked<casbin.Enforcer>;

  beforeEach(() => {
    // 创建模拟的 Casbin Enforcer
    mockEnforcer = {
      getRolesForUser: jest.fn(),
      getUsersForRole: jest.fn(),
      hasRoleForUser: jest.fn(),
      addRoleForUser: jest.fn(),
      deleteRoleForUser: jest.fn(),
      deleteRolesForUser: jest.fn(),
      deleteUser: jest.fn(),
      deleteRole: jest.fn(),
      deletePermission: jest.fn(),
      addPermissionForUser: jest.fn(),
      deletePermissionForUser: jest.fn(),
      deletePermissionsForUser: jest.fn(),
      getPermissionsForUser: jest.fn(),
      hasPermissionForUser: jest.fn(),
      getImplicitRolesForUser: jest.fn(),
      getImplicitPermissionsForUser: jest.fn(),
      getImplicitUsersForPermission: jest.fn(),
    } as unknown as jest.Mocked<casbin.Enforcer>;

    // 创建服务实例
    service = new AuthZRBACService(mockEnforcer);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getRolesForUser', () => {
    it('应该返回用户拥有的角色列表', async () => {
      const expectedRoles = ['admin', 'user'];
      mockEnforcer.getRolesForUser.mockResolvedValue(expectedRoles);

      const result = await service.getRolesForUser('alice');

      expect(result).toEqual(expectedRoles);
      expect(mockEnforcer.getRolesForUser).toHaveBeenCalledWith(
        'alice',
        undefined,
      );
    });

    it('应该支持域名参数', async () => {
      const expectedRoles = ['admin'];
      mockEnforcer.getRolesForUser.mockResolvedValue(expectedRoles);

      const result = await service.getRolesForUser('alice', 'domain1');

      expect(result).toEqual(expectedRoles);
      expect(mockEnforcer.getRolesForUser).toHaveBeenCalledWith(
        'alice',
        'domain1',
      );
    });
  });

  describe('getUsersForRole', () => {
    it('应该返回拥有指定角色的用户列表', async () => {
      const expectedUsers = ['alice', 'bob'];
      mockEnforcer.getUsersForRole.mockResolvedValue(expectedUsers);

      const result = await service.getUsersForRole('admin');

      expect(result).toEqual(expectedUsers);
      expect(mockEnforcer.getUsersForRole).toHaveBeenCalledWith(
        'admin',
        undefined,
      );
    });
  });

  describe('hasRoleForUser', () => {
    it('应该在用户拥有角色时返回 true', async () => {
      mockEnforcer.hasRoleForUser.mockResolvedValue(true);

      const result = await service.hasRoleForUser('alice', 'admin');

      expect(result).toBe(true);
      expect(mockEnforcer.hasRoleForUser).toHaveBeenCalledWith(
        'alice',
        'admin',
        undefined,
      );
    });
  });

  describe('addRoleForUser', () => {
    it('应该在成功添加角色时返回 true', async () => {
      mockEnforcer.addRoleForUser.mockResolvedValue(true);

      const result = await service.addRoleForUser('alice', 'admin');

      expect(result).toBe(true);
      expect(mockEnforcer.addRoleForUser).toHaveBeenCalledWith(
        'alice',
        'admin',
        undefined,
      );
    });
  });

  describe('deleteRoleForUser', () => {
    it('应该在成功删除角色时返回 true', async () => {
      mockEnforcer.deleteRoleForUser.mockResolvedValue(true);

      const result = await service.deleteRoleForUser('alice', 'admin');

      expect(result).toBe(true);
      expect(mockEnforcer.deleteRoleForUser).toHaveBeenCalledWith(
        'alice',
        'admin',
        undefined,
      );
    });
  });

  describe('deleteRolesForUser', () => {
    it('应该在成功删除所有角色时返回 true', async () => {
      mockEnforcer.deleteRolesForUser.mockResolvedValue(true);

      const result = await service.deleteRolesForUser('alice');

      expect(result).toBe(true);
      expect(mockEnforcer.deleteRolesForUser).toHaveBeenCalledWith(
        'alice',
        undefined,
      );
    });
  });

  describe('deleteUser', () => {
    it('应该在成功删除用户时返回 true', async () => {
      mockEnforcer.deleteUser.mockResolvedValue(true);

      const result = await service.deleteUser('alice');

      expect(result).toBe(true);
      expect(mockEnforcer.deleteUser).toHaveBeenCalledWith('alice');
    });
  });

  describe('deleteRole', () => {
    it('应该在成功删除角色时返回 true', async () => {
      mockEnforcer.deleteRole.mockResolvedValue(true);

      const result = await service.deleteRole('admin');

      expect(result).toBe(true);
      expect(mockEnforcer.deleteRole).toHaveBeenCalledWith('admin');
    });
  });

  describe('deletePermission', () => {
    it('应该删除指定的权限', async () => {
      mockEnforcer.deletePermission.mockResolvedValue(true);

      const result = await service.deletePermission('data1', 'read');

      expect(result).toBe(true);
      expect(mockEnforcer.deletePermission).toHaveBeenCalledWith(
        'data1',
        'read',
      );
    });
  });

  describe('addPermissionForUser', () => {
    it('应该为用户添加权限', async () => {
      mockEnforcer.addPermissionForUser.mockResolvedValue(true);

      const result = await service.addPermissionForUser(
        'alice',
        'data1',
        'read',
      );

      expect(result).toBe(true);
      expect(mockEnforcer.addPermissionForUser).toHaveBeenCalledWith(
        'alice',
        'data1',
        'read',
      );
    });
  });

  describe('deletePermissionForUser', () => {
    it('应该删除用户的权限', async () => {
      mockEnforcer.deletePermissionForUser.mockResolvedValue(true);

      const result = await service.deletePermissionForUser(
        'alice',
        'data1',
        'read',
      );

      expect(result).toBe(true);
      expect(mockEnforcer.deletePermissionForUser).toHaveBeenCalledWith(
        'alice',
        'data1',
        'read',
      );
    });
  });

  describe('deletePermissionsForUser', () => {
    it('应该删除用户的所有权限', async () => {
      mockEnforcer.deletePermissionsForUser.mockResolvedValue(true);

      const result = await service.deletePermissionsForUser('alice');

      expect(result).toBe(true);
      expect(mockEnforcer.deletePermissionsForUser).toHaveBeenCalledWith(
        'alice',
      );
    });
  });

  describe('getPermissionsForUser', () => {
    it('应该返回用户的所有权限', async () => {
      const expectedPermissions = [
        ['alice', 'data1', 'read'],
        ['alice', 'data2', 'write'],
      ];
      mockEnforcer.getPermissionsForUser.mockResolvedValue(expectedPermissions);

      const result = await service.getPermissionsForUser('alice');

      expect(result).toEqual(expectedPermissions);
      expect(mockEnforcer.getPermissionsForUser).toHaveBeenCalledWith('alice');
    });
  });

  describe('hasPermissionForUser', () => {
    it('应该在用户拥有权限时返回 true', async () => {
      mockEnforcer.hasPermissionForUser.mockResolvedValue(true);

      const result = await service.hasPermissionForUser(
        'alice',
        'data1',
        'read',
      );

      expect(result).toBe(true);
      expect(mockEnforcer.hasPermissionForUser).toHaveBeenCalledWith(
        'alice',
        'data1',
        'read',
      );
    });
  });

  describe('getImplicitRolesForUser', () => {
    it('应该返回用户的隐式角色（包括继承的角色）', async () => {
      const expectedRoles = ['admin', 'user'];
      mockEnforcer.getImplicitRolesForUser.mockResolvedValue(expectedRoles);

      const result = await service.getImplicitRolesForUser('alice', 'domain1');

      expect(result).toEqual(expectedRoles);
      expect(mockEnforcer.getImplicitRolesForUser).toHaveBeenCalledWith(
        'alice',
        'domain1',
      );
    });
  });

  describe('getImplicitPermissionsForUser', () => {
    it('应该返回用户的隐式权限（包括通过角色继承的权限）', async () => {
      const expectedPermissions = [
        ['admin', 'data1', 'read'],
        ['alice', 'data2', 'read'],
      ];
      mockEnforcer.getImplicitPermissionsForUser.mockResolvedValue(
        expectedPermissions,
      );

      const result = await service.getImplicitPermissionsForUser(
        'alice',
        'domain1',
      );

      expect(result).toEqual(expectedPermissions);
      expect(mockEnforcer.getImplicitPermissionsForUser).toHaveBeenCalledWith(
        'alice',
        'domain1',
      );
    });
  });

  describe('getImplicitUsersForPermission', () => {
    it('应该返回拥有指定权限的隐式用户', async () => {
      const expectedUsers = ['alice', 'bob'];
      mockEnforcer.getImplicitUsersForPermission.mockResolvedValue(
        expectedUsers,
      );

      const result = await service.getImplicitUsersForPermission(
        'data1',
        'read',
      );

      expect(result).toEqual(expectedUsers);
      expect(mockEnforcer.getImplicitUsersForPermission).toHaveBeenCalledWith(
        'data1',
        'read',
      );
    });
  });
});
