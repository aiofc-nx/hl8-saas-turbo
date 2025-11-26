/**
 * OSS 配置接口
 *
 * @description 定义阿里云 OSS 对象存储服务的配置结构
 *
 * @example
 * ```typescript
 * const config: OssConfig = {
 *   region: 'oss-cn-beijing',
 *   accessKeyId: 'your-access-key-id',
 *   accessKeySecret: 'your-access-key-secret',
 *   bucket: 'your-bucket-name',
 * };
 * ```
 */
export interface OssConfig {
  /** OSS 区域，如 'oss-cn-beijing'、'oss-cn-shanghai' 等 */
  region: string;
  /** 阿里云 AccessKey ID */
  accessKeyId: string;
  /** 阿里云 AccessKey Secret */
  accessKeySecret: string;
  /** OSS 存储桶名称 */
  bucket: string;
  /** 自定义端点（可选），用于私有化部署或特殊场景 */
  endpoint?: string;
  /** 是否使用 HTTPS（可选），默认 true */
  secure?: boolean;
  /** 请求超时时间（毫秒，可选），默认 60000 */
  timeout?: number;
  /** 是否启用内部端点（可选），用于 ECS 内网访问 */
  internal?: boolean;
}
