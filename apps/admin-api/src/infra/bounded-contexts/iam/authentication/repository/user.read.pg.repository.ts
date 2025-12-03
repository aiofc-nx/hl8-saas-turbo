import { EntityManager, FilterQuery } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';

import type { UserProperties } from '@/lib/bounded-contexts/iam/authentication/domain/user.read.model';
import type { UserReadRepoPort } from '@/lib/bounded-contexts/iam/authentication/ports/user.read.repo-port';
import { PageUsersQuery } from '@/lib/bounded-contexts/iam/authentication/queries/page-users.query';

import { PaginationResult } from '@hl8/rest';

/**
 * 用户读取仓储实现
 *
 * @description
 * 使用 MikroORM EntityManager 实现用户数据的读取操作。
 * 该实现遵循端口适配器模式，实现了 UserReadRepoPort 接口。
 *
 * @implements {UserReadRepoPort}
 */
@Injectable()
export class UserReadRepository implements UserReadRepoPort {
  /**
   * 构造函数
   *
   * @param em - MikroORM 实体管理器，用于数据库操作
   */
  constructor(private readonly em: EntityManager) {}

  /**
   * 根据 ID 查找用户
   *
   * @description 从数据库中查询指定 ID 的用户信息
   *
   * @param id - 用户的唯一标识符
   * @returns 返回用户属性对象，如果不存在则返回 null
   */
  async findUserById(id: string): Promise<UserProperties | null> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const user = await this.em.findOne('SysUser', { id } as FilterQuery<any>);
    return user as UserProperties | null;
  }

  /**
   * 根据角色 ID 查找用户 ID 列表
   *
   * @description 查询拥有指定角色的所有用户 ID 列表
   *
   * @param roleId - 角色的唯一标识符
   * @returns 返回拥有该角色的用户 ID 数组
   */
  async findUserIdsByRoleId(roleId: string): Promise<string[]> {
    const userRoles = await this.em.find('SysUserRole', {
      roleId,
    } as FilterQuery<any>);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return userRoles.map((item: any) => item.userId);
  }

  /**
   * 根据 ID 列表查找用户
   *
   * @description 批量查询指定 ID 列表的用户信息
   *
   * @param ids - 用户 ID 数组
   * @returns 返回用户属性数组，如果某些 ID 不存在则不会包含在结果中
   */
  async findUsersByIds(ids: string[]): Promise<UserProperties[]> {
    const users = await this.em.find('SysUser', {
      id: { $in: ids },
    } as FilterQuery<any>);
    return users as UserProperties[];
  }

  /**
   * 根据标识符查找用户
   *
   * @description
   * 根据用户名、邮箱或手机号查找用户。支持使用多种标识符进行登录。
   *
   * @param identifier - 用户标识符，可以是用户名、邮箱或手机号
   * @returns 返回用户属性对象，如果不存在则返回 null
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
   * @description
   * 根据查询条件分页查询用户列表，支持按用户名、昵称和状态筛选。
   *
   * @param query - 分页查询参数，包含页码、页大小、用户名、昵称、状态等筛选条件
   * @returns 返回分页结果，包含用户列表和分页信息
   */
  async pageUsers(
    query: PageUsersQuery,
  ): Promise<PaginationResult<UserProperties>> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
   * @description 从数据库中查询指定用户名的用户信息
   *
   * @param username - 用户的登录名
   * @returns 返回用户属性对象，如果不存在则返回 null
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
   * @description
   * 查询指定用户拥有的所有角色代码。通过用户角色关联表查询，
   * 然后获取对应的角色信息，返回角色代码集合。
   *
   * @param userId - 用户的唯一标识符
   * @returns 返回用户拥有的角色代码集合，如果用户没有角色则返回空集合
   */
  async findRolesByUserId(userId: string): Promise<Set<string>> {
    const userRoles = await this.em.find('SysUserRole', {
      userId,
    } as FilterQuery<any>);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const roleIds = userRoles.map((userRole: any) => userRole.roleId);

    if (roleIds.length === 0) {
      return new Set<string>();
    }

    const roles = await this.em.find('SysRole', {
      id: { $in: roleIds },
    } as FilterQuery<any>);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return new Set(roles.map((role: any) => role.code));
  }
}
