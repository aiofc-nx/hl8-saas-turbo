import { PaginationResult } from '@hl8/rest';

import {
  AccessKeyProperties,
  AccessKeyReadModel,
} from '../domain/access_key.read.model';
import { PageAccessKeysQuery } from '../queries/page-access_key.query';

/**
 * 访问密钥读取仓储端口
 *
 * @description
 * 定义访问密钥的读取操作接口，遵循端口适配器模式。
 * 该接口由基础设施层实现，用于查询访问密钥数据。
 *
 * @interface AccessKeyReadRepoPort
 */
export interface AccessKeyReadRepoPort {
  /**
   * 根据 ID 获取访问密钥
   *
   * @description 从数据库中查询指定 ID 的访问密钥
   *
   * @param id - 访问密钥的唯一标识符
   * @returns 返回访问密钥属性对象，如果不存在则返回 null
   */
  getAccessKeyById(id: string): Promise<Readonly<AccessKeyProperties> | null>;

  /**
   * 分页查询访问密钥
   *
   * @description 根据查询条件分页查询访问密钥列表，支持按域和状态筛选
   *
   * @param query - 分页查询对象，包含分页参数、域和状态筛选条件
   * @returns 返回分页结果，包含访问密钥列表和分页信息
   */
  pageAccessKeys(
    query: PageAccessKeysQuery,
  ): Promise<PaginationResult<AccessKeyReadModel>>;

  /**
   * 查询所有访问密钥
   *
   * @description 查询所有访问密钥，返回完整的属性列表
   *
   * @returns 返回所有访问密钥的属性数组
   */
  findAll(): Promise<AccessKeyProperties[]>;
}
