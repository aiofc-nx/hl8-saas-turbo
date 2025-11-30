# Domain（域模块）开发档案

## 1. 模块概述

### 1.1 业务定位

Domain（域模块）是 IAM 有界上下文的基础子模块，负责 Casbin 域的生命周期管理。域是 Casbin 权限模型中的多租户隔离单位，用于实现不同租户之间的权限隔离。每个域拥有独立的权限策略、角色和用户，形成完全隔离的安全边界。

### 1.2 核心职责

- **域生命周期管理**：域的创建、更新、删除，支持域的启用和禁用
- **多租户隔离**：通过域代码实现不同租户之间的权限隔离
- **权限策略管理**：当域被删除时，自动清理该域下的所有 Casbin 权限策略
- **业务域标识**：为不同的业务域或租户提供唯一标识符

### 1.3 技术架构

本模块采用 **Clean Architecture + CQRS + 事件驱动架构（EDA）** 模式：

- **Clean Architecture**：领域层、应用层、基础设施层清晰分离
- **CQRS**：命令用于写操作（创建、更新、删除），查询用于读操作（查询域信息）
- **事件驱动**：通过领域事件实现模块间解耦和异步处理（如域删除后清理权限策略）
- **端口适配器模式**：通过端口接口定义仓储契约，由基础设施层实现

## 2. 目录结构

```
domain/
├── application/                    # 应用层
│   ├── command-handlers/          # 命令处理器
│   │   ├── domain-create.command.handler.ts
│   │   ├── domain-update.command.handler.ts
│   │   ├── domain-delete.command.handler.ts
│   │   └── index.ts
│   ├── query-handlers/            # 查询处理器
│   │   ├── domain.by-code.query.handler.ts
│   │   ├── page-domains-query.handler.ts
│   │   └── index.ts
│   └── event-handlers/            # 事件处理器
│       ├── domain-deleted.event.handler.ts
│       └── index.ts
├── domain/                        # 领域层
│   ├── domain.model.ts            # 域聚合根
│   ├── domain.read.model.ts       # 域读取模型
│   └── events/                    # 领域事件
│       └── domain-deleted.event.ts
├── commands/                      # 命令对象
│   ├── domain-create.command.ts
│   ├── domain-update.command.ts
│   └── domain-delete.command.ts
├── queries/                       # 查询对象
│   ├── domain.by-code.query.ts
│   └── page-domains.query.ts
├── ports/                         # 端口接口
│   ├── domain.read.repo-port.ts   # 域读取仓储端口
│   └── domain.write.repo-port.ts  # 域写入仓储端口
├── constants.ts                    # 常量定义
└── domain.module.ts                # 模块定义
```

## 3. 领域模型

### 3.1 Domain（域聚合根）

域聚合根是域模块的核心实体，负责管理域的生命周期和业务规则。

#### 3.1.1 属性定义

| 属性名        | 类型     | 说明                                     | 约束                                                |
| ------------- | -------- | ---------------------------------------- | --------------------------------------------------- |
| `id`          | `string` | 域的唯一标识符（ULID）                   | 必填，唯一                                          |
| `code`        | `string` | 域的唯一代码，用于标识不同的租户或业务域 | 必填，全局唯一                                      |
| `name`        | `string` | 域的显示名称                             | 必填                                                |
| `description` | `string` | 域的详细描述信息                         | 可选                                                |
| `status`      | `Status` | 域的状态                                 | 必填，可选值：`ENABLED`（启用）、`DISABLED`（禁用） |
| `createdAt`   | `Date`   | 创建时间                                 | 自动生成                                            |
| `createdBy`   | `string` | 创建者用户 ID                            | 必填                                                |
| `updatedAt`   | `Date`   | 更新时间                                 | 自动生成                                            |
| `updatedBy`   | `string` | 更新者用户 ID                            | 可选                                                |

#### 3.1.2 领域方法

##### `static fromCreate(properties: DomainCreateProperties): Domain`

从创建属性创建域实例。

