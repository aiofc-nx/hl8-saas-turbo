import { Injectable } from '@nestjs/common';
import * as si from 'systeminformation';

import { RedisUtility } from '@hl8/redis';

/**
 * 应用服务
 *
 * 提供应用级别的业务逻辑，包括系统信息查询和 Redis 信息查询。
 *
 * @remarks
 * - 使用 systeminformation 库收集系统硬件和运行时信息
 * - 提供 Redis 连接状态和配置信息查询
 */
@Injectable()
export class AppService {
  /**
   * 获取欢迎消息
   *
   * 返回简单的欢迎消息，用于测试应用是否正常运行。
   *
   * @returns 欢迎消息字符串 "Hello World!"
   */
  getHello(): string {
    return 'Hello World!';
  }

  /**
   * 获取系统信息
   *
   * 收集并返回服务器的详细系统信息，包括 CPU、内存、磁盘、操作系统、网络接口等。
   *
   * @returns 包含系统信息的对象，包括：
   * - cpu: CPU 制造商、型号、核心数、速度、当前负载等
   * - memory: 内存总量、已用、可用等
   * - disk: 磁盘文件系统、类型、大小、使用率等
   * - os: 操作系统信息
   * - nodeInfo: Node.js 和 npm 版本信息
   * - network: 网络接口和统计信息
   * - data: 完整的系统数据
   *
   * @remarks
   * - 使用 systeminformation 库异步收集各项系统信息
   * - 所有信息收集操作并行执行以提高性能
   * - 返回的数据可用于系统监控和诊断
   */
  async getSystemInfo() {
    const [
      cpu,
      memory,
      osInfo,
      currentLoad,
      disk,
      networkInterfaces,
      networkStats,
    ] = await Promise.all([
      si.cpu(),
      si.mem(),
      si.osInfo(),
      si.currentLoad(),
      si.fsSize(),
      si.networkInterfaces(),
      si.networkStats('*'),
    ]);
    const nodeInfo = {
      nodeVersion: process.version,
      npmVersion: await si.versions('npm'),
    };

    const interfacesArray = Array.isArray(networkInterfaces)
      ? networkInterfaces
      : [networkInterfaces];

    return {
      cpu: {
        manufacturer: cpu.manufacturer,
        brand: cpu.brand,
        physicalCores: cpu.physicalCores,
        model: cpu.model,
        speed: cpu.speed,
        rawCurrentLoad: currentLoad.rawCurrentLoad,
        rawCurrentLoadIdle: currentLoad.rawCurrentLoadIdle,
        coresLoad: currentLoad.cpus.map((e) => {
          return {
            rawLoad: e.rawLoad,
            rawLoadIdle: e.rawLoadIdle,
          };
        }),
      },
      memory: {
        total: memory.total,
        free: memory.free,
        used: memory.used,
        available: memory.available,
      },
      disk: disk.map((d) => ({
        fs: d.fs,
        type: d.type,
        size: d.size,
        used: d.used,
        use: d.use,
      })),
      os: osInfo,
      nodeInfo,
      network: {
        interfaces: interfacesArray.map((iface) => ({
          name: iface.iface,
          ip4: iface.ip4,
          ip6: iface.ip6,
          mac: iface.mac,
        })),
        stats: networkStats,
      },
      data: await si.getAllData(),
    };
  }

  /**
   * 获取 Redis 信息
   *
   * 查询 Redis 服务器的连接状态和配置信息，解析 Redis INFO 命令的输出。
   *
   * @returns 包含 Redis 服务器信息的对象，包括：
   * - 服务器版本、运行模式
   * - 内存使用情况
   * - 连接数、命令统计
   * - 持久化配置
   * - 其他 Redis 配置项
   *
   * @remarks
   * - 通过 RedisUtility 获取 Redis 客户端实例
   * - 解析 Redis INFO 命令的原始输出
   * - 过滤掉注释行（以 # 开头的行）
   * - 将键值对格式的配置项解析为对象
   */
  async getRedisInfo() {
    const redisClient = RedisUtility.instance;
    const info = await redisClient.info();
    const redisInfo: any = {};
    const lines = info.split('\r\n');
    lines.forEach((line) => {
      if (line && !line.startsWith('#')) {
        const parts = line.split(':');
        if (parts.length > 1) {
          redisInfo[parts[0]] = parts[1];
        }
      }
    });
    return redisInfo;
  }
}
