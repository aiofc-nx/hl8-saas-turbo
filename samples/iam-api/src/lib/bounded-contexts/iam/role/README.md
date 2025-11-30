# Role（角色模块）开发档案

## 1. 模块概述

### 1.1 业务定位

Role（角色模块）是 IAM 有界上下文的核心子模块，负责角色的生命周期管理和权限组织。角色是权限管理的基础单位，通过角色可以组织和管理用户权限，实现基于角色的访问控制（RBAC）。角色支持层级结构，可以构建父子角色关系，实现权限继承和灵活的角色管理。

### 1.2 核心职责

- **角色生命周期管理**：角色的创建、更新、删除，支持角色的启用和禁用
- **角色层级管理**：支持父子角色关系，构建角色树形结构
- **权限组织**：通过角色组织权限，实现权限的批量分配和管理
- **用户角色关联**：查询用户拥有的角色，支持权限验证和授权
- **权限策略集成**：与 Casbin 权限策略系统集成，删除角色时自动清理相关权限策略

### 1.3 技术架构

本模块采用 **Clean Architecture + CQRS + 事件驱动架构（EDA）** 模式：

- **Clean Architecture**：领域层、应用层、基础设施层清晰分离
- **CQRS**：命令用于写操作（创建、更新、删除），查询用于读操作（查询角色信息）
- **事件驱动**：通过领域事件实现模块间解耦和异步处理（如角色删除后清理权限策略、用户登录后缓存角色）
- **端口适配器模式**：通过端口接口定义仓储契约，由基础设施层实现

## 2. 目录结构

```
role/
├── application/                    # 应用层
│   ├── command-handlers/          # 命令处理器
│   │   ├── role-create.command.handler.ts
│   │   ├── role-update.command.handler.ts
│   │   ├── role-delete.command.handler.ts
│   │   └── index.ts
│   ├── query-handlers/            # 查询处理器
│   │   ├── role.by-id.query.handler.ts
│   │   ├── page-roles.query.handler.ts
│   │   ├── find-roles-query.handler.ts
│   │   └── index.ts
│   ├── event-handlers/            # 事件处理器
│   │   ├── role-deleted.event.handler.ts
│   │   ├── domain-deleted.event.handler.ts
│   │   ├── user-logged-in.event.handler.ts
│   │   └── index.ts
│   └── dto/                       # 数据传输对象
│       └── role-create.dto.ts
├── domain/                        # 领域层
│   ├── role.model.ts              # 角色聚合根
│   ├── role.read.model.ts         # 角色读取模型
│   └── events/                    # 领域事件
│       └── role-deleted.event.ts
├── commands/                      # 命令对象
│   ├── role-create.command.ts
│   ├── role-update.command.ts
│   └── role-delete.command.ts
├── queries/                       # 查询对象
│   ├── role.by-id.query.ts
│   ├── page-roles.query.ts
│   ├── role_codes_by_user_id_query.ts
│   └── get-roles.query-result.ts
├── ports/                         # 端口接口
│   ├── role.read.repo-port.ts     # 角色读取仓储端口
│   └── role.write.repo-port.ts    # 角色写入仓储端口
├── constants.ts                    # 常量定义
└── role.module.ts                  # 模块定义
```

## 3. 领域模型

### 3.1 Role（角色聚合根）

角色聚合根是角色模块的核心实体，负责管理角色的生命周期和业务规则。

#### 3.1.1 属性定义

| 属性名        | 类型             | 说明                               | 约束                                                |
| ------------- | ---------------- | ---------------------------------- | --------------------------------------------------- |
| `id`          | `string`         | 角色的唯一标识符（ULID）           | 必填，唯一                                          |
| `code`        | `string`         | 角色的唯一代码，用于标识不同的角色 | 必填，全局唯一                                      |
| `name`        | `string`         | 角色的显示名称                     | 必填                                                |
| `description` | `string \| null` | 角色的详细描述信息                 | 可选                                                |
| `pid`         | `string`         | 父角色 ID，用于实现角色层级结构    | 必填，根角色为 `'0'`                                |
| `status`      | `Status`         | 角色的状态                         | 必填，可选值：`ENABLED`（启用）、`DISABLED`（禁用） |
| `createdAt`   | `Date`           | 创建时间                           | 自动生成                                            |
| `createdBy`   | `string`         | 创建者用户 ID                      | 必填                                                |
| `updatedAt`   | `Date`           | 更新时间                           | 自动生成                                            |
| `updatedBy`   | `string`         | 更新者用户 ID                      | 可选                                                |

