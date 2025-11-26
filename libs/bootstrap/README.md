# @hl8/bootstrap

NestJS 应用启动引导模块，提供 API 端点自动收集和 Swagger 文档初始化功能。

## 📋 项目概述

### 基本信息

- **包名**: `@hl8/bootstrap`
- **版本**: `1.0.0`
- **描述**: Bootstrap module for NestJS applications
- **位置**: `libs/bootstrap`

### 提供的功能

1. **`BootstrapModule`** - 引导模块，负责应用启动时的初始化工作
2. **`ApiDataService`** - API 数据服务，自动收集所有 API 端点信息
3. **`initDocSwagger`** - Swagger 文档初始化函数，配置和初始化 API 文档
4. **`IApiEndpoint`** - API 端点接口，定义端点的数据结构

## 🚀 快速开始

### 安装

该库是 monorepo 工作空间的一部分，通过 workspace 协议引用：

```json
{
  "dependencies": {
    "@hl8/bootstrap": "workspace:*"
  }
}
```

### 导入

```typescript
import {
  BootstrapModule,
  ApiDataService,
  initDocSwagger,
  IApiEndpoint,
} from '@hl8/bootstrap';
```

## 📚 API 文档

### BootstrapModule

引导模块，负责应用启动时的 API 端点收集和初始化。

#### 类签名

```typescript
@Global()
@Module({
  providers: [ApiDataService],
  exports: [ApiDataService],
})
export class BootstrapModule {}
```

#### 功能特性

- ✅ 全局模块，自动注册到应用
- ✅ 自动收集所有 API 端点信息
- ✅ 通过事件机制通知其他模块
- ✅ 支持集群环境，仅在主实例执行

#### 使用示例

```typescript
import { Module } from '@nestjs/common';
import { BootstrapModule } from '@hl8/bootstrap';

@Module({
  imports: [BootstrapModule],
  // ... 其他模块
})
export class AppModule {}
```

### ApiDataService

API 数据服务，在模块初始化时自动收集所有 API 端点信息。

#### 类签名

```typescript
@Injectable()
export class ApiDataService implements OnModuleInit {
  constructor(
    private readonly modulesContainer: ModulesContainer,
    private readonly reflector: Reflector,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  onModuleInit(): void;
}
```

#### 功能特性

- ✅ 自动扫描所有控制器和路由方法
- ✅ 提取路径、HTTP 方法、权限信息
- ✅ 生成唯一的端点 ID（MD5 哈希）
- ✅ 通过事件发送收集到的端点信息
- ✅ 支持集群环境，避免重复收集
- ✅ 完善的错误处理机制

#### 工作机制

1. **初始化触发**：实现 `OnModuleInit` 接口，在 NestJS 模块初始化完成后自动执行
2. **模块遍历**：通过 `ModulesContainer` 遍历所有已注册的 NestJS 模块
3. **控制器扫描**：从每个模块中提取所有控制器实例
4. **反射元数据提取**：使用 TypeScript 反射机制读取装饰器元数据
5. **路径拼接与清理**：合并控制器路径和方法路径，规范化路径格式
6. **端点对象创建**：为每个权限组合创建 `IApiEndpoint` 对象
7. **事件通知**：通过 `EventEmitter2` 发送 `EVENT_API_ROUTE_COLLECTED` 事件

### initDocSwagger

初始化 Swagger 文档的函数。

#### 函数签名

```typescript
export function initDocSwagger(
  app: INestApplication,
  configService: ConfigService<ConfigKeyPaths>,
  swaggerConfig?: ISwaggerConfig,
): void;
```

#### 参数说明

- `app`: NestJS 应用实例
- `configService`: 配置服务，用于获取应用配置
- `swaggerConfig`: 可选的 Swagger 配置，用于自定义文档信息

#### Swagger 配置接口

```typescript
export interface ISwaggerConfig {
  /** API 文档标题 */
  title?: string;
  /** API 文档描述 */
  description?: string;
  /** 服务条款 URL */
  termsOfService?: string;
  /** 联系信息 */
  contact?: {
    name?: string;
    url?: string;
    email?: string;
  };
  /** 许可证信息 */
  license?: {
    name: string;
    url: string;
  };
}
```

#### 使用示例

##### 基本使用（使用默认配置）

```typescript
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { initDocSwagger } from '@hl8/bootstrap';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // 使用默认配置初始化 Swagger
  initDocSwagger(app, configService);

  await app.listen(3000);
}
bootstrap();
```

##### 使用自定义配置

```typescript
import { initDocSwagger } from '@hl8/bootstrap';

// 使用自定义配置
initDocSwagger(app, configService, {
  title: 'My API Documentation',
  description: 'This is my custom API documentation',
  contact: {
    name: 'John Doe',
    email: 'john@example.com',
    url: 'https://example.com',
  },
  license: {
    name: 'MIT',
    url: 'https://opensource.org/licenses/MIT',
  },
});
```

### IApiEndpoint

