import { EntityManager, FilterQuery } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';

import { Status } from '@/lib/shared/enums/status.enum';

import {
  MenuProperties,
  MenuTreeProperties,
} from '@/lib/bounded-contexts/iam/menu/domain/menu.read.model';
import type { MenuReadRepoPort } from '@/lib/bounded-contexts/iam/menu/ports/menu.read.repo-port';

/**
 * Menu 读取仓储实现
 *
 * @description 使用 MikroORM EntityManager 实现 Menu 数据的读取操作
 */
@Injectable()
export class MenuReadPostgresRepository implements MenuReadRepoPort {
  constructor(private readonly em: EntityManager) {}

  /**
   * 获取子菜单数量
   *
   * @param id - 父菜单 ID
   * @returns 子菜单数量
   */
  async getChildrenMenuCount(id: number): Promise<number> {
    const count = await this.em.count('SysMenu', {
      pid: id,
    } as FilterQuery<any>);
    return count;
  }

  /**
   * 根据 ID 获取 Menu
   *
   * @param id - Menu ID
   * @returns Menu 属性或 null
   */
  async getMenuById(id: number): Promise<Readonly<MenuProperties> | null> {
    const menu = await this.em.findOne('SysMenu', { id } as FilterQuery<any>);
    return menu as Readonly<MenuProperties> | null;
  }

  /**
   * 根据角色代码查找菜单
   *
   * @param roleCode - 角色代码数组
   * @param domain - 域名
   * @returns Menu 属性列表
   */
  async findMenusByRoleCode(
    roleCode: string[],
    domain: string,
  ): Promise<Readonly<MenuProperties[]> | []> {
    const roles = await this.em.find(
      'SysRole',
      { code: { $in: roleCode } } as FilterQuery<any>,
      { fields: ['id'] },
    );

    const roleIds = roles.map((role: any) => role.id);

    if (roleIds.length === 0) {
      return [];
    }

    const roleMenus = await this.em.find(
      'SysRoleMenu',
      { roleId: { $in: roleIds }, domain } as FilterQuery<any>,
      { fields: ['menuId'] },
    );

    const menuIds = roleMenus.map((rm: any) => rm.menuId);

    if (menuIds.length > 0) {
      const menus = await this.em.find('SysMenu', {
        id: { $in: menuIds },
        status: Status.ENABLED,
      } as FilterQuery<any>);
      return menus as unknown as Readonly<MenuProperties[]>;
    }

    return [];
  }

  /**
   * 根据角色 ID 查找菜单
   *
   * @param roleId - 角色 ID
   * @param domain - 域名
   * @returns Menu 属性列表
   */
  async findMenusByRoleId(
    roleId: string,
    domain: string,
  ): Promise<Readonly<MenuProperties[]> | []> {
    const roleMenus = await this.em.find(
      'SysRoleMenu',
      { roleId, domain } as FilterQuery<any>,
      { fields: ['menuId'] },
    );

    const menuIds = roleMenus.map((rm: any) => rm.menuId);

    if (menuIds.length > 0) {
      const menus = await this.em.find('SysMenu', {
        id: { $in: menuIds },
        status: Status.ENABLED,
        constant: false,
      } as FilterQuery<any>);
      return menus as unknown as Readonly<MenuProperties[]>;
    }

    return [];
  }

  /**
   * 获取常量路由
   *
   * @returns Menu 属性列表
   */
  async getConstantRoutes(): Promise<Readonly<MenuProperties[]> | []> {
    const menus = await this.em.find('SysMenu', {
      constant: true,
      status: Status.ENABLED,
    } as FilterQuery<any>);
    return menus as unknown as Readonly<MenuProperties[]>;
  }

  /**
   * 查询所有菜单
   *
   * @returns Menu 树形属性列表
   */
  async findAll(): Promise<MenuTreeProperties[] | []> {
    const menus = await this.em.find('SysMenu', {} as FilterQuery<any>);
    return menus as MenuTreeProperties[];
  }

  /**
   * 查询所有常量菜单
   *
   * @param constant - 是否为常量
   * @returns Menu 树形属性列表
   */
  async findAllConstantMenu(
    constant: boolean,
  ): Promise<MenuTreeProperties[] | []> {
    const menus = await this.em.find('SysMenu', {
      constant,
    } as FilterQuery<any>);
    return menus as MenuTreeProperties[];
  }

  /**
   * 根据 ID 列表查找菜单
   *
   * @param ids - 菜单 ID 列表
   * @returns Menu 属性列表
   */
  async findMenusByIds(ids: number[]): Promise<MenuProperties[]> {
    const menus = await this.em.find('SysMenu', {
      id: { $in: ids },
    } as FilterQuery<any>);
    return menus as MenuProperties[];
  }

  /**
   * 根据用户 ID 查找菜单 ID 列表
   *
   * @param userId - 用户 ID
   * @param domain - 域名
   * @returns 菜单 ID 列表
   */
  async findMenuIdsByUserId(userId: string, domain: string): Promise<number[]> {
    const userRoles = await this.em.find(
      'SysUserRole',
      { userId } as FilterQuery<any>,
      { fields: ['roleId'] },
    );

    const roleIds = userRoles.map((ur: any) => ur.roleId);

    if (roleIds.length === 0) {
      return [];
    }

    const roleMenus = await this.em.find(
      'SysRoleMenu',
      { roleId: { $in: roleIds }, domain } as FilterQuery<any>,
      { fields: ['menuId'] },
    );

    return roleMenus.map((rm: any) => rm.menuId);
  }
}