#### 3.1.2 领域方法

##### `static fromCreate(properties: RoleCreateProperties): Role`

从创建属性创建角色实例。

**参数说明**：

- `properties`: 角色创建属性对象，包含 `id`、`code`、`name`、`description`、`pid`、`status`、`createdAt`、`createdBy`

**返回值**：角色聚合根实例

**使用场景**：在创建新角色时使用

**示例**：

```typescript
const roleCreateProperties: RoleCreateProperties = {
  id: UlidGenerator.generate(),
  code: 'admin',
  name: '管理员',
  pid: ROOT_PID, // '0' 表示根角色
  status: Status.ENABLED,
  description: '系统管理员角色',
  createdAt: new Date(),
  createdBy: 'user-123',
};
const role = Role.fromCreate(roleCreateProperties);
```

##### `static fromUpdate(properties: RoleUpdateProperties): Role`

从更新属性创建角色实例。

**参数说明**：

- `properties`: 角色更新属性对象，包含 `id`、`code`、`name`、`description`、`pid`、`status`、`updatedAt`、`updatedBy`

**返回值**：角色聚合根实例

**使用场景**：在更新现有角色时使用

##### `static fromProp(properties: RoleProperties): Role`

从完整属性创建角色实例。

**参数说明**：

- `properties`: 角色完整属性对象

**返回值**：角色聚合根实例

**使用场景**：从数据库加载角色数据时使用

##### `async deleted(): Promise<void>`

发布角色删除事件。

**说明**：

- 当角色被删除时，发布 `RoleDeletedEvent` 事件
- 该事件可以被其他有界上下文订阅，用于执行后续操作（如清理权限策略、删除角色菜单关联等）

**使用场景**：在删除角色后调用，触发相关清理工作

**示例**：

```typescript
const role = Role.fromProp(existingRole);
await role.deleted(); // 发布 RoleDeletedEvent
role.commit(); // 提交事件到事件总线
```

##### `commit(): void`

提交领域事件到事件总线。

**说明**：

- 继承自 `AggregateRoot` 的方法
- 将所有待处理的领域事件提交到 NestJS CQRS 事件总线

**使用场景**：在处理完聚合根操作后调用，确保领域事件被发布

### 3.2 RoleProperties（角色属性类型）

定义角色的属性结构，用于数据传输和持久化。

#### 3.2.1 类型定义

```typescript
type RoleEssentialProperties = Readonly<
  Required<{
    id: string;
    code: string;
    name: string;
    pid: string;
    status: Status;
  }>
>;

type RoleOptionalProperties = Readonly<
  Partial<{
    description: string | null;
  }>
>;

type RoleProperties = RoleEssentialProperties &
  Required<RoleOptionalProperties>;
type RoleCreateProperties = RoleProperties & CreationAuditInfoProperties;
type RoleUpdateProperties = RoleProperties & UpdateAuditInfoProperties;
```

#### 3.2.2 RoleReadModel（角色读取模型）

用于 API 响应和查询结果的数据传输对象。

**属性说明**：

- 使用 `@ApiProperty` 装饰器提供 Swagger 文档支持
- 所有字段均用于只读查询场景

### 3.3 角色层级结构

角色支持父子层级关系，通过 `pid` 字段实现：

- **根角色**：`pid` 为 `ROOT_PID`（即 `'0'`）的角色为根角色，是角色树的顶层
- **子角色**：`pid` 指向其他角色 ID 的角色为子角色
- **层级限制**：角色不能将自己的 ID 设置为父角色 ID（防止循环引用）

**示例层级结构**：

```
系统管理员 (pid: '0')
  ├── 业务管理员 (pid: '系统管理员ID')
  │   ├── 业务专员 (pid: '业务管理员ID')
  │   └── 业务审核员 (pid: '业务管理员ID')
  └── 运营管理员 (pid: '系统管理员ID')
      └── 运营专员 (pid: '运营管理员ID')
```

## 4. 命令与处理器

