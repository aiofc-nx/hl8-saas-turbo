import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { PaginationResult } from '@hl8/rest';

import { MenuReadRepoPortToken } from '../../constants';
import type { MenuProperties } from '../../domain/menu.read.model';
import type { MenuReadRepoPort } from '../../ports/menu.read.repo-port';
import { PageMenusQuery } from '../../queries/page-menus.query';

/**
 * 菜单分页查询处理器
 *
 * @description
 * 处理菜单分页查询命令，从仓储中获取分页的菜单数据。
 *
 * @implements {IQueryHandler<PageMenusQuery, PaginationResult<MenuProperties>>}
 */
@QueryHandler(PageMenusQuery)
export class PageMenusQueryHandler
  implements IQueryHandler<PageMenusQuery, PaginationResult<MenuProperties>>
{
  /**
   * 菜单读取仓储
   * 通过依赖注入获取，用于查询菜单数据
   */
  @Inject(MenuReadRepoPortToken)
  private readonly repository: MenuReadRepoPort;

  /**
   * 执行分页查询
   *
   * @param query - 分页查询对象
   * @returns 返回分页结果，包含菜单列表和分页信息
   */
  async execute(
    query: PageMenusQuery,
  ): Promise<PaginationResult<MenuProperties>> {
    return this.repository.pageMenus(query);
  }
}
