/**
 * 登录日志实体
 *
 * @description 表示用户登录事件的领域实体，包含登录相关的所有信息，如用户信息、IP地址、登录时间等。
 * 该实体用于记录和追踪用户的登录行为，支持安全审计和登录历史查询。
 *
 * @example
 * ```typescript
 * const loginLog = new LoginLogEntity(
 *   'user-123',
 *   'john.doe',
 *   'example.com',
 *   '192.168.1.1',
 *   '北京市',
 *   'Mozilla/5.0...',
 *   'req-456',
 *   'success',
 *   'user-123',
 *   8080
 * );
 * ```
 */
export class LoginLogEntity {
  /**
   * 创建登录日志实体
   *
   * @param userId - 用户ID，标识执行登录操作的用户
   * @param username - 用户名，用于登录的用户名
   * @param domain - 域名，登录发生的域名
   * @param ip - IP地址，登录请求的来源IP地址
   * @param address - 地址，IP地址对应的地理位置信息
   * @param userAgent - 用户代理，客户端浏览器的用户代理字符串
   * @param requestId - 请求ID，用于追踪本次登录请求的唯一标识
   * @param type - 登录类型，如 'success'、'failure' 等
   * @param createdBy - 创建者，记录创建该日志的用户ID
   * @param port - 端口号，登录请求使用的端口号，可选
   */
  constructor(
    public readonly userId: string,
    public readonly username: string,
    public readonly domain: string,
    public readonly ip: string,
    public readonly address: string,
    public readonly userAgent: string,
    public readonly requestId: string,
    public readonly type: string,
    public readonly createdBy: string,
    public readonly port?: number | null,
  ) {}
}
