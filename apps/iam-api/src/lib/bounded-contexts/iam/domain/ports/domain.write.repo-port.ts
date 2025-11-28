import { Domain } from '../domain/domain.model';

/**
 * 域写入仓储端口
 *
 * @description
 * 定义域的写入操作接口，遵循端口适配器模式。
 * 该接口由基础设施层实现，用于持久化域数据。
 *
 * @interface DomainWriteRepoPort
 */
export interface DomainWriteRepoPort {
  /**
   * 删除域
   *
   * @description 从数据库中删除指定的域记录
   *
   * @param domain - 要删除的域聚合根
   * @returns Promise<void>
   *
   * @throws {Error} 当删除操作失败时抛出异常
   */
  delete(domain: Domain): Promise<void>;

  /**
   * 保存域
   *
   * @description
   * 保存或创建域到数据库。如果是新记录则创建，如果是已存在的记录则更新。
   *
   * @param domain - 要保存的域聚合根
   * @returns Promise<void>
   *
   * @throws {Error} 当保存操作失败时抛出异常
   */
  save(domain: Domain): Promise<void>;

  /**
   * 更新域
   *
   * @description 更新数据库中已存在的域记录
   *
   * @param domain - 要更新的域聚合根
   * @returns Promise<void>
   *
   * @throws {Error} 当更新操作失败时抛出异常
   */
  update(domain: Domain): Promise<void>;
}
