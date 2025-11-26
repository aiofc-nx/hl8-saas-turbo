/**
 * IP2Region 配置接口
 *
 * @description 定义 IP2Region 服务的配置结构
 */
export interface Ip2RegionConfig {
  /** 数据库文件路径（.xdb 文件） */
  xdbPath: string;
  /** 查询模式 */
  mode: SearchMode;
}

/**
 * 查询模式枚举
 *
 * @description 定义 IP2Region 支持的三种查询模式
 *
 * @enum
 * - File: 文件模式，每次查询都读取文件（内存占用最小，性能较低）
 * - VectorIndex: 向量索引模式，预加载索引到内存（平衡内存和性能）
 * - Full: 全量模式，预加载整个数据库到内存（内存占用最大，性能最高）
 */
export enum SearchMode {
  /** 文件模式：每次查询都读取文件 */
  File = 'FILE',
  /** 向量索引模式：预加载索引到内存 */
  VectorIndex = 'VECTOR_INDEX',
  /** 全量模式：预加载整个数据库到内存 */
  Full = 'FULL',
}
