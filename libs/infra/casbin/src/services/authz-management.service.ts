import { Inject, Injectable } from '@nestjs/common';
import * as casbin from 'casbin';

import { AUTHZ_ENFORCER } from '../constants/authz.constants';

import type { MatchingFunction } from './authz-api';
import * as authzAPI from './authz-api';

/**
 * 授权管理服务（已废弃）
 *
 * @description Casbin 管理 API 的封装服务
 *
 * @deprecated 此服务将在后续版本中移除，由 AuthZService 替代
 *
 * @class AuthZManagementService
 */
@Injectable()
export class AuthZManagementService {
  constructor(
    @Inject(AUTHZ_ENFORCER)
    public readonly enforcer: casbin.Enforcer,
  ) {}

  /**
   * 执行权限验证
   *
   * @description 判断"主体"是否可以使用"动作"访问"对象"
   *
   * @param params - 请求参数，通常是 (sub, obj, act)
   * @returns 返回 true 表示允许访问，false 表示拒绝访问
   */
  enforce(...params: string[]): Promise<boolean> {
    return authzAPI.enforce(this.enforcer, params);
  }

  /**
   * 使用自定义匹配器执行权限验证
   *
   * @description 使用自定义匹配器判断"主体"是否可以使用"动作"访问"对象"
   *
   * @param matcher - 要使用的匹配器语句
   * @param params - 请求参数，通常是 (sub, obj, act)
   * @returns 返回 true 表示允许访问，false 表示拒绝访问
   */
  enforceWithMatcher(matcher: string, ...params: string[]): Promise<boolean> {
    return authzAPI.enforceWithMatcher(this.enforcer, matcher, params);
  }

  /**
   * 执行权限验证并返回匹配的规则
   *
   * @description 通过返回匹配的规则来解释权限验证结果
   *
   * @param params - 请求参数，通常是 (sub, obj, act)
   * @returns 返回是否允许访问，以及导致该决策的策略
   */
  enforceEx(...params: string[]): Promise<[boolean, string[]]> {
    return authzAPI.enforceEx(this.enforcer, params);
  }

  /**
   * 使用自定义匹配器执行权限验证并返回匹配的规则
   *
   * @description 使用自定义匹配器并通过返回匹配的规则来解释权限验证结果
   *
   * @param matcher - 要使用的匹配器语句
   * @param params - 请求参数，通常是 (sub, obj, act)
   * @returns 返回是否允许访问，以及导致该决策的策略
   */
  enforceExWithMatcher(
    matcher: string,
    ...params: string[]
  ): Promise<[boolean, string[]]> {
    return authzAPI.enforceExWithMatcher(this.enforcer, matcher, params);
  }

  /**
   * 批量执行权限验证
   *
   * @description 对每个请求执行权限验证，并在布尔数组中返回结果
   *
   * @param params - 请求参数数组，通常是 (sub, obj, act) 的数组
   * @returns 返回每个给定请求的验证结果数组
   */
  batchEnforce(params: string[][]): Promise<boolean[]> {
    return authzAPI.batchEnforce(this.enforcer, params);
  }

