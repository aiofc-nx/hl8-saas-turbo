# IAM（身份和访问管理）有界上下文详细设计文档

## 1. 概述

### 1.1 业务背景

IAM（Identity and Access Management，身份和访问管理）有界上下文是系统的核心安全模块，负责管理用户身份、认证、授权和权限控制。该有界上下文采用多租户架构，支持基于角色的访问控制（RBAC），并与 Casbin 权限系统深度集成。

### 1.2 核心功能

- **用户管理：** 用户的创建、更新、删除，支持用户名、邮箱、手机号登录
- **认证服务：** 密码登录、令牌刷新、JWT 令牌生成和验证
- **授权服务：** 角色权限分配、菜单路由分配、用户角色分配
- **域管理：** 多租户域的生命周期管理
- **角色管理：** 角色的创建、更新、删除，支持角色层级结构
- **菜单管理：** 前端菜单和路由的管理，支持树形结构
- **令牌管理：** 访问令牌和刷新令牌的生命周期管理

### 1.3 技术架构

本有界上下文采用 **Clean Architecture + CQRS + 事件驱动架构（EDA）** 模式：

- **Clean Architecture：** 分层架构，领域层独立于基础设施层
- **CQRS：** 命令查询职责分离，命令用于写操作，查询用于读操作
- **事件驱动：** 通过领域事件实现模块间解耦和异步处理
- **端口适配器模式：** 通过端口接口定义仓储契约，由基础设施层实现
- **Casbin 集成：** 与 Casbin 权限系统深度集成，实现细粒度权限控制

### 1.4 子模块结构

IAM 有界上下文包含以下5个子模块：

1. **authentication（认证模块）**：用户管理和认证服务
2. **domain（域模块）**：多租户域管理
3. **role（角色模块）**：角色管理
4. **menu（菜单模块）**：菜单和路由管理
5. **tokens（令牌模块）**：令牌管理

## 2. 子模块详细设计

### 2.1 Authentication（认证模块）

#### 2.1.1 领域模型

##### User（用户聚合根）

用户的领域聚合根，负责管理用户的生命周期和业务规则。

**属性：**

| 属性名        | 类型             | 说明                                             |
| ------------- | ---------------- | ------------------------------------------------ |
| `id`          | `string`         | 用户的唯一标识符                                 |
| `username`    | `string`         | 用户名，在域内必须唯一                           |
| `nickName`    | `string`         | 用户昵称                                         |
| `password`    | `Password`       | 密码值对象，用于密码验证和加密                   |
| `status`      | `Status`         | 用户状态：`ENABLED`（启用）或 `DISABLED`（禁用） |
| `domain`      | `string`         | 用户所属的域代码，用于多租户隔离                 |
| `avatar`      | `string \| null` | 用户头像 URL                                     |
| `email`       | `string \| null` | 用户邮箱地址                                     |
| `phoneNumber` | `string \| null` | 用户手机号码                                     |
| `createdAt`   | `Date`           | 创建时间                                         |
| `createdBy`   | `string`         | 创建者用户 ID                                    |

**领域方法：**

- `verifyPassword(password: string)`: 验证密码
- `canLogin()`: 检查是否可以登录
- `loginUser(password: string)`: 执行用户登录逻辑
- `created()`: 发布 `UserCreatedEvent` 事件
- `deleted()`: 发布 `UserDeletedEvent` 事件

**值对象：**

- `Password`: 密码值对象，负责密码的加密和验证

#### 2.1.2 服务

##### AuthenticationService（认证服务）

提供用户认证相关的业务逻辑。

**主要方法：**

- `execPasswordLogin(dto: PasswordIdentifierDTO)`: 执行密码登录
  - 通过标识符（用户名/邮箱/手机号）查找用户
  - 验证密码
  - 生成 JWT 访问令牌和刷新令牌
  - 发布 `UserLoggedInEvent` 和 `TokenGeneratedEvent` 事件
  - 将用户角色信息缓存到 Redis

- `refreshToken(dto: RefreshTokenDTO)`: 刷新访问令牌
  - 验证刷新令牌的有效性
  - 检查令牌是否已被使用
  - 生成新的访问令牌和刷新令牌
  - 发布 `TokenGeneratedEvent` 事件

##### AuthorizationService（授权服务）

提供基于角色的访问控制（RBAC）相关的业务逻辑。

**主要方法：**

