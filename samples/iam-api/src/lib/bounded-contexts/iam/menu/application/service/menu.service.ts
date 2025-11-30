import { Inject, Injectable } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';

import { MenuReadRepoPortToken } from '../../constants';
import type { MenuReadRepoPort } from '../../ports/menu.read.repo-port';

import { buildTree } from '@hl8/utils';

import type { MenuProperties } from '../../domain/menu.read.model';
import { MenusByRoleCodeAndDomainQuery } from '../../queries/menus.by-role_code&domain.query';
import { MenuRoute, UserRoute } from '../dto/route.dto';

/**
 * 菜单服务
 *
 * @description
 * 提供菜单相关的业务逻辑，包括获取用户路由和常量路由。
 * 该服务用于前端菜单渲染和权限控制。
 */
@Injectable()
export class MenuService {
  /**
   * 构造函数
   *
   * @param queryBus - CQRS 查询总线，用于执行查询操作
   * @param repository - 菜单读取仓储端口，用于查询菜单数据
   */
  constructor(
    private readonly queryBus: QueryBus,
    @Inject(MenuReadRepoPortToken)
    private readonly repository: MenuReadRepoPort,
  ) {}

  /**
   * 获取用户路由
   *
   * @description
   * 根据用户角色和域获取该用户可访问的所有路由。
   * 返回的路由信息组织成树形结构，用于前端菜单渲染。
   *
   * @param roleCode - 用户拥有的角色代码数组
   * @param domain - 用户所属的域代码
   * @returns 返回用户路由信息，包含路由树和首页路径
   */
  async getUserRoutes(roleCode: string[], domain: string): Promise<UserRoute> {
    const userRoutes = await this.queryBus.execute<
      MenusByRoleCodeAndDomainQuery,
      Readonly<MenuProperties[]> | []
    >(new MenusByRoleCodeAndDomainQuery(roleCode, domain));
    if (userRoutes.length > 0) {
      const tree = buildTree([...userRoutes], 'pid', 'id', 'order');
      return {
        routes: tree as unknown as MenuRoute[],
        home: 'home',
      };
    }
    return { home: '', routes: [] };
  }

  /**
   * 获取常量路由
   *
   * @description
   * 获取系统中所有常量路由。常量路由是系统预定义的路由，
   * 不受权限控制，所有用户都可以访问。
   *
   * @returns 返回常量路由列表，包含路由名称、路径、组件和元数据信息
   */
  async getConstantRoutes(): Promise<MenuRoute[]> {
    const constantMenus = await this.repository.getConstantRoutes();

    return constantMenus.map((menu) => ({
      name: menu.menuName,
      path: menu.routePath,
      component: menu.component,
      meta: {
        title: menu.menuName,
        i18nKey: menu.i18nKey,
        constant: menu.constant,
        hideInMenu: menu.hideInMenu,

        keepAlive: menu.keepAlive,
        icon: menu.icon,
        order: menu.order,
        href: menu.href,
        activeMenu: menu.activeMenu,
        multiTab: menu.multiTab,
      },
    }));
  }
}
