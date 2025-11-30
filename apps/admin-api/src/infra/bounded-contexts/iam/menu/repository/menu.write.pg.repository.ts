import { EntityManager } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';

import { Menu } from '@/lib/bounded-contexts/iam/menu/domain/menu.model';
import type { MenuWriteRepoPort } from '@/lib/bounded-contexts/iam/menu/ports/menu.write.repo-port';

/**
 * Menu 写入仓储实现
 *
 * @description 使用 MikroORM EntityManager 实现 Menu 数据的写入操作
 */
@Injectable()
export class MenuWritePostgresRepository implements MenuWriteRepoPort {
  constructor(private readonly em: EntityManager) {}

  /**
   * 根据 ID 删除 Menu
   *
   * @param id - Menu ID
   * @returns Promise<void>
   */
  async deleteById(id: number): Promise<void> {
    await this.em.nativeDelete('SysMenu', { id });
  }

  /**
   * 保存 Menu
   *
   * @param menu - Menu 聚合根
   * @returns Promise<void>
   */
  async save(menu: Menu): Promise<void> {
    const { id, ...menuData } = menu; // 移除 id，让数据库自动生成
    const newMenu = this.em.create('SysMenu', menuData);
    await this.em.persistAndFlush(newMenu);
  }

  /**
   * 更新 Menu
   *
   * @param menu - Menu 聚合根
   * @returns Promise<void>
   */
  async update(menu: Menu): Promise<void> {
    await this.em.nativeUpdate('SysMenu', { id: menu.id }, { ...menu });
  }
}
