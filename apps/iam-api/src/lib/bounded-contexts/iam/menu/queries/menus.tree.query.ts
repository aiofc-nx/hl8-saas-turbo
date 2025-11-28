import { IQuery } from '@nestjs/cqrs';

/**
 * 菜单树查询
 *
 * @description
 * CQRS 查询对象，用于查询菜单的树形结构。
 * 支持筛选常量路由或普通路由，返回按父子关系组织的树形结构。
 *
 * @implements {IQuery}
 */
export class MenusTreeQuery implements IQuery {
  /**
   * 构造函数
   *
   * @param constant - 是否只查询常量路由，默认为 false（查询所有路由）
   */
  constructor(readonly constant: boolean = false) {}
}
