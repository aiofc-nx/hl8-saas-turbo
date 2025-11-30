# API 端点（API Endpoint）有界上下文详细设计文档

## 1. 概述

### 1.1 业务背景

API 端点是后端接口的抽象表示，用于 Casbin 权限控制和接口管理。系统在启动时会自动收集所有 API 路由并保存到数据库，支持动态权限管理和接口发现。

### 1.2 核心功能

- **自动端点收集：** 系统启动时自动收集所有 API 路由并保存到数据库
- **端点查询：** 支持分页查询、按 ID 列表查询、树形结构查询
- **权限控制：** 与 Casbin 权限系统集成，支持基于端点的权限管理
- **端点管理：** 提供端点的增删改查功能，支持按路径、方法、操作、资源筛选

### 1.3 技术架构

本模块采用 **Clean Architecture + CQRS + 事件驱动架构（EDA）** 模式：

- **Clean Architecture：** 分层架构，领域层独立于基础设施层
- **CQRS：** 命令查询职责分离，查询用于读操作
- **事件驱动：** 通过事件实现端点自动收集和同步
- **端口适配器模式：** 通过端口接口定义仓储契约，由基础设施层实现

## 2. 领域层（Domain Layer）

领域层是 API 端点有界上下文的核心业务逻辑层，包含领域模型、业务规则和领域概念。

**详细文档**：请参阅 [领域层开发文档](./domain/README.md)

领域层包含以下组件：

- **聚合根（Aggregate Root）**：`ApiEndpoint` - API 端点的领域模型
- **读模型（Read Model）**：`EndpointReadModel` - 用于查询和展示的模型
- **类型定义（Type Definitions）**：端点属性的类型定义

### 2.1 聚合根

#### ApiEndpoint（API 端点聚合根）

API 端点的领域聚合根，继承自 `AggregateRoot`，表示一个后端 API 接口。

**属性：**

| 属性名       | 类型                  | 说明                                             |
| ------------ | --------------------- | ------------------------------------------------ |
| `id`         | `string`              | API 端点的唯一标识符                             |
| `path`       | `string`              | API 端点的 URL 路径，例如 "/user" 或 "/user/:id" |
| `method`     | `string`              | HTTP 方法，例如：GET、POST、PUT、DELETE          |
| `action`     | `string`              | 操作类型，例如：read、write、delete              |
| `resource`   | `string`              | 资源类型，例如：user、role、domain               |
| `controller` | `string`              | 处理该 API 端点的控制器名称                      |
| `summary`    | `string \| undefined` | API 端点的简要描述信息，可选                     |

**使用场景：**

- 系统启动时自动收集并保存所有 API 端点
- 用于 Casbin 权限规则配置
- 用于接口文档生成和展示
- 用于权限分配和管理

### 2.2 读模型

#### EndpointReadModel（端点读模型）

用于 API 响应的端点读取模型，包含端点的完整信息。

**属性：**

- `id: string` - API 端点的唯一标识符
- `path: string` - API 端点的 URL 路径
- `method: string` - HTTP 方法
- `action: string` - 操作类型
- `resource: string` - 资源类型
- `controller: string` - 控制器名称
- `summary: string | null` - 摘要描述
- `createdAt: Date` - 创建时间
- `updatedAt: Date | null` - 最后更新时间

#### EndpointTreeProperties（端点树形属性）

用于树形结构的端点属性，包含子节点数组。

**属性：**

- 继承自 `EndpointProperties`
- `children?: EndpointTreeProperties[]` - 子节点数组，用于构建树形结构

**使用场景：**

- 按控制器分组展示端点
- 权限分配界面展示
- 接口文档树形展示

### 2.3 类型定义

#### EndpointEssentialProperties（端点必需属性）

定义端点的必需属性，所有字段均为只读且必需。

#### EndpointProperties（端点完整属性）

包含端点的所有属性，继承自必需属性。