- `assignPermission(command: RoleAssignPermissionCommand)`: 为角色分配权限
  - 验证域和角色的存在性
  - 查询并验证权限（API 端点）是否存在
  - 同步权限到 Casbin 策略中

- `assignRoutes(command: RoleAssignRouteCommand)`: 为角色分配路由
  - 验证域和角色的存在性
  - 查询并验证路由（菜单）是否存在
  - 同步路由到角色菜单关联表

- `assignUsers(command: RoleAssignUserCommand)`: 为用户分配角色
  - 验证角色和用户的存在性
  - 同步用户到用户角色关联表

#### 2.1.3 命令

- `UserCreateCommand`: 创建用户命令
- `UserUpdateCommand`: 更新用户命令
- `UserDeleteCommand`: 删除用户命令
- `RoleAssignUserCommand`: 为用户分配角色命令
- `RoleAssignRouteCommand`: 为角色分配路由命令
- `RoleAssignPermissionCommand`: 为角色分配权限命令

#### 2.1.4 查询

- `PageUsersQuery`: 分页查询用户列表

#### 2.1.5 领域事件

- `UserCreatedEvent`: 用户创建事件
- `UserLoggedInEvent`: 用户登录事件
- `UserDeletedEvent`: 用户删除事件

### 2.2 Domain（域模块）

#### 2.2.1 领域模型

##### Domain（域聚合根）

Casbin 域的领域模型，是域有界上下文的聚合根。

**属性：**

| 属性名        | 类型     | 说明                                             |
| ------------- | -------- | ------------------------------------------------ |
| `id`          | `string` | 域的唯一标识符                                   |
| `code`        | `string` | 域的唯一代码，用于标识不同的租户或业务域         |
| `name`        | `string` | 域的显示名称                                     |
| `description` | `string` | 域的详细描述信息                                 |
| `status`      | `Status` | 域的状态：`ENABLED`（启用）或 `DISABLED`（禁用） |
| `createdAt`   | `Date`   | 创建时间                                         |
| `createdBy`   | `string` | 创建者用户 ID                                    |

**领域方法：**

- `deleted()`: 发布 `DomainDeletedEvent` 事件

**静态方法：**

- `fromCreate(properties: DomainCreateProperties)`: 从创建属性创建域实例
- `fromUpdate(properties: DomainUpdateProperties)`: 从更新属性创建域实例
- `fromProp(properties: DomainProperties)`: 从完整属性创建域实例

#### 2.2.2 命令

- `DomainCreateCommand`: 创建域命令
- `DomainUpdateCommand`: 更新域命令
- `DomainDeleteCommand`: 删除域命令

#### 2.2.3 查询

- `PageDomainsQuery`: 分页查询域列表
- `FindDomainByCodeQuery`: 根据域代码查询域

#### 2.2.4 领域事件

- `DomainDeletedEvent`: 域删除事件

### 2.3 Role（角色模块）

#### 2.3.1 领域模型

##### Role（角色聚合根）

角色的领域模型，是角色有界上下文的聚合根。

**属性：**

| 属性名        | 类型     | 说明                                               |
| ------------- | -------- | -------------------------------------------------- |
| `id`          | `string` | 角色的唯一标识符                                   |
| `code`        | `string` | 角色的唯一代码，用于标识不同的角色                 |
| `name`        | `string` | 角色的显示名称                                     |
| `description` | `string` | 角色的详细描述信息                                 |
| `pid`         | `string` | 父角色 ID，用于实现角色层级结构                    |
| `status`      | `Status` | 角色的状态：`ENABLED`（启用）或 `DISABLED`（禁用） |
| `createdAt`   | `Date`   | 创建时间                                           |
| `createdBy`   | `string` | 创建者用户 ID                                      |

**领域方法：**

- `deleted()`: 发布 `RoleDeletedEvent` 事件

**静态方法：**

- `fromCreate(properties: RoleCreateProperties)`: 从创建属性创建角色实例
- `fromUpdate(properties: RoleUpdateProperties)`: 从更新属性创建角色实例
- `fromProp(properties: RoleProperties)`: 从完整属性创建角色实例

#### 2.3.2 命令

- `RoleCreateCommand`: 创建角色命令
- `RoleUpdateCommand`: 更新角色命令
- `RoleDeleteCommand`: 删除角色命令

#### 2.3.3 查询