**参数说明**：

- `properties`: 域创建属性对象，包含 `id`、`code`、`name`、`description`、`status`、`createdAt`、`createdBy`

**返回值**：域聚合根实例

**使用场景**：在创建新域时使用

**示例**：

```typescript
const domainCreateProperties: DomainCreateProperties = {
  id: UlidGenerator.generate(),
  code: 'tenant-001',
  name: '租户001',
  status: Status.ENABLED,
  description: '示例租户',
  createdAt: new Date(),
  createdBy: 'user-123',
};
const domain = Domain.fromCreate(domainCreateProperties);
```

##### `static fromUpdate(properties: DomainUpdateProperties): Domain`

从更新属性创建域实例。

**参数说明**：

- `properties`: 域更新属性对象，包含 `id`、`code`、`name`、`description`、`status`、`updatedAt`、`updatedBy`

**返回值**：域聚合根实例

**使用场景**：在更新现有域时使用

##### `static fromProp(properties: DomainProperties): Domain`

从完整属性创建域实例。

**参数说明**：

- `properties`: 域完整属性对象

**返回值**：域聚合根实例

**使用场景**：从数据库加载域数据时使用

##### `async deleted(): Promise<void>`

发布域删除事件。

**说明**：

- 当域被删除时，发布 `DomainDeletedEvent` 事件
- 该事件可以被其他有界上下文订阅，用于执行后续操作（如清理权限、通知等）

**使用场景**：在删除域后调用，触发相关清理工作

**示例**：

```typescript
const domain = Domain.fromProp(existingDomain);
await domain.deleted(); // 发布 DomainDeletedEvent
domain.commit(); // 提交事件到事件总线
```

##### `commit(): void`

提交领域事件到事件总线。

**说明**：

- 继承自 `AggregateRoot` 的方法
- 将所有待处理的领域事件提交到 NestJS CQRS 事件总线

**使用场景**：在处理完聚合根操作后调用，确保领域事件被发布

### 3.2 DomainProperties（域属性类型）

定义域的属性结构，用于数据传输和持久化。

#### 3.2.1 类型定义

```typescript
type DomainEssentialProperties = Readonly<
  Required<{
    id: string;
    code: string;
    name: string;
    description: string | null;
    status: Status;
  }>
>;

type DomainProperties = DomainEssentialProperties;
type DomainCreateProperties = DomainProperties & CreationAuditInfoProperties;
type DomainUpdateProperties = DomainProperties & UpdateAuditInfoProperties;
```

#### 3.2.2 DomainReadModel（域读取模型）

用于 API 响应和查询结果的数据传输对象。

**属性说明**：

- 继承自 `UpdateAuditInfo`，包含审计字段
- 使用 `@ApiProperty` 装饰器提供 Swagger 文档支持
- 所有字段均用于只读查询场景

## 4. 命令与处理器

### 4.1 DomainCreateCommand（域创建命令）

用于创建新的域。

#### 4.1.1 命令定义

```typescript
class DomainCreateCommand implements ICommand {
  readonly code: string; // 域的唯一代码
  readonly name: string; // 域的显示名称
  readonly description: string | null; // 域的详细描述
  readonly uid: string; // 创建者用户 ID
}
```

#### 4.1.2 DomainCreateHandler（域创建命令处理器）

**职责**：

- 验证域代码的唯一性
- 生成域 ID（ULID）
- 设置域状态为启用
- 创建域聚合根并保存到数据库

**业务流程**：

1. 检查域代码是否已存在，如果存在则抛出 `BadRequestException`
2. 生成域 ID（使用 ULID）
3. 设置域状态为 `ENABLED`
4. 创建域聚合根实例
5. 保存到数据库

**异常处理**：

- 当域代码已存在时，抛出 `BadRequestException`，错误消息：`A domain with code {code} already exists.`

**示例**：

```typescript
const command = new DomainCreateCommand(
  'tenant-001',
  '租户001',
  '示例租户描述',
  'user-123',
);
await commandBus.execute(command);
```