## 3. 应用层（Application Layer）

应用层是 API 端点有界上下文的核心业务编排层，负责协调领域对象完成业务用例。

**详细文档**：请参阅 [应用层开发文档](./application/README.md)

应用层包含以下组件：

- **查询处理器（Query Handlers）**：实现查询用例，负责数据查询
  - `EndpointsQueryHandler`：端点树形查询处理器
  - `FindEndpointsByIdsQueryHandler`：根据 ID 列表查询处理器
  - `PageEndpointsQueryHandler`：分页查询处理器
- **事件处理器（Event Handlers）**：实现事件处理用例，负责处理领域事件
  - `ApiEndpointEventHandler`：API 端点事件处理器
- **应用服务（Application Services）**：实现服务用例，负责复杂业务流程编排
  - `CasbinRuleApiEndpointService`：Casbin 规则查询服务

## 4. 查询层（Queries Layer）

查询层是 API 端点有界上下文的查询对象定义层，遵循 CQRS 模式，定义了所有查询操作的查询对象。

**详细文档**：请参阅 [查询层开发文档](./queries/README.md)

查询层包含以下查询对象：

- **EndpointsQuery**：端点树形查询
- **FindEndpointsByIdsQuery**：根据 ID 列表查询
- **PageEndpointsQuery**：分页查询

### 4.1 EndpointsQuery（端点查询）

**用途：** 查询所有需要权限控制的 API 端点，返回树形结构

**参数：** 无

**返回：** `Readonly<EndpointTreeProperties[]> | []`

**处理逻辑：**

1. 查询所有需要权限控制的端点
2. 按控制器分组组织成树形结构
3. 每个控制器作为父节点，其下的端点作为子节点

**查询处理器：** `EndpointsQueryHandler`

**使用场景：**

- 权限分配界面展示所有可分配的端点
- 接口文档树形展示
- 权限管理界面

### 4.2 FindEndpointsByIdsQuery（根据 ID 列表查询端点）

**用途：** 根据端点 ID 列表批量查询 API 端点信息

**参数：**

- `ids: string[]` - 要查询的端点 ID 数组

**返回：** `EndpointProperties[]`

**处理逻辑：**

1. 根据 ID 列表批量查询端点
2. 返回端点属性数组（不存在的 ID 不会包含在结果中）

**查询处理器：** `FindEndpointsByIdsQueryHandler`

**使用场景：**

- 权限分配时获取指定的端点详情
- 批量操作时获取端点信息

### 4.3 PageEndpointsQuery（分页查询端点）

**用途：** 分页查询 API 端点列表，支持多条件筛选

**参数：**

- `page: number` - 页码（继承自 `PaginationParams`）
- `pageSize: number` - 每页大小（继承自 `PaginationParams`）
- `path?: string` - 路径筛选条件，支持模糊查询，可选
- `method?: string` - HTTP 方法筛选条件，可选（GET、POST、PUT、DELETE 等）
- `action?: string` - 操作类型筛选条件，可选（read、write、delete 等）
- `resource?: string` - 资源类型筛选条件，可选（user、role、domain 等）

**返回：** `PaginationResult<EndpointProperties>`

**查询处理器：** `PageEndpointsQueryHandler`

**使用场景：**

- 端点管理界面列表展示
- 端点搜索和筛选
- 接口文档列表展示

## 5. 事件处理器（Event Handlers）

### 4.1 ApiEndpointEventHandler（API 端点事件处理器）

**监听事件：** `EVENT_API_ROUTE_COLLECTED`（来自 `@hl8/constants`）

**处理逻辑：**

1. 接收系统启动时收集到的所有 API 端点
2. 批量保存到数据库
3. 记录处理日志

**事件处理方式：**

该处理器实现了两种事件监听方式：

1. **使用 @OnEvent 装饰器（标准方式）**
2. **手动注册事件监听器（备用方式）**

