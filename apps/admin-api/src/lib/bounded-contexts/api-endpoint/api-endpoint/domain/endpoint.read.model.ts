import { ApiProperty } from '@nestjs/swagger';

/**
 * API 端点必需属性类型
 *
 * @description 定义 API 端点的必需属性，包括 ID、路径、方法、操作、资源等
 */
export type EndpointEssentialProperties = Readonly<
  Required<{
    /** API 端点的唯一标识符 */
    id: string;
    /** API 端点的 URL 路径 */
    path: string;
    /** HTTP 方法 */
    method: string;
    /** 操作类型 */
    action: string;
    /** 资源类型 */
    resource: string;
    /** 控制器名称 */
    controller: string;
    /** 摘要描述 */
    summary: string | null;
    /** 创建时间 */
    createdAt: Date;
    /** 更新时间 */
    updatedAt: Date | null;
  }>
>;

/**
 * API 端点完整属性类型
 *
 * @description 包含 API 端点的所有属性
 */
export type EndpointProperties = EndpointEssentialProperties;

/**
 * API 端点树形属性类型
 *
 * @description 用于树形结构的端点属性，包含子节点数组
 */
export type EndpointTreeProperties = EndpointProperties & {
  /** 子节点数组，用于构建树形结构 */
  children?: EndpointTreeProperties[];
};

/**
 * API 端点读取模型
 *
 * @description
 * 用于 API 响应的 API 端点读取模型。
 * 该模型用于查询和展示 API 端点信息，不包含敏感数据。
 */
export class EndpointReadModel {
  /**
   * API 端点的唯一标识符
   */
  @ApiProperty({ description: 'The unique identifier of the API endpoint' })
  id: string;

  /**
   * API 端点的 URL 路径
   */
  @ApiProperty({ description: 'Path of the API endpoint' })
  path: string;

  /**
   * HTTP 方法
   */
  @ApiProperty({ description: 'HTTP method of the API endpoint' })
  method: string;

  /**
   * 操作类型
   */
  @ApiProperty({ description: 'Action associated with the API endpoint' })
  action: string;

  /**
   * 资源类型
   */
  @ApiProperty({ description: 'Resource targeted by the API endpoint' })
  resource: string;

  /**
   * 控制器名称
   */
  @ApiProperty({ description: 'Controller handling the API endpoint' })
  controller: string;

  /**
   * 摘要描述
   */
  @ApiProperty({
    description: 'Summary or description of the API endpoint',
    nullable: true,
  })
  summary: string | null;

  /**
   * 创建时间
   */
  @ApiProperty({
    description: 'Creation date of the API endpoint',
    type: 'string',
    format: 'date-time',
  })
  createdAt: Date;

  /**
   * 最后更新时间
   */
  @ApiProperty({
    description: 'Last update date of the API endpoint',
    type: 'string',
    format: 'date-time',
    nullable: true,
  })
  updatedAt: Date | null;
}