### 4.1 RoleCreateCommand（角色创建命令）

用于创建新的角色。

#### 4.1.1 命令定义

```typescript
class RoleCreateCommand implements ICommand {
  readonly code: string; // 角色的唯一代码
  readonly name: string; // 角色的显示名称
  readonly pid: string; // 父角色 ID
  readonly status: Status; // 角色状态
  readonly description: string | null; // 角色的详细描述
  readonly uid: string; // 创建者用户 ID
}
```

#### 4.1.2 RoleCreateHandler（角色创建命令处理器）

**职责**：

- 验证角色代码的唯一性
- 验证父角色的存在性（如果指定了父角色）
- 生成角色 ID（ULID）
- 创建角色聚合根并保存到数据库

**业务流程**：

1. 检查角色代码是否已存在，如果存在则抛出 `BadRequestException`
2. 如果 `pid` 不是 `ROOT_PID`，检查父角色是否存在，如果不存在则抛出异常
3. 生成角色 ID（使用 ULID）
4. 创建角色聚合根实例
5. 保存到数据库

**异常处理**：

- 当角色代码已存在时，抛出 `BadRequestException`，错误消息：`A role with code {code} already exists.`
- 当父角色不存在时，抛出 `BadRequestException`，错误消息：`Parent role with code {pid} does not exist.`

**示例**：

```typescript
const command = new RoleCreateCommand(
  'admin',
  '管理员',
  ROOT_PID, // '0' 表示根角色
  Status.ENABLED,
  '系统管理员角色',
  'user-123',
);
await commandBus.execute(command);
```

### 4.2 RoleUpdateCommand（角色更新命令）

用于更新现有的角色。

#### 4.2.1 命令定义

```typescript
class RoleUpdateCommand extends RoleCreateCommand implements ICommand {
  readonly id: string; // 要更新的角色的唯一标识符
  // 继承自 RoleCreateCommand 的其他字段
}
```

#### 4.2.2 RoleUpdateHandler（角色更新命令处理器）

**职责**：

- 验证角色代码的唯一性（排除当前角色）
- 验证父角色的存在性和有效性
- 防止循环引用（角色不能将自己的 ID 设置为父角色 ID）
- 更新角色属性并保存到数据库

**业务流程**：

1. 检查角色代码是否已被其他角色使用，如果被其他角色使用则抛出异常
2. 验证角色不能将自己的 ID 设置为父角色 ID
3. 如果 `pid` 不是 `ROOT_PID`，检查父角色是否存在
4. 更新角色属性（名称、描述、代码、父角色等）
5. 设置更新时间和更新者
6. 更新角色聚合根实例
7. 保存到数据库

**异常处理**：

- 当角色代码已被其他角色使用时，抛出 `BadRequestException`
- 当角色将自己的 ID 设置为父角色 ID 时，抛出 `BadRequestException`，错误消息：`The parent role identifier '{pid}' cannot be the same as its own identifier.`
- 当父角色不存在时，抛出 `BadRequestException`

**示例**：

```typescript
const command = new RoleUpdateCommand(
  'role-123',
  'admin',
  '管理员',
  ROOT_PID,
  Status.ENABLED,
  '更新后的描述',
  'user-456',
);
await commandBus.execute(command);
```

### 4.3 RoleDeleteCommand（角色删除命令）

用于删除指定的角色。

#### 4.3.1 命令定义

```typescript
class RoleDeleteCommand implements ICommand {
  readonly id: string; // 要删除的角色的唯一标识符
}
```

#### 4.3.2 RoleDeleteHandler（角色删除命令处理器）

**职责**：

- 验证角色是否存在
- 删除角色记录
- 发布角色删除事件，触发权限策略和角色菜单关联的清理

**业务流程**：

1. 根据 ID 查询角色是否存在，如果不存在则抛出异常
2. 从数据库删除角色记录
3. 调用角色的 `deleted()` 方法发布 `RoleDeletedEvent` 事件
4. 提交事件到事件总线

**异常处理**：

- 当角色不存在时，抛出 `BadRequestException`，错误消息：`A role with the specified ID does not exist.`

**事件发布**：

- 删除角色后会自动发布 `RoleDeletedEvent` 事件
- 事件处理器会清理该角色的所有 Casbin 权限策略和角色菜单关联