### 4.2 DomainUpdateCommand（域更新命令）

用于更新现有的域。

#### 4.2.1 命令定义

```typescript
class DomainUpdateCommand extends DomainCreateCommand implements ICommand {
  readonly id: string; // 要更新的域的唯一标识符
  // 继承自 DomainCreateCommand 的其他字段
}
```

#### 4.2.2 DomainUpdateHandler（域更新命令处理器）

**职责**：

- 验证域代码的唯一性（排除当前域）
- 更新域属性并保存到数据库

**业务流程**：

1. 检查域代码是否已被其他域使用，如果被其他域使用则抛出异常
2. 更新域属性（名称、描述、代码等）
3. 设置更新时间和更新者
4. 更新域聚合根实例
5. 保存到数据库

**异常处理**：

- 当域代码已被其他域使用时，抛出 `BadRequestException`，错误消息：`A domain with code {code} already exists.`

**示例**：

```typescript
const command = new DomainUpdateCommand(
  'domain-123',
  'tenant-001',
  '更新后的租户名称',
  '更新后的描述',
  'user-456',
);
await commandBus.execute(command);
```

### 4.3 DomainDeleteCommand（域删除命令）

用于删除指定的域。

#### 4.3.1 命令定义

```typescript
class DomainDeleteCommand implements ICommand {
  readonly id: string; // 要删除的域的唯一标识符
}
```

#### 4.3.2 DomainDeleteHandler（域删除命令处理器）

**职责**：

- 验证域是否存在
- 删除域记录
- 发布域删除事件，触发权限策略清理

**业务流程**：

1. 根据 ID 查询域是否存在，如果不存在则抛出异常
2. 从数据库删除域记录
3. 调用域的 `deleted()` 方法发布 `DomainDeletedEvent` 事件
4. 提交事件到事件总线

**异常处理**：

- 当域不存在时，抛出 `BadRequestException`，错误消息：`A domain with the specified ID does not exist.`

**事件发布**：

- 删除域后会自动发布 `DomainDeletedEvent` 事件
- 事件处理器会清理该域下的所有 Casbin 权限策略

**示例**：

```typescript
const command = new DomainDeleteCommand('domain-123');
await commandBus.execute(command);
// 自动触发 DomainDeletedEvent，清理权限策略
```

## 5. 查询与处理器

### 5.1 FindDomainByCodeQuery（根据代码查询域）

用于根据域代码查询域信息。

#### 5.1.1 查询定义

```typescript
class FindDomainByCodeQuery implements IQuery {
  readonly code: string; // 域的唯一代码
}
```

#### 5.1.2 FindDomainByCodeQueryHandler（查询处理器）

**职责**：

- 根据域代码查询域信息

**返回值**：

- `DomainProperties | null`：找到则返回域属性，未找到返回 `null`

**使用场景**：

- 验证域代码是否已存在
- 根据域代码加载域信息

**示例**：

```typescript
const query = new FindDomainByCodeQuery('tenant-001');
const domain = await queryBus.execute(query);
if (domain) {
  console.log(`找到域: ${domain.name}`);
}
```

### 5.2 PageDomainsQuery（域分页查询）

用于分页查询域列表，支持按名称和状态筛选。

#### 5.2.1 查询定义

```typescript
class PageDomainsQuery extends PaginationParams implements IQuery {
  readonly name?: string; // 域名称，支持模糊查询
  readonly status?: Status; // 域状态，可选值：ENABLED、DISABLED
  // 继承自 PaginationParams 的分页参数
}
```

#### 5.2.2 PageDomainsQueryHandler（查询处理器）

**职责**：

- 根据查询条件分页查询域列表

**返回值**：

- `PaginationResult<DomainProperties>`：包含域列表和分页信息

**筛选条件**：

- `name`：按名称模糊查询（可选）
- `status`：按状态精确筛选（可选）
- 分页参数：`page`、`pageSize`、`total` 等

**使用场景**：

