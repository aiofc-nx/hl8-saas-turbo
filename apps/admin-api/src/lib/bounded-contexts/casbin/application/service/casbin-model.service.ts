import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import * as casbin from 'casbin';

import { ModelConfigStatus } from '@/infra/entities/casbin-model-config.entity';

import {
  CasbinModelReadRepoPortToken,
  CasbinModelWriteRepoPortToken,
} from '../../constants';
import { CasbinModelConfigProperties } from '../../domain/casbin-model.model';
import type {
  CasbinModelReadRepoPort,
  CasbinModelWriteRepoPort,
} from '../../ports/casbin-model.repo-port';

/**
 * Casbin 模型配置服务
 *
 * @description
 * 提供 Casbin 模型配置的业务逻辑，包括版本管理、内容校验、发布和回滚。
 */
@Injectable()
export class CasbinModelService {
  /**
   * 构造函数
   *
   * @param readRepo - 模型配置读取仓储
   * @param writeRepo - 模型配置写入仓储
   */
  constructor(
    @Inject(CasbinModelReadRepoPortToken)
    private readonly readRepo: CasbinModelReadRepoPort,
    @Inject(CasbinModelWriteRepoPortToken)
    private readonly writeRepo: CasbinModelWriteRepoPort,
  ) {}

  /**
   * 校验模型配置内容
   *
   * @description
   * 使用 Casbin 官方 API 尝试解析模型配置内容，如果解析失败则抛出异常。
   * 同时检查必备段落，确保模型配置的完整性。
   *
   * @param content - 模型配置内容
   * @throws {BadRequestException} 当模型配置内容无效时抛出异常
   */
  async validateModelContent(content: string): Promise<void> {
    // 检查必备段落
    const requiredSections = [
      '[request_definition]',
      '[policy_definition]',
      '[matchers]',
    ];

    for (const section of requiredSections) {
      if (!content.includes(section)) {
        throw new BadRequestException(`模型配置缺少必备段落: ${section}`);
      }
    }

    // 尝试使用 Casbin 解析模型配置
    try {
      casbin.newModelFromString(content);
    } catch (error) {
      throw new BadRequestException(
        `模型配置内容无效: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * 创建模型配置草稿
   *
   * @description
   * 创建新的模型配置草稿版本。会先校验模型配置内容，然后保存为草稿状态。
   *
   * @param content - 模型配置内容
   * @param remark - 备注说明
   * @param createdBy - 创建者用户 ID
   * @returns 返回创建后的模型配置
   */
  async createDraft(
    content: string,
    remark: string | undefined,
    createdBy: string,
  ): Promise<CasbinModelConfigProperties> {
    // 校验模型配置内容
    await this.validateModelContent(content);

    // 获取下一个版本号
    const version = await this.readRepo.getNextVersion();

    // 创建草稿
    return await this.writeRepo.createModelConfig({
      content,
      version,
      status: ModelConfigStatus.DRAFT,
      remark,
      createdBy,
      createdAt: new Date(),
    });
  }

  /**
   * 更新模型配置草稿
   *
   * @description
   * 更新已存在的模型配置草稿。会先校验模型配置内容，然后更新草稿。
   *
   * @param id - 草稿版本 ID
   * @param content - 模型配置内容
   * @param remark - 备注说明
   * @returns 返回更新后的模型配置
   */
  async updateDraft(
    id: number,
    content: string,
    remark: string | undefined,
  ): Promise<CasbinModelConfigProperties> {
    // 检查草稿是否存在
    const draft = await this.readRepo.getModelConfigById(id);
    if (!draft) {
      throw new BadRequestException(`草稿版本 ${id} 不存在`);
    }

    if (draft.status !== ModelConfigStatus.DRAFT) {
      throw new BadRequestException(`版本 ${id} 不是草稿状态，无法更新`);
    }

    // 校验模型配置内容
    await this.validateModelContent(content);

    // 更新草稿
    return await this.writeRepo.updateModelConfig(id, {
      content,
      remark,
    });
  }

  /**
   * 发布模型配置版本
   *
   * @description
   * 将指定版本设置为激活状态，同时将其他激活版本归档。
   * 发布后需要重新加载 Enforcer。
   *
   * @param id - 要发布的版本 ID
   * @param approvedBy - 审批者用户 ID
   * @returns 返回是否成功
   */
  async publishVersion(id: number, approvedBy: string): Promise<boolean> {
    // 检查版本是否存在
    const version = await this.readRepo.getModelConfigById(id);
    if (!version) {
      throw new BadRequestException(`版本 ${id} 不存在`);
    }

    // 如果是草稿，需要先校验内容
    if (version.status === ModelConfigStatus.DRAFT) {
      await this.validateModelContent(version.content);
    }

    // 设置为激活状态
    const success = await this.writeRepo.setActiveVersion(id);

    if (success) {
      // 更新审批信息
      await this.writeRepo.updateModelConfig(id, {
        approvedBy,
        approvedAt: new Date(),
      });
    }

    return success;
  }

  /**
   * 回滚到历史版本
   *
   * @description
   * 将指定的历史版本重新设置为激活状态，同时将当前激活版本归档。
   * 回滚后需要重新加载 Enforcer。
   *
   * @param id - 要回滚到的版本 ID
   * @param approvedBy - 操作者用户 ID
   * @returns 返回是否成功
   */
  async rollbackVersion(id: number, approvedBy: string): Promise<boolean> {
    // 检查版本是否存在
    const version = await this.readRepo.getModelConfigById(id);
    if (!version) {
      throw new BadRequestException(`版本 ${id} 不存在`);
    }

    // 设置为激活状态
    const success = await this.writeRepo.setActiveVersion(id);

    if (success) {
      // 更新审批信息
      await this.writeRepo.updateModelConfig(id, {
        approvedBy,
        approvedAt: new Date(),
      });
    }

    return success;
  }

  /**
   * 获取当前激活的模型配置内容
   *
   * @description
   * 获取当前激活版本的模型配置内容。如果数据库中没有激活版本，返回 null。
   *
   * @returns 返回激活版本的模型配置内容，如果不存在则返回 null
   */
  async getActiveModelContent(): Promise<string | null> {
    const activeConfig = await this.readRepo.getActiveModelConfig();
    return activeConfig?.content || null;
  }
}
