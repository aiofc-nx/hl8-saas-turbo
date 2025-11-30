import * as crypto from 'crypto';

import {
  Injectable,
  Logger,
  OnModuleInit,
  RequestMethod,
} from '@nestjs/common';
import { ModulesContainer, Reflector } from '@nestjs/core';
import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper';
import { Module } from '@nestjs/core/injector/module';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { ApiEndpoint } from '@app/base-system/lib/bounded-contexts/api-endpoint/api-endpoint/domain/api-endpoint.model';

import { EVENT_API_ROUTE_COLLECTED } from '@lib/constants/event-emitter-token.constant';
import {
  FUNCTION,
  METHOD,
  PATH,
  SWAGGER_API_OPERATION,
} from '@lib/constants/rest.constant';
import { Permission, PERMISSIONS_METADATA } from '@lib/infra/casbin';
import { isMainCluster } from '@lib/utils/env';

/**
 * API 数据服务
 * 
 * @description 在模块初始化时收集所有 API 端点信息，包括路径、方法、权限等，并发送事件通知
 * 
 * @class ApiDataService
 * @implements {OnModuleInit}
 */
@Injectable()
export class ApiDataService implements OnModuleInit {
  /**
   * 构造函数
   * 
   * @param modulesContainer - 模块容器，用于访问所有已注册的模块
   * @param reflector - 反射器，用于获取路由元数据
   * @param eventEmitter - 事件发射器，用于发送 API 端点收集完成事件
   */
  constructor(
    private readonly modulesContainer: ModulesContainer,
    private readonly reflector: Reflector,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  private readonly logger = new Logger(ApiDataService.name);

  /**
   * 模块初始化
   * 
   * @description 在模块初始化时收集所有 API 端点，并在主集群实例中发送收集完成事件
   */
  onModuleInit() {
    if (isMainCluster) {
      const endpoints: ApiEndpoint[] = [];
      this.modulesContainer.forEach((module: Module) => {
        const controllers = Array.from(module.controllers.values());
        controllers.forEach((controller) =>
          this.processController(controller, endpoints),
        );
      });

      setImmediate(() => {
        this.logger.log(`Emitting ${endpoints.length} API endpoints`);
        this.eventEmitter.emit(EVENT_API_ROUTE_COLLECTED, endpoints);
      });
    }
  }

  /**
   * 处理单个控制器
   * 
   * @description 从控制器中提取所有路由方法并处理
   * 
   * @param controller - 控制器实例包装器
   * @param endpoints - API 端点数组，用于收集端点信息
   */
  private processController(
    controller: InstanceWrapper<object>,
    endpoints: ApiEndpoint[],
  ) {
    const instance: Record<string, any> = controller.instance;
    if (!instance) return;

    const prototype = Object.getPrototypeOf(instance);
    const controllerName = controller.metatype?.name || '';
    const controllerPath =
      Reflect.getMetadata(PATH, controller.metatype as any) || '';

    Object.getOwnPropertyNames(prototype)
      .filter((method) => typeof instance[method] === FUNCTION)
      .forEach((method) =>
        this.processMethod(
          method,
          instance,
          controllerPath,
          controllerName,
          endpoints,
        ),
      );
  }

  /**
   * 处理控制器中的每个方法
   * 
   * @description 从路由方法中提取路径、方法类型、权限等信息，并创建 API 端点
   * 
   * @param method - 方法名称
   * @param instance - 控制器实例
   * @param controllerPath - 控制器路径
   * @param controllerName - 控制器名称
   * @param endpoints - API 端点数组，用于收集端点信息
   */
  private processMethod(
    method: string,
    instance: Record<string, any>,
    controllerPath: string,
    controllerName: string,
    endpoints: ApiEndpoint[],
  ) {
    const methodPath = Reflect.getMetadata(PATH, instance[method]) || '';
    const methodType = Reflect.getMetadata(METHOD, instance[method]);
    if (methodType === undefined) return;

    const permissions: Permission[] = this.reflector.get(
      PERMISSIONS_METADATA,
      instance[method],
    ) || [{ action: '', resource: '' }];
    const cleanedPath = (controllerPath + (methodPath ? '/' + methodPath : ''))
      .replace(/\/+/g, '/')
      .replace(/\/$/, '');
    const summary =
      Reflect.getMetadata(SWAGGER_API_OPERATION, instance[method])?.summary ||
      '';

    this.createEndpoints(
      permissions,
      cleanedPath,
      methodType,
      controllerName,
      summary,
      endpoints,
    );
  }

  /**
   * 创建 API 端点
   * 
   * @description 根据权限、路径、方法等信息创建 API 端点对象，并添加到端点数组
   * 
   * @param permissions - 权限数组
   * @param cleanedPath - 清理后的路径
   * @param methodType - HTTP 方法类型
   * @param controllerName - 控制器名称
   * @param summary - API 摘要描述
   * @param endpoints - API 端点数组，用于收集端点信息
   */
  private createEndpoints(
    permissions: Permission[],
    cleanedPath: string,
    methodType: any,
    controllerName: string,
    summary: string,
    endpoints: ApiEndpoint[],
  ) {
    permissions.forEach((permission) => {
      const action = permission.action;
      const resource = permission.resource;
      const id = crypto
        .createHash('md5')
        .update(
          JSON.stringify({
            action,
            resource,
            path: cleanedPath,
            method: RequestMethod[methodType],
          }),
        )
        .digest('hex');

      endpoints.push(
        new ApiEndpoint(
          id,
          cleanedPath,
          RequestMethod[methodType],
          action,
          resource,
          controllerName,
          summary,
        ),
      );
    });
  }
}