- 域管理页面展示域列表
- 按条件搜索域

**示例**：

```typescript
const query = new PageDomainsQuery({
  page: 1,
  pageSize: 10,
  name: '租户',
  status: Status.ENABLED,
});
const result = await queryBus.execute(query);
console.log(`共 ${result.total} 个域，当前页：${result.data.length} 个`);
```

## 6. 领域事件

### 6.1 DomainDeletedEvent（域删除事件）

当域被删除时发布的领域事件。

#### 6.1.1 事件定义

```typescript
class DomainDeletedEvent implements IEvent {
  readonly domainId: string; // 被删除的域的唯一标识符
  readonly code: string; // 被删除的域的唯一代码
}
```

#### 6.1.2 DomainDeletedHandler（事件处理器）

**职责**：

- 清理被删除域下的所有 Casbin 权限策略

**业务流程**：

1. 接收 `DomainDeletedEvent` 事件
2. 调用 `AuthZManagementService.removeFilteredPolicy()` 方法
3. 使用域代码作为过滤条件，删除所有相关的权限策略
4. 记录日志

**技术实现**：

- 使用 Casbin 的 `removeFilteredPolicy` 方法，第 3 个参数为域代码，用于过滤要删除的策略

**使用场景**：

- 当域被删除时，自动清理该域下的所有权限策略，避免数据残留

**注意事项**：

- 该事件处理器会自动执行，无需手动调用
- 清理操作是异步的，不会阻塞域删除操作

## 7. 端口接口

### 7.1 DomainWriteRepoPort（域写入仓储端口）

定义域的写入操作接口，由基础设施层实现。

#### 7.1.1 接口定义

```typescript
interface DomainWriteRepoPort {
  save(domain: Domain): Promise<void>; // 保存或创建域
  update(domain: Domain): Promise<void>; // 更新域
  delete(domain: Domain): Promise<void>; // 删除域
}
```

#### 7.1.2 方法说明

##### `save(domain: Domain): Promise<void>`

保存或创建域到数据库。

- **参数**：`domain` - 域聚合根实例
- **行为**：如果是新记录则创建，如果是已存在的记录则更新
- **异常**：当保存操作失败时抛出异常

##### `update(domain: Domain): Promise<void>`

更新数据库中已存在的域记录。

- **参数**：`domain` - 域聚合根实例
- **异常**：当更新操作失败时抛出异常

##### `delete(domain: Domain): Promise<void>`

从数据库中删除指定的域记录。

- **参数**：`domain` - 域聚合根实例
- **异常**：当删除操作失败时抛出异常

### 7.2 DomainReadRepoPort（域读取仓储端口）

定义域的读取操作接口，由基础设施层实现。

#### 7.2.1 接口定义

```typescript
interface DomainReadRepoPort {
  getDomainById(id: string): Promise<Readonly<DomainProperties> | null>;
  getDomainByCode(code: string): Promise<Readonly<DomainProperties> | null>;
  pageDomains(
    query: PageDomainsQuery,
  ): Promise<PaginationResult<DomainProperties>>;
}
```

#### 7.2.2 方法说明

##### `getDomainById(id: string): Promise<Readonly<DomainProperties> | null>`

根据 ID 获取域信息。

- **参数**：`id` - 域的唯一标识符
- **返回值**：域属性对象，如果不存在则返回 `null`

##### `getDomainByCode(code: string): Promise<Readonly<DomainProperties> | null>`

根据代码获取域信息。

- **参数**：`code` - 域的唯一代码
- **返回值**：域属性对象，如果不存在则返回 `null`
- **用途**：域代码是域的唯一标识符，常用于验证和查询

##### `pageDomains(query: PageDomainsQuery): Promise<PaginationResult<DomainProperties>>`

分页查询域列表。

- **参数**：`query` - 分页查询对象，包含分页参数、名称和状态筛选条件
- **返回值**：分页结果，包含域列表和分页信息

## 8. 模块注册

### 8.1 DomainModule（域模块）