- `PageRolesQuery`: 分页查询角色列表
- `FindRoleByIdQuery`: 根据角色 ID 查询角色

#### 2.3.4 领域事件

- `RoleDeletedEvent`: 角色删除事件

### 2.4 Menu（菜单模块）

#### 2.4.1 领域模型

##### Menu（菜单聚合根）

菜单的领域模型，是菜单有界上下文的聚合根。

**属性：**

| 属性名       | 类型                   | 说明                                                            |
| ------------ | ---------------------- | --------------------------------------------------------------- |
| `id`         | `number`               | 菜单的唯一标识符                                                |
| `menuName`   | `string`               | 菜单的显示名称                                                  |
| `menuType`   | `MenuType`             | 菜单类型：`MENU`（菜单）、`DIRECTORY`（目录）、`BUTTON`（按钮） |
| `routeName`  | `string`               | 前端路由的唯一名称                                              |
| `routePath`  | `string`               | 前端路由的 URL 路径                                             |
| `component`  | `string`               | 前端组件的路径或名称                                            |
| `status`     | `Status`               | 菜单状态：`ENABLED`（启用）或 `DISABLED`（禁用）                |
| `pid`        | `number`               | 父菜单 ID，用于构建菜单层级结构                                 |
| `order`      | `number`               | 菜单的显示顺序                                                  |
| `constant`   | `boolean`              | 是否为常量路由，常量路由不受权限控制                            |
| `uid`        | `string`               | 用于权限控制的用户标识                                          |
| `iconType`   | `number \| undefined`  | 图标类型，可选                                                  |
| `icon`       | `string \| undefined`  | 图标名称或路径，可选                                            |
| `pathParam`  | `string \| undefined`  | 路由路径中的动态参数，可选                                      |
| `activeMenu` | `string \| undefined`  | 当前路由激活时高亮的菜单项路径，可选                            |
| `hideInMenu` | `boolean \| undefined` | 是否在菜单中隐藏，可选                                          |
| `i18nKey`    | `string \| undefined`  | 用于国际化的键名，可选                                          |
| `keepAlive`  | `boolean \| undefined` | 是否保持组件状态，可选                                          |
| `href`       | `string \| undefined`  | 外部链接 URL，可选                                              |
| `multiTab`   | `boolean \| undefined` | 是否支持多标签，可选                                            |
| `createdAt`  | `Date`                 | 创建时间                                                        |
| `createdBy`  | `string`               | 创建者用户 ID                                                   |

**领域方法：**

- `deleted()`: 发布 `MenuDeletedEvent` 事件

**静态方法：**

- `fromCreate(properties: MenuCreateProperties)`: 从创建属性创建菜单实例
- `fromUpdate(properties: MenuUpdateProperties)`: 从更新属性创建菜单实例
- `fromProp(properties: MenuProperties)`: 从完整属性创建菜单实例

#### 2.4.2 服务

##### MenuService（菜单服务）

提供菜单相关的业务逻辑，包括菜单树形结构构建等。

#### 2.4.3 命令

- `MenuCreateCommand`: 创建菜单命令
- `MenuUpdateCommand`: 更新菜单命令
- `MenuDeleteCommand`: 删除菜单命令

#### 2.4.4 查询

- `MenusQuery`: 查询所有菜单
- `MenusTreeQuery`: 查询菜单树形结构
- `MenusByIdsQuery`: 根据 ID 列表查询菜单
- `MenusByRoleCodeAndDomainQuery`: 根据角色代码和域查询菜单
- `MenuIdsByRoleIdAndDomainQuery`: 根据角色 ID 和域查询菜单 ID 列表
- `MenuIdsByUserIdAndDomainQuery`: 根据用户 ID 和域查询菜单 ID 列表
- `MenuIdsByRoleCodeAndDomainQuery`: 根据角色代码和域查询菜单 ID 列表

#### 2.4.5 领域事件

- `MenuDeletedEvent`: 菜单删除事件

### 2.5 Tokens（令牌模块）

#### 2.5.1 领域模型

##### TokensEntity（令牌聚合根）

令牌的领域模型，是令牌有界上下文的聚合根。

**属性：**

