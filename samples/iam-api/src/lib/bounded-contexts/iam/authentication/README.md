# Authentication（认证模块）开发档案

## 1. 模块概述

### 1.1 业务定位

Authentication（认证模块）是 IAM 有界上下文的核心子模块，负责用户身份管理和认证授权服务。该模块提供用户生命周期管理、密码认证、令牌生成与刷新、以及基于角色的权限分配等核心功能。

### 1.2 核心职责

- **用户管理**：用户的创建、更新、删除，支持多租户域隔离
- **身份认证**：密码登录、令牌刷新、JWT 令牌生成和验证
- **权限授权**：角色权限分配、菜单路由分配、用户角色分配
- **安全控制**：密码加密存储、用户状态管理、登录状态检查

### 1.3 技术架构

本模块采用 **Clean Architecture + CQRS + 事件驱动架构（EDA）** 模式：

- **Clean Architecture**：领域层、应用层、基础设施层清晰分离
- **CQRS**：命令用于写操作（创建、更新、删除），查询用于读操作（查询用户信息）
- **事件驱动**：通过领域事件实现模块间解耦和异步处理
- **端口适配器模式**：通过端口接口定义仓储契约，由基础设施层实现

## 2. 目录结构

```
authentication/
├── application/                    # 应用层
│   ├── command-handlers/          # 命令处理器
│   │   ├── user-create.command.handler.ts
│   │   ├── user-update.command.handler.ts
│   │   └── user-delete.command.handler.ts
│   ├── query-handlers/            # 查询处理器
│   │   ├── page-users.query.handler.ts
│   │   ├── users.by-ids.query.handler.ts
│   │   └── user-ids.by-role_id.query.handler.ts
│   ├── event-handlers/            # 事件处理器
│   │   ├── user-created.event.handler.ts
│   │   ├── user-deleted.event.handler.ts
│   │   ├── domain-deleted.event.handler.ts
│   │   └── role-deleted.event.handler.ts
│   ├── service/                   # 应用服务
│   │   ├── authentication.service.ts
│   │   └── authorization.service.ts
│   └── dto/                       # 数据传输对象
│       ├── password-identifier.dto.ts
│       └── refresh-token.dto.ts
├── domain/                        # 领域层
│   ├── user.ts                    # 用户聚合根
│   ├── password.value-object.ts   # 密码值对象
│   ├── user.read.model.ts         # 用户读取模型
│   └── events/                    # 领域事件
│       ├── user-created.event.ts
│       ├── user-deleted.event.ts
│       └── user-logged-in.event.ts
├── commands/                      # 命令对象
│   ├── user-create.command.ts
│   ├── user-update.command.ts
│   ├── user-delete.command.ts
│   ├── role-assign-permission.command.ts
│   ├── role-assign-route.command.ts
│   └── role-assign-user.command.ts
├── queries/                       # 查询对象
│   ├── page-users.query.ts
│   ├── users.by-ids.query.ts
│   └── user-ids.by-role_id.query.ts
├── ports/                         # 端口接口
│   ├── user.read.repo-port.ts     # 用户读取仓储端口
│   └── user.write.repo-port.ts    # 用户写入仓储端口
├── constants.ts                    # 常量定义
└── authentication.module.ts       # 模块定义
```

## 3. 领域模型

### 3.1 User（用户聚合根）

用户聚合根是认证模块的核心实体，负责管理用户的生命周期和业务规则。

#### 3.1.1 属性定义

| 属性名        | 类型             | 说明                     | 约束                 |
| ------------- | ---------------- | ------------------------ | -------------------- |
| `id`          | `string`         | 用户的唯一标识符（ULID） | 必填，唯一           |
| `username`    | `string`         | 用户名，用于登录         | 必填，在域内唯一     |
| `nickName`    | `string`         | 用户昵称，用于界面展示   | 必填                 |
| `password`    | `Password`       | 密码值对象，加密存储     | 必填                 |
| `status`      | `Status`         | 用户状态                 | 必填，默认 `ENABLED` |
| `domain`      | `string`         | 用户所属的域代码         | 必填，用于多租户隔离 |
| `avatar`      | `string \| null` | 用户头像 URL             | 可选                 |
| `email`       | `string \| null` | 用户邮箱地址             | 可选，可用于登录     |
| `phoneNumber` | `string \| null` | 用户手机号码             | 可选，可用于登录     |
| `createdAt`   | `Date`           | 创建时间                 | 自动生成             |
| `createdBy`   | `string`         | 创建者用户 ID            | 必填                 |

