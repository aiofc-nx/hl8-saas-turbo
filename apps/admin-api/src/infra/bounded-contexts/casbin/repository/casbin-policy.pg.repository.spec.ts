import { EntityManager } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';

import { CasbinRule } from '@hl8/casbin';

import { PaginationResult } from '@hl8/rest';

import {
  PolicyRuleProperties,
  PolicyType,
  RoleRelationProperties,
} from '@/lib/bounded-contexts/casbin/domain/policy-rule.model';
import { PagePoliciesQuery } from '@/lib/bounded-contexts/casbin/queries/page-policies.query';
import { PageRelationsQuery } from '@/lib/bounded-contexts/casbin/queries/page-relations.query';

import {
  CasbinPolicyReadPostgresRepository,
  CasbinPolicyWritePostgresRepository,
} from './casbin-policy.pg.repository';

/**
 * CasbinPolicyReadPostgresRepository 单元测试
 *
 * @description
 * 测试 Casbin 策略读取仓储的实现，验证分页查询策略规则、角色继承关系等功能。
 */
describe('CasbinPolicyReadPostgresRepository', () => {
  let repository: CasbinPolicyReadPostgresRepository;
  let entityManager: jest.Mocked<EntityManager>;

  /**
   * 测试前准备
   *
   * 创建测试模块，Mock EntityManager 依赖。
   */
  beforeEach(async () => {
    // 创建 Mock EntityManager
    const mockEntityManager = {
      findAndCount: jest.fn(),
      findOne: jest.fn(),
    } as unknown as jest.Mocked<EntityManager>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CasbinPolicyReadPostgresRepository,
        {
          provide: EntityManager,
          useValue: mockEntityManager,
        },
      ],
    }).compile();

    repository = module.get<CasbinPolicyReadPostgresRepository>(
      CasbinPolicyReadPostgresRepository,
    );
    entityManager = module.get(EntityManager);
  });

  /**
   * 测试后清理
   *
   * 重置所有 Mock 函数。
   */
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('pagePolicies', () => {
    /**
     * 应该成功分页查询策略规则（无筛选条件）
     *
     * 验证当没有筛选条件时，能够正确返回分页结果。
     */
    it('应该成功分页查询策略规则（无筛选条件）', async () => {
      const query = new PagePoliciesQuery({
        current: 1,
        size: 10,
      });

      const mockRules: CasbinRule[] = [
        {
          id: 1,
          ptype: PolicyType.POLICY,
          v0: 'admin',
          v1: '/api/users',
          v2: 'GET',
          v3: 'example.com',
          v4: 'allow',
          v5: null,
        } as CasbinRule,
        {
          id: 2,
          ptype: PolicyType.POLICY,
          v0: 'user',
          v1: '/api/posts',
          v2: 'POST',
          v3: 'example.com',
          v4: 'allow',
          v5: null,
        } as CasbinRule,
      ];

      (entityManager.findAndCount as jest.Mock).mockResolvedValue([
        mockRules,
        2,
      ]);

      const result = await repository.pagePolicies(query);

      expect(result).toBeInstanceOf(PaginationResult);
      expect(result.current).toBe(1);
      expect(result.size).toBe(10);
      expect(result.total).toBe(2);
      expect(result.records).toHaveLength(2);
      expect(result.records[0].id).toBe(1);
      expect(result.records[0].ptype).toBe(PolicyType.POLICY);
      expect(entityManager.findAndCount).toHaveBeenCalledWith(
        CasbinRule,
        {},
        {
          limit: 10,
          offset: 0,
          orderBy: [{ id: 'DESC' }],
        },
      );
    });

    /**
     * 应该成功分页查询策略规则（按策略类型筛选）
     *
     * 验证当提供策略类型筛选条件时，能够正确构建查询条件并返回结果。
     */
    it('应该成功分页查询策略规则（按策略类型筛选）', async () => {
      const query = new PagePoliciesQuery({
        current: 1,
        size: 10,
        ptype: PolicyType.POLICY,
      });

      const mockRules: CasbinRule[] = [];

      (entityManager.findAndCount as jest.Mock).mockResolvedValue([
        mockRules,
        0,
      ]);

      const result = await repository.pagePolicies(query);

      expect(result.total).toBe(0);
      expect(entityManager.findAndCount).toHaveBeenCalledWith(
        CasbinRule,
        { ptype: PolicyType.POLICY },
        expect.objectContaining({
          limit: 10,
          offset: 0,
        }),
      );
    });

    /**
     * 应该成功分页查询策略规则（按主体筛选）
     *
     * 验证当提供主体筛选条件时，能够正确构建查询条件并返回结果。
     */
    it('应该成功分页查询策略规则（按主体筛选）', async () => {
      const query = new PagePoliciesQuery({
        current: 1,
        size: 10,
        subject: 'admin',
      });

      const mockRules: CasbinRule[] = [];

      (entityManager.findAndCount as jest.Mock).mockResolvedValue([
        mockRules,
        0,
      ]);

      const result = await repository.pagePolicies(query);

      expect(result.total).toBe(0);
      expect(entityManager.findAndCount).toHaveBeenCalledWith(
        CasbinRule,
        { v0: { $like: '%admin%' } },
        expect.objectContaining({
          limit: 10,
          offset: 0,
        }),
      );
    });

    /**
     * 应该成功分页查询策略规则（按域筛选）
     *
     * 验证当提供域筛选条件时，能够正确构建查询条件（支持 p 和 g 类型）。
     */
    it('应该成功分页查询策略规则（按域筛选）', async () => {
      const query = new PagePoliciesQuery({
        current: 1,
        size: 10,
        domain: 'example.com',
      });

      const mockRules: CasbinRule[] = [];

      (entityManager.findAndCount as jest.Mock).mockResolvedValue([
        mockRules,
        0,
      ]);

      const result = await repository.pagePolicies(query);

      expect(result.total).toBe(0);
      expect(entityManager.findAndCount).toHaveBeenCalledWith(
        CasbinRule,
        { $or: [{ v3: 'example.com' }, { v2: 'example.com' }] },
        expect.objectContaining({
          limit: 10,
          offset: 0,
        }),
      );
    });
  });

  describe('pageRelations', () => {
    /**
     * 应该成功分页查询角色继承关系（无筛选条件）
     *
     * 验证当没有筛选条件时，能够正确返回分页结果。
     */
    it('应该成功分页查询角色继承关系（无筛选条件）', async () => {
      const query = new PageRelationsQuery({
        current: 1,
        size: 10,
      });

      const mockRules: CasbinRule[] = [
        {
          id: 1,
          ptype: PolicyType.ROLE_RELATION,
          v0: 'user-123',
          v1: 'admin',
          v2: 'example.com',
          v3: null,
          v4: null,
          v5: null,
        } as CasbinRule,
      ];

      (entityManager.findAndCount as jest.Mock).mockResolvedValue([
        mockRules,
        1,
      ]);

      const result = await repository.pageRelations(query);

      expect(result).toBeInstanceOf(PaginationResult);
      expect(result.current).toBe(1);
      expect(result.size).toBe(10);
      expect(result.total).toBe(1);
      expect(result.records).toHaveLength(1);
      expect(result.records[0].v0).toBe('user-123');
      expect(result.records[0].v1).toBe('admin');
      expect(entityManager.findAndCount).toHaveBeenCalledWith(
        CasbinRule,
        { ptype: PolicyType.ROLE_RELATION },
        {
          limit: 10,
          offset: 0,
          orderBy: [{ id: 'DESC' }],
        },
      );
    });

    /**
     * 应该成功分页查询角色继承关系（按子主体筛选）
     *
     * 验证当提供子主体筛选条件时，能够正确构建查询条件并返回结果。
     */
    it('应该成功分页查询角色继承关系（按子主体筛选）', async () => {
      const query = new PageRelationsQuery({
        current: 1,
        size: 10,
        childSubject: 'user',
      });

      const mockRules: CasbinRule[] = [];

      (entityManager.findAndCount as jest.Mock).mockResolvedValue([
        mockRules,
        0,
      ]);

      const result = await repository.pageRelations(query);

      expect(result.total).toBe(0);
      expect(entityManager.findAndCount).toHaveBeenCalledWith(
        CasbinRule,
        {
          ptype: PolicyType.ROLE_RELATION,
          v0: { $like: '%user%' },
        },
        expect.objectContaining({
          limit: 10,
          offset: 0,
        }),
      );
    });
  });

  describe('getPolicyById', () => {
    /**
     * 应该成功根据 ID 获取策略规则
     *
     * 验证当策略规则存在时，能够正确返回策略规则属性。
     */
    it('应该成功根据 ID 获取策略规则', async () => {
      const policyId = 1;
      const mockRule: CasbinRule = {
        id: policyId,
        ptype: PolicyType.POLICY,
        v0: 'admin',
        v1: '/api/users',
        v2: 'GET',
        v3: 'example.com',
        v4: 'allow',
        v5: null,
      } as CasbinRule;

      (entityManager.findOne as jest.Mock).mockResolvedValue(mockRule);

      const result = await repository.getPolicyById(policyId);

      expect(result).not.toBeNull();
      expect(result?.id).toBe(policyId);
      expect(result?.ptype).toBe(PolicyType.POLICY);
      expect(result?.v0).toBe('admin');
      expect(entityManager.findOne).toHaveBeenCalledWith(CasbinRule, {
        id: policyId,
      });
    });

    /**
     * 应该返回 null 当策略规则不存在时
     *
     * 验证当策略规则不存在时，方法返回 null。
     */
    it('应该返回 null 当策略规则不存在时', async () => {
      const policyId = 999;

      (entityManager.findOne as jest.Mock).mockResolvedValue(null);

      const result = await repository.getPolicyById(policyId);

      expect(result).toBeNull();
      expect(entityManager.findOne).toHaveBeenCalledWith(CasbinRule, {
        id: policyId,
      });
    });
  });

  describe('getRelationById', () => {
    /**
     * 应该成功根据 ID 获取角色继承关系
     *
     * 验证当角色继承关系存在时，能够正确返回关系属性。
     */
    it('应该成功根据 ID 获取角色继承关系', async () => {
      const relationId = 1;
      const mockRule: CasbinRule = {
        id: relationId,
        ptype: PolicyType.ROLE_RELATION,
        v0: 'user-123',
        v1: 'admin',
        v2: 'example.com',
        v3: null,
        v4: null,
        v5: null,
      } as CasbinRule;

      (entityManager.findOne as jest.Mock).mockResolvedValue(mockRule);

      const result = await repository.getRelationById(relationId);

      expect(result).not.toBeNull();
      expect(result?.id).toBe(relationId);
      expect(result?.v0).toBe('user-123');
      expect(result?.v1).toBe('admin');
      expect(result?.v2).toBe('example.com');
      expect(entityManager.findOne).toHaveBeenCalledWith(CasbinRule, {
        id: relationId,
        ptype: PolicyType.ROLE_RELATION,
      });
    });

    /**
     * 应该返回 null 当角色继承关系不存在时
     *
     * 验证当角色继承关系不存在时，方法返回 null。
     */
    it('应该返回 null 当角色继承关系不存在时', async () => {
      const relationId = 999;

      (entityManager.findOne as jest.Mock).mockResolvedValue(null);

      const result = await repository.getRelationById(relationId);

      expect(result).toBeNull();
    });

    /**
     * 应该返回 null 当规则缺少必需字段时
     *
     * 验证当规则缺少 v0 或 v1 字段时，方法返回 null。
     */
    it('应该返回 null 当规则缺少必需字段时', async () => {
      const relationId = 1;
      const mockRule: CasbinRule = {
        id: relationId,
        ptype: PolicyType.ROLE_RELATION,
        v0: null,
        v1: 'admin',
        v2: 'example.com',
      } as unknown as CasbinRule;

      (entityManager.findOne as jest.Mock).mockResolvedValue(mockRule);

      const result = await repository.getRelationById(relationId);

      expect(result).toBeNull();
    });
  });
});