动态模块，用于注册域相关的处理器和依赖。

#### 8.1.1 模块定义

```typescript
@Module({})
export class DomainModule {
  static register(options: {
    inject: Provider[];
    imports: any[];
  }): DynamicModule;
}
```

#### 8.1.2 注册方式

在基础设施层通过 `register` 方法注册模块：

```typescript
DomainModule.register({
  imports: [
    /* 其他模块 */
  ],
  inject: [
    /* 仓储实现提供者 */
  ],
});
```

#### 8.1.3 提供的处理器

- **命令处理器**：`DomainCreateHandler`、`DomainUpdateHandler`、`DomainDeleteHandler`
- **查询处理器**：`FindDomainByCodeQueryHandler`、`PageDomainsQueryHandler`
- **事件处理器**：`DomainDeletedHandler`

#### 8.1.4 依赖注入令牌

- `DomainWriteRepoPortToken`：域写入仓储端口令牌
- `DomainReadRepoPortToken`：域读取仓储端口令牌

## 9. 业务规则

### 9.1 域代码唯一性规则

- **规则**：域代码必须在全局范围内唯一
- **验证时机**：创建域时和更新域时
- **异常处理**：如果域代码已存在，抛出 `BadRequestException`

### 9.2 域状态管理

- **默认状态**：新创建的域默认状态为 `ENABLED`（启用）
- **状态值**：
  - `ENABLED`：启用状态，域可以正常使用
  - `DISABLED`：禁用状态，域不可使用（当前版本暂未实现禁用逻辑）

### 9.3 域删除规则

- **前置条件**：域必须存在才能删除
- **删除后操作**：删除域后自动发布 `DomainDeletedEvent` 事件
- **权限清理**：事件处理器会自动清理该域下的所有 Casbin 权限策略
- **关联数据**：删除域前需要确保域下没有关联的用户、角色等资源（由调用方或基础设施层保证）

### 9.4 审计信息

- **创建审计**：创建域时必须记录 `createdAt` 和 `createdBy`
- **更新审计**：更新域时必须记录 `updatedAt` 和 `updatedBy`

## 10. 使用示例

### 10.1 创建域

```typescript
import { CommandBus } from '@nestjs/cqrs';
import { DomainCreateCommand } from './commands/domain-create.command';

// 在服务或控制器中
constructor(private readonly commandBus: CommandBus) {}

async createDomain(code: string, name: string, description: string, uid: string) {
  const command = new DomainCreateCommand(code, name, description, uid);
  await this.commandBus.execute(command);
}
```

### 10.2 更新域

```typescript
import { CommandBus } from '@nestjs/cqrs';
import { DomainUpdateCommand } from './commands/domain-update.command';

async updateDomain(
  id: string,
  code: string,
  name: string,
  description: string,
  uid: string
) {
  const command = new DomainUpdateCommand(id, code, name, description, uid);
  await this.commandBus.execute(command);
}
```

### 10.3 删除域

```typescript
import { CommandBus } from '@nestjs/cqrs';
import { DomainDeleteCommand } from './commands/domain-delete.command';

async deleteDomain(id: string) {
  const command = new DomainDeleteCommand(id);
  await this.commandBus.execute(command);
  // 自动触发 DomainDeletedEvent，清理权限策略
}
```

### 10.4 查询域

```typescript
import { QueryBus } from '@nestjs/cqrs';
import { FindDomainByCodeQuery } from './queries/domain.by-code.query';
import { PageDomainsQuery } from './queries/page-domains.query';

// 根据代码查询
async getDomainByCode(code: string) {
  const query = new FindDomainByCodeQuery(code);
  return await this.queryBus.execute(query);
}

// 分页查询
async pageDomains(page: number, pageSize: number, name?: string) {
  const query = new PageDomainsQuery({
    page,
    pageSize,
    name,
  });
  return await this.queryBus.execute(query);
}
```

## 11. 测试指南

### 11.1 单元测试

单元测试文件应放在与被测文件同目录下，命名为 `{filename}.spec.ts`。

