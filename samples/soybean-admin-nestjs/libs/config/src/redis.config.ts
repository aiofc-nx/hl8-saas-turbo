import { ConfigType, registerAs } from '@nestjs/config';

import { getEnvNumber, getEnvString } from '@lib/utils/env';

/**
 * Redis 配置注册令牌
 * 
 * @description 用于标识 Redis 配置的注册令牌
 */
export const redisRegToken = 'redis';

/**
 * Redis 配置
 * 
 * @description 注册 Redis 配置，支持单机模式、集群模式和哨兵模式
 * 
 * @returns 返回 Redis 配置对象，包含模式、单机配置、集群配置和哨兵配置
 * 
 * @example
 * 环境变量配置：
 * - REDIS_MODE: 模式（standalone/cluster/sentinel），默认 standalone
 * - REDIS_HOST: 单机模式主机地址，默认 localhost
 * - REDIS_PORT: 单机模式端口，默认 26379
 * - REDIS_PASSWORD: Redis 密码，默认 123456
 * - REDIS_DB: 数据库编号，默认 5
 * - REDIS_CLUSTER_NODES: 集群节点列表（逗号分隔，格式：host:port）
 * - REDIS_CLUSTER_PASSWORD: 集群密码
 * - REDIS_SENTINELS: 哨兵节点列表（逗号分隔，格式：host:port）
 * - REDIS_SENTINEL_MASTER_NAME: 哨兵主节点名称，默认 master
 * - REDIS_SENTINEL_PASSWORD: 哨兵密码
 * - REDIS_SENTINEL_DB: 哨兵数据库编号，默认 5
 */
export const RedisConfig = registerAs(redisRegToken, () => {
  return {
    mode: process.env.REDIS_MODE ?? 'standalone', // 'standalone', 'cluster', 'sentinel'
    standalone: {
      host: getEnvString('REDIS_HOST', 'localhost'),
      port: getEnvNumber('REDIS_PORT', 26379),
      password: getEnvString('REDIS_PASSWORD', '123456'),
      db: getEnvNumber('REDIS_DB', 5),
    },
    cluster: process.env.REDIS_CLUSTER_NODES
      ? process.env.REDIS_CLUSTER_NODES.split(',').map((node) => {
          const [host, port] = node.split(':');
          return {
            host,
            port: parseInt(port, 10),
            password: getEnvString('REDIS_CLUSTER_PASSWORD', ''),
          };
        })
      : [],
    sentinel: {
      sentinels: process.env.REDIS_SENTINELS
        ? process.env.REDIS_SENTINELS.split(',').map((node) => {
            const [host, port] = node.split(':');
            return { host, port: parseInt(port, 10) };
          })
        : [],
      name: getEnvString('REDIS_SENTINEL_MASTER_NAME', 'master'),
      password: getEnvString('REDIS_SENTINEL_PASSWORD', ''),
      db: getEnvNumber('REDIS_SENTINEL_DB', 5),
    },
  };
});

/**
 * Redis 配置类型
 * 
 * @description Redis 配置对象的类型定义
 */
export type IRedisConfig = ConfigType<typeof RedisConfig>;
