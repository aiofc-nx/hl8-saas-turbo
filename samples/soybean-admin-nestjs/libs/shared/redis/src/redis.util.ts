import { Redis, Cluster } from 'ioredis';

import { RedisConfig } from '@lib/config/redis.config';

/**
 * Redis 工具类
 * 
 * @description 提供 Redis 客户端的单例访问，支持单机模式和集群模式
 * 
 * @class RedisUtility
 */
export class RedisUtility {
  /**
   * 获取 Redis 实例
   * 
   * @description 获取当前 Redis 客户端实例（单机或集群）
   * 
   * @returns 返回 Redis 或 Cluster 实例
   */
  static get instance(): Redis | Cluster {
    return this._instance;
  }
  
  /** Redis 客户端实例（私有） */
  private static _instance: Redis | Cluster;
  
  /** 初始化 Promise（用于防止并发初始化） */
  private static initializing: Promise<Redis | Cluster> | null = null;

  /**
   * 创建 Redis 实例
   * 
   * @description 根据配置创建 Redis 客户端实例，支持单机模式和集群模式
   * 
   * @returns 返回创建的 Redis 或 Cluster 实例
   */
  private static async createInstance(): Promise<Redis | Cluster> {
    const [config] = await Promise.all([RedisConfig()]);
    if (config.mode === 'cluster') {
      this._instance = new Redis.Cluster(
        config.cluster.map((node) => ({
          host: node.host,
          port: node.port,
          password: node.password,
        })),
        {
          redisOptions: {
            password: config.cluster[0].password,
            db: config.standalone.db,
          },
        },
      );
    } else {
      this._instance = new Redis({
        host: config.standalone.host,
        port: config.standalone.port,
        password: config.standalone.password,
        db: config.standalone.db,
      });
    }
    return this._instance;
  }

  /**
   * 获取 Redis 客户端
   * 
   * @description 获取 Redis 客户端实例，如果不存在则创建，支持并发安全
   * 
   * @returns 返回 Redis 或 Cluster 实例的 Promise
   * 
   * @example
   * ```typescript
   * const redis = await RedisUtility.client();
   * await redis.set('key', 'value');
   * ```
   */
  public static async client(): Promise<Redis | Cluster> {
    if (!this._instance) {
      if (!this.initializing) {
        this.initializing = this.createInstance();
      }
      this._instance = await this.initializing;
      this.initializing = null;
    }
    return this._instance;
  }
}