  /**
   * 获取所有主体
   *
   * @description 获取当前策略中出现的所有主体列表。实际上收集 "p" 策略规则的 0 索引元素。确保主体是 0 索引元素，如 (sub, obj, act)。重复项会被移除
   *
   * @returns 返回 "p" 策略规则中的所有主体
   */
  getAllSubjects(): Promise<string[]> {
    return authzAPI.getAllSubjects(this.enforcer);
  }
  /**
   * 获取命名策略中的所有主体
   *
   * @description 获取指定命名策略类型中出现的所有主体列表。实际上收集策略规则的 0 索引元素。确保主体是 0 索引元素，如 (sub, obj, act)。重复项会被移除
   *
   * @param ptype - 策略类型，可以是 "p"、"p2"、"p3" 等
   * @returns 返回指定 ptype 类型策略规则中的所有主体
   */
  getAllNamedSubjects(ptype: string): Promise<string[]> {
    return authzAPI.getAllNamedSubjects(this.enforcer, ptype);
  }
  /**
   * 获取所有对象
   *
   * @description 获取当前策略中出现的所有对象列表。实际上收集 "p" 策略规则的 1 索引元素。确保对象是 1 索引元素，如 (sub, obj, act)。重复项会被移除
   *
   * @returns 返回 "p" 策略规则中的所有对象
   */
  getAllObjects(): Promise<string[]> {
    return authzAPI.getAllObjects(this.enforcer);
  }
  /**
   * 获取命名策略中的所有对象
   *
   * @description 获取指定命名策略类型中出现的所有对象列表。实际上收集策略规则的 1 索引元素。确保对象是 1 索引元素，如 (sub, obj, act)。重复项会被移除
   *
   * @param ptype - 策略类型，可以是 "p"、"p2"、"p3" 等
   * @returns 返回指定 ptype 类型策略规则中的所有对象
   */
  getAllNamedObjects(ptype: string): Promise<string[]> {
    return authzAPI.getAllNamedObjects(this.enforcer, ptype);
  }
  /**
   * 获取所有动作
   *
   * @description 获取当前策略中出现的所有动作列表。实际上收集 "p" 策略规则的 2 索引元素。确保动作是 2 索引元素，如 (sub, obj, act)。重复项会被移除
   *
   * @returns 返回 "p" 策略规则中的所有动作
   */
  getAllActions(): Promise<string[]> {
    return authzAPI.getAllActions(this.enforcer);
  }
  /**
   * 获取命名策略中的所有动作
   *
   * @description 获取指定命名策略类型中出现的所有动作列表。实际上收集策略规则的 2 索引元素。确保动作是 2 索引元素，如 (sub, obj, act)。重复项会被移除
   *
   * @param ptype - 策略类型，可以是 "p"、"p2"、"p3" 等
   * @returns 返回指定 ptype 类型策略规则中的所有动作
   */
  getAllNamedActions(ptype: string): Promise<string[]> {
    return authzAPI.getAllNamedActions(this.enforcer, ptype);
  }
  /**
   * 获取所有角色
   *
   * @description 获取当前策略中出现的所有角色列表。实际上收集 "g" 策略规则的 1 索引元素。确保角色是 1 索引元素，如 (sub, role)。重复项会被移除
   *
   * @returns 返回 "g" 策略规则中的所有角色
   */
  getAllRoles(): Promise<string[]> {
    return authzAPI.getAllRoles(this.enforcer);
  }
  /**
   * 获取命名策略中的所有角色
   *
   * @description 获取指定命名策略类型中出现的所有角色列表。实际上收集策略规则的 0 索引元素。确保主体是 0 索引元素，如 (sub, obj, act)。重复项会被移除
   *
   * @param ptype - 策略类型，可以是 "g"、"g2"、"g3" 等
   * @returns 返回指定 ptype 类型策略规则中的所有角色
   */
  getAllNamedRoles(ptype: string): Promise<string[]> {
    return authzAPI.getAllNamedRoles(this.enforcer, ptype);
  }
  /**
   * 获取所有策略规则
   *
   * @description 获取策略中的所有授权规则
   *
   * @returns 返回所有 "p" 策略规则
   */
  getPolicy(): Promise<string[][]> {
    return authzAPI.getPolicy(this.enforcer);
  }
  /**
   * 获取过滤后的策略规则
   *
   * @description 获取策略中匹配过滤条件的授权规则，可以指定字段过滤器
   *
   * @param fieldIndex - 策略规则的起始索引，从该索引开始匹配
   * @param fieldValues - 要匹配的字段值数组，空字符串 "" 表示不匹配该字段
   * @returns 返回过滤后的 "p" 策略规则
   */
  getFilteredPolicy(
    fieldIndex: number,
    ...fieldValues: string[]
  ): Promise<string[][]> {
    return authzAPI.getFilteredPolicy(
      this.enforcer,
      fieldIndex,
      ...fieldValues,
    );
  }
  /**
   * 获取命名策略中的所有授权规则
   *
   * @description 获取指定命名策略类型中的所有授权规则
   *
   * @param ptype - 策略类型，可以是 "p"、"p2"、"p3" 等
   * @returns 返回指定 ptype 的 "p" 策略规则
   */
  getNamedPolicy(ptype: string): Promise<string[][]> {
    return authzAPI.getNamedPolicy(this.enforcer, ptype);
  }
  /**
   * 获取命名策略中过滤后的授权规则
   *
   * @description 获取指定命名策略类型中匹配过滤条件的授权规则，可以指定字段过滤器
   *
   * @param ptype - 策略类型，可以是 "p"、"p2"、"p3" 等
   * @param fieldIndex - 策略规则的起始索引，从该索引开始匹配
   * @param fieldValues - 要匹配的字段值数组，空字符串 "" 表示不匹配该字段
   * @returns 返回指定 ptype 的过滤后的 "p" 策略规则
   */
  getFilteredNamedPolicy(
    ptype: string,
    fieldIndex: number,
    ...fieldValues: string[]
  ): Promise<string[][]> {
    return authzAPI.getFilteredNamedPolicy(
      this.enforcer,
      ptype,
      fieldIndex,
      ...fieldValues,
    );
  }
  /**
   * 获取所有角色继承规则
   *
   * @description 获取策略中的所有角色继承规则
   *
   * @returns 返回所有 "g" 策略规则
   */
  getGroupingPolicy(): Promise<string[][]> {
    return authzAPI.getGroupingPolicy(this.enforcer);
  }
  /**
   * 获取过滤后的角色继承规则
   *
   * @description 获取策略中匹配过滤条件的角色继承规则，可以指定字段过滤器
   *
   * @param fieldIndex - 策略规则的起始索引，从该索引开始匹配
   * @param fieldValues - 要匹配的字段值数组，空字符串 "" 表示不匹配该字段
   * @returns 返回过滤后的 "g" 策略规则
   */
  getFilteredGroupingPolicy(
    fieldIndex: number,
    ...fieldValues: string[]
  ): Promise<string[][]> {
    return authzAPI.getFilteredGroupingPolicy(
      this.enforcer,
      fieldIndex,
      ...fieldValues,
    );
  }
  /**
   * 获取命名策略中的所有角色继承规则
   *
   * @description 获取指定命名策略类型中的所有角色继承规则
   *
   * @param ptype - 策略类型，可以是 "g"、"g2"、"g3" 等
   * @returns 返回指定 ptype 的 "g" 策略规则
   */
  getNamedGroupingPolicy(ptype: string): Promise<string[][]> {
    return authzAPI.getNamedGroupingPolicy(this.enforcer, ptype);
  }
  /**
   * 获取命名策略中过滤后的角色继承规则
   *
   * @description 获取指定命名策略类型中匹配过滤条件的角色继承规则，可以指定字段过滤器
   *
   * @param ptype - 策略类型，可以是 "g"、"g2"、"g3" 等
   * @param fieldIndex - 策略规则的起始索引，从该索引开始匹配
   * @param fieldValues - 要匹配的字段值数组，空字符串 "" 表示不匹配该字段
   * @returns 返回指定 ptype 的过滤后的 "g" 策略规则
   */
  getFilteredNamedGroupingPolicy(
    ptype: string,
    fieldIndex: number,
    ...fieldValues: string[]
  ): Promise<string[][]> {
    return authzAPI.getFilteredNamedGroupingPolicy(
      this.enforcer,
      ptype,
      fieldIndex,
      ...fieldValues,
    );
  }
  /**
   * 检查策略规则是否存在
   *
   * @description 判断指定的授权规则是否存在
   *
   * @param params - "p" 策略规则，隐式使用 ptype "p"
   * @returns 返回 true 表示规则存在，false 表示不存在
   */
  hasPolicy(...params: string[]): Promise<boolean> {
    return authzAPI.hasPolicy(this.enforcer, ...params);
  }
  /**
   * 检查命名策略规则是否存在
   *
   * @description 判断指定的命名授权规则是否存在
   *
   * @param ptype - 策略类型，可以是 "p"、"p2"、"p3" 等
   * @param params - "p" 策略规则
   * @returns 返回 true 表示规则存在，false 表示不存在
   */
  hasNamedPolicy(ptype: string, ...params: string[]): Promise<boolean> {
    return authzAPI.hasNamedPolicy(this.enforcer, ptype, ...params);
  }
  /**
   * 添加策略规则
   *
   * @description 向当前策略添加授权规则。如果规则已存在，函数返回 false 且不会添加规则。否则函数返回 true 并添加新规则
   *
   * @param params - "p" 策略规则，隐式使用 ptype "p"
   * @returns 返回 true 表示成功，false 表示失败
   */
  addPolicy(...params: string[]): Promise<boolean> {
    return authzAPI.addPolicy(this.enforcer, ...params);
  }