#### 3.1.2 领域方法

##### `verifyPassword(password: string): Promise<boolean>`

验证提供的密码是否与用户密码匹配。

**参数：**

- `password: string` - 要验证的明文密码

**返回：**

- `Promise<boolean>` - 验证结果，`true` 表示密码正确

**业务规则：**

- 使用 bcrypt 进行密码比较
- 密码值对象封装了密码验证逻辑

##### `canLogin(): Promise<boolean>`

检查用户状态是否允许登录。

**返回：**

- `Promise<boolean>` - 检查结果，`true` 表示可以登录

**业务规则：**

- 只有状态为 `ENABLED` 的用户才能登录
- 状态为 `DISABLED` 的用户无法登录

##### `loginUser(password: string): Promise<{ success: boolean; message: string }>`

执行用户登录逻辑，包括状态检查和密码验证。

**参数：**

- `password: string` - 用户输入的密码

**返回：**

- `Promise<{ success: boolean; message: string }>` - 登录结果

**业务规则：**

1. 检查用户状态是否为 `ENABLED`
2. 验证密码是否正确
3. 返回详细的登录结果信息

**异常情况：**

- 用户状态为 `DISABLED`：返回 `{ success: false, message: 'User is disabled.' }`
- 密码错误：返回 `{ success: false, message: 'Invalid credentials.' }`

##### `created(): Promise<void>`

发布用户创建事件。

**业务规则：**

- 当用户被创建时，发布 `UserCreatedEvent` 事件
- 该事件可以被其他有界上下文订阅，用于执行后续操作（如初始化权限、发送通知等）

##### `deleted(): Promise<void>`

发布用户删除事件。

**业务规则：**

- 当用户被删除时，发布 `UserDeletedEvent` 事件
- 该事件可以被其他有界上下文订阅，用于执行后续操作（如清理权限、撤销令牌等）

### 3.2 Password（密码值对象）

密码值对象封装密码的加密、验证和存储逻辑，确保密码的安全性。

#### 3.2.1 静态工厂方法

##### `hash(password: string): Promise<Password>`

从明文密码创建密码值对象。

**参数：**

- `password: string` - 明文密码

**返回：**

- `Promise<Password>` - 加密后的密码值对象

**业务规则：**

- 使用 bcrypt 对明文密码进行哈希加密
- 自动生成盐值
- 这是创建新密码的标准方式

##### `fromHashed(password: string): Password`

从已哈希的密码创建密码值对象。

**参数：**

- `password: string` - 已加密的密码哈希值

**返回：**

- `Password` - 密码值对象

**业务规则：**

- 用于从数据库中读取的已加密密码创建密码值对象
- 不进行加密操作，直接封装哈希值

#### 3.2.2 实例方法

##### `compare(password: string): Promise<boolean>`

比较提供的明文密码是否与存储的哈希值匹配。

**参数：**

- `password: string` - 要验证的明文密码

**返回：**

- `Promise<boolean>` - 比较结果，`true` 表示密码匹配

**业务规则：**

- 使用 bcrypt 进行密码比较
- 用于用户登录时的密码验证

##### `getValue(): string`

获取密码的哈希值，用于持久化到数据库。

**返回：**

- `string` - 密码的哈希值

**业务规则：**

- 仅用于持久化操作
- 不应直接暴露给外部调用者

## 4. 应用服务

### 4.1 AuthenticationService（认证服务）

提供用户认证相关的业务逻辑，包括密码登录和刷新令牌功能。

#### 4.1.1 依赖注入

- `JwtService` - JWT 令牌服务
- `EventPublisher` - 事件发布器
- `UserReadRepoPort` - 用户读取仓储端口
- `QueryBus` - 查询总线
- `ISecurityConfig` - 安全配置

#### 4.1.2 主要方法

##### `execPasswordLogin(dto: PasswordIdentifierDTO): Promise<{ token: string; refreshToken: string }>`

执行密码登录，通过用户名/邮箱/手机号等标识符和密码进行用户认证。

**参数：**

- `dto: PasswordIdentifierDTO` - 密码标识符数据传输对象
  - `identifier: string` - 用户标识符（用户名、邮箱或手机号）
  - `password: string` - 用户密码
  - `ip: string` - 请求 IP 地址
  - `address: string` - 请求地址
  - `userAgent: string` - 用户代理
  - `requestId: string` - 请求 ID
  - `type: string` - 登录类型
  - `port: number` - 请求端口

