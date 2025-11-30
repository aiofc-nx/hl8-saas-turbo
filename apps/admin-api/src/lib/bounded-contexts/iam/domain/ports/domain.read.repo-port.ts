import { PaginationResult } from '@hl8/rest';

import type { DomainProperties } from '../domain/domain.read.model';
import { PageDomainsQuery } from '../queries/page-domains.query';

/**
 * 域读取仓储端口
 *
 * @description
 * 定义域的读取操作接口，遵循端口适配器模式。
 * 该接口由基础设施层实现，用于查询域数据。
 *
 * @interface DomainReadRepoPort
 */
export interface DomainReadRepoPort {
  /**
   * 根据 ID 获取域
   *
   * @description 从数据库中查询指定 ID 的域信息
   *
   * @param id - 域的唯一标识符
   * @returns 返回域属性对象，如果不存在则返回 null
   */
  getDomainById(id: string): Promise<Readonly<DomainProperties> | null>;

  /**
   * 分页查询域
   *
   * @description 根据查询条件分页查询域列表，支持按名称和状态筛选
   *
   * @param query - 分页查询对象，包含分页参数、名称和状态筛选条件
   * @returns 返回分页结果，包含域列表和分页信息
   */
  pageDomains(
    query: PageDomainsQuery,
  ): Promise<PaginationResult<DomainProperties>>;

  /**
   * 根据代码获取域
   *
   * @description 从数据库中查询指定代码的域信息。域代码是域的唯一标识符。
   *
   * @param code - 域的唯一代码
   * @returns 返回域属性对象，如果不存在则返回 null
   */
  getDomainByCode(code: string): Promise<Readonly<DomainProperties> | null>;
}