  /**
   * 批量添加策略规则
   *
   * @description 向当前策略批量添加授权规则。如果规则已存在，函数返回 false 且不会添加规则。否则函数返回 true 并添加新规则
   *
   * @param rules - "p" 策略规则数组，隐式使用 ptype "p"
   * @returns 返回 true 表示成功，false 表示失败
   */
  addPolicies(rules: string[][]): Promise<boolean> {
    return authzAPI.addPolicies(this.enforcer, rules);
  }

  /**
   * 添加命名策略规则
   *
   * @description 向当前命名策略添加授权规则。如果规则已存在，函数返回 false 且不会添加规则。否则函数返回 true 并添加新规则
   *
   * @param ptype - 策略类型，可以是 "p"、"p2"、"p3" 等
   * @param params - "p" 策略规则
   * @returns 返回 true 表示成功，false 表示失败
   */
  addNamedPolicy(ptype: string, ...params: string[]): Promise<boolean> {
    return authzAPI.addNamedPolicy(this.enforcer, ptype, ...params);
  }

  /**
   * 批量添加命名策略规则
   *
   * @description 向当前命名策略批量添加授权规则。如果规则已存在，函数返回 false 且不会添加规则。否则函数返回 true 并添加新规则
   *
   * @param ptype - 策略类型，可以是 "p"、"p2"、"p3" 等
   * @param rules - "p" 策略规则数组
   * @returns 返回 true 表示成功，false 表示失败
   */
  addNamedPolicies(ptype: string, rules: string[][]): Promise<boolean> {
    return authzAPI.addNamedPolicies(this.enforcer, ptype, rules);
  }

