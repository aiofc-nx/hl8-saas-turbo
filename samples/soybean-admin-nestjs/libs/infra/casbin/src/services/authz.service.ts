import { Injectable, Inject } from '@nestjs/common';
import * as casbin from 'casbin';

import { AUTHZ_ENFORCER } from '../constants/authz.constants';

import * as authzAPI from './authz-api';

/**
 * 授权服务
 * 
 * @description Casbin RBAC API 的封装服务，所有方法都转换为异步方法以支持未来的 IO 操作
 * 
 * @class AuthZService
 */
@Injectable()
export class AuthZService {
  constructor(
    @Inject(AUTHZ_ENFORCER)
    public readonly enforcer: casbin.Enforcer,
  ) {}

  /**
   * RBAC API
   */

  /**
   * 获取用户拥有的角色
   * 
   * @description 获取指定用户拥有的所有角色列表
   * 
   * @param name - 用户名
   * @param domain - 域名（可选）
   * @returns 返回用户拥有的角色数组
   * 
   * @example
   * ```typescript
   * const roles = await authZService.getRolesForUser('alice', 'domain1');
   * ```
   */
  getRolesForUser(name: string, domain?: string): Promise<string[]> {
    return authzAPI.getRolesForUser(this.enforcer, name, domain);
  }

  /**
   * 获取拥有指定角色的用户
   * 
   * @description 获取拥有指定角色的所有用户列表
   * 
   * @param name - 角色名
   * @param domain - 域名（可选）
   * @returns 返回拥有该角色的用户数组
   * 
   * @example
   * ```typescript
   * const users = await authZService.getUsersForRole('admin', 'domain1');
   * ```
   */
  getUsersForRole(name: string, domain?: string): Promise<string[]> {
    return authzAPI.getUsersForRole(this.enforcer, name, domain);
  }

  /**
   * 判断用户是否拥有指定角色
   * 
   * @description 检查指定用户是否拥有指定的角色
   * 
   * @param name - 用户名
   * @param role - 角色名
   * @param domain - 域名（可选）
   * @returns 返回 true 表示用户拥有该角色，false 表示不拥有
   * 
   * @example
   * ```typescript
   * const hasRole = await authZService.hasRoleForUser('alice', 'admin', 'domain1');
   * ```
   */
  hasRoleForUser(
    name: string,
    role: string,
    domain?: string,
  ): Promise<boolean> {
    return authzAPI.hasRoleForUser(this.enforcer, name, role, domain);
  }

  /**
   * 为用户添加角色
   * 
   * @description 为指定用户添加角色，如果用户已拥有该角色则返回 false（未受影响）
   * 
   * @param user - 用户名
   * @param role - 角色名
   * @param domain - 域名（可选）
   * @returns 返回 true 表示成功添加，false 表示用户已拥有该角色
   * 
   * @example
   * ```typescript
   * const success = await authZService.addRoleForUser('alice', 'admin', 'domain1');
   * ```
   */
  addRoleForUser(
    user: string,
    role: string,
    domain?: string,
  ): Promise<boolean> {
    return authzAPI.addRoleForUser(this.enforcer, user, role, domain);
  }

  /**
   * 删除用户的角色
   * 
   * @description 删除指定用户的角色，如果用户不拥有该角色则返回 false（未受影响）
   * 
   * @param user - 用户名
   * @param role - 角色名
   * @param domain - 域名（可选）
   * @returns 返回 true 表示成功删除，false 表示用户不拥有该角色
   * 
   * @example
   * ```typescript
   * const success = await authZService.deleteRoleForUser('alice', 'admin', 'domain1');
   * ```
   */
  deleteRoleForUser(
    user: string,
    role: string,
    domain?: string,
  ): Promise<boolean> {
    return authzAPI.deleteRoleForUser(this.enforcer, user, role, domain);
  }

  /**
   * 删除用户的所有角色
   * 
   * @description 删除指定用户的所有角色，如果用户没有任何角色则返回 false（未受影响）
   * 
   * @param user - 用户名
   * @param domain - 域名（可选）
   * @returns 返回 true 表示成功删除，false 表示用户没有任何角色
   * 
   * @example
   * ```typescript
   * const success = await authZService.deleteRolesForUser('alice', 'domain1');
   * ```
   */
  deleteRolesForUser(user: string, domain?: string): Promise<boolean> {
    return authzAPI.deleteRolesForUser(this.enforcer, user, domain);
  }