| 属性名         | 类型                          | 说明                                                        |
| -------------- | ----------------------------- | ----------------------------------------------------------- |
| `accessToken`  | `string`                      | JWT 访问令牌，用于 API 请求的身份验证                       |
| `refreshToken` | `string`                      | JWT 刷新令牌，用于获取新的访问令牌                          |
| `status`       | `string`                      | 令牌状态：`UNUSED`（未使用）或 `USED`（已使用）             |
| `userId`       | `string`                      | 令牌所属用户的唯一标识符                                    |
| `username`     | `string`                      | 令牌所属用户的用户名                                        |
| `domain`       | `string`                      | 用户所属的域代码                                            |
| `ip`           | `string`                      | 生成令牌时的客户端 IP 地址                                  |
| `address`      | `string`                      | 生成令牌时的地理位置信息                                    |
| `userAgent`    | `string`                      | 生成令牌时的用户代理信息                                    |
| `requestId`    | `string`                      | 生成令牌时的请求唯一标识符                                  |
| `type`         | `string`                      | 令牌生成类型，例如：password（密码登录）、token（令牌刷新） |
| `createdBy`    | `string`                      | 创建令牌的用户 ID                                           |
| `port`         | `number \| null \| undefined` | 生成令牌时的端口号，可选                                    |

**领域方法：**

- `refreshTokenCheck()`: 检查刷新令牌是否可用
  - 验证刷新令牌是否已被使用
  - 如果未使用，发布 `RefreshTokenUsedEvent` 事件

#### 2.5.2 查询

- `TokensByRefreshTokenQuery`: 根据刷新令牌查询令牌

#### 2.5.3 领域事件

- `TokenGeneratedEvent`: 令牌生成事件
- `RefreshTokenUsedEvent`: 刷新令牌使用事件

## 3. 权限控制机制

### 3.1 Casbin 权限模型

IAM 系统使用 Casbin 进行权限控制，权限策略格式为：

```
p, roleCode, resource, action, domain, allow
```

其中：

- `p` 表示策略规则
- `roleCode` 表示角色代码
- `resource` 表示资源（API 端点的资源类型）
- `action` 表示操作（API 端点的操作类型）
- `domain` 表示域（多租户隔离）
- `allow` 表示允许

### 3.2 权限分配流程

1. **为角色分配权限（API 端点）**
   - 选择角色和域
   - 选择要分配的 API 端点
   - 同步权限到 Casbin 策略中

2. **为角色分配路由（菜单）**
   - 选择角色和域
   - 选择要分配的菜单路由
   - 同步路由到角色菜单关联表

3. **为用户分配角色**
   - 选择角色
   - 选择要分配的用户
   - 同步用户到用户角色关联表

### 3.3 权限验证流程

```
API 请求
  ↓
提取 JWT 令牌
  ↓
验证令牌有效性
  ↓
从令牌中提取用户信息（userId, username, domain）
  ↓
从 Redis 缓存中获取用户角色列表
  ↓
提取请求路径和方法
  ↓
查找对应的 API 端点（path + method）
  ↓
获取端点的 resource 和 action
  ↓
查询 Casbin 规则（roleCode, resource, action, domain）
  ↓
验证权限
  ↓
允许或拒绝请求
```

### 3.4 角色缓存机制

用户登录成功后，系统会将用户的角色列表缓存到 Redis 中：

- **缓存键格式：** `auth:token:{userId}`
- **缓存值：** 角色代码集合（Set）
- **过期时间：** 与 JWT 访问令牌过期时间一致

这样可以避免每次权限验证都查询数据库，提升性能。

## 4. 认证流程

### 4.1 密码登录流程

```
用户提交登录请求（identifier + password）
  ↓
AuthenticationService.execPasswordLogin()
  ↓
通过标识符查找用户（支持用户名/邮箱/手机号）
  ↓
使用 User 聚合根验证密码
  ↓
检查用户状态是否启用
  ↓
生成 JWT 访问令牌和刷新令牌
  ↓
发布 UserLoggedInEvent 事件（记录登录日志）
  ↓
发布 TokenGeneratedEvent 事件（保存令牌）
  ↓
查询用户角色列表
  ↓
将角色列表缓存到 Redis
  ↓
返回访问令牌和刷新令牌
```

### 4.2 令牌刷新流程

