/**
 * 认证信息接口
 * 
 * @description 定义用户认证信息的数据结构
 * 
 * @property uid - 用户唯一标识
 * @property username - 用户名
 * @property domain - 用户所属域
 */
export interface IAuthentication {
  /** 用户唯一标识 */
  uid: string;
  /** 用户名 */
  username: string;
  /** 用户所属域 */
  domain: string;
}

/**
 * API 响应接口
 * 
 * @description 定义标准化的 API 响应格式
 * 
 * @template T - 响应数据类型
 * 
 * @property code - 响应状态码
 * @property message - 响应消息
 * @property error - 错误信息（可选）
 * @property data - 响应数据（可选）
 */
export interface ApiResponse<T = any> {
  /** 响应状态码 */
  code: number;
  /** 响应消息 */
  message: string;
  // timestamp: string;
  // requestId: string;
  // path: string;
  /** 错误信息 */
  error?: {
    /** 错误码 */
    code: number;
    /** 错误消息 */
    message: string;
  };
  /** 响应数据 */
  data?: T;
}

/**
 * 创建审计信息属性类型
 * 
 * @description 定义创建记录时的审计信息
 * 
 * @property createdAt - 创建时间
 * @property createdBy - 创建者
 */
export type CreationAuditInfoProperties = Readonly<{
  /** 创建时间 */
  createdAt: Date;
  /** 创建者 */
  createdBy: string;
}>;

/**
 * 更新审计信息属性类型
 * 
 * @description 定义更新记录时的审计信息
 * 
 * @property updatedAt - 更新时间（可为空）
 * @property updatedBy - 更新者（可为空）
 */
export type UpdateAuditInfoProperties = Readonly<{
  /** 更新时间 */
  updatedAt: Date | null;
  /** 更新者 */
  updatedBy: string | null;
}>;
