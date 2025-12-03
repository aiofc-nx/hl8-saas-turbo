import { ApiProperty } from '@nestjs/swagger';

/**
 * 策略类型枚举
 *
 * @description Casbin 策略类型，'p' 表示权限策略，'g' 表示角色继承关系
 */
export enum PolicyType {
  /** 权限策略 */
  POLICY = 'p',
  /** 角色继承关系 */
  ROLE_RELATION = 'g',
}

/**
 * 策略规则 DTO
 *
 * @description 用于前端展示和 API 传输的策略规则数据对象，将 CasbinRule 的底层字段（v0~v5）映射为业务语义
 */
export class PolicyRuleDto {
  @ApiProperty({ description: '策略规则 ID', example: 1 })
  id!: number;

  @ApiProperty({
    description: '策略类型',
    enum: PolicyType,
    example: PolicyType.POLICY,
  })
  ptype!: PolicyType;

  @ApiProperty({
    description: '主体（Subject），通常是角色编码或用户标识',
    example: 'admin',
    required: false,
    nullable: true,
  })
  subject?: string;

  @ApiProperty({
    description: '资源（Object），通常是接口路径或资源编码',
    example: '/api/users',
    required: false,
    nullable: true,
  })
  object?: string;

  @ApiProperty({
    description: '操作（Action），通常是 HTTP 方法或动作枚举',
    example: 'GET',
    required: false,
    nullable: true,
  })
  action?: string;

  @ApiProperty({
    description: '域（Domain），用于多租户隔离',
    example: 'example.com',
    required: false,
    nullable: true,
  })
  domain?: string;

  @ApiProperty({
    description: '效果（Effect），allow 或 deny',
    example: 'allow',
    required: false,
    nullable: true,
  })
  effect?: string;

  @ApiProperty({
    description: '扩展字段 v4',
    required: false,
    nullable: true,
  })
  v4?: string;

  @ApiProperty({
    description: '扩展字段 v5',
    required: false,
    nullable: true,
  })
  v5?: string;
}

/**
 * 角色继承关系 DTO
 *
 * @description 用于前端展示和 API 传输的角色继承关系数据对象
 */
export class RoleRelationDto {
  @ApiProperty({ description: '关系 ID', example: 1 })
  id!: number;

  @ApiProperty({
    description: '子主体（用户 ID 或子角色编码）',
    example: 'user-123',
  })
  childSubject!: string;

  @ApiProperty({
    description: '父角色编码',
    example: 'admin',
  })
  parentRole!: string;

  @ApiProperty({
    description: '域（Domain），用于多租户隔离',
    example: 'example.com',
    required: false,
    nullable: true,
  })
  domain?: string;
}

/**
 * 策略规则属性
 *
 * @description 策略规则的领域模型属性
 */
export type PolicyRuleProperties = Readonly<{
  id: number;
  ptype: PolicyType;
  v0?: string;
  v1?: string;
  v2?: string;
  v3?: string;
  v4?: string;
  v5?: string;
}>;

/**
 * 角色继承关系属性
 *
 * @description 角色继承关系的领域模型属性
 */
export type RoleRelationProperties = Readonly<{
  id: number;
  v0: string; // 子主体
  v1: string; // 父角色
  v2?: string; // 域
}>;

/**
 * 将 CasbinRule 实体转换为策略规则 DTO
 *
 * @description 将数据库实体映射为业务语义化的 DTO
 *
 * @param rule - CasbinRule 实体对象
 * @returns 策略规则 DTO
 */
export function casbinRuleToPolicyRuleDto(rule: {
  id: number;
  ptype: string;
  v0?: string;
  v1?: string;
  v2?: string;
  v3?: string;
  v4?: string;
  v5?: string;
}): PolicyRuleDto {
  const dto = new PolicyRuleDto();
  dto.id = rule.id;
  dto.ptype = rule.ptype as PolicyType;

  // 根据 ptype 映射字段
  if (rule.ptype === PolicyType.POLICY) {
    // p 类型：v0=sub, v1=obj, v2=act, v3=dom, v4=eft
    dto.subject = rule.v0;
    dto.object = rule.v1;
    dto.action = rule.v2;
    dto.domain = rule.v3;
    dto.effect = rule.v4;
    dto.v5 = rule.v5;
  } else if (rule.ptype === PolicyType.ROLE_RELATION) {
    // g 类型：v0=子主体, v1=父角色, v2=域
    dto.subject = rule.v0;
    dto.object = rule.v1;
    dto.domain = rule.v2;
    dto.v4 = rule.v3;
    dto.v5 = rule.v4;
  } else {
    // 未知类型，直接映射
    dto.subject = rule.v0;
    dto.object = rule.v1;
    dto.action = rule.v2;
    dto.domain = rule.v3;
    dto.effect = rule.v4;
    dto.v5 = rule.v5;
  }

  return dto;
}

/**
 * 将策略规则 DTO 转换为 CasbinRule 实体字段
 *
 * @description 将业务语义化的 DTO 映射为数据库实体字段
 *
 * @param dto - 策略规则 DTO
 * @returns CasbinRule 实体字段对象
 */
export function policyRuleDtoToCasbinRule(dto: PolicyRuleDto): {
  ptype: string;
  v0?: string;
  v1?: string;
  v2?: string;
  v3?: string;
  v4?: string;
  v5?: string;
} {
  if (dto.ptype === PolicyType.POLICY) {
    // p 类型：v0=sub, v1=obj, v2=act, v3=dom, v4=eft
    return {
      ptype: dto.ptype,
      v0: dto.subject,
      v1: dto.object,
      v2: dto.action,
      v3: dto.domain,
      v4: dto.effect,
      v5: dto.v5,
    };
  } else if (dto.ptype === PolicyType.ROLE_RELATION) {
    // g 类型：v0=子主体, v1=父角色, v2=域
    return {
      ptype: dto.ptype,
      v0: dto.subject,
      v1: dto.object,
      v2: dto.domain,
      v3: dto.v4,
      v4: dto.v5,
    };
  } else {
    // 未知类型，直接映射
    return {
      ptype: dto.ptype,
      v0: dto.subject,
      v1: dto.object,
      v2: dto.action,
      v3: dto.domain,
      v4: dto.effect,
      v5: dto.v5,
    };
  }
}

/**
 * 将 CasbinRule 实体转换为角色继承关系 DTO
 *
 * @description 将数据库实体映射为角色继承关系 DTO
 *
 * @param rule - CasbinRule 实体对象（ptype 必须为 'g'）
 * @returns 角色继承关系 DTO
 */
export function casbinRuleToRoleRelationDto(rule: {
  id: number;
  v0: string;
  v1: string;
  v2?: string;
}): RoleRelationDto {
  const dto = new RoleRelationDto();
  dto.id = rule.id;
  dto.childSubject = rule.v0;
  dto.parentRole = rule.v1;
  dto.domain = rule.v2;
  return dto;
}

/**
 * 将角色继承关系 DTO 转换为 CasbinRule 实体字段
 *
 * @description 将角色继承关系 DTO 映射为数据库实体字段
 *
 * @param dto - 角色继承关系 DTO
 * @returns CasbinRule 实体字段对象
 */
export function roleRelationDtoToCasbinRule(dto: RoleRelationDto): {
  ptype: string;
  v0: string;
  v1: string;
  v2?: string;
} {
  return {
    ptype: PolicyType.ROLE_RELATION,
    v0: dto.childSubject,
    v1: dto.parentRole,
    v2: dto.domain,
  };
}
