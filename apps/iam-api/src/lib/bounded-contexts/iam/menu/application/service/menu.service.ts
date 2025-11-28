import { Inject, Injectable } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';

import { MenuReadRepoPortToken } from '../../constants';
import type { MenuReadRepoPort } from '../../ports/menu.read.repo-port';

import { buildTree } from '@hl8/utils';

import type { MenuProperties } from '../../domain/menu.read.model';
import { MenusByRoleCodeAndDomainQuery } from '../../queries/menus.by-role_code&domain.query';
import { MenuRoute, UserRoute } from '../dto/route.dto';

@Injectable()
export class MenuService {
  constructor(
    private readonly queryBus: QueryBus,
    @Inject(MenuReadRepoPortToken)
    private readonly repository: MenuReadRepoPort,
  ) {}

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