**为什么需要两种方式？**

在某些情况下，`@OnEvent` 装饰器可能不生效，特别是在模块初始化顺序导致事件在处理器注册之前就已经发射的情况下。手动注册事件监听器可以确保能够捕获到事件。

**替代解决方案：**

在 `app.module.ts` 中将 `BootstrapModule` 放在最后，这样在模块初始化时，`EVENT_API_ROUTE_COLLECTED` 事件已经 emit 了。

**处理流程：**

```
系统启动
  ↓
收集所有 API 路由
  ↓
发射 EVENT_API_ROUTE_COLLECTED 事件
  ↓
ApiEndpointEventHandler 接收事件
  ↓
批量保存端点到数据库
  ↓
记录日志
```

## 6. 服务（Services）

### 5.1 CasbinRuleApiEndpointService（Casbin 规则 API 端点服务）

**用途：** 查询 Casbin 权限规则，用于权限验证和授权管理

**方法：**

#### authApiEndpoint(roleCode: string, domain: string)

**功能：** 根据角色代码和域查询 API 端点权限规则

**参数：**

- `roleCode: string` - 角色代码
- `domain: string` - 域代码，用于多租户隔离

**返回：** Casbin 规则列表

**Casbin 规则格式：**

```
p, roleCode, resource, action, domain
```

其中：

- `ptype='p'` 表示策略规则
- `v0=roleCode` 表示角色
- `v1=resource` 表示资源
- `v2=action` 表示操作
- `v3=domain` 表示域

**使用场景：**

- 权限验证时查询角色拥有的端点权限
- 权限管理界面展示角色的权限规则
- 权限分配时查询现有权限

## 7. 端口层（Ports Layer）

端口层是 API 端点有界上下文的接口定义层，遵循端口适配器模式，定义了应用层需要的数据访问接口。

**详细文档**：请参阅 [端口层开发文档](./ports/README.md)

端口层包含以下组件：

- **写入仓储端口**：`ApiEndpointWriteRepoPort` - 定义写入操作接口
- **读取仓储端口**：`ApiEndpointReadRepoPort` - 定义读取操作接口
- **端口令牌**：用于依赖注入的符号令牌

### 7.1 ApiEndpointWriteRepoPort（写入仓储端口）

**接口定义：**

```typescript
interface ApiEndpointWriteRepoPort {
  save(endpoints: ApiEndpoint[]): Promise<void>;
}
```

**方法说明：**

- `save(endpoints: ApiEndpoint[])`: 批量保存 API 端点到数据库

**实现位置：** 基础设施层（Infrastructure Layer）

**使用场景：**

- 系统启动时批量保存收集到的端点
- 端点信息更新时保存

### 7.2 ApiEndpointReadRepoPort（读取仓储端口）

**接口定义：**

```typescript
interface ApiEndpointReadRepoPort {
  pageEndpoints(
    query: PageEndpointsQuery,
  ): Promise<PaginationResult<EndpointProperties>>;
  findEndpointsByIds(ids: string[]): Promise<EndpointProperties[]>;
  findAll(): Promise<EndpointProperties[]>;
  findAllPermissionApi(): Promise<EndpointProperties[]>;
}
```

**方法说明：**

- `pageEndpoints(query: PageEndpointsQuery)`: 分页查询端点列表，支持多条件筛选
- `findEndpointsByIds(ids: string[])`: 根据 ID 列表批量查询端点
- `findAll()`: 查询所有端点
- `findAllPermissionApi()`: 查询所有需要权限控制的端点

**实现位置：** 基础设施层（Infrastructure Layer）

## 8. 模块配置

### 7.1 ApiEndpointModule（API 端点模块）

**模块类型：** 动态模块（Dynamic Module）

**注册方式：**

