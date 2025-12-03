import { PaginationResult } from '@hl8/rest';

import {
  PolicyRuleProperties,
  RoleRelationProperties,
} from '../domain/policy-rule.model';
import { PagePoliciesQuery } from '../queries/page-policies.query';
import { PageRelationsQuery } from '../queries/page-relations.query';

/**
 * Casbin 策略读取仓储端口
 *
 * @description
 * 定义 Casbin 策略的读取操作接口，遵循端口适配器模式。
 * 该接口由基础设施层实现，用于查询策略规则数据。
 *
 * @interface CasbinPolicyReadRepoPort
 */
export interface CasbinPolicyReadRepoPort {
  /**
   * 分页查询策略规则
   *
   * @description 根据查询条件分页查询策略规则列表，支持按策略类型、主体、资源、操作、域等筛选
   *
   * @param query - 分页查询对象，包含分页参数、策略类型、主体、资源、操作、域等筛选条件
   * @returns 返回分页结果，包含策略规则列表和分页信息
   */
  pagePolicies(
    query: PagePoliciesQuery,
  ): Promise<PaginationResult<PolicyRuleProperties>>;

  /**
   * 分页查询角色继承关系
   *
   * @description 根据查询条件分页查询角色继承关系列表，支持按子主体、父角色、域等筛选
   *
   * @param query - 分页查询对象，包含分页参数、子主体、父角色、域等筛选条件
   * @returns 返回分页结果，包含角色继承关系列表和分页信息
   */
  pageRelations(
    query: PageRelationsQuery,
  ): Promise<PaginationResult<RoleRelationProperties>>;

  /**
   * 根据 ID 获取策略规则
   *
   * @description 从数据库中查询指定 ID 的策略规则信息
   *
   * @param id - 策略规则的唯一标识符
   * @returns 返回策略规则属性对象，如果不存在则返回 null
   */
  getPolicyById(id: number): Promise<PolicyRuleProperties | null>;

  /**
   * 根据 ID 获取角色继承关系
   *
   * @description 从数据库中查询指定 ID 的角色继承关系信息
   *
   * @param id - 角色继承关系的唯一标识符
   * @returns 返回角色继承关系属性对象，如果不存在则返回 null
   */
  getRelationById(id: number): Promise<RoleRelationProperties | null>;
}

/**
 * Casbin 策略写入仓储端口
 *
 * @description
 * 定义 Casbin 策略的写入操作接口，遵循端口适配器模式。
 * 该接口由基础设施层实现，用于创建、更新、删除策略规则数据。
 *
 * @interface CasbinPolicyWriteRepoPort
 */
export interface CasbinPolicyWriteRepoPort {
  /**
   * 创建策略规则
   *
   * @description 在数据库中创建新的策略规则
   *
   * @param policy - 策略规则属性对象
   * @returns 返回创建后的策略规则属性对象
   */
  createPolicy(
    policy: Omit<PolicyRuleProperties, 'id'>,
  ): Promise<PolicyRuleProperties>;

  /**
   * 批量创建策略规则
   *
   * @description 在数据库中批量创建策略规则
   *
   * @param policies - 策略规则属性对象数组
   * @returns 返回创建后的策略规则属性对象数组
   */
  createPolicies(
    policies: Omit<PolicyRuleProperties, 'id'>[],
  ): Promise<PolicyRuleProperties[]>;

  /**
   * 删除策略规则
   *
   * @description 从数据库中删除指定的策略规则
   *
   * @param id - 要删除的策略规则 ID
   * @returns 返回删除是否成功
   */
  deletePolicy(id: number): Promise<boolean>;

  /**
   * 批量删除策略规则
   *
   * @description 从数据库中批量删除策略规则
   *
   * @param ids - 要删除的策略规则 ID 数组
   * @returns 返回删除是否成功
   */
  deletePolicies(ids: number[]): Promise<boolean>;

  /**
   * 创建角色继承关系
   *
   * @description 在数据库中创建新的角色继承关系
   *
   * @param relation - 角色继承关系属性对象
   * @returns 返回创建后的角色继承关系属性对象
   */
  createRelation(
    relation: Omit<RoleRelationProperties, 'id'>,
  ): Promise<RoleRelationProperties>;

  /**
   * 删除角色继承关系
   *
   * @description 从数据库中删除指定的角色继承关系
   *
   * @param id - 要删除的角色继承关系 ID
   * @returns 返回删除是否成功
   */
  deleteRelation(id: number): Promise<boolean>;
}
