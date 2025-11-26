import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import type { EntityManager } from '@mikro-orm/core';
import type { Model } from 'casbin';
import { Helper } from 'casbin';

import { MikroORMAdapter } from './casbin-mikro-orm.adapter';
import { CasbinRule } from './casbin-rule.entity';

/**
 * MikroORMAdapter 单元测试
 *
 * @description 验证 MikroORM Casbin 适配器的功能，包括策略加载、保存、添加和删除
 */
describe('MikroORMAdapter', () => {
  let adapter: MikroORMAdapter;
  let mockEntityManager: jest.Mocked<EntityManager>;
  let mockModel: jest.Mocked<Model>;

  beforeEach(() => {
    // 创建模拟的 EntityManager
    mockEntityManager = {
      find: jest.fn(),
      nativeDelete: jest.fn(),
      create: jest.fn(),
      persist: jest.fn().mockReturnThis(),
      flush: jest.fn(),
    } as unknown as jest.Mocked<EntityManager>;

    // 创建模拟的 Casbin Model
    mockModel = {
      model: {
        get: jest.fn(),
      },
    } as unknown as jest.Mocked<Model>;

    // 创建适配器实例
    adapter = new MikroORMAdapter(mockEntityManager);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('构造函数和静态方法', () => {
    it('应该正确创建适配器实例', () => {
      expect(adapter).toBeInstanceOf(MikroORMAdapter);
      expect(adapter.isFiltered()).toBe(false);
    });

    it('应该通过静态方法创建适配器实例', () => {
      const newAdapter = MikroORMAdapter.newAdapter(mockEntityManager);
      expect(newAdapter).toBeInstanceOf(MikroORMAdapter);
    });
  });

  describe('过滤模式', () => {
    it('应该能够启用和禁用过滤模式', () => {
      expect(adapter.isFiltered()).toBe(false);

      adapter.enableFiltered(true);
      expect(adapter.isFiltered()).toBe(true);

      adapter.enableFiltered(false);
      expect(adapter.isFiltered()).toBe(false);
    });
  });

  describe('loadPolicy', () => {
    it('应该从数据库加载所有策略规则', async () => {
      const mockRules: CasbinRule[] = [
        {
          id: 1,
          ptype: 'p',
          v0: 'alice',
          v1: 'data1',
          v2: 'read',
        } as CasbinRule,
        {
          id: 2,
          ptype: 'g',
          v0: 'alice',
          v1: 'admin',
        } as CasbinRule,
      ];

      mockEntityManager.find.mockResolvedValue(mockRules);
      jest.spyOn(Helper, 'loadPolicyLine').mockImplementation(() => {});

      await adapter.loadPolicy(mockModel);

      // @ts-ignore - 类型实例化过深，MikroORM 的 FindOptions 类型复杂，测试代码中允许
      expect(mockEntityManager.find).toHaveBeenCalledWith(CasbinRule, {});
      expect(Helper.loadPolicyLine).toHaveBeenCalledTimes(2);
    });

    it('应该处理空策略列表', async () => {
      mockEntityManager.find.mockResolvedValue([]);
      jest.spyOn(Helper, 'loadPolicyLine').mockImplementation(() => {});

      await adapter.loadPolicy(mockModel);

      // @ts-ignore - 类型实例化过深，MikroORM 的 FindOptions 类型复杂，测试代码中允许
      expect(mockEntityManager.find).toHaveBeenCalledWith(CasbinRule, {});
      expect(Helper.loadPolicyLine).not.toHaveBeenCalled();
    });
  });

  describe('loadFilteredPolicy', () => {
    it('应该加载匹配过滤条件的策略规则', async () => {
      const mockRules: CasbinRule[] = [
        {
          id: 1,
          ptype: 'p',
          v0: 'alice',
          v1: 'data1',
          v2: 'read',
        } as CasbinRule,
      ];

      const filter = {
        p: [['alice', 'data1', 'read']],
      };

      mockEntityManager.find.mockResolvedValue(mockRules);
      jest.spyOn(Helper, 'loadPolicyLine').mockImplementation(() => {});

      await adapter.loadFilteredPolicy(mockModel, filter);

      // @ts-ignore - 类型实例化过深，MikroORM 的 FindOptions 类型复杂，测试代码中允许
      expect(mockEntityManager.find).toHaveBeenCalledWith(CasbinRule, {
        $or: [{ ptype: 'p', v0: 'alice', v1: 'data1', v2: 'read' }],
      });
      expect(Helper.loadPolicyLine).toHaveBeenCalledTimes(1);
      expect(adapter.isFiltered()).toBe(true);
    });

    it('应该处理多个过滤条件', async () => {
      const filter = {
        p: [['alice', 'data1', 'read']],
        g: [['alice', 'admin']],
      };

      mockEntityManager.find.mockResolvedValue([]);
      jest.spyOn(Helper, 'loadPolicyLine').mockImplementation(() => {});

      await adapter.loadFilteredPolicy(mockModel, filter);

      // @ts-ignore - 类型实例化过深，测试代码中使用 any 类型
      expect(mockEntityManager.find).toHaveBeenCalledWith(CasbinRule, {
        $or: [
          { ptype: 'p', v0: 'alice', v1: 'data1', v2: 'read' },
          { ptype: 'g', v0: 'alice', v1: 'admin' },
        ],
      });
    });

    it('应该忽略空字符串的过滤条件', async () => {
      const filter = {
        p: [['', 'data1', 'read']], // v0 为空字符串，应该被忽略
      };

      mockEntityManager.find.mockResolvedValue([]);
      jest.spyOn(Helper, 'loadPolicyLine').mockImplementation(() => {});

      await adapter.loadFilteredPolicy(mockModel, filter);

      // @ts-ignore - 类型实例化过深，MikroORM 的 FindOptions 类型复杂，测试代码中允许
      expect(mockEntityManager.find).toHaveBeenCalledWith(CasbinRule, {
        $or: [{ ptype: 'p', v1: 'data1', v2: 'read' }],
      });
    });
  });

  describe('savePolicy', () => {
    it('应该保存策略规则到数据库', async () => {
      // model.model.get('p') 返回的 Map 结构：键是 ptype，值是 Assertion
      const mockPAstMap = new Map([
        [
          'p',
          {
            policy: [
              ['alice', 'data1', 'read'],
              ['bob', 'data2', 'write'],
            ],
          },
        ],
      ]);

      const mockGAstMap = new Map([
        [
          'g',
          {
            policy: [['alice', 'admin']],
          },
        ],
      ]);

      // @ts-ignore - Jest mock 类型推断问题，测试代码中允许使用 any
      const mockGet = jest.fn().mockImplementation((key: string) => {
        if (key === 'p') return mockPAstMap;
        if (key === 'g') return mockGAstMap;
        return undefined;
      });
      // @ts-ignore - Jest mock 类型推断问题，测试代码中允许使用 any
      mockModel.model.get = mockGet;
      mockEntityManager.nativeDelete.mockResolvedValue(1);
      mockEntityManager.create.mockImplementation(
        (entity, data) => data as CasbinRule,
      );
      mockEntityManager.persist.mockReturnThis();
      mockEntityManager.flush.mockResolvedValue(undefined);

      const result = await adapter.savePolicy(mockModel);

      expect(result).toBe(true);
      expect(mockEntityManager.nativeDelete).toHaveBeenCalledWith(
        CasbinRule,
        {},
      );
      // 2个p策略（每个p策略遍历时会创建2个规则）+ 1个g策略（每个g策略遍历时会创建1个规则）
      // 但实际上，由于 astMap 的遍历逻辑，每个 ptype 的 Map 中的每个条目都会遍历其 policy
      // 所以：p 类型有 1 个条目，该条目有 2 个 policy，创建 2 个规则
      // g 类型有 1 个条目，该条目有 1 个 policy，创建 1 个规则
      // 总共 3 个规则
      expect(mockEntityManager.create).toHaveBeenCalledTimes(3);
      expect(mockEntityManager.persist).toHaveBeenCalledTimes(3);
      expect(mockEntityManager.flush).toHaveBeenCalled();
    });

    it('应该处理空的策略规则', async () => {
      const mockAstMap = new Map();
      mockModel.model.get = jest
        .fn()
        .mockReturnValue(mockAstMap) as jest.MockedFunction<
        (key: string) => Map<string, any> | undefined
      >;
      mockEntityManager.nativeDelete.mockResolvedValue(1);
      mockEntityManager.flush.mockResolvedValue(undefined);

      const result = await adapter.savePolicy(mockModel);

      expect(result).toBe(true);
      expect(mockEntityManager.nativeDelete).toHaveBeenCalled();
      expect(mockEntityManager.create).not.toHaveBeenCalled();
    });
  });

  describe('addPolicy', () => {
    it('应该添加单条策略规则', async () => {
      const rule = ['alice', 'data1', 'read'];
      const mockRule = {
        ptype: 'p',
        v0: 'alice',
        v1: 'data1',
        v2: 'read',
      } as CasbinRule;

      mockEntityManager.create.mockReturnValue(mockRule);
      mockEntityManager.persist.mockReturnThis();
      mockEntityManager.flush.mockResolvedValue(undefined);

      await adapter.addPolicy('p', 'p', rule);

      expect(mockEntityManager.create).toHaveBeenCalledWith(CasbinRule, {
        ptype: 'p',
        v0: 'alice',
        v1: 'data1',
        v2: 'read',
      });
      expect(mockEntityManager.persist).toHaveBeenCalledWith(mockRule);
      expect(mockEntityManager.flush).toHaveBeenCalled();
    });

    it('应该处理不同长度的策略规则', async () => {
      const rule = ['alice', 'admin'];
      mockEntityManager.create.mockReturnValue({} as CasbinRule);
      mockEntityManager.persist.mockReturnThis();
      mockEntityManager.flush.mockResolvedValue(undefined);

      await adapter.addPolicy('g', 'g', rule);

      expect(mockEntityManager.create).toHaveBeenCalledWith(CasbinRule, {
        ptype: 'g',
        v0: 'alice',
        v1: 'admin',
      });
    });
  });

  describe('addPolicies', () => {
    it('应该批量添加策略规则', async () => {
      const rules = [
        ['alice', 'data1', 'read'],
        ['bob', 'data2', 'write'],
      ];

      mockEntityManager.create.mockImplementation(
        (entity, data) => data as CasbinRule,
      );
      mockEntityManager.persist.mockReturnThis();
      mockEntityManager.flush.mockResolvedValue(undefined);

      await adapter.addPolicies('p', 'p', rules);

      expect(mockEntityManager.create).toHaveBeenCalledTimes(2);
      expect(mockEntityManager.persist).toHaveBeenCalledTimes(2);
      expect(mockEntityManager.flush).toHaveBeenCalledTimes(1);
    });
  });

  describe('removePolicy', () => {
    it('应该删除单条策略规则', async () => {
      const rule = ['alice', 'data1', 'read'];
      mockEntityManager.nativeDelete.mockResolvedValue(1);

      await adapter.removePolicy('p', 'p', rule);

      expect(mockEntityManager.nativeDelete).toHaveBeenCalledWith(CasbinRule, {
        ptype: 'p',
        v0: 'alice',
        v1: 'data1',
        v2: 'read',
      });
    });
  });

  describe('removePolicies', () => {
    it('应该批量删除策略规则', async () => {
      const rules = [
        ['alice', 'data1', 'read'],
        ['bob', 'data2', 'write'],
      ];

      mockEntityManager.nativeDelete.mockResolvedValue(1);

      await adapter.removePolicies('p', 'p', rules);

      expect(mockEntityManager.nativeDelete).toHaveBeenCalledTimes(2);
      expect(mockEntityManager.nativeDelete).toHaveBeenNthCalledWith(
        1,
        CasbinRule,
        {
          ptype: 'p',
          v0: 'alice',
          v1: 'data1',
          v2: 'read',
        },
      );
      expect(mockEntityManager.nativeDelete).toHaveBeenNthCalledWith(
        2,
        CasbinRule,
        {
          ptype: 'p',
          v0: 'bob',
          v1: 'data2',
          v2: 'write',
        },
      );
    });
  });

  describe('removeFilteredPolicy', () => {
    it('应该删除匹配过滤条件的策略规则', async () => {
      mockEntityManager.nativeDelete.mockResolvedValue(1);

      await adapter.removeFilteredPolicy('p', 'p', 0, 'alice');

      expect(mockEntityManager.nativeDelete).toHaveBeenCalledWith(CasbinRule, {
        ptype: 'p',
        v0: 'alice',
      });
    });

    it('应该正确处理不同的字段索引', async () => {
      mockEntityManager.nativeDelete.mockResolvedValue(1);

      await adapter.removeFilteredPolicy('p', 'p', 1, 'data1');

      expect(mockEntityManager.nativeDelete).toHaveBeenCalledWith(CasbinRule, {
        ptype: 'p',
        v1: 'data1',
      });
    });

    it('应该处理多个字段值', async () => {
      mockEntityManager.nativeDelete.mockResolvedValue(1);

      await adapter.removeFilteredPolicy('p', 'p', 0, 'alice', 'data1');

      expect(mockEntityManager.nativeDelete).toHaveBeenCalledWith(CasbinRule, {
        ptype: 'p',
        v0: 'alice',
        v1: 'data1',
      });
    });

    it('应该处理所有6个字段', async () => {
      mockEntityManager.nativeDelete.mockResolvedValue(1);

      await adapter.removeFilteredPolicy(
        'p',
        'p',
        0,
        'v0',
        'v1',
        'v2',
        'v3',
        'v4',
        'v5',
      );

      expect(mockEntityManager.nativeDelete).toHaveBeenCalledWith(CasbinRule, {
        ptype: 'p',
        v0: 'v0',
        v1: 'v1',
        v2: 'v2',
        v3: 'v3',
        v4: 'v4',
        v5: 'v5',
      });
    });
  });

  describe('close', () => {
    it('应该正确关闭连接', async () => {
      const result = await adapter.close();

      expect(result).toBeUndefined();
    });
  });

  describe('边界情况', () => {
    it('应该处理包含所有6个字段的策略规则', async () => {
      const rule = ['v0', 'v1', 'v2', 'v3', 'v4', 'v5'];
      mockEntityManager.create.mockReturnValue({} as CasbinRule);
      mockEntityManager.persist.mockReturnThis();
      mockEntityManager.flush.mockResolvedValue(undefined);

      await adapter.addPolicy('p', 'p', rule);

      expect(mockEntityManager.create).toHaveBeenCalledWith(CasbinRule, {
        ptype: 'p',
        v0: 'v0',
        v1: 'v1',
        v2: 'v2',
        v3: 'v3',
        v4: 'v4',
        v5: 'v5',
      });
    });

    it('应该处理只有 ptype 的策略规则', async () => {
      const rule: string[] = [];
      mockEntityManager.create.mockReturnValue({} as CasbinRule);
      mockEntityManager.persist.mockReturnThis();
      mockEntityManager.flush.mockResolvedValue(undefined);

      await adapter.addPolicy('p', 'p', rule);

      expect(mockEntityManager.create).toHaveBeenCalledWith(CasbinRule, {
        ptype: 'p',
      });
    });

    it('应该正确处理策略规则中的 null 值', async () => {
      const mockRule: CasbinRule = {
        id: 1,
        ptype: 'p',
        v0: 'alice',
        v1: 'data1',
        v2: 'read',
        v3: undefined,
        v4: undefined,
        v5: undefined,
      } as CasbinRule;

      mockEntityManager.find.mockResolvedValue([mockRule]);
      jest.spyOn(Helper, 'loadPolicyLine').mockImplementation(() => {});

      await adapter.loadPolicy(mockModel);

      expect(Helper.loadPolicyLine).toHaveBeenCalled();
    });
  });
});
