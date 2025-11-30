import { LoginLogEntity } from '../domain/login-log.entity';

/**
 * 登录日志写入仓储端口
 *
 * @description 定义登录日志的持久化写入操作接口，遵循端口适配器模式。
 * 该接口用于将登录日志实体保存到持久化存储中，实现类由基础设施层提供。
 *
 * @example
 * ```typescript
 * class LoginLogMikroOrmRepository implements LoginLogWriteRepoPort {
 *   async save(loginLog: LoginLogEntity): Promise<void> {
 *     // 实现保存逻辑
 *   }
 * }
 * ```
 */
export interface LoginLogWriteRepoPort {
  /**
   * 保存登录日志
   *
   * @description 将登录日志实体持久化到存储中。
   *
   * @param loginLog - 待保存的登录日志实体
   * @returns Promise<void> 保存操作完成后的Promise
   * @throws {Error} 当保存操作失败时抛出错误
   */
  save(loginLog: LoginLogEntity): Promise<void>;
}
