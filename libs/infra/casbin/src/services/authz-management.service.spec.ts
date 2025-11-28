import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import * as casbin from 'casbin';

import { AuthZManagementService } from './authz-management.service';

/**
 * AuthZManagementService 单元测试
 *
 * @description 验证已废弃的授权管理服务的功能（为了向后兼容性保留测试）
 */
describe('AuthZManagementService', () => {
  let service: AuthZManagementService;
  let mockEnforcer: jest.Mocked<casbin.Enforcer>;

  beforeEach(() => {
    // 创建模拟的 Casbin Enforcer
    mockEnforcer = {
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
    service = new AuthZManagementService(mockEnforcer);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

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

  describe('getAllSubjects', () => {
    it('应该返回所有主体', async () => {
      const expectedSubjects = ['alice', 'bob', 'admin'];
      mockEnforcer.getAllSubjects.mockResolvedValue(expectedSubjects);

      const result = await service.getAllSubjects();

      expect(result).toEqual(expectedSubjects);
      expect(mockEnforcer.getAllSubjects).toHaveBeenCalled();
    });
  });

  describe('getAllNamedSubjects', () => {
    it('应该返回命名策略中的所有主体', async () => {
      const expectedSubjects = ['alice', 'bob'];
      mockEnforcer.getAllNamedSubjects.mockResolvedValue(expectedSubjects);

      const result = await service.getAllNamedSubjects('p2');

      expect(result).toEqual(expectedSubjects);
      expect(mockEnforcer.getAllNamedSubjects).toHaveBeenCalledWith('p2');
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

  describe('getAllNamedObjects', () => {
    it('应该返回命名策略中的所有对象', async () => {
      const expectedObjects = ['data1', 'data2'];
      mockEnforcer.getAllNamedObjects.mockResolvedValue(expectedObjects);

      const result = await service.getAllNamedObjects('p2');

      expect(result).toEqual(expectedObjects);
      expect(mockEnforcer.getAllNamedObjects).toHaveBeenCalledWith('p2');
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

  describe('getAllNamedActions', () => {
    it('应该返回命名策略中的所有动作', async () => {
      const expectedActions = ['read', 'write'];
      mockEnforcer.getAllNamedActions.mockResolvedValue(expectedActions);

      const result = await service.getAllNamedActions('p2');

      expect(result).toEqual(expectedActions);
      expect(mockEnforcer.getAllNamedActions).toHaveBeenCalledWith('p2');
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

  describe('getAllNamedRoles', () => {
    it('应该返回命名策略中的所有角色', async () => {
      const expectedRoles = ['admin', 'user'];
      mockEnforcer.getAllNamedRoles.mockResolvedValue(expectedRoles);

      const result = await service.getAllNamedRoles('g2');

      expect(result).toEqual(expectedRoles);
      expect(mockEnforcer.getAllNamedRoles).toHaveBeenCalledWith('g2');
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

  describe('getFilteredPolicy', () => {
    it('应该返回过滤后的策略规则', async () => {
      const expectedPolicy = [['alice', 'data1', 'read']];
      mockEnforcer.getFilteredPolicy.mockResolvedValue(expectedPolicy);

      const result = await service.getFilteredPolicy(0, 'alice');

      expect(result).toEqual(expectedPolicy);
      expect(mockEnforcer.getFilteredPolicy).toHaveBeenCalledWith(0, 'alice');
    });
  });

  describe('getNamedPolicy', () => {
    it('应该返回命名策略中的所有规则', async () => {
      const expectedPolicy = [
        ['alice', 'data1', 'read'],
        ['bob', 'data2', 'write'],
      ];
      mockEnforcer.getNamedPolicy.mockResolvedValue(expectedPolicy);

      const result = await service.getNamedPolicy('p2');

      expect(result).toEqual(expectedPolicy);
      expect(mockEnforcer.getNamedPolicy).toHaveBeenCalledWith('p2');
    });
  });

  describe('getFilteredNamedPolicy', () => {
    it('应该返回命名策略中过滤后的规则', async () => {
      const expectedPolicy = [['alice', 'data1', 'read']];
      mockEnforcer.getFilteredNamedPolicy.mockResolvedValue(expectedPolicy);

      const result = await service.getFilteredNamedPolicy('p2', 0, 'alice');

      expect(result).toEqual(expectedPolicy);
      expect(mockEnforcer.getFilteredNamedPolicy).toHaveBeenCalledWith(
        'p2',
        0,
        'alice',
      );
    });
  });

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

  describe('getFilteredGroupingPolicy', () => {
    it('应该返回过滤后的角色继承规则', async () => {
      const expectedPolicy = [['alice', 'admin']];
      mockEnforcer.getFilteredGroupingPolicy.mockResolvedValue(expectedPolicy);

      const result = await service.getFilteredGroupingPolicy(0, 'alice');

      expect(result).toEqual(expectedPolicy);
      expect(mockEnforcer.getFilteredGroupingPolicy).toHaveBeenCalledWith(
        0,
        'alice',
      );
    });
  });

  describe('getNamedGroupingPolicy', () => {
    it('应该返回命名策略中的所有角色继承规则', async () => {
      const expectedPolicy = [
        ['alice', 'admin'],
        ['bob', 'user'],
      ];
      mockEnforcer.getNamedGroupingPolicy.mockResolvedValue(expectedPolicy);

      const result = await service.getNamedGroupingPolicy('g2');

      expect(result).toEqual(expectedPolicy);
      expect(mockEnforcer.getNamedGroupingPolicy).toHaveBeenCalledWith('g2');
    });
  });

  describe('getFilteredNamedGroupingPolicy', () => {
    it('应该返回命名策略中过滤后的角色继承规则', async () => {
      const expectedPolicy = [['alice', 'admin']];
      mockEnforcer.getFilteredNamedGroupingPolicy.mockResolvedValue(
        expectedPolicy,
      );

      const result = await service.getFilteredNamedGroupingPolicy(
        'g2',
        0,
        'alice',
      );

      expect(result).toEqual(expectedPolicy);
      expect(mockEnforcer.getFilteredNamedGroupingPolicy).toHaveBeenCalledWith(
        'g2',
        0,
        'alice',
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

  describe('hasNamedPolicy', () => {
    it('应该检查命名策略规则是否存在', async () => {
      mockEnforcer.hasNamedPolicy.mockResolvedValue(true);

      const result = await service.hasNamedPolicy(
        'p2',
        'alice',
        'data1',
        'read',
      );

      expect(result).toBe(true);
      expect(mockEnforcer.hasNamedPolicy).toHaveBeenCalledWith(
        'p2',
        'alice',
        'data1',
        'read',
      );
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

  describe('addNamedPolicy', () => {
    it('应该添加命名策略规则', async () => {
      mockEnforcer.addNamedPolicy.mockResolvedValue(true);

      const result = await service.addNamedPolicy(
        'p2',
        'alice',
        'data1',
        'read',
      );

      expect(result).toBe(true);
      expect(mockEnforcer.addNamedPolicy).toHaveBeenCalledWith(
        'p2',
        'alice',
        'data1',
        'read',
      );
    });
  });

  describe('addNamedPolicies', () => {
    it('应该批量添加命名策略规则', async () => {
      const rules = [
        ['alice', 'data1', 'read'],
        ['bob', 'data2', 'write'],
      ];
      mockEnforcer.addNamedPolicies.mockResolvedValue(true);

      const result = await service.addNamedPolicies('p2', rules);

      expect(result).toBe(true);
      expect(mockEnforcer.addNamedPolicies).toHaveBeenCalledWith('p2', rules);
    });
  });

  describe('updatePolicy', () => {
    it('应该更新策略规则', async () => {
      const oldRule = ['alice', 'data1', 'read'];
      const newRule = ['alice', 'data1', 'write'];
      mockEnforcer.updatePolicy.mockResolvedValue(true);

      const result = await service.updatePolicy(oldRule, newRule);

      expect(result).toBe(true);
      expect(mockEnforcer.updatePolicy).toHaveBeenCalledWith(oldRule, newRule);
    });
  });

  describe('updateNamedPolicy', () => {
    it('应该更新命名策略规则', async () => {
      const oldRule = ['alice', 'data1', 'read'];
      const newRule = ['alice', 'data1', 'write'];
      mockEnforcer.updateNamedPolicy.mockResolvedValue(true);

      const result = await service.updateNamedPolicy('p2', oldRule, newRule);

      expect(result).toBe(true);
      expect(mockEnforcer.updateNamedPolicy).toHaveBeenCalledWith(
        'p2',
        oldRule,
        newRule,
      );
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

  describe('removeFilteredPolicy', () => {
    it('应该删除过滤后的策略规则', async () => {
      mockEnforcer.removeFilteredPolicy.mockResolvedValue(true);

      const result = await service.removeFilteredPolicy(0, 'alice');

      expect(result).toBe(true);
      expect(mockEnforcer.removeFilteredPolicy).toHaveBeenCalledWith(
        0,
        'alice',
      );
    });
  });

  describe('removeNamedPolicy', () => {
    it('应该删除命名策略规则', async () => {
      mockEnforcer.removeNamedPolicy.mockResolvedValue(true);

      const result = await service.removeNamedPolicy(
        'p2',
        'alice',
        'data1',
        'read',
      );

      expect(result).toBe(true);
      expect(mockEnforcer.removeNamedPolicy).toHaveBeenCalledWith(
        'p2',
        'alice',
        'data1',
        'read',
      );
    });
  });

  describe('removeNamedPolicies', () => {
    it('应该批量删除命名策略规则', async () => {
      const rules = [
        ['alice', 'data1', 'read'],
        ['bob', 'data2', 'write'],
      ];
      mockEnforcer.removeNamedPolicies.mockResolvedValue(true);

      const result = await service.removeNamedPolicies('p2', rules);

      expect(result).toBe(true);
      expect(mockEnforcer.removeNamedPolicies).toHaveBeenCalledWith(
        'p2',
        rules,
      );
    });
  });

  describe('removeFilteredNamedPolicy', () => {
    it('应该删除命名策略中过滤后的规则', async () => {
      mockEnforcer.removeFilteredNamedPolicy.mockResolvedValue(true);

      const result = await service.removeFilteredNamedPolicy('p2', 0, 'alice');

      expect(result).toBe(true);
      expect(mockEnforcer.removeFilteredNamedPolicy).toHaveBeenCalledWith(
        'p2',
        0,
        'alice',
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

  describe('hasNamedGroupingPolicy', () => {
    it('应该检查命名角色继承规则是否存在', async () => {
      mockEnforcer.hasNamedGroupingPolicy.mockResolvedValue(true);

      const result = await service.hasNamedGroupingPolicy(
        'g2',
        'alice',
        'admin',
      );

      expect(result).toBe(true);
      expect(mockEnforcer.hasNamedGroupingPolicy).toHaveBeenCalledWith(
        'g2',
        'alice',
        'admin',
      );
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

  describe('addGroupingPolicies', () => {
    it('应该批量添加角色继承规则', async () => {
      const rules = [
        ['alice', 'admin'],
        ['bob', 'user'],
      ];
      mockEnforcer.addGroupingPolicies.mockResolvedValue(true);

      const result = await service.addGroupingPolicies(rules);

      expect(result).toBe(true);
      expect(mockEnforcer.addGroupingPolicies).toHaveBeenCalledWith(rules);
    });
  });

  describe('addNamedGroupingPolicy', () => {
    it('应该添加命名角色继承规则', async () => {
      mockEnforcer.addNamedGroupingPolicy.mockResolvedValue(true);

      const result = await service.addNamedGroupingPolicy(
        'g2',
        'alice',
        'admin',
      );

      expect(result).toBe(true);
      expect(mockEnforcer.addNamedGroupingPolicy).toHaveBeenCalledWith(
        'g2',
        'alice',
        'admin',
      );
    });
  });

  describe('addNamedGroupingPolicies', () => {
    it('应该批量添加命名角色继承规则', async () => {
      const rules = [
        ['alice', 'admin'],
        ['bob', 'user'],
      ];
      mockEnforcer.addNamedGroupingPolicies.mockResolvedValue(true);

      const result = await service.addNamedGroupingPolicies('g2', rules);

      expect(result).toBe(true);
      expect(mockEnforcer.addNamedGroupingPolicies).toHaveBeenCalledWith(
        'g2',
        rules,
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

  describe('removeGroupingPolicies', () => {
    it('应该批量删除角色继承规则', async () => {
      const rules = [
        ['alice', 'admin'],
        ['bob', 'user'],
      ];
      mockEnforcer.removeGroupingPolicies.mockResolvedValue(true);

      const result = await service.removeGroupingPolicies(rules);

      expect(result).toBe(true);
      expect(mockEnforcer.removeGroupingPolicies).toHaveBeenCalledWith(rules);
    });
  });

  describe('removeFilteredGroupingPolicy', () => {
    it('应该删除过滤后的角色继承规则', async () => {
      mockEnforcer.removeFilteredGroupingPolicy.mockResolvedValue(true);

      const result = await service.removeFilteredGroupingPolicy(0, 'alice');

      expect(result).toBe(true);
      expect(mockEnforcer.removeFilteredGroupingPolicy).toHaveBeenCalledWith(
        0,
        'alice',
      );
    });
  });

  describe('removeNamedGroupingPolicy', () => {
    it('应该删除命名角色继承规则', async () => {
      mockEnforcer.removeNamedGroupingPolicy.mockResolvedValue(true);

      const result = await service.removeNamedGroupingPolicy(
        'g2',
        'alice',
        'admin',
      );

      expect(result).toBe(true);
      expect(mockEnforcer.removeNamedGroupingPolicy).toHaveBeenCalledWith(
        'g2',
        'alice',
        'admin',
      );
    });
  });

  describe('removeNamedGroupingPolicies', () => {
    it('应该批量删除命名角色继承规则', async () => {
      const rules = [
        ['alice', 'admin'],
        ['bob', 'user'],
      ];
      mockEnforcer.removeNamedGroupingPolicies.mockResolvedValue(true);

      const result = await service.removeNamedGroupingPolicies('g2', rules);

      expect(result).toBe(true);
      expect(mockEnforcer.removeNamedGroupingPolicies).toHaveBeenCalledWith(
        'g2',
        rules,
      );
    });
  });

  describe('removeFilteredNamedGroupingPolicy', () => {
    it('应该删除命名策略中过滤后的角色继承规则', async () => {
      mockEnforcer.removeFilteredNamedGroupingPolicy.mockResolvedValue(true);

      const result = await service.removeFilteredNamedGroupingPolicy(
        'g2',
        0,
        'alice',
      );

      expect(result).toBe(true);
      expect(
        mockEnforcer.removeFilteredNamedGroupingPolicy,
      ).toHaveBeenCalledWith('g2', 0, 'alice');
    });
  });

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

  describe('updateNamedGroupingPolicy', () => {
    it('应该更新命名角色继承规则', async () => {
      const oldRule = ['alice', 'user'];
      const newRule = ['alice', 'admin'];
      mockEnforcer.updateNamedGroupingPolicy.mockResolvedValue(true);

      const result = await service.updateNamedGroupingPolicy(
        'g2',
        oldRule,
        newRule,
      );

      expect(result).toBe(true);
      expect(mockEnforcer.updateNamedGroupingPolicy).toHaveBeenCalledWith(
        'g2',
        oldRule,
        newRule,
      );
    });
  });
});
