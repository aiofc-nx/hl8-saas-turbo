import { EntityManager, FilterQuery } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';

/**
 * Casbin 规则 API 端点服务
 *
 * @description
 * 用于查询 Casbin 权限规则的服务，主要用于获取角色在指定域下的 API 端点权限。
 * 该服务直接操作 Casbin 规则表，用于权限验证和授权管理。
 */
@Injectable()
export class CasbinRuleApiEndpointService {
  /**
   * 构造函数
   *
   * @param em - MikroORM 实体管理器，用于数据库操作
   */
  constructor(private readonly em: EntityManager) {}

  /**
   * 根据角色代码和域查询 API 端点权限规则
   *
   * @description
   * 查询指定角色在指定域下拥有的所有 API 端点权限规则。
   * Casbin 规则格式为：p, roleCode, resource, action, domain
   * 其中 ptype='p' 表示策略规则，v0=roleCode 表示角色，v3=domain 表示域。
   *
   * @param roleCode - 角色代码
   * @param domain - 域代码，用于多租户隔离
   * @returns 返回 Casbin 规则列表，包含该角色在该域下的所有权限规则
   */
  async authApiEndpoint(roleCode: string, domain: string) {
    return this.em.find('CasbinRule', {
      ptype: 'p',
      v0: roleCode,
      v3: domain,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as FilterQuery<any>);
  }
}
