import { Injectable, OnModuleInit } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';

import { isDevEnvironment } from '@lib/utils/env';

/**
 * Prisma 服务
 * 
 * @description Prisma 数据库客户端服务，提供数据库访问功能，在开发环境下会记录查询日志
 * 
 * @class PrismaService
 * @extends {PrismaClient}
 * @implements {OnModuleInit}
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  /**
   * 构造函数
   * 
   * @description 初始化 Prisma 客户端，在开发环境下启用查询日志
   */
  constructor() {
    super({
      log: isDevEnvironment
        ? [
            { level: 'query', emit: 'event' },
            { level: 'info', emit: 'stdout' },
            { level: 'warn', emit: 'stdout' },
            { level: 'error', emit: 'stdout' },
          ]
        : [
            { level: 'warn', emit: 'stdout' },
            { level: 'error', emit: 'stdout' },
          ],
    });

    if (isDevEnvironment) {
      // @ts-expect-error
      this.$on('query', (event: Prisma.QueryEvent) => {
        console.log('Query: ' + event.query);
        console.log('Params: ' + event.params);
        console.log('Duration: ' + event.duration + 'ms');
      });
    }
  }

  /**
   * 模块初始化
   * 
   * @description 在模块初始化时连接到数据库
   * 
   * @returns Promise<void> 连接成功时返回
   */
  async onModuleInit() {
    await this.$connect();
  }
}