  /**
   * 更新策略规则
   *
   * @description 更新当前策略中的授权规则。如果规则不存在，函数返回 false。否则函数返回 true 并将规则更改为新规则
   *
   * @param oldRule - 要删除的策略规则
   * @param newRule - 要添加的策略规则
   * @returns 返回 true 表示成功，false 表示失败
   */
  updatePolicy(oldRule: string[], newRule: string[]): Promise<boolean> {
    return authzAPI.updatePolicy(this.enforcer, oldRule, newRule);
  }

  /**
   * 更新命名策略规则
   *
   * @description 更新当前命名策略中的授权规则。如果规则不存在，函数返回 false。否则函数返回 true 并将规则更改为新规则
   *
   * @param ptype - 策略类型，可以是 "p"、"p2"、"p3" 等
   * @param oldRule - 要删除的策略规则
   * @param newRule - 要添加的策略规则
   * @returns 返回 true 表示成功，false 表示失败
   */
  updateNamedPolicy(
    ptype: string,
    oldRule: string[],
    newRule: string[],
  ): Promise<boolean> {
    return authzAPI.updateNamedPolicy(this.enforcer, ptype, oldRule, newRule);
  }

  /**
   * 删除策略规则
   *
   * @description 从当前策略中删除授权规则
   *
   * @param params - "p" 策略规则，隐式使用 ptype "p"
   * @returns 返回 true 表示成功，false 表示失败
   */
  removePolicy(...params: string[]): Promise<boolean> {
    return authzAPI.removePolicy(this.enforcer, ...params);
  }
  /**
   * 批量删除策略规则
   *
   * @description 从当前策略中批量删除授权规则
   *
   * @param rules - "p" 策略规则数组，隐式使用 ptype "p"
   * @returns 返回 true 表示成功，false 表示失败
   */
  removePolicies(rules: string[][]): Promise<boolean> {
    return authzAPI.removePolicies(this.enforcer, rules);
  }
  /**
   * 删除过滤后的策略规则
   *
   * @description 从当前策略中删除匹配过滤条件的授权规则，可以指定字段过滤器
   *
   * @param fieldIndex - 策略规则的起始索引，从该索引开始匹配
   * @param fieldValues - 要匹配的字段值数组，空字符串 "" 表示不匹配该字段
   * @returns 返回 true 表示成功，false 表示失败
   */
  removeFilteredPolicy(
    fieldIndex: number,
    ...fieldValues: string[]
  ): Promise<boolean> {
    return authzAPI.removeFilteredPolicy(
      this.enforcer,
      fieldIndex,
      ...fieldValues,
    );
  }
  /**
   * 删除命名策略规则
   *
   * @description 从当前命名策略中删除授权规则
   *
   * @param ptype - 策略类型，可以是 "p"、"p2"、"p3" 等
   * @param params - "p" 策略规则
   * @returns 返回 true 表示成功，false 表示失败
   */
  removeNamedPolicy(ptype: string, ...params: string[]): Promise<boolean> {
    return authzAPI.removeNamedPolicy(this.enforcer, ptype, ...params);
  }
  /**
   * 批量删除命名策略规则
   *
   * @description 从当前命名策略中批量删除授权规则
   *
   * @param ptype - 策略类型，可以是 "p"、"p2"、"p3" 等
   * @param rules - "p" 策略规则数组
   * @returns 返回 true 表示成功，false 表示失败
   */
  removeNamedPolicies(ptype: string, rules: string[][]): Promise<boolean> {
    return authzAPI.removeNamedPolicies(this.enforcer, ptype, rules);
  }
  /**
   * 删除命名策略中过滤后的授权规则
   *
   * @description 从当前命名策略中删除匹配过滤条件的授权规则，可以指定字段过滤器
   *
   * @param ptype - 策略类型，可以是 "p"、"p2"、"p3" 等
   * @param fieldIndex - 策略规则的起始索引，从该索引开始匹配
   * @param fieldValues - 要匹配的字段值数组，空字符串 "" 表示不匹配该字段
   * @returns 返回 true 表示成功，false 表示失败
   */
  removeFilteredNamedPolicy(
    ptype: string,
    fieldIndex: number,
    ...fieldValues: string[]
  ): Promise<boolean> {
    return authzAPI.removeFilteredNamedPolicy(
      this.enforcer,
      ptype,
      fieldIndex,
      ...fieldValues,
    );
  }
  /**
   * 检查角色继承规则是否存在
   *
   * @description 判断指定的角色继承规则是否存在
   *
   * @param params - "g" 策略规则，隐式使用 ptype "g"
   * @returns 返回 true 表示规则存在，false 表示不存在
   */
  hasGroupingPolicy(...params: string[]): Promise<boolean> {
    return authzAPI.hasGroupingPolicy(this.enforcer, ...params);
  }
  /**
   * 检查命名角色继承规则是否存在
   *
   * @description 判断指定的命名角色继承规则是否存在
   *
   * @param ptype - 策略类型，可以是 "g"、"g2"、"g3" 等
   * @param params - "g" 策略规则
   * @returns 返回 true 表示规则存在，false 表示不存在
   */
  hasNamedGroupingPolicy(ptype: string, ...params: string[]): Promise<boolean> {
    return authzAPI.hasNamedGroupingPolicy(this.enforcer, ptype, ...params);
  }
  /**
   * 添加角色继承规则
   *
   * @description 向当前策略添加角色继承规则。如果规则已存在，函数返回 false 且不会添加规则。否则函数返回 true 并添加新规则
   *
   * @param params - "g" 策略规则，隐式使用 ptype "g"
   * @returns 返回 true 表示成功，false 表示失败
   */
  addGroupingPolicy(...params: string[]): Promise<boolean> {
    return authzAPI.addGroupingPolicy(this.enforcer, ...params);
  }
  /**
   * 批量添加角色继承规则
   *
   * @description 向当前策略批量添加角色继承规则。如果规则已存在，函数返回 false 且不会添加规则。否则函数返回 true 并添加新规则
   *
   * @param rules - "g" 策略规则数组，隐式使用 ptype "g"
   * @returns 返回 true 表示成功，false 表示失败
   */
  addGroupingPolicies(rules: string[][]): Promise<boolean> {
    return authzAPI.addGroupingPolicies(this.enforcer, rules);
  }
  /**
   * 添加命名角色继承规则
   *
   * @description 向当前策略添加命名角色继承规则。如果规则已存在，函数返回 false 且不会添加规则。否则函数返回 true 并添加新规则
   *
   * @param ptype - 策略类型，可以是 "g"、"g2"、"g3" 等
   * @param params - "g" 策略规则
   * @returns 返回 true 表示成功，false 表示失败
   */
  addNamedGroupingPolicy(ptype: string, ...params: string[]): Promise<boolean> {
    return authzAPI.addNamedGroupingPolicy(this.enforcer, ptype, ...params);
  }
  /**
   * 批量添加命名角色继承规则
   *
   * @description 向当前策略批量添加命名角色继承规则。如果规则已存在，函数返回 false 且不会添加规则。否则函数返回 true 并添加新规则
   *
   * @param ptype - 策略类型，可以是 "g"、"g2"、"g3" 等
   * @param rules - "g" 策略规则数组
   * @returns 返回 true 表示成功，false 表示失败
   */
  addNamedGroupingPolicies(ptype: string, rules: string[][]): Promise<boolean> {
    return authzAPI.addNamedGroupingPolicies(this.enforcer, ptype, rules);
  }
  /**
   * 删除角色继承规则
   *
   * @description 从当前策略中删除角色继承规则
   *
   * @param params - "g" 策略规则，隐式使用 ptype "g"
   * @returns 返回 true 表示成功，false 表示失败
   */
  removeGroupingPolicy(...params: string[]): Promise<boolean> {
    return authzAPI.removeGroupingPolicy(this.enforcer, ...params);
  }
  /**
   * 批量删除角色继承规则
   *
   * @description 从当前策略中批量删除角色继承规则
   *
   * @param rules - "g" 策略规则数组，隐式使用 ptype "g"
   * @returns 返回 true 表示成功，false 表示失败
   */
  removeGroupingPolicies(rules: string[][]): Promise<boolean> {
    return authzAPI.removeGroupingPolicies(this.enforcer, rules);
  }
  /**
   * 删除过滤后的角色继承规则
   *
   * @description 从当前策略中删除匹配过滤条件的角色继承规则，可以指定字段过滤器
   *
   * @param fieldIndex - 策略规则的起始索引，从该索引开始匹配
   * @param fieldValues - 要匹配的字段值数组，空字符串 "" 表示不匹配该字段
   * @returns 返回 true 表示成功，false 表示失败
   */
  removeFilteredGroupingPolicy(
    fieldIndex: number,
    ...fieldValues: string[]
  ): Promise<boolean> {
    return authzAPI.removeFilteredGroupingPolicy(
      this.enforcer,
      fieldIndex,
      ...fieldValues,
    );
  }
  /**
   * 删除命名角色继承规则
   *
   * @description 从当前命名策略中删除角色继承规则
   *
   * @param ptype - 策略类型，可以是 "g"、"g2"、"g3" 等
   * @param params - "g" 策略规则
   * @returns 返回 true 表示成功，false 表示失败
   */
  removeNamedGroupingPolicy(
    ptype: string,
    ...params: string[]
  ): Promise<boolean> {
    return authzAPI.removeNamedGroupingPolicy(this.enforcer, ptype, ...params);
  }
  /**
   * 批量删除命名角色继承规则
   *
   * @description 从当前命名策略中批量删除角色继承规则
   *
   * @param ptype - 策略类型，可以是 "g"、"g2"、"g3" 等
   * @param rules - "g" 策略规则数组
   * @returns 返回 true 表示成功，false 表示失败
   */
  removeNamedGroupingPolicies(
    ptype: string,
    rules: string[][],
  ): Promise<boolean> {
    return authzAPI.removeNamedGroupingPolicies(this.enforcer, ptype, rules);
  }
  /**
   * 删除命名策略中过滤后的角色继承规则
   *
   * @description 从当前命名策略中删除匹配过滤条件的角色继承规则，可以指定字段过滤器
   *
   * @param ptype - 策略类型，可以是 "g"、"g2"、"g3" 等
   * @param fieldIndex - 策略规则的起始索引，从该索引开始匹配
   * @param fieldValues - 要匹配的字段值数组，空字符串 "" 表示不匹配该字段
   * @returns 返回 true 表示成功，false 表示失败
   */
  removeFilteredNamedGroupingPolicy(
    ptype: string,
    fieldIndex: number,
    ...fieldValues: string[]
  ): Promise<boolean> {
    return authzAPI.removeFilteredNamedGroupingPolicy(
      this.enforcer,
      ptype,
      fieldIndex,
      ...fieldValues,
    );
  }
  /**
   * 添加自定义函数
   *
   * @description 向 Casbin 执行器添加自定义函数
   *
   * @param name - 自定义函数名称
   * @param func - 函数实现，必须返回 boolean | number | string | Promise<boolean> | Promise<number> | Promise<string>
   */
  addFunction(name: string, func: MatchingFunction): Promise<void> {
    return authzAPI.addFunction(this.enforcer, name, func);
  }

