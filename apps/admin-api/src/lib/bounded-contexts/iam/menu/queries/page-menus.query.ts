import { IQuery } from '@nestjs/cqrs';
import { MenuType, Status } from '../../../../shared/enums/status.enum';

import { PaginationParams } from '@hl8/rest';

/**
 * 菜单分页查询
 *
 * @description
 * CQRS 查询对象，用于分页查询菜单列表。
 * 支持按菜单名称、路由名称、菜单类型和状态筛选，继承自 PaginationParams 提供分页功能。
 *
 * @extends {PaginationParams}
 * @implements {IQuery}
 */
export class PageMenusQuery extends PaginationParams implements IQuery {
  /**
   * 菜单名称
   *
   * @description 用于按菜单名称模糊查询菜单，可选
   */
  readonly menuName?: string;

  /**
   * 路由名称
   *
   * @description 用于按路由名称模糊查询菜单，可选
   */
  readonly routeName?: string;

  /**
   * 菜单类型
   *
   * @description 用于按菜单类型筛选菜单，可选值：MENU（菜单）、DIRECTORY（目录）、BUTTON（按钮），可选
   */
  readonly menuType?: MenuType;

  /**
   * 状态
   *
   * @description 用于按状态筛选菜单，可选值：ENABLED（启用）、DISABLED（禁用），可选
   */
  readonly status?: Status;

  /**
   * 构造函数
   *
   * @param options - 查询选项，包含分页参数、菜单名称、路由名称、菜单类型和状态筛选条件
   */
  constructor(options: PageMenusQuery) {
    super();
    Object.assign(this, options);
  }
}