**返回：**

- `Promise<{ token: string; refreshToken: string }>` - 访问令牌和刷新令牌

**业务规则：**

1. 通过标识符查找用户（支持用户名、邮箱、手机号）
2. 使用领域模型（User）进行密码验证
3. 生成 JWT 访问令牌和刷新令牌
4. 发布 `UserLoggedInEvent` 和 `TokenGeneratedEvent` 事件
5. 将用户角色信息缓存到 Redis，键格式：`auth:token:{userId}`
6. Redis 缓存过期时间与 JWT 过期时间一致

**异常：**

- `NotFoundException` - 当用户不存在时抛出
- `BadRequestException` - 当密码验证失败时抛出

##### `refreshToken(dto: RefreshTokenDTO): Promise<{ token: string; refreshToken: string }>`

刷新访问令牌，使用刷新令牌获取新的访问令牌和刷新令牌。

**参数：**

- `dto: RefreshTokenDTO` - 刷新令牌数据传输对象
  - `refreshToken: string` - 刷新令牌
  - `ip: string` - 请求 IP 地址
  - `region: string` - 请求地区
  - `userAgent: string` - 用户代理
  - `requestId: string` - 请求 ID
  - `type: string` - 令牌类型
  - `port: number` - 请求端口

**返回：**

- `Promise<{ token: string; refreshToken: string }>` - 新的访问令牌和刷新令牌

**业务规则：**

1. 通过查询总线查找令牌详情
2. 验证刷新令牌的签名和有效期
3. 使用领域模型（TokensEntity）进行令牌刷新检查
4. 生成新的访问令牌和刷新令牌
5. 发布 `TokenGeneratedEvent` 事件记录令牌生成
6. 提交领域事件到事件存储

**异常：**

- `NotFoundException` - 当刷新令牌不存在时抛出
- `Error` - 当刷新令牌验证失败或已过期时抛出

### 4.2 AuthorizationService（授权服务）

提供基于角色的访问控制（RBAC）相关的业务逻辑。

#### 4.2.1 依赖注入

- `QueryBus` - 查询总线
- `AuthZRBACService` - Casbin RBAC 服务
- `EntityManager` - MikroORM 实体管理器

#### 4.2.2 主要方法

##### `assignPermission(command: RoleAssignPermissionCommand): Promise<void>`

为角色分配权限（API 端点权限），并同步到 Casbin 权限策略中。

**参数：**

- `command: RoleAssignPermissionCommand` - 角色分配权限命令
  - `domain: string` - 域代码
  - `roleId: string` - 角色 ID
  - `permissions: string[]` - 权限 ID 列表（API 端点 ID）

**业务规则：**

1. 验证域和角色的存在性
2. 查询并验证权限（API 端点）是否存在
3. 获取角色现有的权限策略
4. 同步权限：删除不再需要的权限，添加新权限
5. 权限策略格式：`[角色代码, 资源, 操作, 域, 'allow']`

**异常：**

- `NotFoundException` - 当域、角色或权限不存在时抛出

##### `assignRoutes(command: RoleAssignRouteCommand): Promise<void>`

为角色分配路由（菜单路由），并同步到数据库的角色菜单关联表。

**参数：**

- `command: RoleAssignRouteCommand` - 角色分配路由命令
  - `domain: string` - 域代码
  - `roleId: string` - 角色 ID
  - `menuIds: number[]` - 菜单 ID 列表

**业务规则：**

1. 验证域和角色的存在性
2. 查询并验证路由（菜单）是否存在
3. 获取角色现有的路由关联
4. 使用事务同步路由：删除不再需要的关联，添加新关联
5. 支持增量更新，只添加新路由和删除不再需要的路由

**异常：**

- `NotFoundException` - 当域、角色或路由不存在时抛出

##### `assignUsers(command: RoleAssignUserCommand): Promise<void>`

为角色分配用户，并同步到数据库的用户角色关联表。

**参数：**

- `command: RoleAssignUserCommand` - 角色分配用户命令
  - `roleId: string` - 角色 ID
  - `userIds: string[]` - 用户 ID 列表

**业务规则：**

