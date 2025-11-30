import { AccessKey } from '../domain/access_key.model';

/**
 * 访问密钥写入仓储端口
 *
 * @description
 * 定义访问密钥的写入操作接口，遵循端口适配器模式。
 * 该接口由基础设施层实现，用于持久化访问密钥数据。
 *
 * @interface AccessKeyWriteRepoPort
 */
export interface AccessKeyWriteRepoPort {
  /**
   * 根据 ID 删除访问密钥
   *
   * @description 从数据库中删除指定 ID 的访问密钥
   *
   * @param id - 要删除的访问密钥的唯一标识符
   * @returns Promise<void>
   *
   * @throws {Error} 当删除失败时抛出异常
   */
  deleteById(id: string): Promise<void>;

  /**
   * 保存访问密钥
   *
   * @description 保存或更新访问密钥到数据库
   *
   * @param accessKey - 要保存的访问密钥聚合根
   * @returns Promise<void>
   *
   * @throws {Error} 当保存失败时抛出异常
   */
  save(accessKey: AccessKey): Promise<void>;
}
