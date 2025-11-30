import { EntityManager } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';

import { Role } from '@/lib/bounded-contexts/iam/role/domain/role.model';
import type { RoleWriteRepoPort } from '@/lib/bounded-contexts/iam/role/ports/role.write.repo-port';

/**
 * Role 写入仓储实现
 *
 * @description 使用 MikroORM EntityManager 实现 Role 数据的写入操作
 */
@Injectable()
export class RoleWritePostgresRepository implements RoleWriteRepoPort {
  constructor(private readonly em: EntityManager) {}

  /**
   * 根据角色 ID 删除角色菜单关联
   *
   * @param roleId - 角色 ID
   * @returns Promise<void>
   */
  async deleteRoleMenuByRoleId(roleId: string): Promise<void> {
    await this.em.nativeDelete('SysRoleMenu', { roleId });
  }

  /**
   * 根据域名删除角色菜单关联
   *
   * @param domain - 域名
   * @returns Promise<void>
   */
  async deleteRoleMenuByDomain(domain: string): Promise<void> {
    await this.em.nativeDelete('SysRoleMenu', { domain });
  }

  /**
   * 根据 ID 删除角色
   *
   * @param id - 角色 ID
   * @returns Promise<void>
   */
  async deleteById(id: string): Promise<void> {
    await this.em.nativeDelete('SysRole', { id });
  }

  /**
   * 保存角色
   *
   * @param role - 角色聚合根
   * @returns Promise<void>
   */
  async save(role: Role): Promise<void> {
    const roleData = { ...role };
    const newRole = this.em.create('SysRole', roleData);
    await this.em.persistAndFlush(newRole);
  }

  /**
   * 更新角色
   *
   * @param role - 角色聚合根
   * @returns Promise<void>
   */
  async update(role: Role): Promise<void> {
    await this.em.nativeUpdate('SysRole', { id: role.id }, { ...role });
  }
}