  /**
   * 删除用户
   * 
   * @description 删除指定用户及其所有角色关联，如果用户不存在则返回 false（未受影响）
   * 
   * @param user - 用户名
   * @returns 返回 true 表示成功删除，false 表示用户不存在
   * 
   * @example
   * ```typescript
   * const success = await authZService.deleteUser('alice');
   * ```
   */
  async deleteUser(user: string): Promise<boolean> {
    return authzAPI.deleteUser(this.enforcer, user);
  }

  /**
   * 删除角色
   * 
   * @description 删除指定角色及其所有关联关系
   * 
   * @param role - 角色名
   * @returns 返回 true 表示成功删除，false 表示角色不存在
   * 
   * @example
   * ```typescript
   * const success = await authZService.deleteRole('admin');
   * ```
   */
  deleteRole(role: string): Promise<boolean> {
    return authzAPI.deleteRole(this.enforcer, role);
  }

  /**
   * 删除权限
   * 
   * @description 删除指定的权限规则，如果权限不存在则返回 false（未受影响）
   * 
   * @param permission - 权限参数，按照 Casbin 模型定义
   * @returns 返回 true 表示成功删除，false 表示权限不存在
   * 
   * @example
   * ```typescript
   * const success = await authZService.deletePermission('data1', 'read');
   * ```
   */
  deletePermission(...permission: string[]): Promise<boolean> {
    return authzAPI.deletePermission(this.enforcer, ...permission);
  }

  /**
   * 为用户或角色添加权限
   * 
   * @description 为指定用户或角色添加权限，如果已拥有该权限则返回 false（未受影响）
   * 
   * @param userOrRole - 用户名或角色名
   * @param permission - 权限参数，按照 Casbin 模型定义
   * @returns 返回 true 表示成功添加，false 表示已拥有该权限
   * 
   * @example
   * ```typescript
   * const success = await authZService.addPermissionForUser('alice', 'data1', 'read');
   * ```
   */
  addPermissionForUser(
    userOrRole: string,
    ...permission: string[]
  ): Promise<boolean> {
    return authzAPI.addPermissionForUser(
      this.enforcer,
      userOrRole,
      ...permission,
    );
  }

  /**
   * 删除用户或角色的权限
   * 
   * @description 删除指定用户或角色的权限，如果不拥有该权限则返回 false（未受影响）
   * 
   * @param userOrRole - 用户名或角色名
   * @param permission - 权限参数，按照 Casbin 模型定义
   * @returns 返回 true 表示成功删除，false 表示不拥有该权限
   * 
   * @example
   * ```typescript
   * const success = await authZService.deletePermissionForUser('alice', 'data1', 'read');
   * ```
   */
  deletePermissionForUser(
    userOrRole: string,
    ...permission: string[]
  ): Promise<boolean> {
    return authzAPI.deletePermissionForUser(
      this.enforcer,
      userOrRole,
      ...permission,
    );
  }

  /**
   * 删除用户或角色的所有权限
   * 
   * @description 删除指定用户或角色的所有权限，如果没有任何权限则返回 false（未受影响）
   * 
   * @param userOrRole - 用户名或角色名
   * @returns 返回 true 表示成功删除，false 表示没有任何权限
   * 
   * @example
   * ```typescript
   * const success = await authZService.deletePermissionsForUser('alice');
   * ```
   */
  deletePermissionsForUser(userOrRole: string): Promise<boolean> {
    return authzAPI.deletePermissionsForUser(this.enforcer, userOrRole);
  }

  /**
   * 获取用户或角色的权限
   * 
   * @description 获取指定用户或角色的所有权限列表
   * 
   * @param userOrRole - 用户名或角色名
   * @returns 返回权限数组，每个权限是一个字符串数组
   * 
   * @example
   * ```typescript
   * const permissions = await authZService.getPermissionsForUser('alice');
   * // [['alice', 'data1', 'read'], ['alice', 'data2', 'write']]
   * ```
   */
  getPermissionsForUser(userOrRole: string): Promise<string[][]> {
    return authzAPI.getPermissionsForUser(this.enforcer, userOrRole);
  }