1. 验证角色的存在性
2. 查询并验证用户是否存在
3. 获取角色现有的用户关联
4. 使用事务同步用户：删除不再需要的关联，添加新关联
5. 支持增量更新，只添加新用户和删除不再需要的用户

**异常：**

- `NotFoundException` - 当角色或用户不存在时抛出

## 5. 命令和查询

### 5.1 命令（Commands）

命令用于写操作，通过命令处理器执行。

#### 5.1.1 UserCreateCommand（用户创建命令）

创建新用户。

**属性：**

- `username: string` - 用户名，在域内必须唯一
- `password: string` - 用户密码
- `domain: string` - 用户所属的域代码
- `nickName: string` - 用户昵称
- `avatar: string | null` - 用户头像 URL
- `email: string | null` - 用户邮箱
- `phoneNumber: string | null` - 用户手机号
- `uid: string` - 创建者的用户 ID

**处理器：** `UserCreateHandler`

**业务规则：**

- 验证用户名是否已存在
- 加密用户密码
- 生成用户 ID（ULID）
- 设置用户状态为 `ENABLED`
- 发布 `UserCreatedEvent` 事件

#### 5.1.2 UserUpdateCommand（用户更新命令）

更新已存在的用户信息。

**属性：**

- `id: string` - 用户 ID
- `nickName?: string` - 用户昵称
- `avatar?: string | null` - 用户头像 URL
- `email?: string | null` - 用户邮箱
- `phoneNumber?: string | null` - 用户手机号
- `status?: Status` - 用户状态
- `uid: string` - 更新者的用户 ID

**处理器：** `UserUpdateHandler`

**业务规则：**

- 不允许更新用户名、密码和域
- 只更新允许修改的字段
- 更新审计信息

#### 5.1.3 UserDeleteCommand（用户删除命令）

删除用户。

**属性：**

- `id: string` - 用户 ID
- `uid: string` - 删除者的用户 ID

**处理器：** `UserDeleteHandler`

**业务规则：**

- 删除用户记录
- 删除用户角色关联
- 发布 `UserDeletedEvent` 事件

#### 5.1.4 RoleAssignPermissionCommand（角色分配权限命令）

为角色分配 API 端点权限。

**属性：**

- `domain: string` - 域代码
- `roleId: string` - 角色 ID
- `permissions: string[]` - 权限 ID 列表（API 端点 ID）

**处理器：** `AuthorizationService.assignPermission`

#### 5.1.5 RoleAssignRouteCommand（角色分配路由命令）

为角色分配菜单路由。

**属性：**

- `domain: string` - 域代码
- `roleId: string` - 角色 ID
- `menuIds: number[]` - 菜单 ID 列表

**处理器：** `AuthorizationService.assignRoutes`

#### 5.1.6 RoleAssignUserCommand（角色分配用户命令）

为角色分配用户。

**属性：**

- `roleId: string` - 角色 ID
- `userIds: string[]` - 用户 ID 列表

**处理器：** `AuthorizationService.assignUsers`

### 5.2 查询（Queries）

查询用于读操作，通过查询处理器执行。

#### 5.2.1 PageUsersQuery（用户分页查询）

分页查询用户列表。

**属性：**

- `page: number` - 页码（继承自 `PaginationParams`）
- `pageSize: number` - 每页大小（继承自 `PaginationParams`）
- `username?: string` - 用户名（模糊查询）
- `nickName?: string` - 昵称（模糊查询）
- `status?: Status` - 状态筛选

**处理器：** `PageUsersQueryHandler`

**返回：** `PaginationResult<UserProperties>`

#### 5.2.2 UsersByIdsQuery（根据 ID 列表查询用户）

批量查询指定 ID 列表的用户信息。

**属性：**

- `ids: string[]` - 用户 ID 数组

**处理器：** `UsersByIdsQueryHandler`

**返回：** `UserProperties[]`

#### 5.2.3 UserIdsByRoleIdQuery（根据角色 ID 查询用户 ID 列表）

查询拥有指定角色的所有用户 ID 列表。

**属性：**

- `roleId: string` - 角色 ID

**处理器：** `UserIdsByRoleIdQueryHandler`

**返回：** `string[]`

## 6. 领域事件

### 6.1 UserCreatedEvent（用户创建事件）

当用户被创建时发布的领域事件。

**属性：**

- `userId: string` - 用户的唯一标识符
- `username: string` - 用户名
- `domain: string` - 用户所属的域代码

**发布时机：**

- 用户创建成功后

