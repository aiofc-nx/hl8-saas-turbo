/* eslint-disable @typescript-eslint/no-explicit-any */
import type { EntityManager } from '@mikro-orm/core';
import type { Adapter, Model } from 'casbin';
import { Helper } from 'casbin';

import { CasbinRule } from './casbin-rule.entity';

/**
 * MikroORM Casbin 适配器
 *
 * @description 使用 MikroORM 作为 Casbin 策略存储的适配器，实现 Casbin Adapter 接口
 *
 * @class MikroORMAdapter
 * @implements {Adapter}
 */
export class MikroORMAdapter implements Adapter {
  /** 是否启用过滤模式 */
  filtered = false;

  /** MikroORM EntityManager 实例（私有） */
  #em: EntityManager;

  /**
   * 构造函数
   *
   * @description 创建 MikroORM 适配器实例
   *
   * @param em - MikroORM EntityManager 实例
   */
  constructor(em: EntityManager) {
    this.#em = em;
  }

  /**
   * 创建新的适配器实例
   *
   * @description 静态工厂方法，创建并初始化 MikroORM 适配器
   *
   * @param em - MikroORM EntityManager 实例
   * @returns 返回已初始化的 MikroORMAdapter 实例
   */
  static newAdapter(em: EntityManager): MikroORMAdapter {
    return new MikroORMAdapter(em);
  }

  /**
   * 检查是否启用过滤模式
   *
   * @description 返回当前是否启用过滤模式
   *
   * @returns 返回 true 表示已启用过滤模式，false 表示未启用
   */
  public isFiltered(): boolean {
    return this.filtered;
  }

  /**
   * 启用或禁用过滤模式
   *
   * @description 设置是否启用过滤模式
   *
   * @param enabled - 是否启用过滤模式
   */
  public enableFiltered(enabled: boolean): void {
    this.filtered = enabled;
  }

  /**
   * 加载策略
   *
   * @description 从数据库加载所有策略规则到 Casbin 模型中
   *
   * @param model - Casbin 模型对象
   * @returns Promise<void> 加载成功时返回
   */
  async loadPolicy(model: Model): Promise<void> {
    const lines = await this.#em.find(CasbinRule, {});

    for (const line of lines) {
      this.#loadPolicyLine(line, model);
    }
  }