  /**
   * 判断用户是否拥有指定权限
   * 
   * @description 检查指定用户是否拥有指定的权限
   * 
   * @param user - 用户名
   * @param permission - 权限参数，按照 Casbin 模型定义
   * @returns 返回 true 表示用户拥有该权限，false 表示不拥有
   * 
   * @example
   * ```typescript
   * const hasPermission = await authZService.hasPermissionForUser('alice', 'data1', 'read');
   * ```
   */
  hasPermissionForUser(
    user: string,
    ...permission: string[]
  ): Promise<boolean> {
    return authzAPI.hasPermissionForUser(this.enforcer, user, ...permission);
  }

  /**
   * 获取用户的隐式角色
   * 
   * @description 获取用户的所有角色，包括直接角色和间接继承的角色。与 getRolesForUser() 相比，此函数会检索间接角色
   * 
   * @param name - 用户名
   * @param domain - 域名（可变参数）
   * @returns 返回用户的所有角色数组（包括直接和间接角色）
   * 
   * @example
   * 例如：
   * g, alice, role:admin
   * g, role:admin, role:user
   * 
   * getRolesForUser("alice") 只能获取: ["role:admin"]
   * 但 getImplicitRolesForUser("alice") 会获取: ["role:admin", "role:user"]
   * 
   * ```typescript
   * const roles = await authZService.getImplicitRolesForUser('alice', 'domain1');
   * ```
   */
  getImplicitRolesForUser(
    name: string,
    ...domain: string[]
  ): Promise<string[]> {
    return authzAPI.getImplicitRolesForUser(this.enforcer, name, ...domain);
  }

  /**
   * 获取用户可访问的隐式资源
   * 
   * @description 获取用户可访问的所有资源，包括直接权限和通过角色继承的权限
   * 
   * @param name - 用户名
   * @param domain - 域名（可变参数）
   * @returns 返回用户可访问的资源数组，每个资源是一个字符串数组
   * 
   * @example
   * 例如：
   * g, alice, role:admin
   * p, alice, resource1, read
   * p, role:admin, resource1, write
   * 
   * getImplicitResourcesForUser("alice") 将返回: [["alice", "resource1", "read"], ["role:admin", "resource1", "write"]]
   * 
   * ```typescript
   * const resources = await authZService.getImplicitResourcesForUser('alice', 'domain1');
   * ```
   */
  getImplicitResourcesForUser(
    name: string,
    ...domain: string[]
  ): Promise<string[][]> {
    return authzAPI.getImplicitResourcesForUser(this.enforcer, name, ...domain);
  }

  /**
   * 获取用户或角色的隐式权限
   * 
   * @description 获取用户或角色的所有权限，包括直接权限和通过继承角色获得的权限。与 getPermissionsForUser() 相比，此函数会检索继承角色的权限
   * 
   * @param user - 用户名
   * @param domain - 域名（可变参数）
   * @returns 返回用户或角色的所有权限数组，每个权限是一个字符串数组
   * 
   * @example
   * 例如：
   * p, admin, data1, read
   * p, alice, data2, read
   * g, alice, admin
   * 
   * getPermissionsForUser("alice") 只能获取: [["alice", "data2", "read"]]
   * 但 getImplicitPermissionsForUser("alice") 会获取: [["admin", "data1", "read"], ["alice", "data2", "read"]]
   * 
   * ```typescript
   * const permissions = await authZService.getImplicitPermissionsForUser('alice', 'domain1');
   * ```
   */
  getImplicitPermissionsForUser(
    user: string,
    ...domain: string[]
  ): Promise<string[][]> {
    return authzAPI.getImplicitPermissionsForUser(
      this.enforcer,
      user,
      ...domain,
    );
  }
  /**
   * 获取拥有指定权限的隐式用户
   * 
   * @description 获取拥有指定权限的所有用户，包括直接拥有权限的用户和通过角色继承权限的用户
   * 
   * @param permission - 权限参数，按照 Casbin 模型定义
   * @returns 返回拥有该权限的用户数组
   * 
   * @example
   * 例如：
   * p, admin, data1, read
   * p, bob, data1, read
   * g, alice, admin
   * 
   * getImplicitUsersForPermission("data1", "read") 将获取: ["alice", "bob"]
   * 注意：只返回用户，角色（"g" 中的第二个参数）将被排除
   * 
   * ```typescript
   * const users = await authZService.getImplicitUsersForPermission('data1', 'read');
   * ```
   */
  getImplicitUsersForPermission(...permission: string[]): Promise<string[]> {
    return authzAPI.getImplicitUsersForPermission(this.enforcer, ...permission);
  }