**订阅者：**

- 其他有界上下文可以订阅此事件，用于执行后续操作（如初始化权限、发送欢迎邮件等）

### 6.2 UserDeletedEvent（用户删除事件）

当用户被删除时发布的领域事件。

**属性：**

- `userId: string` - 用户的唯一标识符
- `username: string` - 用户名
- `domain: string` - 用户所属的域代码

**发布时机：**

- 用户删除前

**订阅者：**

- 其他有界上下文可以订阅此事件，用于执行后续操作（如清理权限、撤销令牌等）

### 6.3 UserLoggedInEvent（用户登录事件）

当用户成功登录时发布的领域事件。

**属性：**

- `userId: string` - 用户的唯一标识符
- `username: string` - 用户名
- `domain: string` - 用户所属的域代码
- `ip: string` - 请求 IP 地址
- `address: string` - 请求地址
- `userAgent: string` - 用户代理
- `requestId: string` - 请求 ID
- `type: string` - 登录类型
- `port: number` - 请求端口

**发布时机：**

- 用户成功登录后

**订阅者：**

- 其他有界上下文可以订阅此事件，用于记录登录日志、安全审计等

## 7. 端口接口

### 7.1 UserReadRepoPort（用户读取仓储端口）

定义用户的读取操作接口，由基础设施层实现。

#### 7.1.1 方法列表

- `findUserById(id: string): Promise<UserProperties | null>` - 根据 ID 查找用户
- `findUserByIdentifier(identifier: string): Promise<UserProperties | null>` - 根据标识符查找用户（支持用户名、邮箱、手机号）
- `findUsersByIds(ids: string[]): Promise<UserProperties[]>` - 根据 ID 列表查找用户
- `findUserIdsByRoleId(roleId: string): Promise<string[]>` - 根据角色 ID 查找用户 ID 列表
- `pageUsers(query: PageUsersQuery): Promise<PaginationResult<UserProperties>>` - 分页查询用户
- `getUserByUsername(username: string): Promise<Readonly<UserProperties> | null>` - 根据用户名查找用户
- `findRolesByUserId(userId: string): Promise<Set<string>>` - 根据用户 ID 查找角色代码集合

### 7.2 UserWriteRepoPort（用户写入仓储端口）

定义用户的写入操作接口，由基础设施层实现。

#### 7.2.1 方法列表

- `save(user: User): Promise<void>` - 保存或创建用户
- `update(user: User): Promise<void>` - 更新用户
- `deleteById(id: string): Promise<void>` - 根据 ID 删除用户
- `deleteUserRoleByUserId(userId: string): Promise<void>` - 根据用户 ID 删除用户角色关联
- `deleteUserRoleByRoleId(roleId: string): Promise<void>` - 根据角色 ID 删除用户角色关联
- `deleteUserRoleByDomain(domain: string): Promise<void>` - 根据域名删除用户和用户角色关联

## 8. 模块注册

### 8.1 AuthenticationModule

认证模块使用动态模块注册方式，支持依赖注入配置。

**注册方式：**

```typescript
AuthenticationModule.register({
  imports: [
    /* 依赖的模块 */
  ],
  inject: [
    /* 需要注入的提供者 */
  ],
});
```

**导出的服务：**

- `AuthenticationService`
- `AuthorizationService`
- 所有查询处理器

**注册的提供者：**

- 所有命令处理器
- 所有查询处理器
- 所有事件处理器
- 所有应用服务
- 自定义注入的提供者

## 9. 使用示例

### 9.1 创建用户

```typescript
// 在控制器或服务中
const command = new UserCreateCommand(
  'john_doe', // username
  'password123', // password
  'domain1', // domain
  'John Doe', // nickName
  null, // avatar
  'john@example.com', // email
  '13800138000', // phoneNumber
  'current_user_id', // uid
);

await this.commandBus.execute(command);
```

### 9.2 用户登录

```typescript
// 在控制器中
const dto: PasswordIdentifierDTO = {
  identifier: 'john_doe', // 或 'john@example.com' 或 '13800138000'
  password: 'password123',
  ip: '192.168.1.1',
  address: 'Beijing',
  userAgent: 'Mozilla/5.0...',
  requestId: 'req-123',
  type: 'web',
  port: 8080,
};

const tokens = await this.authenticationService.execPasswordLogin(dto);
// 返回: { token: '...', refreshToken: '...' }
```

### 9.3 刷新令牌

