import { ApiProperty } from '@nestjs/swagger';

/**
 * 登录日志必需属性类型
 *
 * @description 定义登录日志读模型所需的所有必需属性，所有字段均为只读且必需。
 * 该类型用于确保登录日志数据的完整性和一致性。
 */
export type LoginLogEssentialProperties = Readonly<
  Required<{
    username: string;
    domain: string;
    loginTime: Date;
    ip: string;
    port: number | null;
    address: string;
    userAgent: string;
    requestId: string;
    type: string;
    createdAt: Date;
  }>
>;

/**
 * 登录日志属性类型
 *
 * @description 登录日志的完整属性类型定义，继承自必需属性类型。
 */
export type LoginLogProperties = LoginLogEssentialProperties;

/**
 * 登录日志读模型
 *
 * @description 用于查询和展示的登录日志数据模型，包含登录相关的所有信息。
 * 该模型用于API响应和前端展示，支持分页查询和条件筛选。
 *
 * @example
 * ```typescript
 * const loginLog: LoginLogReadModel = {
 *   username: 'john.doe',
 *   domain: 'example.com',
 *   loginTime: new Date(),
 *   ip: '192.168.1.1',
 *   port: 8080,
 *   address: '北京市',
 *   userAgent: 'Mozilla/5.0...',
 *   requestId: 'req-456',
 *   type: 'success',
 *   createdAt: new Date()
 * };
 * ```
 */
export class LoginLogReadModel {
  @ApiProperty({ description: 'Username associated with the login event' })
  username: string;

  @ApiProperty({ description: 'Domain where the login occurred' })
  domain: string;

  @ApiProperty({
    description: 'Time when the login occurred',
    type: 'string',
    format: 'date-time',
  })
  loginTime: Date;

  @ApiProperty({ description: 'IP address from which the login was attempted' })
  ip: string;

  @ApiProperty({
    description: 'Port number used for the login attempt',
    nullable: true,
  })
  port: number | null;

  @ApiProperty({
    description: 'Physical or virtual address where the login occurred',
  })
  address: string;

  @ApiProperty({ description: 'User agent of the device used for logging in' })
  userAgent: string;

  @ApiProperty({ description: 'Request ID associated with the login event' })
  requestId: string;

  @ApiProperty({ description: 'Type of login event (e.g., success, failure)' })
  type: string;

  @ApiProperty({
    description: 'Date and time when the log was created',
    type: 'string',
    format: 'date-time',
  })
  createdAt: Date;
}
