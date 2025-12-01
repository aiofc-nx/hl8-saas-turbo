# 访问密钥（Access Key）有界上下文详细设计文档

## 1. 概述

### 1.1 业务背景

访问密钥（Access Key）是用于 API 调用认证的凭证系统，支持多租户场景。每个访问密钥由一对密钥 ID（AccessKeyID）和密钥值（AccessKeySecret）组成，用于在 API 调用时进行身份验证。

### 1.2 核心功能

- **创建访问密钥**：生成唯一的密钥 ID 和密钥值，用于 API 认证
- **删除访问密钥**：删除指定的访问密钥，使其立即失效
- **查询访问密钥**：支持分页查询和条件筛选（按域、状态）
- **密钥同步**：将密钥信息同步到 API 密钥服务，支持实时认证
- **引导加载**：应用启动时将所有密钥加载到内存，提升认证性能

### 1.3 技术架构

本模块采用 **Clean Architecture + CQRS + 事件驱动架构（EDA）** 模式：

- **Clean Architecture**：分层架构，领域层独立于基础设施层
- **CQRS**：命令查询职责分离，命令用于写操作，查询用于读操作
- **事件驱动**：通过领域事件实现模块间解耦和异步处理
- **端口适配器模式**：通过端口接口定义仓储契约，由基础设施层实现

## 2. 领域层（Domain Layer）

领域层是访问密钥有界上下文的核心业务逻辑层，包含领域模型、业务规则和领域概念。

**详细文档**：请参阅 [领域层开发文档](./domain/README.md)

领域层包含以下组件：

- **聚合根（Aggregate Root）**：`AccessKey` - 访问密钥的领域模型
- **读模型（Read Model）**：`AccessKeyReadModel` - 用于查询和展示的模型（不包含敏感信息）
- **领域事件（Domain Events）**：`AccessKeyCreatedEvent`、`AccessKeyDeletedEvent`
- **类型定义（Type Definitions）**：访问密钥属性的类型定义

### 2.1 聚合根

#### AccessKey（访问密钥聚合根）

访问密钥的领域聚合根，继承自 `AggregateRoot`，负责管理访问密钥的生命周期和业务规则。

**属性：**

| 属性名            | 类型             | 说明                                                 |
| ----------------- | ---------------- | ---------------------------------------------------- |
| `id`              | `string`         | 访问密钥的唯一标识符（ULID）                         |
| `domain`          | `string`         | 访问密钥所属的域代码，用于多租户隔离                 |
| `AccessKeyID`     | `string`         | 用于 API 认证的密钥 ID（ULID）                       |
| `AccessKeySecret` | `string`         | 用于 API 认证的密钥值（ULID）                        |
| `status`          | `Status`         | 访问密钥状态：`ENABLED`（启用）或 `DISABLED`（禁用） |
| `description`     | `string \| null` | 访问密钥的描述信息，可选                             |
| `createdAt`       | `Date`           | 创建时间                                             |
| `createdBy`       | `string`         | 创建者用户 ID                                        |

**领域方法：**

- `created()`: 发布 `AccessKeyCreatedEvent` 事件
- `deleted()`: 发布 `AccessKeyDeletedEvent` 事件
- `commit()`: 提交所有待处理的领域事件到事件总线

**静态方法：**

- `fromProp(properties: AccessKeyProperties): AccessKey`: 从属性对象创建聚合根实例

### 2.2 领域事件

#### AccessKeyCreatedEvent（访问密钥创建事件）

当访问密钥被创建时发布的领域事件。

**事件属性：**

- `domain: string` - 访问密钥所属的域代码
- `AccessKeyID: string` - 访问密钥 ID
- `AccessKeySecret: string` - 访问密钥值
- `status: Status` - 访问密钥状态

**事件处理：**

- `AccessKeyCreatedHandler`: 将密钥信息同步到 API 密钥服务

#### AccessKeyDeletedEvent（访问密钥删除事件）

当访问密钥被删除时发布的领域事件。

**事件属性：**

- `domain: string` - 访问密钥所属的域代码
- `AccessKeyID: string` - 访问密钥 ID
- `AccessKeySecret: string` - 访问密钥值
- `status: Status` - 访问密钥状态

**事件处理：**

- `AccessKeyDeletedHandler`: 从 API 密钥服务中移除密钥

### 2.3 读模型

#### AccessKeyReadModel（访问密钥读模型）

用于 API 响应的访问密钥读取模型，**不包含敏感信息**（如 `AccessKeySecret`）。

**属性：**

- `id: string` - 访问密钥的唯一标识符
- `domain: string` - 访问密钥所属的域代码
- `AccessKeyID: string` - 访问密钥 ID
- `status: Status` - 访问密钥状态
- `description: string | null` - 访问密钥描述

## 3. 命令（Commands）

### 3.1 AccessKeyCreateCommand（创建访问密钥命令）

**用途：** 创建新的访问密钥

**参数：**

- `domain: string` - 访问密钥所属的域代码
- `description: string | null` - 访问密钥的描述信息，可为空
- `uid: string` - 创建者的用户 ID，用于审计追踪

