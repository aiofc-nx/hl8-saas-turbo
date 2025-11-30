import { Status } from '@/lib/shared/enums/status.enum';
import { ApiProperty } from '@nestjs/swagger';

import type { CreationAuditInfoProperties } from '@hl8/typings';

/**
 * 访问密钥必需属性类型
 *
 * @description 定义访问密钥的必需属性，包括 ID、域、密钥 ID、密钥值和状态
 */
export type AccessKeyEssentialProperties = Readonly<
  Required<{
    /** 访问密钥的唯一标识符 */
    id: string;
    /** 访问密钥所属的域代码 */
    domain: string;
    /** 用于 API 认证的密钥 ID */
    AccessKeyID: string;
    /** 用于 API 认证的密钥值 */
    AccessKeySecret: string;
    /** 访问密钥的状态 */
    status: Status;
  }>
>;

/**
 * 访问密钥可选属性类型
 *
 * @description 定义访问密钥的可选属性，包括描述信息
 */
export type AccessKeyOptionalProperties = Readonly<
  Partial<{
    /** 访问密钥的描述信息 */
    description: string | null;
  }>
>;

/**
 * 访问密钥完整属性类型
 *
 * @description 包含访问密钥的所有属性，包括必需属性、可选属性和创建审计信息
 */
export type AccessKeyProperties = AccessKeyEssentialProperties &
  Required<AccessKeyOptionalProperties> &
  CreationAuditInfoProperties;

/**
 * 访问密钥读取模型
 *
 * @description
 * 用于 API 响应的访问密钥读取模型，不包含敏感信息（如 AccessKeySecret）。
 * 该模型用于查询和展示访问密钥信息，确保不会泄露密钥值。
 */
export class AccessKeyReadModel {
  /**
   * 访问密钥的唯一标识符
   */
  @ApiProperty({ description: 'The unique identifier of the AccessKey' })
  id: string;

  /**
   * 访问密钥所属的域代码
   */
  @ApiProperty({ description: 'domain of the AccessKey' })
  domain: string;

  /**
   * 访问密钥 ID（用于 API 认证）
   */
  @ApiProperty({ description: 'AccessKeyID of the AccessKey' })
  AccessKeyID: string;

  /**
   * 访问密钥状态
   */
  @ApiProperty({
    description: 'Status of the AccessKey',
    enum: Object.values(Status),
  })
  status: Status;

  /**
   * 访问密钥描述
   */
  @ApiProperty({
    description: 'Description of the AccessKey',
    nullable: true,
    required: false,
  })
  description: string | null;
}