```
用户提交刷新令牌请求（refreshToken）
  ↓
AuthenticationService.refreshToken()
  ↓
根据刷新令牌查询令牌详情
  ↓
验证刷新令牌的签名和有效期
  ↓
使用 TokensEntity 聚合根检查令牌是否已被使用
  ↓
如果已使用，抛出异常
  ↓
如果未使用，发布 RefreshTokenUsedEvent 事件
  ↓
生成新的访问令牌和刷新令牌
  ↓
发布 TokenGeneratedEvent 事件（保存新令牌）
  ↓
返回新的访问令牌和刷新令牌
```

## 5. 多租户隔离

### 5.1 域（Domain）概念

域是多租户隔离的基本单位，每个域代表一个独立的租户或业务空间。

### 5.2 域隔离机制

- **用户隔离：** 每个用户属于一个域，用户只能访问自己域下的资源
- **角色隔离：** 角色在域内有效，不同域的角色相互独立
- **权限隔离：** Casbin 权限策略包含域信息，确保跨域权限隔离
- **菜单隔离：** 菜单路由分配时指定域，不同域的路由相互独立

### 5.3 域管理

- **创建域：** 创建新的租户域
- **更新域：** 更新域的基本信息
- **删除域：** 删除域及其关联的所有资源（用户、角色、权限等）

## 6. 数据模型关系

### 6.1 实体关系图

```
Domain (域)
  ├── User (用户) - 多对一
  ├── Role (角色) - 多对一
  └── Menu (菜单) - 多对一（通过路由分配）

User (用户)
  ├── SysUserRole (用户角色关联) - 多对多
  └── TokensEntity (令牌) - 一对多

Role (角色)
  ├── SysUserRole (用户角色关联) - 多对多
  ├── SysRoleMenu (角色菜单关联) - 多对多
  └── CasbinRule (Casbin 权限规则) - 一对多

Menu (菜单)
  └── SysRoleMenu (角色菜单关联) - 多对多

ApiEndpoint (API 端点)
  └── CasbinRule (Casbin 权限规则) - 多对多
```

### 6.2 关联表

- **SysUserRole：** 用户角色关联表
  - `userId`: 用户 ID
  - `roleId`: 角色 ID

- **SysRoleMenu：** 角色菜单关联表
  - `roleId`: 角色 ID
  - `menuId`: 菜单 ID
  - `domain`: 域代码

- **CasbinRule：** Casbin 权限规则表
  - `ptype`: 策略类型（'p'）
  - `v0`: 角色代码
  - `v1`: 资源
  - `v2`: 操作
  - `v3`: 域
  - `v4`: 允许/拒绝（'allow'）

## 7. 使用示例

### 7.1 用户登录

```typescript
// 通过认证服务执行密码登录
const dto = new PasswordIdentifierDTO({
  identifier: 'john.doe', // 可以是用户名、邮箱或手机号
  password: 'password123',
  ip: '192.168.1.1',
  address: '北京市',
  userAgent: 'Mozilla/5.0...',
  requestId: 'req-123',
  type: 'password',
  port: 8080,
});

const result = await authenticationService.execPasswordLogin(dto);
// result: { token: '...', refreshToken: '...' }
```

### 7.2 刷新令牌

```typescript
// 通过认证服务刷新令牌
const dto = new RefreshTokenDTO({
  refreshToken: '...',
  ip: '192.168.1.1',
  region: '北京市',
  userAgent: 'Mozilla/5.0...',
  requestId: 'req-456',
  type: 'token',
  port: 8080,
});

const result = await authenticationService.refreshToken(dto);
// result: { token: '...', refreshToken: '...' }
```

### 7.3 为角色分配权限

```typescript
// 通过授权服务为角色分配权限
const command = new RoleAssignPermissionCommand({
  domain: 'example.com',
  roleId: 'role-123',
  permissions: ['endpoint-id-1', 'endpoint-id-2'],
});

await authorizationService.assignPermission(command);
```

### 7.4 为角色分配路由

```typescript
// 通过授权服务为角色分配路由
const command = new RoleAssignRouteCommand({
  domain: 'example.com',
  roleId: 'role-123',
  menuIds: [1, 2, 3],
});

await authorizationService.assignRoutes(command);
```

### 7.5 为用户分配角色

```typescript
// 通过授权服务为用户分配角色
const command = new RoleAssignUserCommand({
  roleId: 'role-123',
  userIds: ['user-1', 'user-2', 'user-3'],
});

await authorizationService.assignUsers(command);
```

## 8. 性能优化

### 8.1 角色缓存