**处理流程：**

1. 生成唯一的密钥 ID 和密钥值（使用 ULID）
2. 设置密钥状态为 `ENABLED`
3. 保存到数据库
4. 发布 `AccessKeyCreatedEvent` 事件

**命令处理器：** `AccessKeyCreateHandler`

### 3.2 AccessKeyDeleteCommand（删除访问密钥命令）

**用途：** 删除指定的访问密钥

**参数：**

- `id: string` - 要删除的访问密钥的唯一标识符

**处理流程：**

1. 验证访问密钥是否存在
2. 从数据库删除访问密钥
3. 发布 `AccessKeyDeletedEvent` 事件

**异常：**

- `BadRequestException`: 当访问密钥不存在时抛出

**命令处理器：** `AccessKeyDeleteHandler`

## 4. 查询（Queries）

### 4.1 PageAccessKeysQuery（分页查询访问密钥）

**用途：** 分页查询访问密钥列表

**参数：**

- `page: number` - 页码（继承自 `PaginationParams`）
- `pageSize: number` - 每页大小（继承自 `PaginationParams`）
- `domain?: string` - 域筛选条件，可选
- `status?: Status` - 状态筛选条件，可选（`ENABLED` 或 `DISABLED`）

**返回：** `PaginationResult<AccessKeyReadModel>`

**查询处理器：** `PageAccessKeysQueryHandler`

**权限说明：**

- 非内置域用户只能查询自己域下的密钥
- 内置域用户可以查询所有域的密钥

### 4.2 AccessBootstrapQueryHandler（引导查询处理器）

**用途：** 应用启动时加载所有访问密钥到内存

**处理流程：**

1. 查询所有访问密钥
2. 将密钥信息添加到简单 API 密钥服务和复杂 API 密钥服务
3. 记录加载日志

**特性：**

- 在模块初始化时自动执行（实现 `OnModuleInit`）
- 如果查询失败，记录警告但不阻塞应用启动
- 提升 API 认证性能，避免每次认证都查询数据库

## 5. 事件处理器（Event Handlers）

### 5.1 AccessKeyCreatedHandler（访问密钥创建事件处理器）

**监听事件：** `AccessKeyCreatedEvent`

**处理逻辑：**

1. 将密钥 ID 添加到简单 API 密钥服务（`SimpleApiKeyService`）
2. 将密钥 ID 和密钥值添加到复杂 API 密钥服务（`ComplexApiKeyService`）
3. 记录日志

**目的：** 确保新创建的密钥可以立即用于 API 认证

### 5.2 AccessKeyDeletedHandler（访问密钥删除事件处理器）

**监听事件：** `AccessKeyDeletedEvent`

**处理逻辑：**

1. 从简单 API 密钥服务中移除密钥 ID
2. 从复杂 API 密钥服务中移除密钥 ID
3. 记录日志

**目的：** 确保删除的密钥立即失效，无法再用于 API 认证

### 5.3 ApiKeyValidationEventHandler（API 密钥验证事件处理器）

**监听事件：** `EVENT_API_KEY_VALIDATED`（来自 `@hl8/constants`）

**处理逻辑：**

- 当前为 TODO 状态，用于处理 API 密钥验证相关的事件

## 6. 仓储接口（Repository Ports）

### 6.1 AccessKeyWriteRepoPort（写入仓储端口）

**接口定义：**

```typescript
interface AccessKeyWriteRepoPort {
  save(accessKey: AccessKey): Promise<void>;
  deleteById(id: string): Promise<void>;
}
```

**方法说明：**

- `save(accessKey: AccessKey)`: 保存或更新访问密钥到数据库
- `deleteById(id: string)`: 根据 ID 删除访问密钥

**实现位置：** 基础设施层（Infrastructure Layer）

### 6.2 AccessKeyReadRepoPort（读取仓储端口）

**接口定义：**

```typescript
interface AccessKeyReadRepoPort {
  getAccessKeyById(id: string): Promise<Readonly<AccessKeyProperties> | null>;
  pageAccessKeys(
    query: PageAccessKeysQuery,
  ): Promise<PaginationResult<AccessKeyReadModel>>;
  findAll(): Promise<AccessKeyProperties[]>;
}
```

**方法说明：**

- `getAccessKeyById(id: string)`: 根据 ID 获取访问密钥，不存在返回 `null`
- `pageAccessKeys(query: PageAccessKeysQuery)`: 分页查询访问密钥列表
- `findAll()`: 查询所有访问密钥（用于引导加载）

**实现位置：** 基础设施层（Infrastructure Layer）

## 7. 模块配置

### 7.1 AccessKeyModule（访问密钥模块）

**模块类型：** 动态模块（Dynamic Module）

**注册方式：**

```typescript
AccessKeyModule.register({
  inject: [
    {
      provide: AccessKeyReadRepoPortToken,
      useClass: AccessKeyReadPostgresRepository,
    },
    {
      provide: AccessKeyWriteRepoPortToken,
      useClass: AccessKeyWritePostgresRepository,
    },
  ],
  imports: [MikroOrmModule],
});
```