**注意事项**：

- 删除角色前应确保角色下没有关联的用户（由调用方或基础设施层保证）
- 删除角色会级联删除相关的权限策略和菜单关联

**示例**：

```typescript
const command = new RoleDeleteCommand('role-123');
await commandBus.execute(command);
// 自动触发 RoleDeletedEvent，清理权限策略和角色菜单关联
```

## 5. 查询与处理器

### 5.1 FindRoleByIdQuery（根据 ID 查询角色）

用于根据角色 ID 查询角色信息。

#### 5.1.1 查询定义

```typescript
class FindRoleByIdQuery implements IQuery {
  readonly id: string; // 角色的唯一标识符
}
```

#### 5.1.2 FindRoleByIdQueryHandler（查询处理器）

**职责**：

- 根据角色 ID 查询角色信息

**返回值**：

- `RoleProperties | null`：找到则返回角色属性，未找到返回 `null`

**使用场景**：

- 根据角色 ID 加载角色详情
- 验证角色是否存在

**示例**：

```typescript
const query = new FindRoleByIdQuery('role-123');
const role = await queryBus.execute(query);
if (role) {
  console.log(`找到角色: ${role.name}`);
}
```

### 5.2 PageRolesQuery（角色分页查询）

用于分页查询角色列表，支持按角色代码、名称和状态筛选。

#### 5.2.1 查询定义

```typescript
class PageRolesQuery extends PaginationParams implements IQuery {
  readonly code?: string; // 角色代码，支持模糊查询
  readonly name?: string; // 角色名称，支持模糊查询
  readonly status?: Status; // 角色状态，可选值：ENABLED、DISABLED
  // 继承自 PaginationParams 的分页参数
}
```

#### 5.2.2 PageRolesQueryHandler（查询处理器）

**职责**：

- 根据查询条件分页查询角色列表

**返回值**：

- `PaginationResult<RoleProperties>`：包含角色列表和分页信息

**筛选条件**：

- `code`：按角色代码模糊查询（可选）
- `name`：按角色名称模糊查询（可选）
- `status`：按状态精确筛选（可选）
- 分页参数：`page`、`pageSize`、`total` 等

**使用场景**：

- 角色管理页面展示角色列表
- 按条件搜索角色

**示例**：

```typescript
const query = new PageRolesQuery({
  page: 1,
  pageSize: 10,
  name: '管理员',
  status: Status.ENABLED,
});
const result = await queryBus.execute(query);
console.log(`共 ${result.total} 个角色，当前页：${result.data.length} 个`);
```

### 5.3 RoleCodesByUserIdQuery（根据用户 ID 查询角色代码）

用于查询指定用户拥有的所有角色代码。

#### 5.3.1 查询定义

```typescript
class RoleCodesByUserIdQuery implements IQuery {
  readonly userId: string; // 用户的唯一标识符
}
```

#### 5.3.2 FindRolesQueryHandler（查询处理器）

**职责**：

- 根据用户 ID 查询用户拥有的所有角色代码

**返回值**：

- `Set<string>`：用户拥有的角色代码集合，如果用户没有角色则返回空集合

**使用场景**：

- 权限验证时查询用户的角色
- 用户登录后缓存用户的角色信息
- 生成用户权限上下文

**示例**：

```typescript
const query = new RoleCodesByUserIdQuery('user-123');
const roleCodes = await queryBus.execute(query);
console.log(`用户拥有的角色: ${Array.from(roleCodes).join(', ')}`);
```

## 6. 领域事件

### 6.1 RoleDeletedEvent（角色删除事件）

当角色被删除时发布的领域事件。

#### 6.1.1 事件定义

```typescript
class RoleDeletedEvent implements IEvent {
  readonly roleId: string; // 被删除的角色的唯一标识符
  readonly code: string; // 被删除的角色的代码
}
```

#### 6.1.2 RoleDeletedHandler（事件处理器）

**职责**：

- 清理被删除角色的所有 Casbin 权限策略
- 删除角色的菜单关联关系

**业务流程**：

1. 接收 `RoleDeletedEvent` 事件
2. 调用 `AuthZManagementService.removeFilteredPolicy()` 方法，使用角色代码作为过滤条件，删除所有相关的权限策略
3. 调用 `RoleWriteRepoPort.deleteRoleMenuByRoleId()` 方法，删除角色的菜单关联
4. 记录日志

