import { EntityManager } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';

import { User } from '@/lib/bounded-contexts/iam/authentication/domain/user';
import type { UserWriteRepoPort } from '@/lib/bounded-contexts/iam/authentication/ports/user.write.repo-port';

/**
 * 用户写入仓储实现
 *
 * @description 使用 MikroORM EntityManager 实现用户数据的写入操作
 */
@Injectable()
export class UserWriteRepository implements UserWriteRepoPort {
  constructor(private readonly em: EntityManager) {}

  /**
   * 根据角色 ID 删除用户角色关联
   *
   * @param {string} roleId - 角色 ID
   * @returns {Promise<void>}
   */
  async deleteUserRoleByRoleId(roleId: string): Promise<void> {
    await this.em.nativeDelete('SysUserRole', { roleId });
  }

  /**
   * 根据域名删除用户角色关联
   *
   * @param {string} domain - 域名
   * @returns {Promise<void>}
   */
  async deleteUserRoleByDomain(domain: string): Promise<void> {
    await this.em.transactional(async (em) => {
      const users = await em.find('SysUser', { domain }, { fields: ['id'] });
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
   * @param {string} userId - 用户 ID
   * @returns {Promise<void>}
   */
  async deleteUserRoleByUserId(userId: string): Promise<void> {
    await this.em.nativeDelete('SysUserRole', { userId });
  }

  /**
   * 根据 ID 删除用户
   *
   * @param {string} id - 用户 ID
   * @returns {Promise<void>}
   */
  async deleteById(id: string): Promise<void> {
    await this.em.nativeDelete('SysUser', { id });
  }

  /**
   * 保存用户
   *
   * @param {User} user - 用户聚合根
   * @returns {Promise<void>}
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
   * @param {User} user - 用户聚合根
   * @returns {Promise<void>}
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
        updatedAt: user.createdAt,
        updatedBy: user.createdBy,
      },
    );
  }
}