  /**
   * Management API
   */

  /**
   * 执行权限验证
   * 
   * @description 判断"主体"是否可以使用"动作"访问"对象"
   * 
   * @param params - 请求参数，通常是 (sub, obj, act)
   * @returns 返回 true 表示允许访问，false 表示拒绝访问
   * 
   * @example
   * ```typescript
   * const allowed = await authZService.enforce('alice', 'data1', 'read');
   * ```
   */
  enforce(...params: any[]): Promise<boolean> {
    return authzAPI.enforce(this.enforcer, params);
  }

  /**
   * enforceWithMatcher uses a custom matcher to decides whether a "subject" can access a "object" with the operation "action"
   *
   * @param matcher the matcher statement to use
   * @param params the request parameters, usually (sub, obj, act)
   *
   * @return whether or not the request is allowed
   */
  enforceWithMatcher(matcher: string, ...params: any[]): Promise<boolean> {
    return authzAPI.enforceWithMatcher(this.enforcer, matcher, params);
  }

  /**
   * enforceEx explains enforcement by returning matched rules.
   *
   * @param params the request parameters, usually (sub, obj, act)
   *
   * @return whether or not the request is allowed, and what policy caused that decision
   */
  enforceEx(...params: any[]): Promise<[boolean, string[]]> {
    return authzAPI.enforceEx(this.enforcer, params);
  }

  /**
   * enforceExWithMatcher uses a custom matcher and explains enforcement by returning matched rules.
   *
   * @param matcher the matcher statement to use
   * @param params the request parameters, usually (sub, obj, act)
   *
   * @return whether or not the request is allowed, and what policy caused that decision
   */
  enforceExWithMatcher(
    matcher: string,
    ...params: any[]
  ): Promise<[boolean, string[]]> {
    return authzAPI.enforceExWithMatcher(this.enforcer, matcher, params);
  }

  /**
   * batchEnforce enforces each request and returns result in a bool array
   *
   * @param params the request parameters, usually (sub, obj, act)
   *
   * @return an array with the enforcement results for each given request
   */
  batchEnforce(params: any[][]): Promise<boolean[]> {
    return authzAPI.batchEnforce(this.enforcer, params);
  }