#### 11.1.1 域聚合根测试

测试文件：`domain/domain.model.spec.ts`

**测试用例**：

- 测试 `fromCreate` 方法正确创建域实例
- 测试 `fromUpdate` 方法正确创建更新域实例
- 测试 `fromProp` 方法正确从属性创建域实例
- 测试 `deleted` 方法发布领域事件

**示例**：

```typescript
describe('Domain', () => {
  it('应该从创建属性创建域实例', () => {
    const properties: DomainCreateProperties = {
      id: '01ARZ3NDEKTSV4RRFFQ69G5FAV',
      code: 'tenant-001',
      name: '租户001',
      description: '示例租户',
      status: Status.ENABLED,
      createdAt: new Date(),
      createdBy: 'user-123',
    };
    const domain = Domain.fromCreate(properties);
    expect(domain.code).toBe('tenant-001');
    expect(domain.status).toBe(Status.ENABLED);
  });
});
```

#### 11.1.2 命令处理器测试

测试文件：`application/command-handlers/domain-create.command.handler.spec.ts`

**测试用例**：

- 测试成功创建域
- 测试域代码重复时抛出异常
- 测试保存操作被正确调用

**示例**：

```typescript
describe('DomainCreateHandler', () => {
  it('应该在域代码已存在时抛出异常', async () => {
    const handler = new DomainCreateHandler(/* mock dependencies */);
    // 设置域代码已存在的场景
    // ...
    await expect(handler.execute(command)).rejects.toThrow(BadRequestException);
  });
});
```

### 11.2 集成测试

集成测试应放置在 `tests/integration/` 目录下。

**测试场景**：

- 测试域完整的 CRUD 流程
- 测试域删除后权限策略被清理
- 测试域代码唯一性约束

### 11.3 测试覆盖率要求

- 核心业务逻辑测试覆盖率须达到 80% 以上
- 关键路径（创建、更新、删除）覆盖率须达到 90% 以上
- 所有公共 API 必须具备测试用例

## 12. 注意事项

### 12.1 域代码命名规范

- 域代码应该使用有意义的标识符，建议使用小写字母、数字和连字符
- 避免使用特殊字符和空格
- 示例：`tenant-001`、`org-abc`、`project-xyz`

### 12.2 域删除的影响范围

- 删除域会触发 `DomainDeletedEvent` 事件
- 事件处理器会自动清理该域下的所有 Casbin 权限策略
- 删除域前应确保域下没有关联的用户和角色（当前版本由调用方保证）

### 12.3 性能考虑

- 域代码唯一性验证使用数据库查询，在生产环境中应确保域代码字段有唯一索引
- 分页查询应合理设置 `pageSize`，避免一次查询过多数据

### 12.4 安全性

- 域代码是权限隔离的关键标识，应由系统管理员创建和管理
- 删除域是高风险操作，应在应用层添加额外的权限验证和确认机制

## 13. 扩展点

### 13.1 域状态扩展

当前域状态仅支持启用和禁用，未来可以扩展为：

- 草稿状态（DRAFT）：域创建但未激活
- 暂停状态（SUSPENDED）：临时暂停域的使用

### 13.2 域配置扩展

可以为域添加配置项，如：

- 权限策略模板
- 域级别的权限规则
- 域到期时间

### 13.3 域关联关系

可以扩展域的关联关系，如：

- 域之间的层级关系（父子域）
- 域的资源配额限制

## 14. 相关模块

### 14.1 Authentication 模块

认证模块依赖域模块，用户必须属于某个域，域代码用于多租户隔离。

### 14.2 Authorization 模块

授权模块依赖域模块，权限策略与域关联，实现不同域之间的权限隔离。

## 15. 更新日志

### 2024-01-XX

- 初始版本，实现域的 CRUD 基本功能
- 实现域删除后自动清理权限策略

---

**文档版本**：v1.0.0  
**最后更新**：2024-01-XX  
**维护者**：IAM 团队