```typescript
ApiEndpointModule.register({
  inject: [
    {
      provide: ApiEndpointReadRepoPortToken,
      useClass: ApiEndpointReadPostgresRepository,
    },
    {
      provide: ApiEndpointWriteRepoPortToken,
      useClass: ApiEndpointWritePostgresRepository,
    },
  ],
  imports: [MikroOrmModule],
});
```

**注册内容：**

- **查询处理器：** `EndpointsQueryHandler`, `FindEndpointsByIdsQueryHandler`, `PageEndpointsQueryHandler`
- **事件处理器：** `ApiEndpointEventHandler`
- **服务：** `CasbinRuleApiEndpointService`
- **仓储实现：** 由基础设施层注入

**导出：** 查询处理器和服务（供其他模块使用）

## 9. 使用示例

### 9.1 查询所有端点（树形结构）

```typescript
// 通过查询总线发送查询
const query = new EndpointsQuery();
const result = await queryBus.execute(query);
// result: EndpointTreeProperties[]
// 按控制器分组，每个控制器包含其下的所有端点
```

### 9.2 根据 ID 列表查询端点

```typescript
// 通过查询总线发送查询
const query = new FindEndpointsByIdsQuery(['endpoint-id-1', 'endpoint-id-2']);
const result = await queryBus.execute(query);
// result: EndpointProperties[]
```

### 9.3 分页查询端点

```typescript
// 通过查询总线发送查询
const query = new PageEndpointsQuery({
  page: 1,
  pageSize: 10,
  path: '/user',
  method: 'GET',
  action: 'read',
  resource: 'user',
});

const result = await queryBus.execute(query);
// result.data: EndpointProperties[]
// result.total: number
// result.page: number
// result.pageSize: number
```

### 9.4 查询角色的端点权限

```typescript
// 注入 CasbinRuleApiEndpointService
const rules = await casbinRuleApiEndpointService.authApiEndpoint(
  'admin',
  'example.com',
);
// rules: CasbinRule[]
// 包含该角色在该域下的所有权限规则
```

### 9.5 在基础设施层注册模块

```typescript
@Module({
  imports: [
    ApiEndpointModule.register({
      inject: [
        {
          provide: ApiEndpointReadRepoPortToken,
          useClass: ApiEndpointReadPostgresRepository,
        },
        {
          provide: ApiEndpointWriteRepoPortToken,
          useClass: ApiEndpointWritePostgresRepository,
        },
      ],
      imports: [MikroOrmModule],
    }),
  ],
})
export class ApiEndpointInfraModule {}
```

## 10. 端点自动收集机制

### 10.1 收集流程

```
应用启动
  ↓
BootstrapModule 初始化
  ↓
扫描所有控制器和路由
  ↓
解析路由信息（路径、方法、操作、资源等）
  ↓
创建 ApiEndpoint 聚合根数组
  ↓
发射 EVENT_API_ROUTE_COLLECTED 事件
  ↓
ApiEndpointEventHandler 接收事件
  ↓
批量保存到数据库
```

### 10.2 端点信息解析

端点信息从以下来源解析：

- **路径（path）：** 从路由装饰器获取，例如 `@Get('/user')`
- **方法（method）：** 从 HTTP 方法装饰器获取，例如 `@Get()`, `@Post()`
- **操作（action）：** 从元数据或约定获取，例如 read、write、delete
- **资源（resource）：** 从控制器名称或元数据获取，例如 user、role
- **控制器（controller）：** 从控制器类名获取
- **摘要（summary）：** 从 Swagger 装饰器获取，例如 `@ApiOperation({ summary: '...' })`

### 10.3 端点唯一性

端点的唯一性由以下组合确定：

- `path` + `method`

即同一个路径的不同 HTTP 方法被视为不同的端点。

## 11. 权限控制集成

### 11.1 Casbin 规则格式

API 端点与 Casbin 权限系统集成，规则格式为：

```
p, roleCode, resource, action, domain
```

**示例：**

```
p, admin, user, read, example.com
p, admin, user, write, example.com
p, user, user, read, example.com
```