API 端点接口，定义端点的数据结构。

#### 接口定义

```typescript
export interface IApiEndpoint {
  /** 端点唯一 ID（MD5 哈希） */
  id: string;
  /** API 路径 */
  path: string;
  /** HTTP 方法（GET, POST, PUT, DELETE 等） */
  method: string;
  /** 权限操作（如 'read', 'write', 'delete'） */
  action: string;
  /** 权限资源（如 'user', 'order'） */
  resource: string;
  /** 控制器名称（类名） */
  controllerName: string;
  /** API 摘要描述（从 Swagger 装饰器获取） */
  summary?: string;
}
```

## 🔔 事件订阅

### EVENT_API_ROUTE_COLLECTED

当 API 端点收集完成时，`ApiDataService` 会发送 `EVENT_API_ROUTE_COLLECTED` 事件。

#### 事件数据

事件携带一个 `IApiEndpoint[]` 数组，包含所有收集到的 API 端点信息。

#### 订阅示例

```typescript
import { Injectable, OnModuleInit } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { EVENT_API_ROUTE_COLLECTED } from '@hl8/constants';
import { IApiEndpoint } from '@hl8/bootstrap';

@Injectable()
export class ApiRouteListener implements OnModuleInit {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  onModuleInit() {
    // 方式 1: 使用装饰器订阅
    this.eventEmitter.on(
      EVENT_API_ROUTE_COLLECTED,
      (endpoints: IApiEndpoint[]) => {
        console.log(`Collected ${endpoints.length} API endpoints`);

        // 将端点信息持久化到数据库
        // 同步到权限管理系统
        // 生成 API 文档
        // 进行路由分析
      },
    );
  }
}

// 方式 2: 使用装饰器订阅（推荐）
@Injectable()
export class ApiRouteHandler {
  @OnEvent(EVENT_API_ROUTE_COLLECTED)
  handleApiRouteCollected(endpoints: IApiEndpoint[]) {
    console.log(`Collected ${endpoints.length} API endpoints`);

    endpoints.forEach((endpoint) => {
      console.log(
        `- ${endpoint.method} ${endpoint.path} (${endpoint.action}:${endpoint.resource})`,
      );
    });
  }
}
```

#### 使用场景

- **权限系统**：将 API 端点自动注册到权限管理系统
- **API 文档**：自动生成完整的 API 端点列表
- **审计日志**：记录所有可用的 API 端点用于审计
- **路由分析**：分析应用的路由结构和权限配置

## ⚙️ 配置说明

### 环境变量

Swagger 文档的配置通过 `@hl8/config` 模块管理，相关环境变量：

- `DOC_SWAGGER_ENABLE`: 是否启用 Swagger 文档，默认 `true`
- `DOC_SWAGGER_PATH`: Swagger 文档路径，默认 `api-docs`
- `APP_PORT`: 应用端口，默认 `9528`

### 配置示例

```env
DOC_SWAGGER_ENABLE=true
DOC_SWAGGER_PATH=api-docs
APP_PORT=9528
```

## 🔧 高级用法

### 自定义端点处理

如果需要自定义端点处理逻辑，可以订阅 `EVENT_API_ROUTE_COLLECTED` 事件：

```typescript
@Injectable()
export class CustomApiRouteProcessor {
  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly apiRouteRepository: ApiRouteRepository,
  ) {}

  onModuleInit() {
    this.eventEmitter.on(
      EVENT_API_ROUTE_COLLECTED,
      async (endpoints: IApiEndpoint[]) => {
        // 自定义处理逻辑
        for (const endpoint of endpoints) {
          await this.apiRouteRepository.upsert({
            id: endpoint.id,
            path: endpoint.path,
            method: endpoint.method,
            action: endpoint.action,
            resource: endpoint.resource,
            controllerName: endpoint.controllerName,
            summary: endpoint.summary,
          });
        }
      },
    );
  }
}
```

### 集群环境

在集群环境中，`ApiDataService` 会自动检测主集群实例，仅在主实例执行端点收集，避免重复收集。这是通过 `isMainCluster` 工具函数实现的。

## 🧪 测试

运行测试：

```bash
# 运行所有测试
pnpm test

# 运行测试并生成覆盖率报告
pnpm test:cov

# 监视模式运行测试
pnpm test:watch
```

## 📝 注意事项

1. **集群环境**：端点收集仅在主集群实例执行，确保不会重复收集
2. **事件发送时机**：使用 `setImmediate` 延迟事件发送，确保所有模块完全初始化
3. **错误处理**：端点收集过程中的错误不会阻止应用启动，只会记录警告日志
4. **权限装饰器**：确保控制器方法使用了 Casbin 权限装饰器（`@UsePermissions`），否则将使用默认空权限
5. **Swagger 装饰器**：使用 `@ApiOperation()` 装饰器可以为端点添加摘要信息

## 🤝 贡献

欢迎提交 Issue 和 Pull Request。

## 📄 许可证

本项目采用项目根目录的许可证。
