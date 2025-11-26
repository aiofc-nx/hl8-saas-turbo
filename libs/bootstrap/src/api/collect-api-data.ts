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

import { Permission, PERMISSIONS_METADATA } from '@hl8/casbin';
import {
  EVENT_API_ROUTE_COLLECTED,
  FUNCTION,
  METHOD,
  PATH,
  SWAGGER_API_OPERATION,
} from '@hl8/constants';
import { isMainCluster } from '@hl8/utils';

/**
 * API 端点接口
 *
 * @description 定义 API 端点的数据结构，用于解耦应用层依赖
 */
export interface IApiEndpoint {
  id: string;
  path: string;
  method: string;
  action: string;
  resource: string;
  controllerName: string;
  summary?: string;
}

/**
 * API 数据服务
 *
 * @description 在模块初始化时收集所有 API 端点信息，包括路径、方法、权限等，并发送事件通知
 *
 * @remarks
 * ## 工作机制
 *
 * 本服务实现了 NestJS 应用启动时的 API 端点自动发现与注册机制，主要流程如下：
 *
 * 1. **初始化触发**：实现 `OnModuleInit` 接口，在 NestJS 模块初始化完成后自动执行
 * 2. **模块遍历**：通过 `ModulesContainer` 遍历所有已注册的 NestJS 模块
 * 3. **控制器扫描**：从每个模块中提取所有控制器实例
 * 4. **反射元数据提取**：使用 TypeScript 反射机制读取装饰器元数据：
 *    - 控制器路径（`@Controller()` 装饰器）
 *    - 路由方法路径（`@Get()`, `@Post()` 等装饰器）
 *    - HTTP 方法类型（GET, POST, PUT, DELETE 等）
 *    - 权限信息（Casbin 权限装饰器）
 *    - Swagger API 描述信息
 * 5. **路径拼接与清理**：合并控制器路径和方法路径，规范化路径格式
 * 6. **端点对象创建**：为每个权限组合创建 `IApiEndpoint` 对象，生成唯一 MD5 ID
 * 7. **事件通知**：通过 `EventEmitter2` 发送 `EVENT_API_ROUTE_COLLECTED` 事件，通知其他模块
 *
 * ## 技术要点
 *
 * - **反射机制**：使用 `Reflect.getMetadata` 读取 NestJS 装饰器注入的元数据
 * - **事件驱动**：采用事件发布-订阅模式，解耦端点收集与消费逻辑
 * - **唯一标识**：通过路径、方法、权限组合生成 MD5 哈希值作为端点唯一 ID
 * - **集群控制**：仅在主集群实例执行，避免多实例重复收集
 * - **异步处理**：使用 `setImmediate` 延迟事件发送，确保所有模块完全初始化
 *
 * ## 使用场景
 *
 * - 权限系统：将 API 端点自动注册到权限管理系统
 * - API 文档：自动生成完整的 API 端点列表
 * - 审计日志：记录所有可用的 API 端点用于审计
 * - 路由分析：分析应用的路由结构和权限配置
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
   *
   * @remarks
   * ## 执行机制
   *
   * 1. **集群检查**：仅在主集群实例执行，避免多实例环境下的重复收集
   * 2. **模块遍历**：通过 `modulesContainer.forEach` 遍历所有已注册的 NestJS 模块
   * 3. **控制器提取**：从每个模块的 `controllers` Map 中提取所有控制器实例包装器
   * 4. **递归处理**：对每个控制器调用 `processController` 方法进行深度扫描
   * 5. **异步事件发送**：使用 `setImmediate` 将事件发送推迟到下一个事件循环，确保：
   *    - 所有模块的初始化流程完全完成
   *    - 所有控制器的元数据都已正确注入
   *    - 避免在初始化过程中触发其他模块的依赖
   *
   * ## 事件通知
   *
   * 收集完成后发送 `EVENT_API_ROUTE_COLLECTED` 事件，携带所有收集到的端点数组。
   * 其他订阅该事件的模块可以：
   * - 将端点信息持久化到数据库
   * - 同步到权限管理系统
   * - 生成 API 文档
   * - 进行路由分析
   */
  onModuleInit() {
    // 仅在主集群实例执行，避免多实例重复收集
    if (isMainCluster) {
      try {
        const endpoints: IApiEndpoint[] = [];
        // 遍历所有已注册的 NestJS 模块
        this.modulesContainer.forEach((module: Module) => {
          try {
            // 从模块中提取所有控制器实例包装器
            const controllers = Array.from(module.controllers.values());
            // 处理每个控制器，收集其路由方法
            controllers.forEach((controller) => {
              try {
                this.processController(controller, endpoints);
              } catch (error) {
                // 单个控制器处理失败不影响其他控制器
                this.logger.warn(
                  `Failed to process controller: ${controller.metatype?.name || 'unknown'}`,
                  error instanceof Error ? error.stack : String(error),
                );
              }
            });
          } catch (error) {
            // 单个模块处理失败不影响其他模块
            this.logger.warn(
              `Failed to process module: ${module.name || 'unknown'}`,
              error instanceof Error ? error.stack : String(error),
            );
          }
        });

        // 使用 setImmediate 延迟事件发送，确保所有模块完全初始化
        setImmediate(() => {
          try {
            this.logger.log(`Emitting ${endpoints.length} API endpoints`);
            // 发送 API 端点收集完成事件，通知其他模块
            this.eventEmitter.emit(EVENT_API_ROUTE_COLLECTED, endpoints);
          } catch (error) {
            // 事件发送失败不应阻止应用启动
            this.logger.error(
              'Failed to emit API route collected event',
              error instanceof Error ? error.stack : String(error),
            );
          }
        });
      } catch (error) {
        // 端点收集过程中的严重错误不应阻止应用启动
        this.logger.error(
          'Failed to collect API endpoints during module initialization',
          error instanceof Error ? error.stack : String(error),
        );
      }
    }
  }

  /**
   * 处理单个控制器
   *
   * @description 从控制器中提取所有路由方法并处理
   *
   * @remarks
   * ## 处理机制
   *
   * 1. **实例获取**：从 `InstanceWrapper` 中提取控制器实例对象
   * 2. **原型链访问**：通过 `Object.getPrototypeOf` 获取控制器的原型对象，用于访问类方法
   * 3. **元数据提取**：
   *    - 控制器名称：从 `metatype.name` 获取类名
   *    - 控制器路径：通过反射读取 `@Controller()` 装饰器注入的路径元数据
   * 4. **方法扫描**：
   *    - 使用 `Object.getOwnPropertyNames` 获取原型上的所有属性名
   *    - 过滤出函数类型的方法（排除属性、getter/setter 等）
   *    - 对每个路由方法调用 `processMethod` 进行详细处理
   *
   * ## 技术细节
   *
   * - 使用 `Reflect.getMetadata(PATH, ...)` 读取装饰器元数据，这是 NestJS 装饰器系统注入的元数据
   * - 通过原型链访问确保能获取到类中定义的所有方法，包括继承的方法
   * - 过滤条件 `typeof instance[method] === FUNCTION` 确保只处理真正的函数方法
   *
   * @param controller - 控制器实例包装器，包含控制器实例和元类型信息
   * @param endpoints - API 端点数组，用于收集端点信息
   */
  private processController(
    controller: InstanceWrapper<object>,
    endpoints: IApiEndpoint[],
  ) {
    // 防御性检查：确保控制器和端点数组有效
    if (!controller || !endpoints) {
      return;
    }

    // 获取控制器实例对象
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const instance: Record<string, any> = controller.instance;
    if (!instance) {
      return;
    }

    try {
      // 获取控制器原型对象，用于访问类方法
      const prototype = Object.getPrototypeOf(instance);
      if (!prototype) {
        return;
      }

      // 获取控制器类名
      const controllerName = controller.metatype?.name || '';
      // 通过反射读取 @Controller() 装饰器注入的路径元数据
      const controllerPath =
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        Reflect.getMetadata(PATH, controller.metatype as any) || '';

      // 获取原型上的所有属性名，过滤出函数类型的方法，然后处理每个路由方法
      const methodNames = Object.getOwnPropertyNames(prototype);
      if (!Array.isArray(methodNames) || methodNames.length === 0) {
        return;
      }

      methodNames
        .filter((method) => {
          // 防御性检查：确保方法是函数类型且实例中存在
          return (
            typeof method === 'string' &&
            method.length > 0 &&
            typeof instance[method] === FUNCTION
          );
        })
        .forEach((method) => {
          try {
            this.processMethod(
              method,
              instance,
              controllerPath,
              controllerName,
              endpoints,
            );
          } catch (error) {
            // 单个方法处理失败不影响其他方法
            this.logger.warn(
              `Failed to process method ${method} in controller ${controllerName}`,
              error instanceof Error ? error.stack : String(error),
            );
          }
        });
    } catch (error) {
      // 控制器处理过程中的异常不应影响其他控制器
      this.logger.warn(
        `Failed to process controller: ${controller.metatype?.name || 'unknown'}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  /**
   * 处理控制器中的每个方法
   *
   * @description 从路由方法中提取路径、方法类型、权限等信息，并创建 API 端点
   *
   * @remarks
   * ## 元数据提取机制
   *
   * 1. **路由路径提取**：使用 `Reflect.getMetadata(PATH, ...)` 读取路由装饰器（如 `@Get('/users')`）注入的路径
   * 2. **HTTP 方法提取**：使用 `Reflect.getMetadata(METHOD, ...)` 读取 HTTP 方法类型（GET, POST, PUT, DELETE 等）
   * 3. **权限信息提取**：使用 NestJS 的 `Reflector` 服务读取 Casbin 权限装饰器注入的权限元数据
   * 4. **Swagger 描述提取**：读取 Swagger `@ApiOperation()` 装饰器注入的 API 摘要信息
   *
   * ## 路径处理机制
   *
   * 1. **路径拼接**：将控制器路径和方法路径进行拼接
   * 2. **路径规范化**：
   *    - 使用正则 `/\/+/g` 将多个连续斜杠替换为单个斜杠
   *    - 使用正则 `/\/$/` 移除路径末尾的斜杠
   * 3. **空路径处理**：如果方法没有路径装饰器，则只使用控制器路径
   *
   * ## 过滤机制
   *
   * 如果方法没有 HTTP 方法装饰器（`methodType === undefined`），说明不是路由方法，直接跳过。
   * 这确保了只处理真正的 API 端点方法，忽略普通辅助方法。
   *
   * @param method - 方法名称
   * @param instance - 控制器实例，用于访问方法对象
   * @param controllerPath - 控制器路径（从 @Controller() 装饰器获取）
   * @param controllerName - 控制器名称（类名）
   * @param endpoints - API 端点数组，用于收集端点信息
   */
  private processMethod(
    method: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    instance: Record<string, any>,
    controllerPath: string,
    controllerName: string,
    endpoints: IApiEndpoint[],
  ) {
    // 防御性检查：确保参数有效
    if (
      !method ||
      typeof method !== 'string' ||
      !instance ||
      !endpoints ||
      !Array.isArray(endpoints)
    ) {
      return;
    }

    // 确保方法在实例中存在
    if (!instance[method] || typeof instance[method] !== 'function') {
      return;
    }

    try {
      // 通过反射读取路由装饰器（@Get, @Post 等）注入的路径元数据
      const methodPath = Reflect.getMetadata(PATH, instance[method]) || '';
      // 通过反射读取 HTTP 方法类型元数据
      const methodType = Reflect.getMetadata(METHOD, instance[method]);
      // 如果不是路由方法（没有 HTTP 方法装饰器），则跳过
      if (methodType === undefined || methodType === null) {
        return;
      }

      // 使用 Reflector 服务读取 Casbin 权限装饰器注入的权限元数据
      // 如果没有权限装饰器，则使用默认空权限
      let permissions: Permission[];
      try {
        const extractedPermissions = this.reflector.get(
          PERMISSIONS_METADATA,
          instance[method],
        );
        permissions =
          Array.isArray(extractedPermissions) && extractedPermissions.length > 0
            ? extractedPermissions
            : [{ action: '', resource: '' }];
      } catch (_error) {
        // 权限提取失败时使用默认权限
        this.logger.warn(
          `Failed to extract permissions for method ${method} in controller ${controllerName}`,
        );
        permissions = [{ action: '', resource: '' }];
      }

      // 确保权限数组有效
      if (!Array.isArray(permissions) || permissions.length === 0) {
        permissions = [{ action: '', resource: '' }];
      }

      // 拼接控制器路径和方法路径，并规范化路径格式
      // 1. 将多个连续斜杠替换为单个斜杠
      // 2. 移除路径末尾的斜杠
      const pathToClean =
        (controllerPath || '') + (methodPath ? '/' + methodPath : '');
      const cleanedPath =
        pathToClean.replace(/\/+/g, '/').replace(/\/$/, '') || '/';

      // 读取 Swagger @ApiOperation() 装饰器注入的 API 摘要信息
      let summary = '';
      try {
        const swaggerOperation = Reflect.getMetadata(
          SWAGGER_API_OPERATION,
          instance[method],
        );
        summary =
          swaggerOperation && typeof swaggerOperation === 'object'
            ? swaggerOperation.summary || ''
            : '';
      } catch (_error) {
        // Swagger 元数据提取失败不影响端点创建
        summary = '';
      }

      // 根据提取的信息创建 API 端点对象
      this.createEndpoints(
        permissions,
        cleanedPath,
        methodType,
        controllerName || 'UnknownController',
        summary || '',
        endpoints,
      );
    } catch (error) {
      // 方法处理过程中的异常不应影响其他方法
      this.logger.warn(
        `Failed to process method ${method} in controller ${controllerName}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  /**
   * 创建 API 端点
   *
   * @description 根据权限、路径、方法等信息创建 API 端点对象，并添加到端点数组
   *
   * @remarks
   * ## 端点创建机制
   *
   * 1. **权限遍历**：一个路由方法可能关联多个权限（通过多个权限装饰器），为每个权限创建独立的端点对象
   * 2. **唯一 ID 生成**：使用 MD5 哈希算法为每个端点生成唯一标识符
   * 3. **ID 生成规则**：基于以下字段的组合生成哈希值：
   *    - `action`：权限操作（如 'read', 'write', 'delete'）
   *    - `resource`：权限资源（如 'user', 'order'）
   *    - `path`：API 路径（如 '/api/users'）
   *    - `method`：HTTP 方法（如 'GET', 'POST'）
   * 4. **端点对象创建**：创建 `IApiEndpoint` 对象
   * 5. **数组收集**：将创建的端点对象添加到端点数组中
   *
   * ## 唯一性保证
   *
   * 通过 MD5 哈希确保相同路径、方法、权限组合的端点具有相同的 ID，避免重复注册。
   * 哈希算法保证了：
   * - 相同输入始终产生相同输出
   * - 不同输入产生不同输出的概率极高
   * - 固定长度输出（32 个十六进制字符）
   *
   * ## 权限与端点关系
   *
   * 一个路由方法可以关联多个权限，每个权限都会创建一个独立的端点记录。
   * 这种设计支持：
   * - 细粒度权限控制（同一接口不同权限）
   * - 权限审计（记录所有权限关联的端点）
   * - 动态权限管理（可以单独管理每个权限-端点对）
   *
   * @param permissions - 权限数组，每个权限都会创建一个端点对象
   * @param cleanedPath - 清理后的路径（已规范化，无多余斜杠）
   * @param methodType - HTTP 方法类型（NestJS RequestMethod 枚举值）
   * @param controllerName - 控制器名称（类名，用于标识端点来源）
   * @param summary - API 摘要描述（从 Swagger 装饰器获取）
   * @param endpoints - API 端点数组，用于收集端点信息
   */
  private createEndpoints(
    permissions: Permission[],
    cleanedPath: string,
    methodType: RequestMethod,
    controllerName: string,
    summary: string,
    endpoints: IApiEndpoint[],
  ) {
    // 防御性检查：确保参数有效
    if (
      !Array.isArray(permissions) ||
      permissions.length === 0 ||
      !endpoints ||
      !Array.isArray(endpoints) ||
      typeof cleanedPath !== 'string' ||
      typeof controllerName !== 'string'
    ) {
      return;
    }

    // 确保 methodType 有效
    if (
      methodType === undefined ||
      methodType === null ||
      !RequestMethod[methodType]
    ) {
      return;
    }

    const methodName = RequestMethod[methodType];
    if (!methodName || typeof methodName !== 'string') {
      return;
    }

    // 遍历每个权限，为每个权限创建独立的端点对象
    permissions.forEach((permission) => {
      try {
        // 防御性检查：确保权限对象有效
        if (!permission || typeof permission !== 'object') {
          return;
        }

        const action = permission.action || '';
        const resource = permission.resource || '';

        // 生成端点的唯一 ID：使用 MD5 哈希算法对权限、路径、方法的组合进行哈希
        // 确保相同配置的端点具有相同的 ID，避免重复注册
        let id: string;
        try {
          id = crypto
            .createHash('md5')
            .update(
              JSON.stringify({
                action,
                resource,
                path: cleanedPath,
                method: methodName,
              }),
            )
            .digest('hex');
        } catch (_error) {
          // MD5 哈希生成失败时使用备用方案
          this.logger.warn(
            `Failed to generate MD5 hash for endpoint: ${cleanedPath}`,
          );
          // 使用简单的字符串拼接作为备用 ID（不推荐，但比失败好）
          id = `${action}-${resource}-${cleanedPath}-${methodName}`.replace(
            /[^a-zA-Z0-9-]/g,
            '-',
          );
        }

        // 创建 API 端点对象并添加到数组
        endpoints.push({
          id,
          path: cleanedPath,
          method: methodName,
          action,
          resource,
          controllerName: controllerName || 'UnknownController',
          summary: summary || '',
        });
      } catch (error) {
        // 单个权限端点创建失败不影响其他权限
        this.logger.warn(
          `Failed to create endpoint for permission: ${JSON.stringify(permission)}`,
          error instanceof Error ? error.stack : String(error),
        );
      }
    });
  }
}
