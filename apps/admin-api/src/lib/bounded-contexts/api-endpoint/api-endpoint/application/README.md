# API 端点应用层（Application Layer）开发文档

## 1. 概述

应用层（Application Layer）是 API 端点有界上下文的核心业务编排层，负责协调领域对象完成业务用例。本层采用 **CQRS（命令查询职责分离）模式**和**事件驱动架构（EDA）**，将业务用例分为三类：

- **查询用例（Query Use Case）**：通过 Query Handler 实现，负责数据查询
- **事件处理用例（Event Handling Use Case）**：通过 Event Handler 实现，负责处理领域事件
- **服务用例（Service Use Case）**：通过 Application Service 实现，负责复杂业务流程编排

### 1.1 目录结构

```
application/
├── query-handlers/          # 查询处理器（Query Handlers）
│   ├── endpoints.query.handler.ts              # 端点树形查询处理器
│   ├── endpoints.by-ids.query.handler.ts       # 根据 ID 列表查询处理器
│   ├── page-endpoints.query.handler.ts         # 分页查询处理器
│   └── index.ts                                # 导出文件
├── event-handlers/          # 事件处理器（Event Handlers）
│   ├── api-endpoint.event.handler.ts           # API 端点事件处理器
│   └── index.ts                                # 导出文件
├── service/                 # 应用服务（Application Services）
│   ├── casbin-rule-api-endpoint.service.ts    # Casbin 规则查询服务
│   └── index.ts                                # 导出文件
└── README.md                # 本文档
```

### 1.2 架构原则

1. **单一职责**：每个 Handler 或 Service 只负责一个业务用例
2. **依赖抽象**：通过端口接口（Port）访问基础设施层，不直接依赖具体实现
3. **编排而非逻辑**：应用层只负责编排，业务逻辑在领域层
4. **可测试性**：所有组件都可以独立测试，通过 Mock 端口接口

## 2. 查询处理器（Query Handlers）

查询处理器实现**查询用例（Query Use Case）**，负责处理只读操作，不修改系统状态。

### 2.1 EndpointsQueryHandler（端点树形查询处理器）

#### 2.1.1 职责

- **查询用例**：查询所有需要权限控制的 API 端点，并组织成树形结构
- **业务场景**：权限分配界面展示、接口文档树形展示、权限管理界面

#### 2.1.2 实现细节

```typescript
@QueryHandler(EndpointsQuery)
export class EndpointsQueryHandler
  implements IQueryHandler<EndpointsQuery, Readonly<EndpointTreeProperties[]> | []>
{
  @Inject(ApiEndpointReadRepoPortToken)
  private readonly repository: ApiEndpointReadRepoPort;

  async execute(_: EndpointsQuery): Promise<Readonly<EndpointTreeProperties[]> | []> {
    const endpoints = await this.repository.findAllPermissionApi();
    return this.createEndpointTree(endpoints);
  }

  private createEndpointTree(endpoints: EndpointProperties[]): EndpointTreeProperties[] {
    // 按控制器分组，构建树形结构
  }
}
```

#### 2.1.3 处理流程

```
1. 接收 EndpointsQuery 查询对象
   ↓
2. 调用仓储接口查询所有需要权限控制的端点
   ↓
3. 将扁平化的端点列表转换为树形结构（按控制器分组）
   ↓
4. 返回树形结构的端点列表
```

#### 2.1.4 树形结构构建逻辑

- **父节点**：控制器（controller）作为父节点
- **子节点**：该控制器下的所有端点作为子节点
- **节点属性**：父节点包含控制器的基本信息，子节点包含端点的完整信息

**示例结构**：

```typescript
[
  {
    id: "controller-UserController",
    controller: "UserController",
    path: "",
    method: "",
    action: "",
    resource: "",
    summary: null,
    children: [
      {
        id: "endpoint-1",
        path: "/api/users",
        method: "GET",
        action: "read",
        resource: "user",
        controller: "UserController",
        summary: "查询用户列表",
        children: []
      },
      // ... 更多端点
    ]
  },
  // ... 更多控制器
]
```

#### 2.1.5 使用示例

```typescript
// 在 Controller 中使用
@Controller('api-endpoints')
export class ApiEndpointController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get('tree')
  async getEndpointsTree() {
    const query = new EndpointsQuery();
    return this.queryBus.execute(query);
  }
}
```