**技术实现**：

- 使用 Casbin 的 `removeFilteredPolicy` 方法，第 0 个参数为角色代码，用于过滤要删除的策略

**使用场景**：

- 当角色被删除时，自动清理该角色的所有权限策略和菜单关联，避免数据残留

**注意事项**：

- 该事件处理器会自动执行，无需手动调用
- 清理操作是异步的，不会阻塞角色删除操作

### 6.2 DomainDeletedEvent（域删除事件）

当域被删除时发布的领域事件，角色模块订阅此事件以清理相关数据。

#### 6.2.1 DomainDeletedHandler（事件处理器）

**职责**：

- 删除指定域下的所有角色菜单关联关系

**业务流程**：

1. 接收 `DomainDeletedEvent` 事件
2. 调用 `RoleWriteRepoPort.deleteRoleMenuByDomain()` 方法，删除该域下的所有角色菜单关联
3. 记录日志

**使用场景**：

- 当域被删除时，自动清理该域下的所有角色菜单关联

### 6.3 UserLoggedInEvent（用户登录事件）

当用户登录时发布的领域事件，角色模块订阅此事件以缓存用户的角色信息。

#### 6.3.1 UserLoggedInHandler（事件处理器）

**职责**：

- 查询用户拥有的所有角色代码
- 将角色代码缓存到 Redis 中，用于快速权限验证

**业务流程**：

1. 接收 `UserLoggedInEvent` 事件
2. 调用 `RoleReadRepoPort.findRolesByUserId()` 查询用户的所有角色代码
3. 如果用户有角色，将角色代码集合存储到 Redis 中
4. 设置 Redis Key 的过期时间为 JWT Token 过期时间

**技术实现**：

- Redis Key 格式：`{AUTH_TOKEN_PREFIX}{userId}`
- 使用 Redis Set 数据结构存储角色代码集合
- 过期时间与 JWT Token 过期时间一致，保证缓存与 Token 同步失效

**使用场景**：

- 用户登录后自动缓存角色信息，提升权限验证性能
- 减少每次权限验证时的数据库查询

**注意事项**：

- 如果用户没有角色，不会创建 Redis Key
- 缓存会在 JWT Token 过期时自动失效

## 7. 端口接口

### 7.1 RoleWriteRepoPort（角色写入仓储端口）

定义角色的写入操作接口，由基础设施层实现。

#### 7.1.1 接口定义

```typescript
interface RoleWriteRepoPort {
  save(role: Role): Promise<void>;
  update(role: Role): Promise<void>;
  deleteById(id: string): Promise<void>;
  deleteRoleMenuByRoleId(roleId: string): Promise<void>;
  deleteRoleMenuByDomain(domain: string): Promise<void>;
}
```

#### 7.1.2 方法说明

##### `save(role: Role): Promise<void>`

保存或创建角色到数据库。

- **参数**：`role` - 角色聚合根实例
- **行为**：如果是新记录则创建，如果是已存在的记录则更新
- **异常**：当保存操作失败时抛出异常

##### `update(role: Role): Promise<void>`

更新数据库中已存在的角色记录。

- **参数**：`role` - 角色聚合根实例
- **异常**：当更新操作失败时抛出异常

##### `deleteById(id: string): Promise<void>`

从数据库中删除指定 ID 的角色记录。

- **参数**：`id` - 角色的唯一标识符
- **异常**：当删除操作失败时抛出异常

##### `deleteRoleMenuByRoleId(roleId: string): Promise<void>`

删除指定角色的所有角色菜单关联记录。

- **参数**：`roleId` - 角色的唯一标识符
- **使用场景**：删除角色时清理角色的菜单关联

##### `deleteRoleMenuByDomain(domain: string): Promise<void>`

删除指定域下的所有角色菜单关联记录。

- **参数**：`domain` - 域代码
- **使用场景**：删除域时清理该域下的所有角色菜单关联

### 7.2 RoleReadRepoPort（角色读取仓储端口）

定义角色的读取操作接口，由基础设施层实现。

#### 7.2.1 接口定义

