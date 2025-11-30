/**
 * 状态枚举
 *
 * @description 定义系统中实体的通用状态值，用于表示启用/禁用等状态
 *
 * @enum {string}
 */
export enum Status {
  /**
   * 启用状态
   *
   * @description 实体处于启用状态，可以正常使用
   */
  ENABLED = 'ENABLED',

  /**
   * 禁用状态
   *
   * @description 实体处于禁用状态，不可使用
   */
  DISABLED = 'DISABLED',
}

/**
 * 菜单类型枚举
 *
 * @description 定义菜单的类型，用于区分菜单、目录和按钮权限
 *
 * @enum {string}
 */
export enum MenuType {
  /**
   * 菜单类型
   *
   * @description 可点击的菜单项，通常对应一个路由页面
   */
  MENU = 'MENU',

  /**
   * 目录类型
   *
   * @description 目录节点，用于组织菜单结构，本身不可点击
   */
  DIRECTORY = 'DIRECTORY',

  /**
   * 按钮类型
   *
   * @description 按钮权限，用于控制页面内的操作按钮权限
   */
  BUTTON = 'BUTTON',
}