**注册内容：**

- **命令处理器：** `AccessKeyCreateHandler`, `AccessKeyDeleteHandler`
- **查询处理器：** `PageAccessKeysQueryHandler`, `AccessBootstrapQueryHandler`
- **事件处理器：** `AccessKeyCreatedHandler`, `AccessKeyDeletedHandler`, `ApiKeyValidationEventHandler`
- **仓储实现：** 由基础设施层注入

**导出：** 查询处理器（供其他模块使用）

## 8. 使用示例

### 8.1 创建访问密钥

```typescript
// 通过命令总线发送创建命令
const command = new AccessKeyCreateCommand(
  'example.com',
  '用于 API 调用的访问密钥',
  'user-123',
);

await commandBus.execute(command);
```

### 8.2 删除访问密钥

```typescript
// 通过命令总线发送删除命令
const command = new AccessKeyDeleteCommand('access-key-id-123');

await commandBus.execute(command);
```

### 8.3 分页查询访问密钥

```typescript
// 通过查询总线发送查询
const query = new PageAccessKeysQuery({
  page: 1,
  pageSize: 10,
  domain: 'example.com',
  status: Status.ENABLED,
});

const result = await queryBus.execute(query);
// result.data: AccessKeyReadModel[]
// result.total: number
// result.page: number
// result.pageSize: number
```

### 8.4 在基础设施层注册模块

```typescript
@Module({
  imports: [
    AccessKeyModule.register({
      inject: [
        {
          provide: AccessKeyReadRepoPortToken,
          useClass: AccessKeyReadPostgresRepository,
        },
        {
          provide: AccessKeyWriteRepoPortToken,
          useClass: AccessKeyWritePostgresRepository,
        },
      ],
      imports: [MikroOrmModule],
    }),
  ],
})
export class AccessKeyInfraModule {}
```

## 9. 安全考虑

### 9.1 密钥安全

- **密钥生成：** 使用 ULID 生成器生成唯一的密钥 ID 和密钥值
- **密钥存储：** 密钥值以加密形式存储在数据库中
- **密钥传输：** 密钥值仅在创建时返回一次，后续查询不返回密钥值
- **密钥泄露：** 如果密钥泄露，应立即删除并创建新密钥

### 9.2 多租户隔离

- 每个访问密钥关联到特定的域（`domain`）
- 非内置域用户只能查询和管理自己域下的密钥
- 域信息在创建时设置，不可修改

### 9.3 状态管理

- 访问密钥支持启用（`ENABLED`）和禁用（`DISABLED`）状态
- 禁用的密钥无法用于 API 认证
- 删除操作会立即使密钥失效

## 10. 性能优化

### 10.1 内存缓存

- 应用启动时通过 `AccessBootstrapQueryHandler` 将所有密钥加载到内存
- 密钥信息存储在 `SimpleApiKeyService` 和 `ComplexApiKeyService` 中
- 避免每次 API 认证都查询数据库，提升认证性能

### 10.2 事件驱动

- 密钥的创建和删除通过事件异步处理
- 事件处理器负责同步密钥信息到认证服务
- 降低命令处理的响应时间

## 11. 扩展点

### 11.1 密钥验证事件

`ApiKeyValidationEventHandler` 当前为 TODO 状态，可用于：

- 记录密钥验证日志
- 统计密钥使用情况
- 实现密钥使用限制
- 发送安全告警

### 11.2 密钥轮换

当前版本不支持密钥轮换，未来可扩展：

- 支持密钥自动过期
- 支持密钥续期
- 支持密钥历史记录

### 11.3 密钥权限

当前版本所有密钥权限相同，未来可扩展：

- 支持为密钥分配特定权限
- 支持密钥作用域限制
- 支持密钥使用频率限制

## 12. 依赖关系

### 12.1 内部依赖

- `@hl8/rest`: 分页参数和结果类型
- `@hl8/utils`: ULID 生成器
- `@hl8/guard`: API 密钥服务接口
- `@hl8/constants`: 事件常量
- `@hl8/typings`: 类型定义

### 12.2 外部依赖

- `@nestjs/common`: NestJS 核心模块
- `@nestjs/cqrs`: CQRS 模式支持
- `@nestjs/event-emitter`: 事件发射器
- `@nestjs/swagger`: API 文档支持

## 13. 测试建议

### 13.1 单元测试

- 测试聚合根的业务逻辑（创建、删除事件发布）
- 测试命令处理器的业务逻辑
- 测试查询处理器的查询逻辑
- 测试事件处理器的同步逻辑

### 13.2 集成测试

- 测试命令和查询的完整流程
- 测试事件发布和处理的完整流程
- 测试仓储接口的实现

### 13.3 端到端测试

- 测试创建、删除、查询的完整 API 流程
- 测试密钥认证的完整流程
- 测试多租户隔离的正确性

## 14. 变更历史

| 版本 | 日期 | 变更说明                                     | 作者 |
| ---- | ---- | -------------------------------------------- | ---- |
| 1.0  | -    | 初始版本，实现访问密钥的创建、删除、查询功能 | -    |