```typescript
interface RoleReadRepoPort {
  getRoleById(id: string): Promise<Readonly<RoleProperties> | null>;
  getRoleByCode(code: string): Promise<Readonly<RoleProperties> | null>;
  pageRoles(query: PageRolesQuery): Promise<PaginationResult<RoleProperties>>;
  findRolesByUserId(userId: string): Promise<Set<string>>;
}
```

#### 7.2.2 方法说明

##### `getRoleById(id: string): Promise<Readonly<RoleProperties> | null>`

根据 ID 获取角色信息。

- **参数**：`id` - 角色的唯一标识符
- **返回值**：角色属性对象，如果不存在则返回 `null`

##### `getRoleByCode(code: string): Promise<Readonly<RoleProperties> | null>`

根据代码获取角色信息。

- **参数**：`code` - 角色的唯一代码
- **返回值**：角色属性对象，如果不存在则返回 `null`
- **用途**：角色代码是角色的唯一标识符，常用于验证和查询

##### `pageRoles(query: PageRolesQuery): Promise<PaginationResult<RoleProperties>>`

分页查询角色列表。

- **参数**：`query` - 分页查询对象，包含分页参数、角色代码、名称、状态等筛选条件
- **返回值**：分页结果，包含角色列表和分页信息

##### `findRolesByUserId(userId: string): Promise<Set<string>>`

根据用户 ID 查找角色代码集合。

- **参数**：`userId` - 用户的唯一标识符
- **返回值**：用户拥有的角色代码集合，如果用户没有角色则返回空集合
- **用途**：查询用户权限、生成权限上下文

## 8. 模块注册

### 8.1 RoleModule（角色模块）

动态模块，用于注册角色相关的处理器和依赖。

#### 8.1.1 模块定义

```typescript
@Module({})
export class RoleModule {
  static register(options: {
    inject: Provider[];
    imports: any[];
  }): DynamicModule;
}
```

#### 8.1.2 注册方式

在基础设施层通过 `register` 方法注册模块：

```typescript
RoleModule.register({
  imports: [
    /* 其他模块 */
  ],
  inject: [
    /* 仓储实现提供者 */
  ],
});
```

#### 8.1.3 提供的处理器

- **命令处理器**：`RoleCreateHandler`、`RoleUpdateHandler`、`RoleDeleteHandler`
- **查询处理器**：`FindRoleByIdQueryHandler`、`PageRolesQueryHandler`、`FindRolesQueryHandler`
- **事件处理器**：`RoleDeletedHandler`、`DomainDeletedHandler`、`UserLoggedInHandler`

#### 8.1.4 依赖注入令牌

- `RoleWriteRepoPortToken`：角色写入仓储端口令牌
- `RoleReadRepoPortToken`：角色读取仓储端口令牌

## 9. 业务规则

### 9.1 角色代码唯一性规则

- **规则**：角色代码必须在全局范围内唯一
- **验证时机**：创建角色时和更新角色时
- **异常处理**：如果角色代码已存在，抛出 `BadRequestException`

### 9.2 角色层级规则

- **根角色标识**：`pid` 为 `ROOT_PID`（即 `'0'`）表示根角色
- **父角色验证**：如果指定了父角色（`pid` 不是 `ROOT_PID`），父角色必须存在
- **循环引用防止**：角色不能将自己的 ID 设置为父角色 ID
- **层级深度**：理论上支持无限层级，但建议控制层级深度以提升性能

### 9.3 角色状态管理

- **状态值**：
  - `ENABLED`：启用状态，角色可以正常使用
  - `DISABLED`：禁用状态，角色不可使用（当前版本暂未实现禁用逻辑）
- **默认状态**：新创建的角色可以设置状态，通常默认为 `ENABLED`

### 9.4 角色删除规则

- **前置条件**：角色必须存在才能删除
- **删除后操作**：删除角色后自动发布 `RoleDeletedEvent` 事件
- **关联清理**：
  - 自动清理该角色的所有 Casbin 权限策略
  - 自动删除角色的菜单关联关系
- **关联数据**：删除角色前需要确保角色下没有关联的用户（由调用方或基础设施层保证）

### 9.5 审计信息

- **创建审计**：创建角色时必须记录 `createdAt` 和 `createdBy`
- **更新审计**：更新角色时必须记录 `updatedAt` 和 `updatedBy`

