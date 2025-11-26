import { Inject, Injectable } from '@nestjs/common';
import * as casbin from 'casbin';

import { AUTHZ_ENFORCER } from '../constants/authz.constants';

import * as authzAPI from './authz-api';

/**
 * 授权 RBAC 服务（已废弃）
 *
 * @description Casbin RBAC API 的封装服务，所有方法都转换为异步方法以支持未来的 IO 操作
 *
 * @deprecated 此服务将在后续版本中移除，由 AuthZService 替代
 *
 * @class AuthZRBACService
 */
@Injectable()
export class AuthZRBACService {
  constructor(
    @Inject(AUTHZ_ENFORCER)
    public readonly enforcer: casbin.Enforcer,
  ) {}

  /**
   * 获取用户拥有的角色
   *
   * @description 获取指定用户拥有的所有角色列表
   *
   * @param name - 用户名
   * @param domain - 域名（可选）
   * @returns 返回用户拥有的角色数组
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
   */
  getImplicitRolesForUser(
    name: string,
    ...domain: string[]
  ): Promise<string[]> {
    return authzAPI.getImplicitRolesForUser(this.enforcer, name, ...domain);
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
   */
  getImplicitUsersForPermission(...permission: string[]): Promise<string[]> {
    return authzAPI.getImplicitUsersForPermission(this.enforcer, ...permission);
  }
}
