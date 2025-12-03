import { EntityManager, FilterQuery } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';

import { CasbinRule } from '@hl8/casbin';

import { PaginationResult } from '@hl8/rest';

import {
  PolicyRuleProperties,
  PolicyType,
  RoleRelationProperties,
} from '@/lib/bounded-contexts/casbin/domain/policy-rule.model';
import type {
  CasbinPolicyReadRepoPort,
  CasbinPolicyWriteRepoPort,
} from '@/lib/bounded-contexts/casbin/ports/casbin-policy.repo-port';
import { PagePoliciesQuery } from '@/lib/bounded-contexts/casbin/queries/page-policies.query';
import { PageRelationsQuery } from '@/lib/bounded-contexts/casbin/queries/page-relations.query';

/**
 * Casbin 策略读取仓储实现
 *
 * @description 使用 MikroORM EntityManager 实现 Casbin 策略数据的读取操作
 */
@Injectable()
export class CasbinPolicyReadPostgresRepository
  implements CasbinPolicyReadRepoPort
{
  constructor(private readonly em: EntityManager) {}

  /**
   * 分页查询策略规则
   *
   * @param query - 分页查询参数
   * @returns 分页结果
   */
  async pagePolicies(
    query: PagePoliciesQuery,
  ): Promise<PaginationResult<PolicyRuleProperties>> {
    const where: FilterQuery<CasbinRule> = {};

    if (query.ptype) {
      where.ptype = query.ptype;
    }

    // 根据 ptype 构建查询条件
    if (query.subject) {
      where.v0 = { $like: `%${query.subject}%` };
    }

    if (query.object) {
      where.v1 = { $like: `%${query.object}%` };
    }

    if (query.action) {
      where.v2 = { $like: `%${query.action}%` };
    }

    if (query.domain) {
      // 对于 p 类型，域在 v3；对于 g 类型，域在 v2
      where.$or = [{ v3: query.domain }, { v2: query.domain }];
    }

    const [rules, total] = await this.em.findAndCount(CasbinRule, where, {
      limit: query.size,
      offset: (query.current - 1) * query.size,
      orderBy: [{ id: 'DESC' }],
    });

    const properties: PolicyRuleProperties[] = rules.map((rule) => ({
      id: rule.id,
      ptype: rule.ptype as PolicyType,
      v0: rule.v0,
      v1: rule.v1,
      v2: rule.v2,
      v3: rule.v3,
      v4: rule.v4,
      v5: rule.v5,
    }));

    return new PaginationResult<PolicyRuleProperties>(
      query.current,
      query.size,
      total,
      properties,
    );
  }

  /**
   * 分页查询角色继承关系
   *
   * @param query - 分页查询参数
   * @returns 分页结果
   */
  async pageRelations(
    query: PageRelationsQuery,
  ): Promise<PaginationResult<RoleRelationProperties>> {
    const where: FilterQuery<CasbinRule> = {
      ptype: PolicyType.ROLE_RELATION,
    };

    if (query.childSubject) {
      where.v0 = { $like: `%${query.childSubject}%` };
    }

    if (query.parentRole) {
      where.v1 = { $like: `%${query.parentRole}%` };
    }

    if (query.domain) {
      where.v2 = query.domain;
    }

    const [rules, total] = await this.em.findAndCount(CasbinRule, where, {
      limit: query.size,
      offset: (query.current - 1) * query.size,
      orderBy: [{ id: 'DESC' }],
    });

    const properties: RoleRelationProperties[] = rules.map((rule) => ({
      id: rule.id,
      v0: rule.v0!,
      v1: rule.v1!,
      v2: rule.v2,
    }));

    return new PaginationResult<RoleRelationProperties>(
      query.current,
      query.size,
      total,
      properties,
    );
  }

  /**
   * 根据 ID 获取策略规则
   *
   * @param id - 策略规则 ID
   * @returns 策略规则属性或 null
   */
  async getPolicyById(id: number): Promise<PolicyRuleProperties | null> {
    const rule = await this.em.findOne(CasbinRule, { id });
    if (!rule) {
      return null;
    }

    return {
      id: rule.id,
      ptype: rule.ptype as PolicyType,
      v0: rule.v0,
      v1: rule.v1,
      v2: rule.v2,
      v3: rule.v3,
      v4: rule.v4,
      v5: rule.v5,
    };
  }

  /**
   * 根据 ID 获取角色继承关系
   *
   * @param id - 角色继承关系 ID
   * @returns 角色继承关系属性或 null
   */
  async getRelationById(id: number): Promise<RoleRelationProperties | null> {
    const rule = await this.em.findOne(CasbinRule, {
      id,
      ptype: PolicyType.ROLE_RELATION,
    });
    if (!rule || !rule.v0 || !rule.v1) {
      return null;
    }

    return {
      id: rule.id,
      v0: rule.v0,
      v1: rule.v1,
      v2: rule.v2,
    };
  }
}

