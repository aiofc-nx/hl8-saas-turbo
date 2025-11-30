import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';

import { EVENT_API_ROUTE_COLLECTED } from '@hl8/constants';

import { ApiEndpointWriteRepoPortToken } from '../../constants';
import { ApiEndpoint } from '../../domain/api-endpoint.model';
import type { ApiEndpointWriteRepoPort } from '../../ports/api-endpoint.write.repo-port';

/**
 * API 端点事件处理器
 *
 * @description
 * 处理 API 端点相关的事件，主要是 EVENT_API_ROUTE_COLLECTED 事件。
 * 当系统启动时收集到所有 API 路由后，该处理器会将端点信息保存到数据库。
 *
 * 该处理器实现了两种事件监听方式：
 * 1. 使用 @OnEvent 装饰器（标准方式）
 * 2. 手动注册事件监听器（备用方式，解决某些情况下装饰器不生效的问题）
 *
 * @implements {OnModuleInit}
 */
@Injectable()
export class ApiEndpointEventHandler implements OnModuleInit {
  /**
   * 日志记录器
   *
   * @description 用于记录事件处理过程中的日志信息
   */
  private readonly logger = new Logger(ApiEndpointEventHandler.name);

  /**
   * 构造函数
   *
   * @param endpointWriteRepo - API 端点写入仓储端口，用于持久化端点数据
   * @param eventEmitter - 事件发射器，用于手动注册事件监听器
   */
  constructor(
    @Inject(ApiEndpointWriteRepoPortToken)
    private readonly endpointWriteRepo: ApiEndpointWriteRepoPort,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * 模块初始化时执行的方法
   *
   * @description
   * 在模块初始化时手动注册事件监听器，以确保能捕获到 EVENT_API_ROUTE_COLLECTED 事件。
   * 这种方法可以解决 @OnEvent 装饰器在某些情况下不生效的问题。
   * 另一种解决方案是在 app.module.ts 中将 BootstrapModule 放在最后，
   * 这样在模块初始化时，EVENT_API_ROUTE_COLLECTED 事件已经 emit 了。
   */
  onModuleInit() {
    this.logger.log('ApiEndpointEventHandler initialized');
    this.eventEmitter.on(
      EVENT_API_ROUTE_COLLECTED,
      this.handleManually.bind(this),
    );
  }

  /**
   * 手动处理事件
   *
   * @description 手动注册的事件监听器处理方法，作为 @OnEvent 装饰器的备用方案
   *
   * @param payload - API 端点数组
   */
  private handleManually(payload: ApiEndpoint[]) {
    this.logger.log(`Manually received ${payload.length} API endpoints`);
    this.handle(payload);
  }

  /**
   * 处理 API 路由收集事件
   *
   * @description
   * 当系统启动时收集到所有 API 路由后，将端点信息批量保存到数据库。
   * 该方法是系统自动发现和注册 API 端点的关键环节。
   *
   * @param payload - API 端点数组，包含所有收集到的 API 端点信息
   * @returns Promise<void>
   */
  @OnEvent(EVENT_API_ROUTE_COLLECTED)
  async handle(payload: ApiEndpoint[]) {
    this.logger.log(`Handling ${payload.length} API endpoints`);
    try {
      await this.endpointWriteRepo.save(payload);
      this.logger.log('API endpoints saved successfully');
    } catch (error) {
      this.logger.error(
        'Failed to save API endpoints',
        error instanceof Error ? error.stack : String(error),
      );
    }
  }
}