  /**
   * 加载过滤后的策略
   *
   * @description 从数据库加载匹配过滤条件的策略规则到 Casbin 模型中
   *
   * @param model - Casbin 模型对象
   * @param filter - 过滤条件对象，键为策略类型（如 'p'、'g'），值为策略模式数组
   * @returns Promise<void> 加载成功时返回
   *
   * @note 使用空字符串可以选择某个字段的所有值
   */
  async loadFilteredPolicy(
    model: Model,
    filter: { [key: string]: string[][] },
  ): Promise<void> {
    const whereConditions: any[] = [];

    Object.keys(filter).forEach((ptype) => {
      const policyPatterns = filter[ptype];
      policyPatterns.forEach((policyPattern) => {
        const condition: any = { ptype };
        if (policyPattern[0]) condition.v0 = policyPattern[0];
        if (policyPattern[1]) condition.v1 = policyPattern[1];
        if (policyPattern[2]) condition.v2 = policyPattern[2];
        if (policyPattern[3]) condition.v3 = policyPattern[3];
        if (policyPattern[4]) condition.v4 = policyPattern[4];
        if (policyPattern[5]) condition.v5 = policyPattern[5];
        whereConditions.push(condition);
      });
    });

    const lines = await this.#em.find(CasbinRule, {
      $or: whereConditions,
    });

    lines.forEach((line) => this.#loadPolicyLine(line, model));
    this.enableFiltered(true);
  }

  /**
   * 保存策略
   *
   * @description 将 Casbin 模型中的所有策略规则保存到数据库，先清空现有策略再保存
   *
   * @param model - Casbin 模型对象
   * @returns Promise<boolean> 保存成功时返回 true
   */
  async savePolicy(model: Model): Promise<boolean> {
    // 清空现有策略
    await this.#em.nativeDelete(CasbinRule, {});

    const savePolicyType = (ptype: string): void => {
      const astMap = model.model.get(ptype);
      if (astMap) {
        for (const [ptype, ast] of astMap) {
          for (const rule of ast.policy) {
            const line = this.#savePolicyLine(ptype, rule);
            const casbinRule = this.#em.create(CasbinRule, line);
            this.#em.persist(casbinRule);
          }
        }
      }
    };

    savePolicyType('p');
    savePolicyType('g');

    await this.#em.flush();

    return true;
  }

  /**
   * 添加策略
   *
   * @description 向数据库添加一条策略规则
   *
   * @param sec - 策略部分（通常为 'p' 或 'g'）
   * @param ptype - 策略类型
   * @param rule - 策略规则数组
   * @returns Promise<void> 添加成功时返回
   */
  async addPolicy(sec: string, ptype: string, rule: string[]): Promise<void> {
    const line = this.#savePolicyLine(ptype, rule);
    const casbinRule = this.#em.create(CasbinRule, line);
    this.#em.persist(casbinRule);
    await this.#em.flush();
  }

  /**
   * 批量添加策略
   *
   * @description 向数据库批量添加多条策略规则
   *
   * @param sec - 策略部分（通常为 'p' 或 'g'）
   * @param ptype - 策略类型
   * @param rules - 策略规则数组的数组
   * @returns Promise<void> 添加成功时返回
   */
  async addPolicies(
    sec: string,
    ptype: string,
    rules: string[][],
  ): Promise<void> {
    for (const rule of rules) {
      const line = this.#savePolicyLine(ptype, rule);
      const casbinRule = this.#em.create(CasbinRule, line);
      this.#em.persist(casbinRule);
    }

    await this.#em.flush();
  }

  /**
   * 删除策略
   *
   * @description 从数据库删除一条策略规则
   *
   * @param sec - 策略部分（通常为 'p' 或 'g'）
   * @param ptype - 策略类型
   * @param rule - 策略规则数组
   * @returns Promise<void> 删除成功时返回
   */
  async removePolicy(
    sec: string,
    ptype: string,
    rule: string[],
  ): Promise<void> {
    const line = this.#savePolicyLine(ptype, rule);
    await this.#em.nativeDelete(CasbinRule, line);
  }

  /**
   * 批量删除策略
   *
   * @description 从数据库批量删除多条策略规则
   *
   * @param sec - 策略部分（通常为 'p' 或 'g'）
   * @param ptype - 策略类型
   * @param rules - 策略规则数组的数组
   * @returns Promise<void> 删除成功时返回
   */
  async removePolicies(
    sec: string,
    ptype: string,
    rules: string[][],
  ): Promise<void> {
    for (const rule of rules) {
      const line = this.#savePolicyLine(ptype, rule);
      await this.#em.nativeDelete(CasbinRule, line);
    }
  }

  /**
   * 删除过滤后的策略
   *
   * @description 从数据库删除匹配过滤条件的策略规则
   *
   * @param sec - 策略部分（通常为 'p' 或 'g'）
   * @param ptype - 策略类型
   * @param fieldIndex - 字段索引，从该索引开始匹配
   * @param fieldValues - 字段值数组，用于匹配策略规则
   * @returns Promise<void> 删除成功时返回
   */
  async removeFilteredPolicy(
    sec: string,
    ptype: string,
    fieldIndex: number,
    ...fieldValues: string[]
  ): Promise<void> {
    const condition: any = { ptype };

    const idx = fieldIndex + fieldValues.length;
    if (fieldIndex <= 0 && 0 < idx) {
      condition.v0 = fieldValues[0 - fieldIndex];
    }
    if (fieldIndex <= 1 && 1 < idx) {
      condition.v1 = fieldValues[1 - fieldIndex];
    }
    if (fieldIndex <= 2 && 2 < idx) {
      condition.v2 = fieldValues[2 - fieldIndex];
    }
    if (fieldIndex <= 3 && 3 < idx) {
      condition.v3 = fieldValues[3 - fieldIndex];
    }
    if (fieldIndex <= 4 && 4 < idx) {
      condition.v4 = fieldValues[4 - fieldIndex];
    }
    if (fieldIndex <= 5 && 5 < idx) {
      condition.v5 = fieldValues[5 - fieldIndex];
    }

    await this.#em.nativeDelete(CasbinRule, condition);
  }

  /**
   * 关闭连接
   *
   * @description 断开与数据库的连接（MikroORM 通过 EntityManager 管理连接，通常不需要手动关闭）
   *
   * @returns Promise<void> 断开成功时返回
   */
  async close(): Promise<void> {
    // MikroORM 的连接由 EntityManager 管理，通常不需要手动关闭
    // 如果需要关闭，可以通过 em.getConnection().close() 实现
    return Promise.resolve();
  }

  /**
   * 加载策略行
   *
   * @description 将数据库中的策略规则行转换为 Casbin 模型格式
   *
   * @param line - CasbinRule 实体实例
   * @param model - Casbin 模型对象
   */
  readonly #loadPolicyLine = (line: CasbinRule, model: Model): void => {
    const result =
      line.ptype +
      ', ' +
      [line.v0, line.v1, line.v2, line.v3, line.v4, line.v5]
        .filter((n) => n)
        .join(', ');
    Helper.loadPolicyLine(result, model);
  };

  /**
   * 保存策略行
   *
   * @description 将 Casbin 策略规则转换为数据库实体格式
   *
   * @param ptype - 策略类型
   * @param rule - 策略规则数组
   * @returns 返回 CasbinRule 实体的数据对象
   */
  readonly #savePolicyLine = (
    ptype: string,
    rule: string[],
  ): Omit<Partial<CasbinRule>, 'ptype'> & { ptype: string } => {
    const line: Omit<Partial<CasbinRule>, 'ptype'> & { ptype: string } = {
      ptype,
    };

    if (rule.length > 0) {
      line.v0 = rule[0];
    }
    if (rule.length > 1) {
      line.v1 = rule[1];
    }
    if (rule.length > 2) {
      line.v2 = rule[2];
    }
    if (rule.length > 3) {
      line.v3 = rule[3];
    }
    if (rule.length > 4) {
      line.v4 = rule[4];
    }
    if (rule.length > 5) {
      line.v5 = rule[5];
    }

    return line;
  };
}
