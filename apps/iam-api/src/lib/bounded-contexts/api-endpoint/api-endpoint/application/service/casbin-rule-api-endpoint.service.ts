import { EntityManager, FilterQuery } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';

/**
 * Casbin 规则 API 端点服务
 *
 * @description 用于查询 Casbin 权限规则的服务
 */
@Injectable()
export class CasbinRuleApiEndpointService {
  constructor(private readonly em: EntityManager) {}

  /**
   * 根据角色代码和域查询 API 端点权限规则
   *
   * @param roleCode - 角色代码
   * @param domain - 域代码
   * @returns Casbin 规则列表
   */
  async authApiEndpoint(roleCode: string, domain: string) {
    return this.em.find('CasbinRule', {
      ptype: 'p',
      v0: roleCode,
      v3: domain,
    } as FilterQuery<any>);
  }
}
