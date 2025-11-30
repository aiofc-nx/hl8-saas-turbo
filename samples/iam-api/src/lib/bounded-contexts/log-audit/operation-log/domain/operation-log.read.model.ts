import { ApiProperty } from '@nestjs/swagger';

/**
 * 操作日志必需属性类型
 *
 * @description 定义操作日志读模型所需的所有必需属性，所有字段均为只读且必需。
 * 该类型用于确保操作日志数据的完整性和一致性。
 */
export type OperationLogEssentialProperties = Readonly<
  Required<{
    userId: string;
    username: string;
    domain: string;
    moduleName: string;
    description: string;
    requestId: string;
    method: string;
    url: string;
    ip: string;
    userAgent: string | null;
    params: any;
    body: any;
    response: any;
    startTime: Date;
    endTime: Date;
    duration: number;
  }>
>;

/**
 * 操作日志属性类型
 *
 * @description 操作日志的完整属性类型定义，继承自必需属性类型。
 */
export type OperationLogProperties = OperationLogEssentialProperties;

/**
 * 操作日志读模型
 *
 * @description 用于查询和展示的操作日志数据模型，包含操作相关的所有信息。
 * 该模型用于API响应和前端展示，支持分页查询和条件筛选。
 *
 * @example
 * ```typescript
 * const operationLog: OperationLogReadModel = {
 *   id: 'log-123',
 *   userId: 'user-123',
 *   username: 'john.doe',
 *   domain: 'example.com',
 *   moduleName: 'user-management',
 *   description: '创建用户',
 *   requestId: 'req-456',
 *   method: 'POST',
 *   url: '/api/users',
 *   ip: '192.168.1.1',
 *   userAgent: 'Mozilla/5.0...',
 *   params: {},
 *   body: { name: 'John' },
 *   response: { id: 'user-789' },
 *   startTime: new Date(),
 *   endTime: new Date(),
 *   duration: 150
 * };
 * ```
 */
export class OperationLogReadModel {
  @ApiProperty({ description: 'The unique identifier of the operation log' })
  id: string;

  @ApiProperty({ description: 'User ID associated with the operation' })
  userId: string;

  @ApiProperty({ description: 'Username associated with the operation' })
  username: string;

  @ApiProperty({ description: 'Domain where the operation occurred' })
  domain: string;

  @ApiProperty({ description: 'Module where the operation occurred' })
  moduleName: string;

  @ApiProperty({ description: 'Description of the operation' })
  description: string;

  @ApiProperty({ description: 'Request ID associated with the operation' })
  requestId: string;

  @ApiProperty({ description: 'HTTP method used in the operation' })
  method: string;

  @ApiProperty({ description: 'URL accessed during the operation' })
  url: string;

  @ApiProperty({
    description: 'IP address from which the operation was initiated',
  })
  ip: string;

  @ApiProperty({
    description: 'User agent of the device used in the operation',
    nullable: true,
  })
  userAgent: string | null;

  @ApiProperty({
    description: 'Parameters used in the operation',
  })
  params: any;

  @ApiProperty({
    description: 'Body of the request used in the operation',
  })
  body: any;

  @ApiProperty({
    description: 'Response returned from the operation',
  })
  response: any;

  @ApiProperty({
    description: 'Start time of the operation',
    type: 'string',
    format: 'date-time',
  })
  startTime: Date;

  @ApiProperty({
    description: 'End time of the operation',
    type: 'string',
    format: 'date-time',
  })
  endTime: Date;

  @ApiProperty({ description: 'Duration of the operation in milliseconds' })
  duration: number;
}