### 11.2 权限验证流程

```
API 请求
  ↓
提取请求路径和方法
  ↓
查找对应的端点（path + method）
  ↓
获取端点的 resource 和 action
  ↓
查询 Casbin 规则（roleCode, resource, action, domain）
  ↓
验证权限
  ↓
允许或拒绝请求
```

### 11.3 权限分配

权限分配时：

1. 选择角色和域
2. 选择要分配的端点（通过 `EndpointsQuery` 获取树形结构）
3. 创建 Casbin 规则（p, roleCode, resource, action, domain）
4. 保存到 Casbin 规则表

## 12. 性能优化

### 12.1 批量保存

- 系统启动时一次性批量保存所有端点，避免多次数据库操作
- 使用事务确保数据一致性

### 12.2 查询优化

- 分页查询支持索引优化
- 按 ID 列表查询支持批量查询优化
- 树形结构查询在应用层构建，减少数据库查询次数

### 12.3 缓存策略

- 端点信息相对稳定，可以考虑缓存
- 权限规则查询频繁，建议使用缓存

## 13. 扩展点

### 13.1 端点版本管理

当前版本不支持端点版本管理，未来可扩展：

- 支持端点版本号
- 支持端点变更历史
- 支持端点废弃标记

### 13.2 端点分组

当前版本按控制器分组，未来可扩展：

- 支持自定义分组
- 支持多级分组
- 支持分组权限

### 13.3 端点统计

当前版本不支持端点统计，未来可扩展：

- 端点调用次数统计
- 端点响应时间统计
- 端点错误率统计

### 13.4 端点文档

当前版本支持摘要信息，未来可扩展：

- 完整的 API 文档生成
- 参数和返回值说明
- 示例代码生成

## 14. 依赖关系

### 14.1 内部依赖

- `@hl8/rest`: 分页参数和结果类型
- `@hl8/constants`: 事件常量
- `@mikro-orm/core`: ORM 核心（用于 CasbinRuleApiEndpointService）

### 14.2 外部依赖

- `@nestjs/common`: NestJS 核心模块
- `@nestjs/cqrs`: CQRS 模式支持
- `@nestjs/event-emitter`: 事件发射器
- `@nestjs/swagger`: API 文档支持

## 15. 测试建议

### 15.1 单元测试

- 测试聚合根的业务逻辑
- 测试查询处理器的查询逻辑
- 测试事件处理器的事件处理逻辑
- 测试服务的业务逻辑

### 15.2 集成测试

- 测试端点自动收集的完整流程
- 测试查询的完整流程
- 测试事件处理的完整流程
- 测试仓储接口的实现

### 15.3 端到端测试

- 测试端点自动收集和保存
- 测试端点查询的完整 API 流程
- 测试权限控制的完整流程
- 测试树形结构构建的正确性

## 16. 注意事项

### 16.1 事件处理时机

- 确保 `ApiEndpointEventHandler` 在 `EVENT_API_ROUTE_COLLECTED` 事件发射之前注册
- 如果使用装饰器方式，注意模块初始化顺序
- 建议使用手动注册方式作为备用方案

### 16.2 端点唯一性

- 端点的唯一性由 `path + method` 确定
- 确保同一路径的不同方法被视为不同端点
- 路径参数（如 `/user/:id`）需要正确处理

### 16.3 权限规则同步

- 端点信息变更时，需要同步更新相关的 Casbin 规则
- 删除端点时，需要清理相关的权限规则

### 16.4 多租户隔离

- 权限规则包含域信息，确保多租户隔离
- 查询端点时需要考虑域权限

## 17. 变更历史

| 版本 | 日期 | 变更说明                                         | 作者 |
| ---- | ---- | ------------------------------------------------ | ---- |
| 1.0  | -    | 初始版本，实现端点的自动收集、查询和权限控制集成 | -    |
