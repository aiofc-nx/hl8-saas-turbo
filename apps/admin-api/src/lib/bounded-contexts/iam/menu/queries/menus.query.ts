import { IQuery } from '@nestjs/cqrs';

/**
 * 菜单查询
 *
 * @description
 * CQRS 查询对象，用于查询所有菜单列表。
 * 返回扁平化的菜单数组，不区分常量路由和普通路由。
 *
 * @implements {IQuery}
 */
export class MenusQuery implements IQuery {
  /**
   * 构造函数
   *
   * @description 创建菜单查询实例，无需参数
   */
  constructor() {}
}
