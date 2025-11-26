import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import * as casbin from 'casbin';

import { AuthZService } from './authz.service';

/**
 * AuthZService 单元测试
 *
 * @description 验证授权服务的功能，包括 RBAC API、权限管理 API 和隐式权限方法
 */
describe('AuthZService', () => {
  let service: AuthZService;
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
      getImplicitResourcesForUser: jest.fn(),
      getImplicitPermissionsForUser: jest.fn(),
      getImplicitUsersForPermission: jest.fn(),
      enforce: jest.fn(),
      enforceWithMatcher: jest.fn(),
      enforceEx: jest.fn(),
      enforceExWithMatcher: jest.fn(),
      batchEnforce: jest.fn(),
      getAllSubjects: jest.fn(),
      getAllNamedSubjects: jest.fn(),
      getAllObjects: jest.fn(),
      getAllNamedObjects: jest.fn(),
      getAllActions: jest.fn(),
      getAllNamedActions: jest.fn(),
      getAllRoles: jest.fn(),
      getAllNamedRoles: jest.fn(),
      getPolicy: jest.fn(),
      getFilteredPolicy: jest.fn(),
      getNamedPolicy: jest.fn(),
      getFilteredNamedPolicy: jest.fn(),
      getGroupingPolicy: jest.fn(),
      getFilteredGroupingPolicy: jest.fn(),
      getNamedGroupingPolicy: jest.fn(),
      getFilteredNamedGroupingPolicy: jest.fn(),
      hasPolicy: jest.fn(),
      hasNamedPolicy: jest.fn(),
      addPolicy: jest.fn(),
      addPolicies: jest.fn(),
      addNamedPolicy: jest.fn(),
      addNamedPolicies: jest.fn(),
      updatePolicy: jest.fn(),
      updateNamedPolicy: jest.fn(),
      removePolicy: jest.fn(),
      removePolicies: jest.fn(),
      removeFilteredPolicy: jest.fn(),
      removeNamedPolicy: jest.fn(),
      removeNamedPolicies: jest.fn(),
      removeFilteredNamedPolicy: jest.fn(),
      hasGroupingPolicy: jest.fn(),
      hasNamedGroupingPolicy: jest.fn(),
      addGroupingPolicy: jest.fn(),
      addGroupingPolicies: jest.fn(),
      addNamedGroupingPolicy: jest.fn(),
      addNamedGroupingPolicies: jest.fn(),
      removeGroupingPolicy: jest.fn(),
      removeGroupingPolicies: jest.fn(),
      removeFilteredGroupingPolicy: jest.fn(),
      removeNamedGroupingPolicy: jest.fn(),
      removeNamedGroupingPolicies: jest.fn(),
      removeFilteredNamedGroupingPolicy: jest.fn(),
      addFunction: jest.fn(),
      loadPolicy: jest.fn(),
      updateGroupingPolicy: jest.fn(),
      updateNamedGroupingPolicy: jest.fn(),
    } as unknown as jest.Mocked<casbin.Enforcer>;

    // 创建服务实例
    service = new AuthZService(mockEnforcer);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('RBAC API', () => {
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

      it('应该支持域名参数', async () => {
        const expectedUsers = ['alice'];
        mockEnforcer.getUsersForRole.mockResolvedValue(expectedUsers);

        const result = await service.getUsersForRole('admin', 'domain1');

        expect(result).toEqual(expectedUsers);
        expect(mockEnforcer.getUsersForRole).toHaveBeenCalledWith(
          'admin',
          'domain1',
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

      it('应该在用户不拥有角色时返回 false', async () => {
        mockEnforcer.hasRoleForUser.mockResolvedValue(false);

        const result = await service.hasRoleForUser('alice', 'admin');

        expect(result).toBe(false);
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

      it('应该在角色已存在时返回 false', async () => {
        mockEnforcer.addRoleForUser.mockResolvedValue(false);

        const result = await service.addRoleForUser('alice', 'admin');

        expect(result).toBe(false);
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

      it('应该在角色不存在时返回 false', async () => {
        mockEnforcer.deleteRoleForUser.mockResolvedValue(false);

        const result = await service.deleteRoleForUser('alice', 'admin');

        expect(result).toBe(false);
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
        mockEnforcer.getPermissionsForUser.mockResolvedValue(
          expectedPermissions,
        );

        const result = await service.getPermissionsForUser('alice');

        expect(result).toEqual(expectedPermissions);
        expect(mockEnforcer.getPermissionsForUser).toHaveBeenCalledWith(
          'alice',
        );
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
  });

  describe('隐式权限 API', () => {
    describe('getImplicitRolesForUser', () => {
      it('应该返回用户的隐式角色（包括继承的角色）', async () => {
        const expectedRoles = ['admin', 'user'];
        mockEnforcer.getImplicitRolesForUser.mockResolvedValue(expectedRoles);

        const result = await service.getImplicitRolesForUser(
          'alice',
          'domain1',
        );

        expect(result).toEqual(expectedRoles);
        expect(mockEnforcer.getImplicitRolesForUser).toHaveBeenCalledWith(
          'alice',
          'domain1',
        );
      });
    });

    describe('getImplicitResourcesForUser', () => {
      it('应该返回用户可访问的隐式资源', async () => {
        const expectedResources = [
          ['alice', 'resource1', 'read'],
          ['role:admin', 'resource1', 'write'],
        ];
        mockEnforcer.getImplicitResourcesForUser.mockResolvedValue(
          expectedResources,
        );

        const result = await service.getImplicitResourcesForUser(
          'alice',
          'domain1',
        );

        expect(result).toEqual(expectedResources);
        expect(mockEnforcer.getImplicitResourcesForUser).toHaveBeenCalledWith(
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

  describe('权限验证 API', () => {
    describe('enforce', () => {
      it('应该执行权限验证', async () => {
        mockEnforcer.enforce.mockResolvedValue(true);

        const result = await service.enforce('alice', 'data1', 'read');

        expect(result).toBe(true);
        expect(mockEnforcer.enforce).toHaveBeenCalledWith([
          'alice',
          'data1',
          'read',
        ]);
      });
    });

    describe('enforceWithMatcher', () => {
      it('应该使用自定义匹配器执行权限验证', async () => {
        mockEnforcer.enforceWithMatcher.mockResolvedValue(true);

        const result = await service.enforceWithMatcher(
          'm = g(r.sub, p.sub)',
          'alice',
          'data1',
          'read',
        );

        expect(result).toBe(true);
        expect(mockEnforcer.enforceWithMatcher).toHaveBeenCalledWith(
          'm = g(r.sub, p.sub)',
          ['alice', 'data1', 'read'],
        );
      });
    });

    describe('enforceEx', () => {
      it('应该执行权限验证并返回匹配的规则', async () => {
        const expectedResult: [boolean, string[]] = [
          true,
          ['alice', 'data1', 'read'],
        ];
        mockEnforcer.enforceEx.mockResolvedValue(expectedResult);

        const result = await service.enforceEx('alice', 'data1', 'read');

        expect(result).toEqual(expectedResult);
        expect(mockEnforcer.enforceEx).toHaveBeenCalledWith([
          'alice',
          'data1',
          'read',
        ]);
      });
    });

    describe('enforceExWithMatcher', () => {
      it('应该使用自定义匹配器执行权限验证并返回匹配的规则', async () => {
        const expectedResult: [boolean, string[]] = [
          true,
          ['alice', 'data1', 'read'],
        ];
        mockEnforcer.enforceExWithMatcher.mockResolvedValue(expectedResult);

        const result = await service.enforceExWithMatcher(
          'm = g(r.sub, p.sub)',
          'alice',
          'data1',
          'read',
        );

        expect(result).toEqual(expectedResult);
        expect(mockEnforcer.enforceExWithMatcher).toHaveBeenCalledWith(
          'm = g(r.sub, p.sub)',
          ['alice', 'data1', 'read'],
        );
      });
    });

    describe('batchEnforce', () => {
      it('应该批量执行权限验证', async () => {
        const params = [
          ['alice', 'data1', 'read'],
          ['bob', 'data2', 'write'],
        ];
        const expectedResults = [true, false];
        mockEnforcer.batchEnforce.mockResolvedValue(expectedResults);

        const result = await service.batchEnforce(params);

        expect(result).toEqual(expectedResults);
        expect(mockEnforcer.batchEnforce).toHaveBeenCalledWith(params);
      });
    });
  });

  describe('策略管理 API', () => {
    describe('getAllSubjects', () => {
      it('应该返回所有主体', async () => {
        const expectedSubjects = ['alice', 'bob', 'admin'];
        mockEnforcer.getAllSubjects.mockResolvedValue(expectedSubjects);

        const result = await service.getAllSubjects();

        expect(result).toEqual(expectedSubjects);
        expect(mockEnforcer.getAllSubjects).toHaveBeenCalled();
      });
    });

    describe('getAllObjects', () => {
      it('应该返回所有对象', async () => {
        const expectedObjects = ['data1', 'data2'];
        mockEnforcer.getAllObjects.mockResolvedValue(expectedObjects);

        const result = await service.getAllObjects();

        expect(result).toEqual(expectedObjects);
        expect(mockEnforcer.getAllObjects).toHaveBeenCalled();
      });
    });

    describe('getAllActions', () => {
      it('应该返回所有动作', async () => {
        const expectedActions = ['read', 'write', 'delete'];
        mockEnforcer.getAllActions.mockResolvedValue(expectedActions);

        const result = await service.getAllActions();

        expect(result).toEqual(expectedActions);
        expect(mockEnforcer.getAllActions).toHaveBeenCalled();
      });
    });

    describe('getAllRoles', () => {
      it('应该返回所有角色', async () => {
        const expectedRoles = ['admin', 'user', 'guest'];
        mockEnforcer.getAllRoles.mockResolvedValue(expectedRoles);

        const result = await service.getAllRoles();

        expect(result).toEqual(expectedRoles);
        expect(mockEnforcer.getAllRoles).toHaveBeenCalled();
      });
    });

    describe('getPolicy', () => {
      it('应该返回所有策略规则', async () => {
        const expectedPolicy = [
          ['alice', 'data1', 'read'],
          ['bob', 'data2', 'write'],
        ];
        mockEnforcer.getPolicy.mockResolvedValue(expectedPolicy);

        const result = await service.getPolicy();

        expect(result).toEqual(expectedPolicy);
        expect(mockEnforcer.getPolicy).toHaveBeenCalled();
      });
    });

    describe('addPolicy', () => {
      it('应该添加策略规则', async () => {
        mockEnforcer.addPolicy.mockResolvedValue(true);

        const result = await service.addPolicy('alice', 'data1', 'read');

        expect(result).toBe(true);
        expect(mockEnforcer.addPolicy).toHaveBeenCalledWith(
          'alice',
          'data1',
          'read',
        );
      });
    });

    describe('addPolicies', () => {
      it('应该批量添加策略规则', async () => {
        const rules = [
          ['alice', 'data1', 'read'],
          ['bob', 'data2', 'write'],
        ];
        mockEnforcer.addPolicies.mockResolvedValue(true);

        const result = await service.addPolicies(rules);

        expect(result).toBe(true);
        expect(mockEnforcer.addPolicies).toHaveBeenCalledWith(rules);
      });
    });

    describe('removePolicy', () => {
      it('应该删除策略规则', async () => {
        mockEnforcer.removePolicy.mockResolvedValue(true);

        const result = await service.removePolicy('alice', 'data1', 'read');

        expect(result).toBe(true);
        expect(mockEnforcer.removePolicy).toHaveBeenCalledWith(
          'alice',
          'data1',
          'read',
        );
      });
    });

    describe('removePolicies', () => {
      it('应该批量删除策略规则', async () => {
        const rules = [
          ['alice', 'data1', 'read'],
          ['bob', 'data2', 'write'],
        ];
        mockEnforcer.removePolicies.mockResolvedValue(true);

        const result = await service.removePolicies(rules);

        expect(result).toBe(true);
        expect(mockEnforcer.removePolicies).toHaveBeenCalledWith(rules);
      });
    });

    describe('updatePolicy', () => {
      it('应该更新策略规则', async () => {
        const oldRule = ['alice', 'data1', 'read'];
        const newRule = ['alice', 'data1', 'write'];
        mockEnforcer.updatePolicy.mockResolvedValue(true);

        const result = await service.updatePolicy(oldRule, newRule);

        expect(result).toBe(true);
        expect(mockEnforcer.updatePolicy).toHaveBeenCalledWith(
          oldRule,
          newRule,
        );
      });
    });

    describe('hasPolicy', () => {
      it('应该检查策略规则是否存在', async () => {
        mockEnforcer.hasPolicy.mockResolvedValue(true);

        const result = await service.hasPolicy('alice', 'data1', 'read');

        expect(result).toBe(true);
        expect(mockEnforcer.hasPolicy).toHaveBeenCalledWith(
          'alice',
          'data1',
          'read',
        );
      });
    });
  });

  describe('角色继承 API', () => {
    describe('getGroupingPolicy', () => {
      it('应该返回所有角色继承规则', async () => {
        const expectedPolicy = [
          ['alice', 'admin'],
          ['bob', 'user'],
        ];
        mockEnforcer.getGroupingPolicy.mockResolvedValue(expectedPolicy);

        const result = await service.getGroupingPolicy();

        expect(result).toEqual(expectedPolicy);
        expect(mockEnforcer.getGroupingPolicy).toHaveBeenCalled();
      });
    });

    describe('addGroupingPolicy', () => {
      it('应该添加角色继承规则', async () => {
        mockEnforcer.addGroupingPolicy.mockResolvedValue(true);

        const result = await service.addGroupingPolicy('alice', 'admin');

        expect(result).toBe(true);
        expect(mockEnforcer.addGroupingPolicy).toHaveBeenCalledWith(
          'alice',
          'admin',
        );
      });
    });

    describe('removeGroupingPolicy', () => {
      it('应该删除角色继承规则', async () => {
        mockEnforcer.removeGroupingPolicy.mockResolvedValue(true);

        const result = await service.removeGroupingPolicy('alice', 'admin');

        expect(result).toBe(true);
        expect(mockEnforcer.removeGroupingPolicy).toHaveBeenCalledWith(
          'alice',
          'admin',
        );
      });
    });

    describe('hasGroupingPolicy', () => {
      it('应该检查角色继承规则是否存在', async () => {
        mockEnforcer.hasGroupingPolicy.mockResolvedValue(true);

        const result = await service.hasGroupingPolicy('alice', 'admin');

        expect(result).toBe(true);
        expect(mockEnforcer.hasGroupingPolicy).toHaveBeenCalledWith(
          'alice',
          'admin',
        );
      });
    });

    describe('updateGroupingPolicy', () => {
      it('应该更新角色继承规则', async () => {
        const oldRule = ['alice', 'user'];
        const newRule = ['alice', 'admin'];
        mockEnforcer.updateGroupingPolicy.mockResolvedValue(true);

        const result = await service.updateGroupingPolicy(oldRule, newRule);

        expect(result).toBe(true);
        expect(mockEnforcer.updateGroupingPolicy).toHaveBeenCalledWith(
          oldRule,
          newRule,
        );
      });
    });
  });

  describe('其他 API', () => {
    describe('addFunction', () => {
      it('应该添加自定义函数', async () => {
        const customFunc = jest.fn();
        mockEnforcer.addFunction.mockResolvedValue(undefined);

        await service.addFunction('customFunc', customFunc);

        expect(mockEnforcer.addFunction).toHaveBeenCalledWith(
          'customFunc',
          customFunc,
        );
      });
    });

    describe('loadPolicy', () => {
      it('应该重新加载策略', async () => {
        mockEnforcer.loadPolicy.mockResolvedValue(undefined);

        await service.loadPolicy();

        expect(mockEnforcer.loadPolicy).toHaveBeenCalled();
      });
    });
  });
});