### 2.2 FindEndpointsByIdsQueryHandler（根据 ID 列表查询处理器）

#### 2.2.1 职责

- **查询用例**：根据端点 ID 列表批量查询 API 端点信息
- **业务场景**：权限分配时获取指定的端点详情、批量操作时获取端点信息

#### 2.2.2 实现细节

```typescript
@QueryHandler(FindEndpointsByIdsQuery)
export class FindEndpointsByIdsQueryHandler
  implements IQueryHandler<FindEndpointsByIdsQuery, EndpointProperties[]>
{
  @Inject(ApiEndpointReadRepoPortToken)
  private readonly repository: ApiEndpointReadRepoPort;

  async execute(query: FindEndpointsByIdsQuery): Promise<EndpointProperties[]> {
    return this.repository.findEndpointsByIds(query.ids);
  }
}
```

#### 2.2.3 处理流程

```
1. 接收 FindEndpointsByIdsQuery 查询对象（包含 ID 数组）
   ↓
2. 调用仓储接口根据 ID 列表批量查询端点
   ↓
3. 返回端点属性数组（不存在的 ID 不会包含在结果中）
```

#### 2.2.4 使用示例

```typescript
// 在 Controller 中使用
@Get('by-ids')
async getEndpointsByIds(@Query('ids') ids: string[]) {
  const query = new FindEndpointsByIdsQuery(ids);
  return this.queryBus.execute(query);
}
```

### 2.3 PageEndpointsQueryHandler（分页查询处理器）

#### 2.3.1 职责

- **查询用例**：分页查询 API 端点列表，支持多条件筛选
- **业务场景**：端点管理界面列表展示、端点搜索和筛选、接口文档列表展示

#### 2.3.2 实现细节

```typescript
@QueryHandler(PageEndpointsQuery)
export class PageEndpointsQueryHandler
  implements IQueryHandler<PageEndpointsQuery, PaginationResult<EndpointProperties>>
{
  @Inject(ApiEndpointReadRepoPortToken)
  private readonly repository: ApiEndpointReadRepoPort;

  async execute(query: PageEndpointsQuery): Promise<PaginationResult<EndpointProperties>> {
    return this.repository.pageEndpoints(query);
  }
}
```

#### 2.3.3 查询参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `page` | `number` | 是 | 页码（从 1 开始） |
| `pageSize` | `number` | 是 | 每页大小 |
| `path` | `string` | 否 | 路径筛选条件，支持模糊查询 |
| `method` | `string` | 否 | HTTP 方法筛选（GET、POST、PUT、DELETE 等） |
| `action` | `string` | 否 | 操作类型筛选（read、write、delete 等） |
| `resource` | `string` | 否 | 资源类型筛选（user、role、domain 等） |

#### 2.3.4 处理流程

```
1. 接收 PageEndpointsQuery 查询对象（包含分页参数和筛选条件）
   ↓
2. 调用仓储接口分页查询端点（仓储层处理筛选逻辑）
   ↓
3. 返回分页结果（包含端点列表和分页信息）
```

#### 2.3.5 使用示例

```typescript
// 在 Controller 中使用
@Get('page')
async pageEndpoints(
  @Query('page') page: number,
  @Query('pageSize') pageSize: number,
  @Query('path') path?: string,
  @Query('method') method?: string,
  @Query('action') action?: string,
  @Query('resource') resource?: string,
) {
  const query = new PageEndpointsQuery({
    page,
    pageSize,
    path,
    method,
    action,
    resource,
  });
  return this.queryBus.execute(query);
}
```

## 3. 事件处理器（Event Handlers）

事件处理器实现**事件处理用例（Event Handling Use Case）**，负责处理领域事件，通常是异步的、不阻塞主流程的操作。

### 3.1 ApiEndpointEventHandler（API 端点事件处理器）

#### 3.1.1 职责

- **事件处理用例**：处理系统启动时收集到的 API 端点，批量保存到数据库
- **业务场景**：系统启动时自动发现和注册 API 端点

#### 3.1.2 监听的事件

- **事件名称**：`EVENT_API_ROUTE_COLLECTED`（来自 `@hl8/constants`）
- **事件载荷**：`ApiEndpoint[]`（API 端点数组）

#### 3.1.3 实现细节

