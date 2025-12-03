import { EntityManager, FilterQuery } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';

import {
  CasbinModelConfig,
  ModelConfigStatus,
} from '@/infra/entities/casbin-model-config.entity';

import { PaginationResult } from '@hl8/rest';

import { CasbinModelConfigProperties } from '@/lib/bounded-contexts/casbin/domain/casbin-model.model';
import type {
  CasbinModelReadRepoPort,
  CasbinModelWriteRepoPort,
} from '@/lib/bounded-contexts/casbin/ports/casbin-model.repo-port';
import { PageModelVersionsQuery } from '@/lib/bounded-contexts/casbin/queries/page-model-versions.query';

/**
 * Casbin 模型配置读取仓储实现
 *
 * @description 使用 MikroORM EntityManager 实现 Casbin 模型配置数据的读取操作
 */
@Injectable()
export class CasbinModelReadPostgresRepository
  implements CasbinModelReadRepoPort
{
  constructor(private readonly em: EntityManager) {}

  /**
   * 分页查询模型配置版本列表
   *
   * @param query - 分页查询参数
   * @returns 分页结果
   */
  async pageModelVersions(
    query: PageModelVersionsQuery,
  ): Promise<PaginationResult<CasbinModelConfigProperties>> {
    const where: FilterQuery<CasbinModelConfig> = {};

    if (query.status) {
      where.status = query.status;
    }

    const [configs, total] = await this.em.findAndCount(
      CasbinModelConfig,
      where,
      {
        limit: query.size,
        offset: (query.current - 1) * query.size,
        orderBy: [{ version: 'DESC' }],
      },
    );

    const properties: CasbinModelConfigProperties[] = configs.map((config) => ({
      id: config.id,
      content: config.content,
      version: config.version,
      status: config.status,
      remark: config.remark,
      createdBy: config.createdBy,
      createdAt: config.createdAt,
      approvedBy: config.approvedBy,
      approvedAt: config.approvedAt,
    }));

    return new PaginationResult<CasbinModelConfigProperties>(
      query.current,
      query.size,
      total,
      properties,
    );
  }

  /**
   * 获取当前激活的模型配置
   *
   * @returns 激活的模型配置或 null
   */
  async getActiveModelConfig(): Promise<CasbinModelConfigProperties | null> {
    const config = await this.em.findOne(CasbinModelConfig, {
      status: ModelConfigStatus.ACTIVE,
    });

    if (!config) {
      return null;
    }

    return {
      id: config.id,
      content: config.content,
      version: config.version,
      status: config.status,
      remark: config.remark,
      createdBy: config.createdBy,
      createdAt: config.createdAt,
      approvedBy: config.approvedBy,
      approvedAt: config.approvedAt,
    };
  }

  /**
   * 根据 ID 获取模型配置
   *
   * @param id - 模型配置 ID
   * @returns 模型配置属性或 null
   */
  async getModelConfigById(
    id: number,
  ): Promise<CasbinModelConfigProperties | null> {
    const config = await this.em.findOne(CasbinModelConfig, { id });

    if (!config) {
      return null;
    }

    return {
      id: config.id,
      content: config.content,
      version: config.version,
      status: config.status,
      remark: config.remark,
      createdBy: config.createdBy,
      createdAt: config.createdAt,
      approvedBy: config.approvedBy,
      approvedAt: config.approvedAt,
    };
  }

  /**
   * 获取下一个版本号
   *
   * @returns 下一个版本号
   */
  async getNextVersion(): Promise<number> {
    const configs = await this.em.find(
      CasbinModelConfig,
      {},
      {
        orderBy: { version: 'DESC' },
        limit: 1,
      },
    );

    const maxVersion = configs.length > 0 ? configs[0].version : 0;
    return maxVersion + 1;
  }
}

/**
 * Casbin 模型配置写入仓储实现
 *
 * @description 使用 MikroORM EntityManager 实现 Casbin 模型配置数据的写入操作
 */
@Injectable()
export class CasbinModelWritePostgresRepository
  implements CasbinModelWriteRepoPort
{
  constructor(private readonly em: EntityManager) {}

  /**
   * 创建模型配置
   *
   * @param config - 模型配置属性
   * @returns 创建后的模型配置属性
   */
  async createModelConfig(
    config: Omit<CasbinModelConfigProperties, 'id'>,
  ): Promise<CasbinModelConfigProperties> {
    const modelConfig = this.em.create(CasbinModelConfig, {
      content: config.content,
      version: config.version,
      status: config.status,
      remark: config.remark,
      createdBy: config.createdBy,
      createdAt: config.createdAt,
      approvedBy: config.approvedBy,
      approvedAt: config.approvedAt,
    });

    await this.em.persistAndFlush(modelConfig);

    return {
      id: modelConfig.id,
      content: modelConfig.content,
      version: modelConfig.version,
      status: modelConfig.status,
      remark: modelConfig.remark,
      createdBy: modelConfig.createdBy,
      createdAt: modelConfig.createdAt,
      approvedBy: modelConfig.approvedBy,
      approvedAt: modelConfig.approvedAt,
    };
  }

  /**
   * 更新模型配置
   *
   * @param id - 模型配置 ID
   * @param config - 要更新的字段
   * @returns 更新后的模型配置属性
   */
  async updateModelConfig(
    id: number,
    config: Partial<CasbinModelConfigProperties>,
  ): Promise<CasbinModelConfigProperties> {
    const modelConfig = await this.em.findOne(CasbinModelConfig, { id });
    if (!modelConfig) {
      throw new Error(`Model config with id ${id} not found`);
    }

    if (config.content !== undefined) {
      modelConfig.content = config.content;
    }
    if (config.status !== undefined) {
      modelConfig.status = config.status;
    }
    if (config.remark !== undefined) {
      modelConfig.remark = config.remark;
    }
    if (config.approvedBy !== undefined) {
      modelConfig.approvedBy = config.approvedBy;
    }
    if (config.approvedAt !== undefined) {
      modelConfig.approvedAt = config.approvedAt;
    }

    await this.em.flush();

    return {
      id: modelConfig.id,
      content: modelConfig.content,
      version: modelConfig.version,
      status: modelConfig.status,
      remark: modelConfig.remark,
      createdBy: modelConfig.createdBy,
      createdAt: modelConfig.createdAt,
      approvedBy: modelConfig.approvedBy,
      approvedAt: modelConfig.approvedAt,
    };
  }

  /**
   * 将指定版本设置为激活状态
   *
   * @param id - 要激活的模型配置 ID
   * @returns 是否成功
   */
  async setActiveVersion(id: number): Promise<boolean> {
    // 先将所有 active 版本设置为 archived
    await this.em.nativeUpdate(
      CasbinModelConfig,
      { status: ModelConfigStatus.ACTIVE },
      { status: ModelConfigStatus.ARCHIVED },
    );

    // 将指定版本设置为 active
    const result = await this.em.nativeUpdate(
      CasbinModelConfig,
      { id },
      {
        status: ModelConfigStatus.ACTIVE,
        approvedAt: new Date(),
      },
    );

    return result > 0;
  }
}
