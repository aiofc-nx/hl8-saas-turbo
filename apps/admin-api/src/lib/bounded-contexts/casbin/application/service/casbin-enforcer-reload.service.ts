import { Inject, Injectable } from '@nestjs/common';
import * as casbin from 'casbin';

import { AUTHZ_ENFORCER } from '@hl8/casbin';
import type { Enforcer } from 'casbin';

import { CasbinModelService } from './casbin-model.service';

/**
 * Casbin Enforcer 重新加载服务
 *
 * @description
 * 统一管理 Casbin Enforcer 的重新加载，支持从数据库加载激活版本的模型配置。
 * 在模型配置变更后调用此服务重新加载 Enforcer。
 */
@Injectable()
export class CasbinEnforcerReloadService {
  /**
   * 构造函数
   *
   * @param enforcer - Casbin Enforcer 实例
   * @param modelService - 模型配置服务
   */
  constructor(
    @Inject(AUTHZ_ENFORCER)
    private readonly enforcer: Enforcer,
    private readonly modelService: CasbinModelService,
  ) {}

  /**
   * 重新加载 Enforcer
   *
   * @description
   * 从数据库获取激活版本的模型配置，重新加载到 Enforcer 中。
   * 如果数据库中没有激活版本，则保持当前模型不变。
   *
   * @returns 返回是否成功重新加载
   */
  async reloadEnforcer(): Promise<boolean> {
    try {
      // 获取激活版本的模型内容
      const activeContent = await this.modelService.getActiveModelContent();

      if (activeContent) {
        // 从字符串加载模型
        const model = casbin.newModelFromString(activeContent);

        // 设置新模型并重新加载策略
        this.enforcer.setModel(model);
        await this.enforcer.loadPolicy();

        return true;
      }

      // 如果没有激活版本，只重新加载策略（使用当前模型）
      await this.enforcer.loadPolicy();
      return true;
    } catch (error) {
      console.error('Failed to reload Enforcer:', error);
      return false;
    }
  }
}