### 9.6 用户角色缓存规则

- **缓存时机**：用户登录时自动缓存角色代码到 Redis
- **缓存 Key**：`{AUTH_TOKEN_PREFIX}{userId}`
- **缓存结构**：Redis Set 存储角色代码集合
- **过期时间**：与 JWT Token 过期时间一致
- **缓存更新**：用户重新登录时自动更新缓存

## 10. 使用示例

### 10.1 创建角色

```typescript
import { CommandBus } from '@nestjs/cqrs';
import { RoleCreateCommand } from './commands/role-create.command';
import { ROOT_PID } from '@/lib/shared/constants/db.constant';
import { Status } from '@/lib/shared/enums/status.enum';

// 在服务或控制器中
constructor(private readonly commandBus: CommandBus) {}

async createRole(code: string, name: string, pid: string, description: string, uid: string) {
  const command = new RoleCreateCommand(
    code,
    name,
    pid, // ROOT_PID 或父角色 ID
    Status.ENABLED,
    description,
    uid
  );
  await this.commandBus.execute(command);
}
```

### 10.2 更新角色

```typescript
import { CommandBus } from '@nestjs/cqrs';
import { RoleUpdateCommand } from './commands/role-update.command';

async updateRole(
  id: string,
  code: string,
  name: string,
  pid: string,
  status: Status,
  description: string,
  uid: string
) {
  const command = new RoleUpdateCommand(id, code, name, pid, status, description, uid);
  await this.commandBus.execute(command);
}
```

### 10.3 删除角色

```typescript
import { CommandBus } from '@nestjs/cqrs';
import { RoleDeleteCommand } from './commands/role-delete.command';

async deleteRole(id: string) {
  const command = new RoleDeleteCommand(id);
  await this.commandBus.execute(command);
  // 自动触发 RoleDeletedEvent，清理权限策略和角色菜单关联
}
```

### 10.4 查询角色

```typescript
import { QueryBus } from '@nestjs/cqrs';
import { FindRoleByIdQuery } from './queries/role.by-id.query';
import { PageRolesQuery } from './queries/page-roles.query';
import { RoleCodesByUserIdQuery } from './queries/role_codes_by_user_id_query';

// 根据 ID 查询
async getRoleById(id: string) {
  const query = new FindRoleByIdQuery(id);
  return await this.queryBus.execute(query);
}

// 分页查询
async pageRoles(page: number, pageSize: number, name?: string, status?: Status) {
  const query = new PageRolesQuery({
    page,
    pageSize,
    name,
    status,
  });
  return await this.queryBus.execute(query);
}

// 根据用户 ID 查询角色代码
async getUserRoles(userId: string) {
  const query = new RoleCodesByUserIdQuery(userId);
  return await this.queryBus.execute(query);
}
```

## 11. 测试指南

### 11.1 单元测试

单元测试文件应放在与被测文件同目录下，命名为 `{filename}.spec.ts`。

#### 11.1.1 角色聚合根测试

测试文件：`domain/role.model.spec.ts`

**测试用例**：

- 测试 `fromCreate` 方法正确创建角色实例
- 测试 `fromUpdate` 方法正确创建更新角色实例
- 测试 `fromProp` 方法正确从属性创建角色实例
- 测试 `deleted` 方法发布领域事件

**示例**：

```typescript
describe('Role', () => {
  it('应该从创建属性创建角色实例', () => {
    const properties: RoleCreateProperties = {
      id: '01ARZ3NDEKTSV4RRFFQ69G5FAV',
      code: 'admin',
      name: '管理员',
      pid: ROOT_PID,
      status: Status.ENABLED,
      description: '系统管理员',
      createdAt: new Date(),
      createdBy: 'user-123',
    };
    const role = Role.fromCreate(properties);
    expect(role.code).toBe('admin');
    expect(role.pid).toBe(ROOT_PID);
    expect(role.status).toBe(Status.ENABLED);
  });
});
```

#### 11.1.2 命令处理器测试

测试文件：`application/command-handlers/role-create.command.handler.spec.ts`

**测试用例**：

- 测试成功创建角色
- 测试角色代码重复时抛出异常
- 测试父角色不存在时抛出异常
- 测试保存操作被正确调用