```typescript
@Injectable()
export class ApiEndpointEventHandler implements OnModuleInit {
  private readonly logger = new Logger(ApiEndpointEventHandler.name);

  constructor(
    @Inject(ApiEndpointWriteRepoPortToken)
    private readonly endpointWriteRepo: ApiEndpointWriteRepoPort,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  onModuleInit() {
    // 手动注册事件监听器（备用方案）
    this.eventEmitter.on(
      EVENT_API_ROUTE_COLLECTED,
      this.handleManually.bind(this),
    );
  }

  @OnEvent(EVENT_API_ROUTE_COLLECTED)
  async handle(payload: ApiEndpoint[]) {
    await this.endpointWriteRepo.save(payload);
  }
}
```

#### 3.1.4 双重事件监听机制

该处理器实现了**两种事件监听方式**：

1. **@OnEvent 装饰器（标准方式）**
   - 使用 NestJS 的 `@OnEvent` 装饰器自动注册事件监听器
   - 这是推荐的标准方式

2. **手动注册事件监听器（备用方式）**
   - 在 `onModuleInit()` 中手动注册事件监听器
   - 解决某些情况下装饰器不生效的问题

**为什么需要两种方式？**

在某些情况下，`@OnEvent` 装饰器可能不生效，特别是在模块初始化顺序导致事件在处理器注册之前就已经发射的情况下。手动注册事件监听器可以确保能够捕获到事件。

**替代解决方案**：

在 `app.module.ts` 中将 `BootstrapModule` 放在最后，这样在模块初始化时，`EVENT_API_ROUTE_COLLECTED` 事件已经 emit 了。

#### 3.1.5 处理流程

```
系统启动
  ↓
BootstrapModule 收集所有 API 路由
  ↓
发射 EVENT_API_ROUTE_COLLECTED 事件（包含 ApiEndpoint[]）
  ↓
ApiEndpointEventHandler 接收事件
  ↓
调用仓储接口批量保存端点到数据库
  ↓
记录处理日志（成功或失败）
```

#### 3.1.6 错误处理

- **成功**：记录成功日志，端点已保存到数据库
- **失败**：记录错误日志（包含错误堆栈），但不抛出异常（避免影响系统启动）

#### 3.1.7 注意事项

1. **模块初始化顺序**：确保事件处理器在事件发射之前注册
2. **事件处理时机**：事件处理是异步的，不阻塞系统启动
3. **数据一致性**：批量保存使用事务确保数据一致性

## 4. 应用服务（Application Services）

应用服务实现**服务用例（Service Use Case）**，负责复杂业务流程编排，通常涉及多个聚合或外部系统。

### 4.1 CasbinRuleApiEndpointService（Casbin 规则 API 端点服务）

#### 4.1.1 职责

- **服务用例**：查询 Casbin 权限规则，用于权限验证和授权管理
- **业务场景**：权限验证时查询角色拥有的端点权限、权限管理界面展示角色的权限规则

#### 4.1.2 实现细节

```typescript
@Injectable()
export class CasbinRuleApiEndpointService {
  constructor(private readonly em: EntityManager) {}

  async authApiEndpoint(roleCode: string, domain: string) {
    return this.em.find('CasbinRule', {
      ptype: 'p',
      v0: roleCode,
      v3: domain,
    } as FilterQuery<any>);
  }
}
```

#### 4.1.3 Casbin 规则格式

Casbin 规则格式为：

```
p, roleCode, resource, action, domain
```

**字段说明**：

| 字段 | 说明 | 示例 |
|------|------|------|
| `ptype` | 规则类型，'p' 表示策略规则 | `'p'` |
| `v0` | 角色代码（roleCode） | `'admin'` |
| `v1` | 资源类型（resource） | `'user'` |
| `v2` | 操作类型（action） | `'read'` |
| `v3` | 域代码（domain） | `'example.com'` |

**示例规则**：

```
p, admin, user, read, example.com
p, admin, user, write, example.com
p, user, user, read, example.com
```

#### 4.1.4 方法说明

##### authApiEndpoint(roleCode: string, domain: string)

**功能**：根据角色代码和域查询 API 端点权限规则

**参数**：

| 参数名 | 类型 | 说明 |
|--------|------|------|
| `roleCode` | `string` | 角色代码 |
| `domain` | `string` | 域代码，用于多租户隔离 |

**返回**：`Promise<CasbinRule[]>` - Casbin 规则列表

**查询条件**：