/**
 * CasbinPolicyWritePostgresRepository 单元测试
 *
 * @description
 * 测试 Casbin 策略写入仓储的实现，验证创建、删除策略规则和角色继承关系等功能。
 */
describe('CasbinPolicyWritePostgresRepository', () => {
  let repository: CasbinPolicyWritePostgresRepository;
  let entityManager: jest.Mocked<EntityManager>;

  /**
   * 测试前准备
   *
   * 创建测试模块，Mock EntityManager 依赖。
   */
  beforeEach(async () => {
    // 创建 Mock EntityManager
    const mockEntityManager = {
      create: jest.fn(),
      persistAndFlush: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      removeAndFlush: jest.fn(),
    } as unknown as jest.Mocked<EntityManager>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CasbinPolicyWritePostgresRepository,
        {
          provide: EntityManager,
          useValue: mockEntityManager,
        },
      ],
    }).compile();

    repository = module.get<CasbinPolicyWritePostgresRepository>(
      CasbinPolicyWritePostgresRepository,
    );
    entityManager = module.get(EntityManager);
  });

  /**
   * 测试后清理
   *
   * 重置所有 Mock 函数。
   */
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createPolicy', () => {
    /**
     * 应该成功创建策略规则
     *
     * 验证能够正确创建策略规则并返回创建后的属性。
     */
    it('应该成功创建策略规则', async () => {
      const policy: Omit<PolicyRuleProperties, 'id'> = {
        ptype: PolicyType.POLICY,
        v0: 'admin',
        v1: '/api/users',
        v2: 'GET',
        v3: 'example.com',
        v4: 'allow',
        v5: null,
      };

      const mockRule: CasbinRule = {
        id: 1,
        ptype: policy.ptype,
        v0: policy.v0,
        v1: policy.v1,
        v2: policy.v2,
        v3: policy.v3,
        v4: policy.v4,
        v5: policy.v5,
      } as CasbinRule;

      (entityManager.create as jest.Mock).mockReturnValue(mockRule);
      (entityManager.persistAndFlush as jest.Mock).mockResolvedValue(undefined);

      const result = await repository.createPolicy(policy);

      expect(result.id).toBe(1);
      expect(result.ptype).toBe(PolicyType.POLICY);
      expect(result.v0).toBe('admin');
      expect(entityManager.create).toHaveBeenCalledWith(CasbinRule, {
        ptype: policy.ptype,
        v0: policy.v0,
        v1: policy.v1,
        v2: policy.v2,
        v3: policy.v3,
        v4: policy.v4,
        v5: policy.v5,
      });
      expect(entityManager.persistAndFlush).toHaveBeenCalledWith(mockRule);
    });
  });

  describe('createPolicies', () => {
    /**
     * 应该成功批量创建策略规则
     *
     * 验证能够正确批量创建策略规则并返回创建后的属性数组。
     */
    it('应该成功批量创建策略规则', async () => {
      const policies: Omit<PolicyRuleProperties, 'id'>[] = [
        {
          ptype: PolicyType.POLICY,
          v0: 'admin',
          v1: '/api/users',
          v2: 'GET',
        },
        {
          ptype: PolicyType.POLICY,
          v0: 'user',
          v1: '/api/posts',
          v2: 'POST',
        },
      ];

      const mockRules: CasbinRule[] = [
        { id: 1, ...policies[0] } as CasbinRule,
        { id: 2, ...policies[1] } as CasbinRule,
      ];

      (entityManager.create as jest.Mock)
        .mockReturnValueOnce(mockRules[0])
        .mockReturnValueOnce(mockRules[1]);
      (entityManager.persistAndFlush as jest.Mock).mockResolvedValue(undefined);

      const result = await repository.createPolicies(policies);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe(1);
      expect(result[1].id).toBe(2);
      expect(entityManager.persistAndFlush).toHaveBeenCalledWith(mockRules);
    });
  });

  describe('deletePolicy', () => {
    /**
     * 应该成功删除策略规则
     *
     * 验证当策略规则存在时，能够正确删除并返回 true。
     */
    it('应该成功删除策略规则', async () => {
      const policyId = 1;
      const mockRule: CasbinRule = {
        id: policyId,
        ptype: PolicyType.POLICY,
      } as CasbinRule;

      (entityManager.findOne as jest.Mock).mockResolvedValue(mockRule);
      (entityManager.removeAndFlush as jest.Mock).mockResolvedValue(undefined);

      const result = await repository.deletePolicy(policyId);

      expect(result).toBe(true);
      expect(entityManager.findOne).toHaveBeenCalledWith(CasbinRule, {
        id: policyId,
      });
      expect(entityManager.removeAndFlush).toHaveBeenCalledWith(mockRule);
    });

    /**
     * 应该返回 false 当策略规则不存在时
     *
     * 验证当策略规则不存在时，方法返回 false。
     */
    it('应该返回 false 当策略规则不存在时', async () => {
      const policyId = 999;

      (entityManager.findOne as jest.Mock).mockResolvedValue(null);

      const result = await repository.deletePolicy(policyId);

      expect(result).toBe(false);
      expect(entityManager.removeAndFlush).not.toHaveBeenCalled();
    });
  });

  describe('deletePolicies', () => {
    /**
     * 应该成功批量删除策略规则
     *
     * 验证当策略规则存在时，能够正确批量删除并返回 true。
     */
    it('应该成功批量删除策略规则', async () => {
      const policyIds = [1, 2, 3];
      const mockRules: CasbinRule[] = [
        { id: 1 } as CasbinRule,
        { id: 2 } as CasbinRule,
        { id: 3 } as CasbinRule,
      ];

      (entityManager.find as jest.Mock).mockResolvedValue(mockRules);
      (entityManager.removeAndFlush as jest.Mock).mockResolvedValue(undefined);

      const result = await repository.deletePolicies(policyIds);

      expect(result).toBe(true);
      expect(entityManager.find).toHaveBeenCalledWith(CasbinRule, {
        id: { $in: policyIds },
      });
      expect(entityManager.removeAndFlush).toHaveBeenCalledWith(mockRules);
    });

    /**
     * 应该返回 false 当策略规则不存在时
     *
     * 验证当策略规则不存在时，方法返回 false。
     */
    it('应该返回 false 当策略规则不存在时', async () => {
      const policyIds = [999, 1000];

      (entityManager.find as jest.Mock).mockResolvedValue([]);

      const result = await repository.deletePolicies(policyIds);

      expect(result).toBe(false);
      expect(entityManager.removeAndFlush).not.toHaveBeenCalled();
    });
  });

  describe('createRelation', () => {
    /**
     * 应该成功创建角色继承关系
     *
     * 验证能够正确创建角色继承关系并返回创建后的属性。
     */
    it('应该成功创建角色继承关系', async () => {
      const relation: Omit<RoleRelationProperties, 'id'> = {
        v0: 'user-123',
        v1: 'admin',
        v2: 'example.com',
      };

      const mockRule: CasbinRule = {
        id: 1,
        ptype: PolicyType.ROLE_RELATION,
        v0: relation.v0,
        v1: relation.v1,
        v2: relation.v2,
      } as CasbinRule;

      (entityManager.create as jest.Mock).mockReturnValue(mockRule);
      (entityManager.persistAndFlush as jest.Mock).mockResolvedValue(undefined);

      const result = await repository.createRelation(relation);

      expect(result.id).toBe(1);
      expect(result.v0).toBe('user-123');
      expect(result.v1).toBe('admin');
      expect(result.v2).toBe('example.com');
      expect(entityManager.create).toHaveBeenCalledWith(CasbinRule, {
        ptype: PolicyType.ROLE_RELATION,
        v0: relation.v0,
        v1: relation.v1,
        v2: relation.v2,
      });
      expect(entityManager.persistAndFlush).toHaveBeenCalledWith(mockRule);
    });
  });

  describe('deleteRelation', () => {
    /**
     * 应该成功删除角色继承关系
     *
     * 验证当角色继承关系存在时，能够正确删除并返回 true。
     */
    it('应该成功删除角色继承关系', async () => {
      const relationId = 1;
      const mockRule: CasbinRule = {
        id: relationId,
        ptype: PolicyType.ROLE_RELATION,
        v0: 'user-123',
        v1: 'admin',
      } as CasbinRule;

      (entityManager.findOne as jest.Mock).mockResolvedValue(mockRule);
      (entityManager.removeAndFlush as jest.Mock).mockResolvedValue(undefined);

      const result = await repository.deleteRelation(relationId);

      expect(result).toBe(true);
      expect(entityManager.findOne).toHaveBeenCalledWith(CasbinRule, {
        id: relationId,
        ptype: PolicyType.ROLE_RELATION,
      });
      expect(entityManager.removeAndFlush).toHaveBeenCalledWith(mockRule);
    });

    /**
     * 应该返回 false 当角色继承关系不存在时
     *
     * 验证当角色继承关系不存在时，方法返回 false。
     */
    it('应该返回 false 当角色继承关系不存在时', async () => {
      const relationId = 999;

      (entityManager.findOne as jest.Mock).mockResolvedValue(null);

      const result = await repository.deleteRelation(relationId);

      expect(result).toBe(false);
      expect(entityManager.removeAndFlush).not.toHaveBeenCalled();
    });
  });
});
