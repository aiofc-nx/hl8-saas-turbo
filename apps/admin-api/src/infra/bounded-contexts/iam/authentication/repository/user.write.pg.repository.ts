import { EntityManager } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';

import { User } from '@/lib/bounded-contexts/iam/authentication/domain/user';
import type { UserWriteRepoPort } from '@/lib/bounded-contexts/iam/authentication/ports/user.write.repo-port';

/**
 * 用户写入仓储实现
 *
 * @description
 * 使用 MikroORM EntityManager 实现用户数据的写入操作。
 * 该实现遵循端口适配器模式，实现了 UserWriteRepoPort 接口。
 *
 * @implements {UserWriteRepoPort}
 */
@Injectable()
export class UserWriteRepository implements UserWriteRepoPort {
  /**
   * 构造函数
   *
   * @param em - MikroORM 实体管理器，用于数据库操作
   */
  constructor(private readonly em: EntityManager) {}

  /**
   * 根据角色 ID 删除用户角色关联
   *
   * @description 删除指定角色的所有用户角色关联记录
   *
   * @param roleId - 角色的唯一标识符
   * @returns Promise<void>
   */
  async deleteUserRoleByRoleId(roleId: string): Promise<void> {
    await this.em.nativeDelete('SysUserRole', { roleId });
  }

  /**
   * 根据域名删除用户和用户角色关联
   *
   * @description
   * 删除指定域下的所有用户及其用户角色关联记录。
   * 使用事务确保数据一致性。
   *
   * @param domain - 域代码
   * @returns Promise<void>
   */
  async deleteUserRoleByDomain(domain: string): Promise<void> {
    await this.em.transactional(async (em) => {
      const users = await em.find('SysUser', { domain }, { fields: ['id'] });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const userIds = users.map((user: any) => user.id);

      if (userIds.length === 0) {
        return;
      }

      await em.nativeDelete('SysUser', { id: { $in: userIds } });
      await em.nativeDelete('SysUserRole', { userId: { $in: userIds } });
    });
  }

  /**
   * 根据用户 ID 删除用户角色关联
   *
   * @description 删除指定用户的所有角色关联记录
   *
   * @param userId - 用户的唯一标识符
   * @returns Promise<void>
   */
  async deleteUserRoleByUserId(userId: string): Promise<void> {
    await this.em.nativeDelete('SysUserRole', { userId });
  }

  /**
   * 根据 ID 删除用户
   *
   * @description 从数据库中删除指定 ID 的用户记录
   *
   * @param id - 用户的唯一标识符
   * @returns Promise<void>
   *
   * @throws {Error} 当删除操作失败时抛出异常
   */
  async deleteById(id: string): Promise<void> {
    await this.em.nativeDelete('SysUser', { id });
  }

  /**
   * 保存用户
   *
   * @description
   * 保存或创建用户到数据库。如果是新记录则创建，如果是已存在的记录则更新。
   * 密码会从值对象中提取并加密存储。
   *
   * @param user - 要保存的用户聚合根
   * @returns Promise<void>
   *
   * @throws {Error} 当保存操作失败时抛出异常
   */
  async save(user: User): Promise<void> {
    const userData = {
      ...user,
      password: user.password.getValue(),
    };
    const newUser = this.em.create('SysUser', userData);
    await this.em.persistAndFlush(newUser);
  }

  /**
   * 更新用户
   *
   * @description
   * 更新数据库中已存在的用户记录。只更新允许修改的字段，
   * 不包括密码和域等敏感或不可变字段。
   *
   * @param user - 要更新的用户聚合根
   * @returns Promise<void>
   *
   * @throws {Error} 当更新操作失败时抛出异常
   */
  async update(user: User): Promise<void> {
    await this.em.nativeUpdate(
      'SysUser',
      { id: user.id },
      {
        nickName: user.nickName,
        status: user.status,
        avatar: user.avatar,
        email: user.email,
        phoneNumber: user.phoneNumber,
        isEmailVerified: user.isEmailVerified,
        updatedAt: user.createdAt,
        updatedBy: user.createdBy,
      },
    );
  }
}