/**
 * Casbin 策略写入仓储实现
 *
 * @description 使用 MikroORM EntityManager 实现 Casbin 策略数据的写入操作
 */
@Injectable()
export class CasbinPolicyWritePostgresRepository
  implements CasbinPolicyWriteRepoPort
{
  constructor(private readonly em: EntityManager) {}

  /**
   * 创建策略规则
   *
   * @param policy - 策略规则属性
   * @returns 创建后的策略规则属性
   */
  async createPolicy(
    policy: Omit<PolicyRuleProperties, 'id'>,
  ): Promise<PolicyRuleProperties> {
    const rule = this.em.create(CasbinRule, {
      ptype: policy.ptype,
      v0: policy.v0,
      v1: policy.v1,
      v2: policy.v2,
      v3: policy.v3,
      v4: policy.v4,
      v5: policy.v5,
    });

    await this.em.persistAndFlush(rule);

    return {
      id: rule.id,
      ptype: rule.ptype as PolicyType,
      v0: rule.v0,
      v1: rule.v1,
      v2: rule.v2,
      v3: rule.v3,
      v4: rule.v4,
      v5: rule.v5,
    };
  }

  /**
   * 批量创建策略规则
   *
   * @param policies - 策略规则属性数组
   * @returns 创建后的策略规则属性数组
   */
  async createPolicies(
    policies: Omit<PolicyRuleProperties, 'id'>[],
  ): Promise<PolicyRuleProperties[]> {
    const rules = policies.map((policy) =>
      this.em.create(CasbinRule, {
        ptype: policy.ptype,
        v0: policy.v0,
        v1: policy.v1,
        v2: policy.v2,
        v3: policy.v3,
        v4: policy.v4,
        v5: policy.v5,
      }),
    );

    await this.em.persistAndFlush(rules);

    return rules.map((rule) => ({
      id: rule.id,
      ptype: rule.ptype as PolicyType,
      v0: rule.v0,
      v1: rule.v1,
      v2: rule.v2,
      v3: rule.v3,
      v4: rule.v4,
      v5: rule.v5,
    }));
  }

  /**
   * 删除策略规则
   *
   * @param id - 策略规则 ID
   * @returns 删除是否成功
   */
  async deletePolicy(id: number): Promise<boolean> {
    const rule = await this.em.findOne(CasbinRule, { id });
    if (!rule) {
      return false;
    }

    await this.em.removeAndFlush(rule);
    return true;
  }

  /**
   * 批量删除策略规则
   *
   * @param ids - 策略规则 ID 数组
   * @returns 删除是否成功
   */
  async deletePolicies(ids: number[]): Promise<boolean> {
    const rules = await this.em.find(CasbinRule, { id: { $in: ids } });
    if (rules.length === 0) {
      return false;
    }

    await this.em.removeAndFlush(rules);
    return true;
  }

  /**
   * 创建角色继承关系
   *
   * @param relation - 角色继承关系属性
   * @returns 创建后的角色继承关系属性
   */
  async createRelation(
    relation: Omit<RoleRelationProperties, 'id'>,
  ): Promise<RoleRelationProperties> {
    const rule = this.em.create(CasbinRule, {
      ptype: PolicyType.ROLE_RELATION,
      v0: relation.v0,
      v1: relation.v1,
      v2: relation.v2,
    });

    await this.em.persistAndFlush(rule);

    return {
      id: rule.id,
      v0: rule.v0!,
      v1: rule.v1!,
      v2: rule.v2,
    };
  }

  /**
   * 删除角色继承关系
   *
   * @param id - 角色继承关系 ID
   * @returns 删除是否成功
   */
  async deleteRelation(id: number): Promise<boolean> {
    const rule = await this.em.findOne(CasbinRule, {
      id,
      ptype: PolicyType.ROLE_RELATION,
    });
    if (!rule) {
      return false;
    }

    await this.em.removeAndFlush(rule);
    return true;
  }
}