- 用户登录成功后，将角色列表缓存到 Redis
- 缓存键格式：`auth:token:{userId}`
- 缓存过期时间与 JWT 访问令牌过期时间一致
- 权限验证时直接从缓存读取，避免数据库查询

### 8.2 令牌管理

- 刷新令牌使用后立即标记为已使用，防止重复使用
- 令牌信息持久化到数据库，支持令牌撤销和审计

### 8.3 权限策略缓存

- Casbin 权限策略可以缓存到内存，提升权限验证性能
- 权限变更时及时更新缓存

## 9. 安全考虑

### 9.1 密码安全

- 密码使用值对象（Password）管理，支持加密和验证
- 密码不直接存储，存储加密后的哈希值
- 使用安全的加密算法（如 bcrypt）

### 9.2 令牌安全

- JWT 令牌使用密钥签名，防止篡改
- 访问令牌和刷新令牌使用不同的密钥
- 刷新令牌使用后立即失效，防止重复使用
- 令牌包含过期时间，自动失效

### 9.3 多租户隔离

- 所有操作都包含域信息，确保跨域隔离
- 用户只能访问自己域下的资源
- 权限策略包含域信息，确保跨域权限隔离

### 9.4 权限控制

- 使用 Casbin 进行细粒度权限控制
- 权限策略持久化到数据库，支持审计
- 支持权限的动态分配和撤销

## 10. 扩展点

### 10.1 多因素认证（MFA）

当前版本支持密码登录，未来可扩展：

- 支持短信验证码登录
- 支持邮箱验证码登录
- 支持第三方 OAuth 登录
- 支持双因素认证（2FA）

### 10.2 权限继承

当前版本支持角色层级结构（pid），未来可扩展：

- 支持角色权限继承
- 支持角色组合权限

### 10.3 权限审计

当前版本记录登录日志，未来可扩展：

- 记录权限变更日志
- 记录权限使用日志
- 支持权限审计报告

### 10.4 单点登录（SSO）

当前版本支持 JWT 令牌，未来可扩展：

- 支持单点登录（SSO）
- 支持令牌撤销列表（Token Revocation List）
- 支持令牌黑名单

## 11. 依赖关系

### 11.1 内部依赖

- `@hl8/casbin`: Casbin 权限控制服务
- `@hl8/config`: 安全配置
- `@hl8/constants`: 常量定义
- `@hl8/redis`: Redis 工具类
- `@hl8/typings`: 类型定义

### 11.2 外部依赖

- `@nestjs/common`: NestJS 核心模块
- `@nestjs/cqrs`: CQRS 模式支持
- `@nestjs/jwt`: JWT 令牌服务
- `@mikro-orm/core`: ORM 核心

### 11.3 跨有界上下文依赖

- `api-endpoint`: API 端点有界上下文（用于权限分配）
- `log-audit`: 日志审计有界上下文（用于登录日志记录）

## 12. 测试建议

### 12.1 单元测试

- 测试聚合根的业务逻辑（密码验证、登录检查等）
- 测试服务的业务逻辑（认证、授权）
- 测试命令处理器的业务逻辑
- 测试查询处理器的查询逻辑

### 12.2 集成测试

- 测试认证流程的完整性
- 测试授权流程的完整性
- 测试权限验证的完整性
- 测试多租户隔离的正确性

### 12.3 端到端测试

- 测试用户登录的完整 API 流程
- 测试令牌刷新的完整 API 流程
- 测试权限分配的完整 API 流程
- 测试权限验证的完整流程

## 13. 注意事项

### 13.1 密码安全

- 密码必须加密存储，不能明文存储
- 使用安全的加密算法和盐值
- 定期更新密码策略

### 13.2 令牌管理

- 刷新令牌使用后立即标记为已使用
- 令牌过期时间要合理设置
- 支持令牌撤销机制

### 13.3 多租户隔离

- 所有操作都要包含域信息
- 确保跨域数据隔离
- 权限策略要包含域信息

### 13.4 权限同步

- 权限变更时要及时同步到 Casbin
- 用户角色变更时要更新 Redis 缓存
- 角色删除时要清理相关权限

## 14. 变更历史

| 版本 | 日期 | 变更说明                                                                     | 作者 |
| ---- | ---- | ---------------------------------------------------------------------------- | ---- |
| 1.0  | -    | 初始版本，实现用户管理、认证、授权、域管理、角色管理、菜单管理、令牌管理功能 | -    |