- `ptype = 'p'`：只查询策略规则
- `v0 = roleCode`：匹配指定的角色代码
- `v3 = domain`：匹配指定的域代码

#### 4.1.5 使用示例

```typescript
// 在权限验证服务中使用
@Injectable()
export class PermissionService {
  constructor(
    private readonly casbinRuleService: CasbinRuleApiEndpointService,
  ) {}

  async checkPermission(
    roleCode: string,
    domain: string,
    resource: string,
    action: string,
  ): Promise<boolean> {
    const rules = await this.casbinRuleService.authApiEndpoint(roleCode, domain);
    return rules.some(
      (rule) => rule.v1 === resource && rule.v2 === action,
    );
  }
}
```

#### 4.1.6 注意事项

1. **直接操作数据库**：该服务直接使用 `EntityManager` 操作 Casbin 规则表，不通过仓储接口
2. **多租户隔离**：查询时必须指定 `domain`，确保多租户数据隔离
3. **性能考虑**：权限规则查询频繁，建议使用缓存优化

## 5. 开发指南

### 5.1 创建新的查询处理器

#### 步骤 1：定义查询对象

```typescript
// queries/my-query.query.ts
import { IQuery } from '@nestjs/cqrs';

export class MyQuery implements IQuery {
  constructor(public readonly param1: string) {}
}
```

#### 步骤 2：创建查询处理器

```typescript
// query-handlers/my-query.handler.ts
import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ApiEndpointReadRepoPortToken } from '../../constants';
import type { ApiEndpointReadRepoPort } from '../../ports/api-endpoint.read.repo-port';
import { MyQuery } from '../../queries/my-query.query';

@QueryHandler(MyQuery)
export class MyQueryHandler implements IQueryHandler<MyQuery, ResultType> {
  @Inject(ApiEndpointReadRepoPortToken)
  private readonly repository: ApiEndpointReadRepoPort;

  async execute(query: MyQuery): Promise<ResultType> {
    // 1. 调用仓储接口查询数据
    // 2. 处理数据（如果需要）
    // 3. 返回结果
  }
}
```

#### 步骤 3：注册查询处理器

在 `ApiEndpointModule` 中注册：

```typescript
@Module({
  providers: [
    // ... 其他处理器
    MyQueryHandler,
  ],
})
export class ApiEndpointModule {}
```

### 5.2 创建新的事件处理器

#### 步骤 1：定义事件（如果还没有）

```typescript
// domain/events/my-event.event.ts
import { IEvent } from '@nestjs/cqrs';

export class MyEvent implements IEvent {
  constructor(public readonly data: any) {}
}
```

#### 步骤 2：创建事件处理器

```typescript
// event-handlers/my-event.handler.ts
import { Injectable } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { MyEvent } from '../../domain/events/my-event.event';

@EventsHandler(MyEvent)
@Injectable()
export class MyEventHandler implements IEventHandler<MyEvent> {
  async handle(event: MyEvent) {
    // 处理事件逻辑
  }
}
```

#### 步骤 3：注册事件处理器

在 `ApiEndpointModule` 中注册：

```typescript
@Module({
  providers: [
    // ... 其他处理器
    MyEventHandler,
  ],
})
export class ApiEndpointModule {}
```

### 5.3 创建新的应用服务

#### 步骤 1：创建服务类

```typescript
// service/my-service.service.ts
import { Injectable } from '@nestjs/common';

@Injectable()
export class MyService {
  constructor(
    // 注入依赖
  ) {}

  async doSomething(param: string): Promise<ResultType> {
    // 业务逻辑编排
  }
}
```

#### 步骤 2：注册服务

在 `ApiEndpointModule` 中注册并导出：

```typescript
@Module({
  providers: [
    // ... 其他服务
    MyService,
  ],
  exports: [
    // ... 其他导出
    MyService,
  ],
})
export class ApiEndpointModule {}
```

### 5.4 测试指南

#### 5.4.1 查询处理器测试

```typescript
describe('EndpointsQueryHandler', () => {
  let handler: EndpointsQueryHandler;
  let repository: jest.Mocked<ApiEndpointReadRepoPort>;

  beforeEach(() => {
    repository = {
      findAllPermissionApi: jest.fn(),
    } as any;

    handler = new EndpointsQueryHandler();
    (handler as any).repository = repository;
  });

  it('should return tree structure', async () => {
    // Arrange
    const endpoints = [/* mock data */];
    repository.findAllPermissionApi.mockResolvedValue(endpoints);

    // Act
    const result = await handler.execute(new EndpointsQuery());

    // Assert
    expect(result).toBeDefined();
    expect(repository.findAllPermissionApi).toHaveBeenCalled();
  });
});
```