```typescript
// 在控制器中
const dto: RefreshTokenDTO = {
  refreshToken: '...',
  ip: '192.168.1.1',
  region: 'Beijing',
  userAgent: 'Mozilla/5.0...',
  requestId: 'req-123',
  type: 'web',
  port: 8080,
};

const tokens = await this.authenticationService.refreshToken(dto);
// 返回: { token: '...', refreshToken: '...' }
```

### 9.4 为角色分配权限

```typescript
// 在控制器或服务中
const command = new RoleAssignPermissionCommand(
  'domain1', // domain
  'role_id_123', // roleId
  ['perm1', 'perm2'], // permissions
);

await this.authorizationService.assignPermission(command);
```

### 9.5 查询用户列表

```typescript
// 在控制器中
const query = new PageUsersQuery({
  page: 1,
  pageSize: 10,
  username: 'john', // 可选，模糊查询
  status: Status.ENABLED, // 可选，状态筛选
});

const result = await this.queryBus.execute(query);
// 返回: PaginationResult<UserProperties>
```

## 10. 测试指南

### 10.1 单元测试

单元测试文件应放在与被测文件同目录下，命名格式：`{filename}.spec.ts`。

**测试覆盖要求：**

- 核心业务逻辑测试覆盖率须达到 80% 以上
- 关键路径（如登录、密码验证）测试覆盖率须达到 90% 以上
- 所有公共 API 必须具备测试用例

**测试示例：**

```typescript
// user.spec.ts
describe('User', () => {
  describe('verifyPassword', () => {
    it('应该验证正确的密码', async () => {
      const user = new User({
        id: 'user1',
        username: 'test',
        password: await Password.hash('password123'),
        // ... 其他属性
      });

      const result = await user.verifyPassword('password123');
      expect(result).toBe(true);
    });
  });
});
```

### 10.2 集成测试

集成测试应放置在 `tests/integration/` 目录下。

**测试内容：**

- 命令处理器的完整流程
- 查询处理器的数据查询
- 应用服务的业务逻辑
- 事件发布和订阅

### 10.3 端到端测试

端到端测试应放置在 `tests/e2e/` 目录下。

**测试内容：**

- 用户创建到登录的完整流程
- 令牌刷新流程
- 权限分配流程

## 11. 注意事项

### 11.1 安全注意事项

1. **密码安全**
   - 密码必须使用 bcrypt 加密存储
   - 密码值对象确保密码不可直接访问
   - 密码验证使用安全的比较方法

2. **令牌安全**
   - JWT 令牌使用强密钥签名
   - 刷新令牌使用独立的密钥
   - 令牌过期时间应合理设置

3. **多租户隔离**
   - 所有操作必须考虑域隔离
   - 用户名在域内唯一，跨域可重复
   - 权限分配必须指定域

### 11.2 性能注意事项

1. **Redis 缓存**
   - 用户角色信息缓存到 Redis，提高查询性能
   - 缓存键格式：`auth:token:{userId}`
   - 缓存过期时间与 JWT 过期时间一致

2. **数据库查询**
   - 使用索引优化查询性能
   - 批量查询使用 `IN` 查询而非循环查询
   - 分页查询使用 `LIMIT` 和 `OFFSET`

### 11.3 事务管理

1. **写操作事务**
   - 用户创建、更新、删除操作应在事务中执行
   - 角色分配操作使用事务确保数据一致性

2. **事件发布**
   - 领域事件应在事务提交后发布
   - 使用事件发布器确保事件正确发布

## 12. 扩展指南

### 12.1 添加新的认证方式

1. 在 `AuthenticationService` 中添加新的认证方法
2. 创建对应的 DTO
3. 实现认证逻辑
4. 发布相应的事件

### 12.2 添加新的用户属性

1. 更新 `UserProperties` 类型定义
2. 更新 `User` 聚合根
3. 更新命令和查询对象
4. 更新仓储端口接口
5. 更新基础设施层实现

### 12.3 添加新的事件处理器

1. 创建事件处理器类
2. 实现 `IEventHandler` 接口
3. 在模块中注册事件处理器

## 13. 相关文档

- [IAM 有界上下文设计文档](../XS-iam.md)
- [Domain 模块文档](../domain/README.md)
- [Role 模块文档](../role/README.md)
- [Menu 模块文档](../menu/README.md)
- [Tokens 模块文档](../tokens/README.md)
