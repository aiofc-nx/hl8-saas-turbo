/**
 * 角色创建数据传输对象
 *
 * 用于接收创建角色时的请求数据，包含角色的基本信息。
 *
 * @remarks
 * - 用于 API 接口的请求参数验证
 * - 所有字段均为只读，确保数据不可变
 */
export class RoleCreateDto {
  /** 角色代码，唯一标识符 */
  readonly code: string;

  /** 角色名称，用于显示 */
  readonly name: string;

  /** 父角色 ID，用于构建角色层级关系 */
  readonly pid: string;

  /** 角色描述信息，可选 */
  readonly description?: string;
}
