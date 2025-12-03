import { PaginationResult } from '@hl8/rest';

import { CasbinModelConfigProperties } from '../domain/casbin-model.model';
import { PageModelVersionsQuery } from '../queries/page-model-versions.query';

/**
 * Casbin 模型配置读取仓储端口
 *
 * @description
 * 定义 Casbin 模型配置的读取操作接口，遵循端口适配器模式。
 * 该接口由基础设施层实现，用于查询模型配置数据。
 *
 * @interface CasbinModelReadRepoPort
 */
export interface CasbinModelReadRepoPort {
  /**
   * 分页查询模型配置版本列表
   *
   * @description 根据查询条件分页查询模型配置版本列表
   *
   * @param query - 分页查询对象
   * @returns 返回分页结果，包含模型配置版本列表和分页信息
   */
  pageModelVersions(
    query: PageModelVersionsQuery,
  ): Promise<PaginationResult<CasbinModelConfigProperties>>;

  /**
   * 获取当前激活的模型配置
   *
   * @description 查询状态为 active 的模型配置
   *
   * @returns 返回激活的模型配置，如果不存在则返回 null
   */
  getActiveModelConfig(): Promise<CasbinModelConfigProperties | null>;

  /**
   * 根据 ID 获取模型配置
   *
   * @description 从数据库中查询指定 ID 的模型配置信息
   *
   * @param id - 模型配置的唯一标识符
   * @returns 返回模型配置属性对象，如果不存在则返回 null
   */
  getModelConfigById(id: number): Promise<CasbinModelConfigProperties | null>;

  /**
   * 获取下一个版本号
   *
   * @description 获取下一个可用的版本号（当前最大版本号 + 1）
   *
   * @returns 返回下一个版本号
   */
  getNextVersion(): Promise<number>;
}

/**
 * Casbin 模型配置写入仓储端口
 *
 * @description
 * 定义 Casbin 模型配置的写入操作接口，遵循端口适配器模式。
 * 该接口由基础设施层实现，用于创建、更新模型配置数据。
 *
 * @interface CasbinModelWriteRepoPort
 */
export interface CasbinModelWriteRepoPort {
  /**
   * 创建模型配置
   *
   * @description 在数据库中创建新的模型配置版本
   *
   * @param config - 模型配置属性对象
   * @returns 返回创建后的模型配置属性对象
   */
  createModelConfig(
    config: Omit<CasbinModelConfigProperties, 'id'>,
  ): Promise<CasbinModelConfigProperties>;

  /**
   * 更新模型配置
   *
   * @description 更新数据库中已存在的模型配置
   *
   * @param id - 模型配置 ID
   * @param config - 要更新的字段
   * @returns 返回更新后的模型配置属性对象
   */
  updateModelConfig(
    id: number,
    config: Partial<CasbinModelConfigProperties>,
  ): Promise<CasbinModelConfigProperties>;

  /**
   * 将指定版本设置为激活状态
   *
   * @description 将指定版本的状态设置为 active，并将其他 active 版本设置为 archived
   *
   * @param id - 要激活的模型配置 ID
   * @returns 返回是否成功
   */
  setActiveVersion(id: number): Promise<boolean>;
}
