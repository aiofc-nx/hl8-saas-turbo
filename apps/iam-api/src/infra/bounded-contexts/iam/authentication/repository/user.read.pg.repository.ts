import { EntityManager, FilterQuery } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';

import type { UserProperties } from '@/lib/bounded-contexts/iam/authentication/domain/user.read.model';
import type { UserReadRepoPort } from '@/lib/bounded-contexts/iam/authentication/ports/user.read.repo-port';
import { PageUsersQuery } from '@/lib/bounded-contexts/iam/authentication/queries/page-users.query';

import { PaginationResult } from '@hl8/rest';

/**
 * 用户读取仓储实现
 *
 * @description 使用 MikroORM EntityManager 实现用户数据的读取操作
 */
@Injectable()
export class UserReadRepository implements UserReadRepoPort {
  constructor(private readonly em: EntityManager) {}

  /**
   * 根据 ID 查找用户
   *
   * @param {string} id - 用户 ID
   * @returns {Promise<UserProperties | null>} 用户属性或 null
   */
  async findUserById(id: string): Promise<UserProperties | null> {
    const user = await this.em.findOne('SysUser', { id } as FilterQuery<any>);
    return user as UserProperties | null;
  }

  /**
   * 根据角色 ID 查找用户 ID 列表
   *
   * @param {string} roleId - 角色 ID
   * @returns {Promise<string[]>} 用户 ID 列表
   */
  async findUserIdsByRoleId(roleId: string): Promise<string[]> {
    const userRoles = await this.em.find('SysUserRole', {
      roleId,
    } as FilterQuery<any>);
    return userRoles.map((item: any) => item.userId);
  }

  /**
   * 根据 ID 列表查找用户
   *
   * @param {string[]} ids - 用户 ID 列表
   * @returns {Promise<UserProperties[]>} 用户属性列表
   */
  async findUsersByIds(ids: string[]): Promise<UserProperties[]> {
    const users = await this.em.find('SysUser', {
      id: { $in: ids },
    } as FilterQuery<any>);
    return users as UserProperties[];
  }

  /**
   * 根据标识符查找用户（用户名、邮箱或手机号）
   *
   * @param {string} identifier - 用户标识符（用户名、邮箱或手机号）
   * @returns {Promise<UserProperties | null>} 用户属性或 null
   */
  async findUserByIdentifier(
    identifier: string,
  ): Promise<UserProperties | null> {
    const user = await this.em.findOne('SysUser', {
      $or: [
        { username: identifier },
        { email: identifier },
        { phoneNumber: identifier },
      ],
    } as FilterQuery<any>);
    return user as UserProperties | null;
  }

  /**
   * 分页查询用户
   *
   * @param {PageUsersQuery} query - 分页查询参数
   * @returns {Promise<PaginationResult<UserProperties>>} 分页结果
   */
  async pageUsers(
    query: PageUsersQuery,
  ): Promise<PaginationResult<UserProperties>> {
    const where: FilterQuery<any> = {};

    if (query.username) {
      where.username = { $like: `%${query.username}%` };
    }

    if (query.nickName) {
      where.nickName = { $like: `%${query.nickName}%` };
    }

    if (query.status) {
      where.status = query.status;
    }

    const [users, total] = await this.em.findAndCount('SysUser', where, {
      limit: query.size,
      offset: (query.current - 1) * query.size,
      fields: [
        'id',
        'username',
        'domain',
        'avatar',
        'email',
        'phoneNumber',
        'nickName',
        'status',
        'createdAt',
        'createdBy',
        'updatedAt',
        'updatedBy',
      ],
    });

    return new PaginationResult<UserProperties>(
      query.current,
      query.size,
      total,
      users as unknown as UserProperties[],
    );
  }

  /**
   * 根据用户名查找用户
   *
   * @param {string} username - 用户名
   * @returns {Promise<Readonly<UserProperties> | null>} 用户属性或 null
   */
  async getUserByUsername(
    username: string,
  ): Promise<Readonly<UserProperties> | null> {
    const user = await this.em.findOne('SysUser', {
      username,
    } as FilterQuery<any>);
    return user as Readonly<UserProperties> | null;
  }

  /**
   * 根据用户 ID 查找角色代码集合
   *
   * @param {string} userId - 用户 ID
   * @returns {Promise<Set<string>>} 角色代码集合
   */
  async findRolesByUserId(userId: string): Promise<Set<string>> {
    const userRoles = await this.em.find('SysUserRole', {
      userId,
    } as FilterQuery<any>);
    const roleIds = userRoles.map((userRole: any) => userRole.roleId);

    if (roleIds.length === 0) {
      return new Set<string>();
    }

    const roles = await this.em.find('SysRole', {
      id: { $in: roleIds },
    } as FilterQuery<any>);
    return new Set(roles.map((role: any) => role.code));
  }
}
