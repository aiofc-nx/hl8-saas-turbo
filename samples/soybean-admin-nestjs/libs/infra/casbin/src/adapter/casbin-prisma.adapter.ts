import type { CasbinRule } from '@prisma/client';
import { Prisma, PrismaClient } from '@prisma/client';
import type { Adapter, Model } from 'casbin';
import { Helper } from 'casbin';

/**
 * Prisma Casbin 适配器
 * 
 * @description 使用 Prisma 作为 Casbin 策略存储的适配器，实现 Casbin Adapter 接口
 * 
 * @class PrismaAdapter
 * @implements {Adapter}
 */
export class PrismaAdapter implements Adapter {
  /** 是否启用过滤模式 */
  filtered = false;
  
  /** Prisma 客户端选项（私有） */
  #option?: Prisma.PrismaClientOptions;
  
  /** Prisma 客户端实例（私有） */
  #prisma: PrismaClient;

  /**
   * 构造函数
   * 
   * @description 创建 Prisma 适配器实例，可以传入 PrismaClientOptions 或 PrismaClient 实例
   * 
   * @param option - Prisma 客户端选项或 PrismaClient 实例（可选）
   * 
   * @note 如果传入 PrismaClientOptions，需要后续调用 open() 方法激活
   */
  constructor(option?: Prisma.PrismaClientOptions | PrismaClient) {
    if (option instanceof PrismaClient) {
      this.#prisma = option;
    } else {
      this.#option = option;
    }
  }

  /**
   * 创建新的适配器实例
   * 
   * @description 静态工厂方法，创建并初始化 Prisma 适配器
   * 
   * @param option - Prisma 客户端选项或 PrismaClient 实例（可选）
   * @returns 返回已初始化的 PrismaAdapter 实例
   */
  static async newAdapter(
    option?: Prisma.PrismaClientOptions | PrismaClient,
  ): Promise<PrismaAdapter> {
    const a = new PrismaAdapter(option);
    await a.#open();

    return a;
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
    const lines = await this.#prisma.casbinRule.findMany();

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
    const whereFilter = Object.keys(filter)
      .map((ptype) => {
        const policyPatterns = filter[ptype];
        return policyPatterns.map((policyPattern) => {
          return {
            ptype,
            ...(policyPattern[0] && { v0: policyPattern[0] }),
            ...(policyPattern[1] && { v1: policyPattern[1] }),
            ...(policyPattern[2] && { v2: policyPattern[2] }),
            ...(policyPattern[3] && { v3: policyPattern[3] }),
            ...(policyPattern[4] && { v4: policyPattern[4] }),
            ...(policyPattern[5] && { v5: policyPattern[5] }),
          };
        });
      })
      .flat();
    const lines = await this.#prisma.casbinRule.findMany({
      where: {
        OR: whereFilter,
      },
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
    await this.#prisma.$executeRaw`DELETE FROM casbin_rule;`;

    const processes: Array<Promise<CasbinRule>> = [];

    const savePolicyType = (ptype: string): void => {
      const astMap = model.model.get(ptype);
      if (astMap) {
        for (const [ptype, ast] of astMap) {
          for (const rule of ast.policy) {
            const line = this.#savePolicyLine(ptype, rule);
            const p = this.#prisma.casbinRule.create({ data: line });
            processes.push(p);
          }
        }
      }
    };

    savePolicyType('p');
    savePolicyType('g');

    // https://github.com/prisma/prisma-client-js/issues/332
    await Promise.all(processes);

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
    await this.#prisma.casbinRule.create({ data: line });
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
    const processes: Array<Promise<CasbinRule>> = [];
    for (const rule of rules) {
      const line = this.#savePolicyLine(ptype, rule);
      const p = this.#prisma.casbinRule.create({ data: line });
      processes.push(p);
    }

    // https://github.com/prisma/prisma-client-js/issues/332
    await Promise.all(processes);
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
    await this.#prisma.casbinRule.deleteMany({ where: line });
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
    const processes: Array<Promise<Prisma.BatchPayload>> = [];
    for (const rule of rules) {
      const line = this.#savePolicyLine(ptype, rule);
      const p = this.#prisma.casbinRule.deleteMany({ where: line });
      processes.push(p);
    }

    // https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/transactions#bulk-operations
    await Promise.all(processes);
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
    const line: Prisma.CasbinRuleCreateInput = { ptype };

    const idx = fieldIndex + fieldValues.length;
    if (fieldIndex <= 0 && 0 < idx) {
      line.v0 = fieldValues[0 - fieldIndex];
    }
    if (fieldIndex <= 1 && 1 < idx) {
      line.v1 = fieldValues[1 - fieldIndex];
    }
    if (fieldIndex <= 2 && 2 < idx) {
      line.v2 = fieldValues[2 - fieldIndex];
    }
    if (fieldIndex <= 3 && 3 < idx) {
      line.v3 = fieldValues[3 - fieldIndex];
    }
    if (fieldIndex <= 4 && 4 < idx) {
      line.v4 = fieldValues[4 - fieldIndex];
    }
    if (fieldIndex <= 5 && 5 < idx) {
      line.v5 = fieldValues[5 - fieldIndex];
    }

    await this.#prisma.casbinRule.deleteMany({ where: line });
  }

  /**
   * 关闭连接
   * 
   * @description 断开与数据库的连接
   * 
   * @returns Promise<any> 断开成功时返回
   */
  async close(): Promise<any> {
    return this.#prisma.$disconnect();
  }

  readonly #open = async (): Promise<void> => {
    if (!this.#option) {
      this.#option = {};
    }
    if (!this.#prisma) {
      this.#prisma = new PrismaClient(this.#option);
    }
    await this.#prisma.$connect();
  };

  readonly #loadPolicyLine = (
    line: Prisma.CasbinRuleCreateInput,
    model: Model,
  ): void => {
    const result =
      line.ptype +
      ', ' +
      [line.v0, line.v1, line.v2, line.v3, line.v4, line.v5]
        .filter((n) => n)
        .join(', ');
    Helper.loadPolicyLine(result, model);
  };

  readonly #savePolicyLine = (
    ptype: string,
    rule: string[],
  ): Prisma.CasbinRuleCreateInput => {
    const line: Prisma.CasbinRuleCreateInput = { ptype };

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