#### 5.4.2 事件处理器测试

```typescript
describe('ApiEndpointEventHandler', () => {
  let handler: ApiEndpointEventHandler;
  let repository: jest.Mocked<ApiEndpointWriteRepoPort>;

  beforeEach(() => {
    repository = {
      save: jest.fn(),
    } as any;

    handler = new ApiEndpointEventHandler(repository, eventEmitter);
  });

  it('should save endpoints when event received', async () => {
    // Arrange
    const endpoints = [/* mock data */];

    // Act
    await handler.handle(endpoints);

    // Assert
    expect(repository.save).toHaveBeenCalledWith(endpoints);
  });
});
```

#### 5.4.3 应用服务测试

```typescript
describe('CasbinRuleApiEndpointService', () => {
  let service: CasbinRuleApiEndpointService;
  let em: jest.Mocked<EntityManager>;

  beforeEach(() => {
    em = {
      find: jest.fn(),
    } as any;

    service = new CasbinRuleApiEndpointService(em);
  });

  it('should query casbin rules', async () => {
    // Arrange
    const rules = [/* mock data */];
    em.find.mockResolvedValue(rules);

    // Act
    const result = await service.authApiEndpoint('admin', 'example.com');

    // Assert
    expect(result).toEqual(rules);
    expect(em.find).toHaveBeenCalledWith('CasbinRule', {
      ptype: 'p',
      v0: 'admin',
      v3: 'example.com',
    });
  });
});
```

## 6. 最佳实践

### 6.1 查询处理器最佳实践

1. **保持简单**：查询处理器只负责数据查询，不包含业务逻辑
2. **使用仓储接口**：通过端口接口访问数据，不直接操作数据库
3. **数据转换**：在应用层进行数据转换和格式化，领域层保持纯净
4. **错误处理**：查询失败时抛出适当的异常

### 6.2 事件处理器最佳实践

1. **幂等性**：事件处理器应该是幂等的，可以安全地重复执行
2. **异步处理**：事件处理应该是异步的，不阻塞主流程
3. **错误处理**：事件处理失败时记录日志，但不抛出异常（避免影响系统）
4. **事务处理**：如果需要保证数据一致性，使用事务

### 6.3 应用服务最佳实践

1. **编排而非逻辑**：应用服务只负责编排，业务逻辑在领域层
2. **单一职责**：每个服务方法只负责一个业务用例
3. **依赖注入**：通过依赖注入获取依赖，不直接创建对象
4. **可测试性**：所有依赖都可以通过 Mock 替换

## 7. 常见问题

### 7.1 事件处理器不生效？

**问题**：`@OnEvent` 装饰器不生效，事件没有被处理

**解决方案**：

1. **检查模块初始化顺序**：确保事件处理器在事件发射之前注册
2. **使用手动注册**：在 `onModuleInit()` 中手动注册事件监听器
3. **调整模块顺序**：在 `app.module.ts` 中将 `BootstrapModule` 放在最后

### 7.2 查询结果为空？

**问题**：查询返回空数组，但数据库中确实有数据

**排查步骤**：

1. 检查查询条件是否正确
2. 检查仓储接口实现是否正确
3. 检查数据库连接和查询语句
4. 添加日志输出调试信息

### 7.3 性能问题？

**问题**：查询或事件处理性能较差

**优化建议**：

1. **添加索引**：在数据库表上添加适当的索引
2. **使用缓存**：对频繁查询的数据使用缓存
3. **批量操作**：使用批量操作减少数据库交互
4. **分页查询**：对于大量数据，使用分页查询

## 8. 总结

应用层是 API 端点有界上下文的核心业务编排层，通过 CQRS 模式和事件驱动架构实现了清晰的职责分离：

- **查询处理器**：负责数据查询，不修改系统状态
- **事件处理器**：负责处理领域事件，通常是异步的
- **应用服务**：负责复杂业务流程编排

遵循本文档的开发指南和最佳实践，可以确保代码质量、可维护性和可测试性。

---

**文档版本**：v1.0.0  
**最后更新**：2024-01-XX  
**维护者**：开发团队