  /**
   * 重新加载策略
   *
   * @description 从文件或数据库重新加载策略
   */
  loadPolicy(): Promise<void> {
    return authzAPI.loadPolicy(this.enforcer);
  }

  /**
   * 更新角色继承规则
   *
   * @description 更新当前策略中的角色继承规则。如果规则不存在，函数返回 false。否则函数返回 true 并将规则更改为新规则
   *
   * @param oldRule - 要删除的角色继承规则
   * @param newRule - 要添加的角色继承规则
   * @returns 返回 true 表示成功，false 表示失败
   */
  updateGroupingPolicy(oldRule: string[], newRule: string[]): Promise<boolean> {
    return authzAPI.updateGroupingPolicy(this.enforcer, oldRule, newRule);
  }

  /**
   * 更新命名角色继承规则
   *
   * @description 更新当前策略中的命名角色继承规则。如果规则不存在，函数返回 false。否则函数返回 true 并将规则更改为新规则
   *
   * @param ptype - 策略类型，可以是 "g"、"g2"、"g3" 等
   * @param oldRule - 要删除的角色继承规则
   * @param newRule - 要添加的角色继承规则
   * @returns 返回 true 表示成功，false 表示失败
   */
  updateNamedGroupingPolicy(
    ptype: string,
    oldRule: string[],
    newRule: string[],
  ): Promise<boolean> {
    return authzAPI.updateNamedGroupingPolicy(
      this.enforcer,
      ptype,
      oldRule,
      newRule,
    );
  }
}