  /**
   * getAllSubjects gets the list of subjects that show up in the current policy.
   *
   * @return all the subjects in "p" policy rules. It actually collects the
   *         0-index elements of "p" policy rules. So make sure your subject
   *         is the 0-index element, like (sub, obj, act). Duplicates are removed.
   */
  getAllSubjects(): Promise<string[]> {
    return authzAPI.getAllSubjects(this.enforcer);
  }
  /**
   * getAllNamedSubjects gets the list of subjects that show up in the currentnamed policy.
   *
   * @param ptype the policy type, can be "p", "p2", "p3", ..
   * @return all the subjects in policy rules of the ptype type. It actually
   *         collects the 0-index elements of the policy rules. So make sure
   *         your subject is the 0-index element, like (sub, obj, act).
   *         Duplicates are removed.
   */
  getAllNamedSubjects(ptype: string): Promise<string[]> {
    return authzAPI.getAllNamedSubjects(this.enforcer, ptype);
  }
  /**
   * getAllObjects gets the list of objects that show up in the current policy.
   *
   * @return all the objects in "p" policy rules. It actually collects the
   *         1-index elements of "p" policy rules. So make sure your object
   *         is the 1-index element, like (sub, obj, act).
   *         Duplicates are removed.
   */
  getAllObjects(): Promise<string[]> {
    return authzAPI.getAllObjects(this.enforcer);
  }
  /**
   * getAllNamedObjects gets the list of objects that show up in the current named policy.
   *
   * @param ptype the policy type, can be "p", "p2", "p3", ..
   * @return all the objects in policy rules of the ptype type. It actually
   *         collects the 1-index elements of the policy rules. So make sure
   *         your object is the 1-index element, like (sub, obj, act).
   *         Duplicates are removed.
   */
  getAllNamedObjects(ptype: string): Promise<string[]> {
    return authzAPI.getAllNamedObjects(this.enforcer, ptype);
  }
  /**
   * getAllActions gets the list of actions that show up in the current policy.
   *
   * @return all the actions in "p" policy rules. It actually collects
   *         the 2-index elements of "p" policy rules. So make sure your action
   *         is the 2-index element, like (sub, obj, act).
   *         Duplicates are removed.
   */
  getAllActions(): Promise<string[]> {
    return authzAPI.getAllActions(this.enforcer);
  }
  /**
   * GetAllNamedActions gets the list of actions that show up in the current named policy.
   *
   * @param ptype the policy type, can be "p", "p2", "p3", ..
   * @return all the actions in policy rules of the ptype type. It actually
   *         collects the 2-index elements of the policy rules. So make sure
   *         your action is the 2-index element, like (sub, obj, act).
   *         Duplicates are removed.
   */
  getAllNamedActions(ptype: string): Promise<string[]> {
    return authzAPI.getAllNamedActions(this.enforcer, ptype);
  }
  /**
   * getAllRoles gets the list of roles that show up in the current policy.
   *
   * @return all the roles in "g" policy rules. It actually collects
   *         the 1-index elements of "g" policy rules. So make sure your
   *         role is the 1-index element, like (sub, role).
   *         Duplicates are removed.
   */
  getAllRoles(): Promise<string[]> {
    return authzAPI.getAllRoles(this.enforcer);
  }
  /**
   * getAllNamedRoles gets the list of roles that show up in the current named policy.
   *
   * @param ptype the policy type, can be "g", "g2", "g3", ..
   * @return all the subjects in policy rules of the ptype type. It actually
   *         collects the 0-index elements of the policy rules. So make
   *         sure your subject is the 0-index element, like (sub, obj, act).
   *         Duplicates are removed.
   */
  getAllNamedRoles(ptype: string): Promise<string[]> {
    return authzAPI.getAllNamedRoles(this.enforcer, ptype);
  }
  /**
   * getPolicy gets all the authorization rules in the policy.
   *
   * @return all the "p" policy rules.
   */
  getPolicy(): Promise<string[][]> {
    return authzAPI.getPolicy(this.enforcer);
  }
  /**
   * getFilteredPolicy gets all the authorization rules in the policy, field filters can be specified.
   *
   * @param fieldIndex the policy rule's start index to be matched.
   * @param fieldValues the field values to be matched, value ""
   *                    means not to match this field.
   * @return the filtered "p" policy rules.
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
   * getNamedPolicy gets all the authorization rules in the named policy.
   *
   * @param ptype the policy type, can be "p", "p2", "p3", ..
   * @return the "p" policy rules of the specified ptype.
   */
  getNamedPolicy(ptype: string): Promise<string[][]> {
    return authzAPI.getNamedPolicy(this.enforcer, ptype);
  }
  /**
   * getFilteredNamedPolicy gets all the authorization rules in the named policy, field filters can be specified.
   *
   * @param ptype the policy type, can be "p", "p2", "p3", ..
   * @param fieldIndex the policy rule's start index to be matched.
   * @param fieldValues the field values to be matched, value ""
   *                    means not to match this field.
   * @return the filtered "p" policy rules of the specified ptype.
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
   * getGroupingPolicy gets all the role inheritance rules in the policy.
   *
   * @return all the "g" policy rules.
   */
  getGroupingPolicy(): Promise<string[][]> {
    return authzAPI.getGroupingPolicy(this.enforcer);
  }
  /**
   * getFilteredGroupingPolicy gets all the role inheritance rules in the policy, field filters can be specified.
   *
   * @param fieldIndex the policy rule's start index to be matched.
   * @param fieldValues the field values to be matched, value "" means not to match this field.
   * @return the filtered "g" policy rules.
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
   * getNamedGroupingPolicy gets all the role inheritance rules in the policy.
   *
   * @param ptype the policy type, can be "g", "g2", "g3", ..
   * @return the "g" policy rules of the specified ptype.
   */
  getNamedGroupingPolicy(ptype: string): Promise<string[][]> {
    return authzAPI.getNamedGroupingPolicy(this.enforcer, ptype);
  }
  /**
   * getFilteredNamedGroupingPolicy gets all the role inheritance rules in the policy, field filters can be specified.
   *
   * @param ptype the policy type, can be "g", "g2", "g3", ..
   * @param fieldIndex the policy rule's start index to be matched.
   * @param fieldValues the field values to be matched, value ""
   *                    means not to match this field.
   * @return the filtered "g" policy rules of the specified ptype.
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
   * hasPolicy determines whether an authorization rule exists.
   *
   * @param params the "p" policy rule, ptype "p" is implicitly used.
   * @return whether the rule exists.
   */
  hasPolicy(...params: string[]): Promise<boolean> {
    return authzAPI.hasPolicy(this.enforcer, ...params);
  }
  /**
   * hasNamedPolicy determines whether a named authorization rule exists.
   *
   * @param ptype the policy type, can be "p", "p2", "p3", ..
   * @param params the "p" policy rule.
   * @return whether the rule exists.
   */
  hasNamedPolicy(ptype: string, ...params: string[]): Promise<boolean> {
    return authzAPI.hasNamedPolicy(this.enforcer, ptype, ...params);
  }
  /**
   * addPolicy adds an authorization rule to the current policy.
   * If the rule already exists, the function returns false and the rule will not be added.
   * Otherwise the function returns true by adding the new rule.
   *
   * @param params the "p" policy rule, ptype "p" is implicitly used.
   * @return succeeds or not.
   */
  addPolicy(...params: string[]): Promise<boolean> {
    return authzAPI.addPolicy(this.enforcer, ...params);
  }

