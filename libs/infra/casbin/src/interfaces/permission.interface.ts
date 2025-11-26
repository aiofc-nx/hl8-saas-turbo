import { AuthActionVerb } from '../casbin';

/**
 * 权限接口
 *
 * @description 定义权限的数据结构，包含资源（resource）和动作（action）
 *
 * @property resource - 资源名称，表示要访问的资源
 * @property action - 动作类型，可以是 AuthActionVerb 枚举值或自定义字符串
 */
export interface Permission {
  /** 资源名称 */
  resource: string;
  /** 动作类型 */
  action: AuthActionVerb | string;
}