**示例**：

```typescript
describe('RoleCreateHandler', () => {
  it('应该在角色代码已存在时抛出异常', async () => {
    const handler = new RoleCreateHandler(/* mock dependencies */);
    // 设置角色代码已存在的场景
    // ...
    await expect(handler.execute(command)).rejects.toThrow(BadRequestException);
  });

  it('应该在父角色不存在时抛出异常', async () => {
    const handler = new RoleCreateHandler(/* mock dependencies */);
    // 设置父角色不存在的场景
    // ...
    await expect(handler.execute(command)).rejects.toThrow(BadRequestException);
  });
});
```

### 11.2 集成测试

集成测试应放置在 `tests/integration/` 目录下。

**测试场景**：

- 测试角色完整的 CRUD 流程
- 测试角色层级关系的创建和验证
- 测试角色删除后权限策略被清理
- 测试用户角色查询和缓存

### 11.3 测试覆盖率要求

- 核心业务逻辑测试覆盖率须达到 80% 以上
- 关键路径（创建、更新、删除、查询）覆盖率须达到 90% 以上
- 所有公共 API 必须具备测试用例

## 12. 注意事项

### 12.1 角色代码命名规范

- 角色代码应该使用有意义的标识符，建议使用小写字母、数字和下划线
- 避免使用特殊字符和空格
- 示例：`admin`、`business_manager`、`operator`

### 12.2 角色层级设计建议

- 建议控制角色层级深度，一般不超过 3-4 层
- 避免过深的层级结构，以提升查询性能
- 设计时考虑权限继承的清晰性和可维护性

### 12.3 角色删除的影响范围

- 删除角色会触发 `RoleDeletedEvent` 事件
- 事件处理器会自动清理该角色的所有 Casbin 权限策略
- 事件处理器会自动删除角色的菜单关联关系
- 删除角色前应确保角色下没有关联的用户（当前版本由调用方保证）

### 12.4 性能考虑

- 角色代码唯一性验证使用数据库查询，在生产环境中应确保角色代码字段有唯一索引
- 分页查询应合理设置 `pageSize`，避免一次查询过多数据
- 用户角色缓存可以显著提升权限验证性能，建议在生产环境中启用

### 12.5 缓存管理

- 用户角色缓存的过期时间与 JWT Token 一致，确保缓存与 Token 同步失效
- 如果用户角色发生变化（如分配新角色、移除角色），需要手动清除或更新缓存
- 建议在角色分配变更时发布事件，由事件处理器更新缓存

### 12.6 安全性

- 角色代码是权限控制的关键标识，应由系统管理员创建和管理
- 删除角色是高风险操作，应在应用层添加额外的权限验证和确认机制
- 角色层级关系应避免循环引用，防止权限验证逻辑错误

## 13. 扩展点

### 13.1 角色权限继承

可以扩展角色层级关系，实现权限继承：

- 子角色自动继承父角色的权限
- 权限验证时递归查询父角色权限

### 13.2 角色权限模板

可以为角色添加权限模板：

- 定义角色权限模板
- 创建角色时自动应用模板
- 支持模板的版本管理

### 13.3 角色生效时间

可以扩展角色的生效时间控制：

- 角色生效时间范围
- 临时角色（有明确的过期时间）
- 定期角色（周期性生效）

### 13.4 角色使用范围

可以扩展角色的使用范围限制：

- 角色可访问的资源范围
- 角色可操作的数据范围
- 角色可管理的组织范围

## 14. 相关模块

### 14.1 Authentication 模块

认证模块与角色模块关联：

- 用户可以分配角色
- 用户登录后，角色模块会缓存用户的角色信息

### 14.2 Authorization 模块

授权模块依赖角色模块：

- 权限策略与角色关联
- 通过角色代码实现权限验证

### 14.3 Domain 模块

域模块与角色模块关联：

- 删除域时会清理该域下的所有角色菜单关联

## 15. 更新日志

### 2024-01-XX

- 初始版本，实现角色的 CRUD 基本功能
- 实现角色删除后自动清理权限策略和菜单关联
- 实现用户登录后自动缓存角色信息

---

**文档版本**：v1.0.0  
**最后更新**：2024-01-XX  
**维护者**：IAM 团队