  /**
   * addPolicies adds authorization rules to the current policy.
   * If the rule already exists, the function returns false and the rules will not be added.
   * Otherwise the function returns true by adding the new rules.
   *
   * @param rules the "p" policy rules, ptype "p" is implicitly used.
   * @return succeeds or not.
   */
  addPolicies(rules: string[][]): Promise<boolean> {
    return authzAPI.addPolicies(this.enforcer, rules);
  }

  /**
   * addNamedPolicy adds an authorization rule to the current named policy.
   * If the rule already exists, the function returns false and the rule will not be added.
   * Otherwise the function returns true by adding the new rule.
   *
   * @param ptype the policy type, can be "p", "p2", "p3", ..
   * @param params the "p" policy rule.
   * @return succeeds or not.
   */
  addNamedPolicy(ptype: string, ...params: string[]): Promise<boolean> {
    return authzAPI.addNamedPolicy(this.enforcer, ptype, ...params);
  }

  /**
   * addNamedPolicies adds authorization rules to the current named policy.
   * If the rule already exists, the function returns false and the rules will not be added.
   * Otherwise the function returns true by adding the new rules.
   *
   * @param ptype the policy type, can be "p", "p2", "p3", ..
   * @param rules the "p" policy rules.
   * @return succeeds or not.
   */
  addNamedPolicies(ptype: string, rules: string[][]): Promise<boolean> {
    return authzAPI.addNamedPolicies(this.enforcer, ptype, rules);
  }

  /**
   * updatePolicy updates an authorization rule from the current policy.
   * If the rule not exists, the function returns false.
   * Otherwise the function returns true by changing it to the new rule.
   *
   * @return succeeds or not.
   * @param oldRule the policy will be remove
   * @param newRule the policy will be added
   */
  updatePolicy(oldRule: string[], newRule: string[]): Promise<boolean> {
    return authzAPI.updatePolicy(this.enforcer, oldRule, newRule);
  }

  /**
   * updateNamedPolicy updates an authorization rule from the current named policy.
   * If the rule not exists, the function returns false.
   * Otherwise the function returns true by changing it to the new rule.
   *
   * @param ptype the policy type, can be "p", "p2", "p3", ..
   * @param oldRule the policy rule will be remove
   * @param newRule the policy rule will be added
   * @return succeeds or not.
   */
  updateNamedPolicy(
    ptype: string,
    oldRule: string[],
    newRule: string[],
  ): Promise<boolean> {
    return authzAPI.updateNamedPolicy(this.enforcer, ptype, oldRule, newRule);
  }

  /**
   * removePolicy removes an authorization rule from the current policy.
   *
   * @param params the "p" policy rule, ptype "p" is implicitly used.
   * @return succeeds or not.
   */
  removePolicy(...params: string[]): Promise<boolean> {
    return authzAPI.removePolicy(this.enforcer, ...params);
  }
  /**
   * removePolicies removes an authorization rules from the current policy.
   *
   * @param rules the "p" policy rules, ptype "p" is implicitly used.
   * @return succeeds or not.
   */
  removePolicies(rules: string[][]): Promise<boolean> {
    return authzAPI.removePolicies(this.enforcer, rules);
  }
  /**
   * removeFilteredPolicy removes an authorization rule from the current policy, field filters can be specified.
   *
   * @param fieldIndex the policy rule's start index to be matched.
   * @param fieldValues the field values to be matched, value ""
   *                    means not to match this field.
   * @return succeeds or not.
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
   * removeNamedPolicy removes an authorization rule from the current named policy.
   *
   * @param ptype the policy type, can be "p", "p2", "p3", ..
   * @param params the "p" policy rule.
   * @return succeeds or not.
   */
  removeNamedPolicy(ptype: string, ...params: string[]): Promise<boolean> {
    return authzAPI.removeNamedPolicy(this.enforcer, ptype, ...params);
  }
  /**
   * removeNamedPolicies removes authorization rules from the current named policy.
   *
   * @param ptype the policy type, can be "p", "p2", "p3", ..
   * @param rules the "p" policy rules.
   * @return succeeds or not.
   */
  removeNamedPolicies(ptype: string, rules: string[][]): Promise<boolean> {
    return authzAPI.removeNamedPolicies(this.enforcer, ptype, rules);
  }
  /**
   * removeFilteredNamedPolicy removes an authorization rule from the current named policy, field filters can be specified.
   *
   * @param ptype the policy type, can be "p", "p2", "p3", ..
   * @param fieldIndex the policy rule's start index to be matched.
   * @param fieldValues the field values to be matched, value ""
   *                    means not to match this field.
   * @return succeeds or not.
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
   * hasGroupingPolicy determines whether a role inheritance rule exists.
   *
   * @param params the "g" policy rule, ptype "g" is implicitly used.
   * @return whether the rule exists.
   */
  hasGroupingPolicy(...params: string[]): Promise<boolean> {
    return authzAPI.hasGroupingPolicy(this.enforcer, ...params);
  }
  /**
   * hasNamedGroupingPolicy determines whether a named role inheritance rule exists.
   *
   * @param ptype the policy type, can be "g", "g2", "g3", ..
   * @param params the "g" policy rule.
   * @return whether the rule exists.
   */
  hasNamedGroupingPolicy(ptype: string, ...params: string[]): Promise<boolean> {
    return authzAPI.hasNamedGroupingPolicy(this.enforcer, ptype, ...params);
  }
  /**
   * addGroupingPolicy adds a role inheritance rule to the current policy.
   * If the rule already exists, the function returns false and the rule will not be added.
   * Otherwise the function returns true by adding the new rule.
   *
   * @param params the "g" policy rule, ptype "g" is implicitly used.
   * @return succeeds or not.
   */
  addGroupingPolicy(...params: string[]): Promise<boolean> {
    return authzAPI.addGroupingPolicy(this.enforcer, ...params);
  }
  /**
   * addGroupingPolicies adds a role inheritance rules to the current policy.
   * If the rule already exists, the function returns false and the rules will not be added.
   * Otherwise the function returns true by adding the new rules.
   *
   * @param rules the "g" policy rules, ptype "g" is implicitly used.
   * @return succeeds or not.
   */
  addGroupingPolicies(rules: string[][]): Promise<boolean> {
    return authzAPI.addGroupingPolicies(this.enforcer, rules);
  }
  /**
   * addNamedGroupingPolicy adds a named role inheritance rule to the current policy.
   * If the rule already exists, the function returns false and the rule will not be added.
   * Otherwise the function returns true by adding the new rule.
   *
   * @param ptype the policy type, can be "g", "g2", "g3", ..
   * @param params the "g" policy rule.
   * @return succeeds or not.
   */
  addNamedGroupingPolicy(ptype: string, ...params: string[]): Promise<boolean> {
    return authzAPI.addNamedGroupingPolicy(this.enforcer, ptype, ...params);
  }
  /**
   * addNamedGroupingPolicies adds named role inheritance rules to the current policy.
   * If the rule already exists, the function returns false and the rules will not be added.
   * Otherwise the function returns true by adding the new rules.
   *
   * @param ptype the policy type, can be "g", "g2", "g3", ..
   * @param rules the "g" policy rule.
   * @return succeeds or not.
   */
  addNamedGroupingPolicies(ptype: string, rules: string[][]): Promise<boolean> {
    return authzAPI.addNamedGroupingPolicies(this.enforcer, ptype, rules);
  }
  /**
   * removeGroupingPolicy removes a role inheritance rule from the current policy.
   *
   * @param params the "g" policy rule, ptype "g" is implicitly used.
   * @return succeeds or not.
   */
  removeGroupingPolicy(...params: string[]): Promise<boolean> {
    return authzAPI.removeGroupingPolicy(this.enforcer, ...params);
  }
  /**
   * removeGroupingPolicies removes role inheritance rules from the current policy.
   *
   * @param rules the "g" policy rules, ptype "g" is implicitly used.
   * @return succeeds or not.
   */
  removeGroupingPolicies(rules: string[][]): Promise<boolean> {
    return authzAPI.removeGroupingPolicies(this.enforcer, rules);
  }
  /**
   * removeFilteredGroupingPolicy removes a role inheritance rule from the current policy, field filters can be specified.
   *
   * @param fieldIndex the policy rule's start index to be matched.
   * @param fieldValues the field values to be matched, value ""
   *                    means not to match this field.
   * @return succeeds or not.
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
   * removeNamedGroupingPolicy removes a role inheritance rule from the current named policy.
   *
   * @param ptype the policy type, can be "g", "g2", "g3", ..
   * @param params the "g" policy rule.
   * @return succeeds or not.
   */
  removeNamedGroupingPolicy(
    ptype: string,
    ...params: string[]
  ): Promise<boolean> {
    return authzAPI.removeNamedGroupingPolicy(this.enforcer, ptype, ...params);
  }
  /**
   * removeNamedGroupingPolicies removes role inheritance rules from the current named policy.
   *
   * @param ptype the policy type, can be "g", "g2", "g3", ..
   * @param rules the "g" policy rules.
   * @return succeeds or not.
   */
  removeNamedGroupingPolicies(
    ptype: string,
    rules: string[][],
  ): Promise<boolean> {
    return authzAPI.removeNamedGroupingPolicies(this.enforcer, ptype, rules);
  }
  /**
   * removeFilteredNamedGroupingPolicy removes a role inheritance rule from the current named policy, field filters can be specified.
   *
   * @param ptype the policy type, can be "g", "g2", "g3", ..
   * @param fieldIndex the policy rule's start index to be matched.
   * @param fieldValues the field values to be matched, value ""
   *                    means not to match this field.
   * @return succeeds or not.
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
   * addFunction adds a customized function.
   * @param name custom function name
   * @param func function
   */
  addFunction(name: string, func: any): Promise<void> {
    return authzAPI.addFunction(this.enforcer, name, func);
  }

  /**
   * loadPolicy reloads the policy from file/database.
   */
  loadPolicy(): Promise<void> {
    return authzAPI.loadPolicy(this.enforcer);
  }

  /**
   * updateGroupingPolicy updates a role inheritance rule from the current policy.
   * If the rule not exists, the function returns false.
   * Otherwise the function returns true by changing it to the new rule.
   *
   * @param oldRule the role inheritance rule will be remove
   * @param newRule the role inheritance rule will be added
   * @return succeeds or not.
   */
  updateGroupingPolicy(oldRule: string[], newRule: string[]): Promise<boolean> {
    return authzAPI.updateGroupingPolicy(this.enforcer, oldRule, newRule);
  }

  /**
   * updateNamedGroupingPolicy updates a named role inheritance rule from the current policy.
   * If the rule not exists, the function returns false.
   * Otherwise the function returns true by changing it to the new rule.
   *
   * @param ptype the policy type, can be "g", "g2", "g3", ..
   * @param oldRule the role inheritance rule will be remove
   * @param newRule the role inheritance rule will be added
   * @return succeeds or not.
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
