# @hl8/casbin

NestJS Casbin 授权库，提供基于 Casbin 的权限管理功能，用于快速集成 RBAC（基于角色的访问控制）权限验证。

## 📋 项目概述

### 基本信息

- **包名**: `@hl8/casbin`
- **版本**: `1.0.0`
- **描述**: Casbin module for NestJS applications
- **位置**: `libs/infra/casbin`

### 提供的功能

1. **`AuthZModule`** - 授权模块，提供基于 Casbin 的权限管理功能
2. **`AuthZGuard`** - 权限验证守卫，用于验证用户是否具有访问特定资源的权限
3. **`AuthZService`** - 授权服务，封装 Casbin RBAC API 和策略管理 API
4. **`UsePermissions`** - 权限装饰器，用于标记路由所需的权限要求
5. **`MikroORMAdapter`** - MikroORM 适配器，用于将 Casbin 策略存储到数据库

## 🚀 快速开始

### 安装

该库是 monorepo 工作空间的一部分，通过 workspace 协议引用：

```json
{
  "dependencies": {
    "@hl8/casbin": "workspace:*"
  }
}
```

### 导入

```typescript
import {
  AuthZModule,
  AuthZGuard,
  UsePermissions,
  MikroORMAdapter,
} from '@hl8/casbin';
```

## 📚 API 文档

### AuthZModule

授权模块，提供基于 Casbin 的权限管理功能。

#### 类签名

```typescript
@Global()
@Module({})
export class AuthZModule {
  static register(options: AuthZModuleOptions): DynamicModule;
}
```

#### 功能特性

- ✅ 支持动态模块注册
- ✅ 支持自定义 Casbin 执行器提供者
- ✅ 支持文件或数据库策略存储
- ✅ 全局模块，可在整个应用中使用

#### 使用示例

##### 基本使用（使用文件策略）

```typescript
import { Module } from '@nestjs/common';
import { AuthZModule } from '@hl8/casbin';
import { ExecutionContext } from '@nestjs/common';
import { IAuthentication } from '@hl8/typings';

@Module({
  imports: [
    AuthZModule.register({
      model: 'path/to/model.conf',
      policy: 'path/to/policy.csv',
      userFromContext: (ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest();
        return request.user as IAuthentication;
      },
    }),
  ],
})
export class AppModule {}
```

##### 使用数据库适配器（推荐）

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EntityManager } from '@mikro-orm/core';
import * as casbin from 'casbin';
import { AUTHZ_ENFORCER, AuthZModule, MikroORMAdapter } from '@hl8/casbin';
import { ISecurityConfig, securityRegToken } from '@hl8/config';
import { getConfigPath } from '@hl8/utils';

@Module({
  imports: [
    ConfigModule,
    AuthZModule.register({
      imports: [ConfigModule],
      enforcerProvider: {
        provide: AUTHZ_ENFORCER,
        useFactory: async (configService: ConfigService, em: EntityManager) => {
          const adapter = MikroORMAdapter.newAdapter(em);
          const { casbinModel } = configService.get<ISecurityConfig>(
            securityRegToken,
            { infer: true },
          );
          const casbinModelPath = getConfigPath(casbinModel);
          return casbin.newEnforcer(casbinModelPath, adapter);
        },
        inject: [ConfigService, EntityManager],
      },
      userFromContext: (ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest();
        return request.user as IAuthentication;
      },
    }),
  ],
})
export class AppModule {}
```

### AuthZGuard

权限验证守卫，用于验证用户是否具有访问特定资源的权限。

#### 类签名

```typescript
@Injectable()
export class AuthZGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(AUTHZ_ENFORCER) private readonly enforcer: casbin.Enforcer,
    @Inject(AUTHZ_MODULE_OPTIONS) private readonly options: AuthZModuleOptions,
  );

  async canActivate(context: ExecutionContext): Promise<boolean>;
}
```

#### 功能特性

- ✅ 自动从路由元数据中获取权限要求
- ✅ 从 Redis 缓存中获取用户角色
- ✅ 支持多权限 AND 逻辑验证
- ✅ 支持域名隔离

#### 使用示例

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthZGuard, UsePermissions } from '@hl8/casbin';

@Controller('api')
export class ApiController {
  // 需要单个权限的路由
  @Get('data')
  @UseGuards(AuthZGuard)
  @UsePermissions({ resource: 'data1', action: 'read' })
  async getData() {
    return { message: 'Data retrieved successfully' };
  }

  // 需要多个权限的路由（所有权限都必须满足）
  @Get('admin')
  @UseGuards(AuthZGuard)
  @UsePermissions(
    { resource: 'data1', action: 'read' },
    { resource: 'data2', action: 'write' },
  )
  async adminOnly() {
    return { message: 'Admin access granted' };
  }
}
```

### AuthZService

授权服务，封装 Casbin RBAC API 和策略管理 API。

#### 类签名

```typescript
@Injectable()
export class AuthZService {
  constructor(
    @Inject(AUTHZ_ENFORCER)
    public readonly enforcer: casbin.Enforcer,
  );

  // RBAC API
  getRolesForUser(name: string, domain?: string): Promise<string[]>;
  getUsersForRole(name: string, domain?: string): Promise<string[]>;
  hasRoleForUser(name: string, role: string, domain?: string): Promise<boolean>;
  addRoleForUser(user: string, role: string, domain?: string): Promise<boolean>;
  deleteRoleForUser(user: string, role: string, domain?: string): Promise<boolean>;
  // ... 更多方法

  // 权限管理 API
  enforce(...params: any[]): Promise<boolean>;
  addPolicy(...params: string[]): Promise<boolean>;
  removePolicy(...params: string[]): Promise<boolean>;
  // ... 更多方法
}
```

#### 功能特性

- ✅ 完整的 RBAC API 封装
- ✅ 策略管理 API
- ✅ 隐式权限查询（包括角色继承）
- ✅ 所有方法都转换为异步，支持未来 IO 操作

#### 使用示例

```typescript
import { Injectable } from '@nestjs/common';
import { AuthZService } from '@hl8/casbin';

@Injectable()
export class UserService {
  constructor(private readonly authZService: AuthZService) {}

  async assignRoleToUser(userId: string, role: string) {
    return await this.authZService.addRoleForUser(userId, role);
  }

  async getUserRoles(userId: string) {
    return await this.authZService.getRolesForUser(userId);
  }

  async checkPermission(userId: string, resource: string, action: string) {
    return await this.authZService.hasPermissionForUser(
      userId,
      resource,
      action,
    );
  }
}
```

### UsePermissions 装饰器

权限装饰器，用于标记路由所需的权限要求。

#### 函数签名

```typescript
export const UsePermissions = (...permissions: Permission[]): ReturnType<typeof SetMetadata>;
```

#### 功能特性

- ✅ 支持单个或多个权限要求
- ✅ 多个权限使用 AND 逻辑（所有权限都必须满足）
- ✅ 支持自定义 action 类型

#### 使用示例

```typescript
import { UsePermissions } from '@hl8/casbin';

// 单个权限
@UsePermissions({ resource: 'data1', action: 'read' })

// 多个权限（AND 逻辑）
@UsePermissions(
  { resource: 'data1', action: 'read' },
  { resource: 'data2', action: 'write' },
)

// 使用枚举值
@UsePermissions({ resource: 'data1', action: AuthActionVerb.READ })

// 使用自定义 action
@UsePermissions({ resource: 'data1', action: 'custom-action' })
```

### MikroORMAdapter

MikroORM Casbin 适配器，用于将 Casbin 策略存储到数据库。

#### 类签名

```typescript
export class MikroORMAdapter implements Adapter {
  static newAdapter(em: EntityManager): MikroORMAdapter;
  isFiltered(): boolean;
  enableFiltered(enabled: boolean): void;
  async loadPolicy(model: Model): Promise<void>;
  async savePolicy(model: Model): Promise<boolean>;
  // ... 更多方法
}
```

#### 功能特性

- ✅ 使用 MikroORM EntityManager 进行数据操作
- ✅ 支持过滤策略加载
- ✅ 支持批量策略操作
- ✅ 自动处理策略规则转换

#### 使用示例

```typescript
import { EntityManager } from '@mikro-orm/core';
import { MikroORMAdapter } from '@hl8/casbin';

// 创建适配器
const adapter = MikroORMAdapter.newAdapter(entityManager);

// 在 enforcerProvider 中使用
const enforcer = await casbin.newEnforcer('model.conf', adapter);
```

## ⚙️ 配置要求

### AuthZModuleOptions

授权模块配置选项接口：

```typescript
interface AuthZModuleOptions {
  /** Casbin 模型文件路径 */
  model?: string;
  /** Casbin 策略文件路径或策略数据 */
  policy?: string | Promise<T>;
  /** 从执行上下文中提取用户信息的函数（必填） */
  userFromContext: (context: ExecutionContext) => IAuthentication;
  /** Casbin 执行器提供者（可选） */
  enforcerProvider?: Provider<any>;
  /** 需要导入的模块列表（可选） */
  imports?: Array<
    Type<any> | DynamicModule | Promise<DynamicModule> | ForwardReference
  >;
}
```

### IAuthentication 接口

用户认证信息接口，必须从 `userFromContext` 函数返回：

```typescript
interface IAuthentication {
  /** 用户唯一标识 */
  uid: string;
  /** 用户名 */
  username: string;
  /** 用户所属域 */
  domain: string;
}
```

### Casbin 模型配置

Casbin 模型文件（`model.conf`）定义了权限验证的规则和逻辑。以下是本系统使用的模型配置及其详细说明：

```ini
[request_definition]
r = sub, obj, act, dom

[policy_definition]
p = sub, obj, act, dom, eft

[role_definition]
g = _, _, _

[policy_effect]
e = some(where (p.eft == allow)) && !some(where (p.eft == deny))

[matchers]
m = g(r.sub, p.sub, r.dom) && r.obj == p.obj && r.act == p.act && r.dom == p.dom
```

#### 配置说明

##### 1. [request_definition] - 请求定义

定义权限验证请求的结构，包含 4 个参数：

```ini
r = sub, obj, act, dom
```

**参数说明**：

| 参数  | 说明                                      | 示例值                          |
| ----- | ----------------------------------------- | ------------------------------- |
| `sub` | 主体（Subject），通常是用户 ID 或角色代码 | `"user-123"` 或 `"admin"`       |
| `obj` | 对象（Object），通常是资源类型            | `"user"`、`"role"`、`"domain"`  |
| `act` | 操作（Action），通常是操作类型            | `"read"`、`"write"`、`"delete"` |
| `dom` | 域（Domain），用于多租户隔离              | `"example.com"`、`"tenant-a"`   |

**使用场景**：

当用户访问资源时，系统会构造一个请求：`(sub, obj, act, dom)`，例如：

- `("user-123", "user", "read", "example.com")` - 用户 user-123 在 example.com 域下读取 user 资源

##### 2. [policy_definition] - 策略定义

定义权限策略的结构，包含 5 个参数：

```ini
p = sub, obj, act, dom, eft
```

**参数说明**：

| 参数  | 说明                            | 示例值                               |
| ----- | ------------------------------- | ------------------------------------ |
| `sub` | 主体（Subject），通常是角色代码 | `"admin"`、`"user"`                  |
| `obj` | 对象（Object），资源类型        | `"user"`、`"role"`                   |
| `act` | 操作（Action），操作类型        | `"read"`、`"write"`、`"delete"`      |
| `dom` | 域（Domain），多租户隔离        | `"example.com"`                      |
| `eft` | 效果（Effect），权限效果        | `"allow"`（允许）或 `"deny"`（拒绝） |

**策略示例**：

```
p, admin, user, read, example.com, allow
p, admin, user, write, example.com, allow
p, user, user, read, example.com, allow
p, admin, user, delete, example.com, deny
```

**策略含义**：

- `p, admin, user, read, example.com, allow` - 管理员角色在 example.com 域下可以读取 user 资源
- `p, admin, user, write, example.com, allow` - 管理员角色在 example.com 域下可以写入 user 资源
- `p, user, user, read, example.com, allow` - 普通用户角色在 example.com 域下可以读取 user 资源
- `p, admin, user, delete, example.com, deny` - 管理员角色在 example.com 域下不能删除 user 资源

##### 3. [role_definition] - 角色定义

定义角色继承关系，使用 RBAC（基于角色的访问控制）模型：

```ini
g = _, _, _
```

**参数说明**：

| 参数       | 说明                         | 示例值                     |
| ---------- | ---------------------------- | -------------------------- |
| 第一个参数 | 用户或子角色                 | `"user-123"` 或 `"editor"` |
| 第二个参数 | 角色或父角色                 | `"admin"` 或 `"manager"`   |
| 第三个参数 | 域（Domain），用于多租户隔离 | `"example.com"`            |

**角色继承示例**：

```
g, user-123, admin, example.com
g, editor, manager, example.com
```

**角色继承含义**：

- `g, user-123, admin, example.com` - 用户 user-123 在 example.com 域下拥有 admin 角色
- `g, editor, manager, example.com` - editor 角色在 example.com 域下继承 manager 角色的权限

**角色继承链**：

如果 `editor` 继承 `manager`，`manager` 继承 `admin`，则：

- `editor` 拥有 `manager` 和 `admin` 的所有权限
- 角色继承支持多级继承

##### 4. [policy_effect] - 策略效果

定义权限验证的结果判断逻辑：

```ini
e = some(where (p.eft == allow)) && !some(where (p.eft == deny))
```

**逻辑说明**：

- `some(where (p.eft == allow))` - 至少有一个策略允许（allow）
- `!some(where (p.eft == deny))` - 没有任何策略拒绝（deny）
- `&&` - 两个条件都必须满足（AND 逻辑）

**验证结果**：

- **允许访问**：至少有一个策略允许，且没有任何策略拒绝
- **拒绝访问**：有策略明确拒绝，或没有任何策略允许

**示例场景**：

1. **场景 1**：用户有 `allow` 策略，没有 `deny` 策略
   - 结果：✅ 允许访问

2. **场景 2**：用户有 `allow` 策略，也有 `deny` 策略
   - 结果：❌ 拒绝访问（deny 优先级更高）

3. **场景 3**：用户没有任何策略
   - 结果：❌ 拒绝访问（没有 allow 策略）

##### 5. [matchers] - 匹配器

定义权限验证的匹配规则，将请求与策略进行匹配：

```ini
m = g(r.sub, p.sub, r.dom) && r.obj == p.obj && r.act == p.act && r.dom == p.dom
```

**匹配逻辑说明**：

1. **角色匹配**：`g(r.sub, p.sub, r.dom)`
   - 检查请求的主体（`r.sub`）是否拥有策略中的角色（`p.sub`）
   - 在指定的域（`r.dom`）下进行角色检查
   - `g()` 函数会递归检查角色继承关系

2. **资源匹配**：`r.obj == p.obj`
   - 请求的资源（`r.obj`）必须与策略的资源（`p.obj`）完全匹配

3. **操作匹配**：`r.act == p.act`
   - 请求的操作（`r.act`）必须与策略的操作（`p.act`）完全匹配

4. **域匹配**：`r.dom == p.dom`
   - 请求的域（`r.dom`）必须与策略的域（`p.dom`）完全匹配
   - **这是多租户隔离的关键**：不同域的策略相互独立

**匹配示例**：

**请求**：`("user-123", "user", "read", "example.com")`

**策略 1**：`p, admin, user, read, example.com, allow`

- 角色匹配：需要检查 `g(user-123, admin, example.com)` - 如果用户拥有 admin 角色，则匹配
- 资源匹配：`"user" == "user"` ✅
- 操作匹配：`"read" == "read"` ✅
- 域匹配：`"example.com" == "example.com"` ✅
- 结果：如果角色匹配，则策略匹配 ✅

**策略 2**：`p, admin, user, read, other.com, allow`

- 域匹配：`"example.com" == "other.com"` ❌
- 结果：策略不匹配 ❌（域不匹配，即使其他条件都满足）

#### 多租户隔离机制

本模型通过 `dom`（域）参数实现多租户隔离：

1. **请求中的域**：从用户上下文中获取，通常是用户所属的域
2. **策略中的域**：策略必须属于特定域
3. **域匹配**：只有请求的域和策略的域完全匹配时，策略才会生效

**隔离效果**：

- ✅ 不同域的策略相互独立，互不影响
- ✅ 用户只能访问自己域下的资源
- ✅ 角色和权限都是域级别的，不能跨域使用

**示例**：

```
# example.com 域的策略
p, admin, user, read, example.com, allow

# other.com 域的策略
p, admin, user, read, other.com, allow
```

即使用户在两个域都拥有 admin 角色，但：

- 在 `example.com` 域下，只能使用 `example.com` 域的策略
- 在 `other.com` 域下，只能使用 `other.com` 域的策略

#### 模型配置总结

| 配置项                 | 作用         | 关键点                                                       |
| ---------------------- | ------------ | ------------------------------------------------------------ |
| **request_definition** | 定义请求结构 | 包含 4 个参数：主体、对象、操作、域                          |
| **policy_definition**  | 定义策略结构 | 包含 5 个参数：主体、对象、操作、域、效果                    |
| **role_definition**    | 定义角色继承 | 支持多级角色继承，域级别隔离                                 |
| **policy_effect**      | 定义验证逻辑 | allow 和 deny 的组合判断                                     |
| **matchers**           | 定义匹配规则 | 包含角色、资源、操作、域的匹配，**域匹配是多租户隔离的关键** |

#### 注意事项

1. **域参数是必需的**：所有请求和策略都必须包含域信息
2. **域匹配是严格的**：域必须完全匹配，不支持通配符或继承
3. **角色继承是域级别的**：角色继承关系只在同一域内有效
4. **策略效果优先级**：`deny` 策略优先级高于 `allow` 策略

### 数据库实体

使用 MikroORMAdapter 时，需要确保数据库中存在 `casbin_rule` 表。实体定义已包含在库中：

```typescript
@Entity({ tableName: 'casbin_rule' })
export class CasbinRule {
  @PrimaryKey({ autoincrement: true })
  id!: number;

  @Property()
  ptype!: string;

  @Property({ nullable: true })
  v0?: string;
  // ... v1 到 v5
}
```

## 🔍 权限验证机制

`AuthZGuard` 的权限验证流程：

1. **获取权限要求**: 从路由元数据中获取 `@UsePermissions` 装饰器定义的权限要求
2. **提取用户信息**: 通过 `userFromContext` 函数从执行上下文中提取用户信息
3. **获取用户角色**: 从 Redis 缓存中获取用户角色列表（使用 `AUTH_TOKEN_PREFIX` + `user.uid` 作为键）
4. **验证权限**: 对每个权限要求，检查用户的角色集合中是否有任何一个角色拥有该权限
5. **返回结果**: 如果所有权限要求都满足，返回 `true`；否则返回 `false` 或抛出异常

### 权限验证逻辑

- **多权限要求**: 使用 AND 逻辑，所有权限都必须满足
- **角色权限检查**: 使用 OR 逻辑，只要有一个角色拥有权限即可
- **域名隔离**: 支持多租户场景，通过 `domain` 字段隔离不同域的策略

## 🎯 最佳实践

### 1. 使用数据库适配器

推荐使用 `MikroORMAdapter` 将策略存储到数据库，而不是文件：

```typescript
// ✅ 推荐：使用数据库适配器
const adapter = MikroORMAdapter.newAdapter(entityManager);
const enforcer = await casbin.newEnforcer('model.conf', adapter);

// ❌ 不推荐：使用文件策略（不适合生产环境）
const enforcer = await casbin.newEnforcer('model.conf', 'policy.csv');
```

### 2. 与 JWT 认证配合使用

`AuthZGuard` 通常与 `JwtAuthGuard` 配合使用：

```typescript
@Controller('api')
@UseGuards(JwtAuthGuard) // 先验证 JWT Token
export class ApiController {
  @Get('data')
  @UseGuards(AuthZGuard) // 再验证权限
  @UsePermissions({ resource: 'data1', action: 'read' })
  async getData() {
    // ...
  }
}
```

### 3. 使用权限枚举

定义权限动作枚举，提高类型安全性：

```typescript
import { AuthActionVerb } from '@hl8/casbin';

@UsePermissions({ resource: 'data1', action: AuthActionVerb.READ })
```

### 4. 错误处理

`AuthZGuard` 会在以下情况抛出异常：

- 用户未认证时抛出 `UnauthorizedException`
- 权限验证失败时返回 `false`（由 NestJS 处理）

建议在全局异常过滤器中统一处理这些异常。

### 5. 性能优化

- **Redis 缓存**: 用户角色从 Redis 缓存中获取，避免频繁数据库查询
- **批量操作**: 使用 `addPolicies`、`removePolicies` 等方法进行批量操作
- **过滤策略**: 使用 `loadFilteredPolicy` 只加载需要的策略规则

## 🔗 相关库

- **`@hl8/guard`** - 提供 `JwtAuthGuard`，与 `AuthZGuard` 配合使用
- **`@hl8/config`** - 提供 `SecurityConfig` 配置
- **`@hl8/typings`** - 提供 `IAuthentication` 接口定义
- **`@hl8/redis`** - 提供 Redis 工具类，用于缓存用户角色
- **`@hl8/constants`** - 提供 `CacheConstant`，包含缓存键前缀

## 📝 技术实现

### 依赖项

- `casbin` - Casbin 权限管理库
- `@nestjs/common` - NestJS 核心模块
- `@mikro-orm/core` - MikroORM 核心（用于数据库适配器）
- `@hl8/redis` - Redis 工具类（用于缓存用户角色）

### 内部实现

1. **权限验证**: 使用 Casbin Enforcer 进行权限验证
2. **角色缓存**: 从 Redis 获取用户角色，提高性能
3. **策略存储**: 通过适配器将策略存储到数据库或文件
4. **元数据反射**: 使用 NestJS Reflector 获取路由权限要求

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

测试覆盖了以下场景：

- ✅ 权限验证逻辑
- ✅ RBAC API 方法
- ✅ 策略管理 API
- ✅ 数据库适配器操作
- ✅ 装饰器和模块注册
- ✅ 边界情况和错误处理

## 🧩 Casbin 权限前端运维与管理方案

> 本节用于规范本系统中 `libs/infra/casbin` 相关的前端维护方案，解决目前缺少页面维护 `model.conf.*` 和 `casbin_rule`（`CasbinRule` 实体）的痛点，为后续实现提供统一设计依据。

### 1. 目标与范围

- **目标**
  - 为运营 / 安全 / 管理员提供一个统一的「Casbin 权限管理」后台页面，用于：
    - 管理权限策略规则（`casbin_rule` 表中 `p` / `g` 规则）；
    - 受控地查看与变更 Casbin 模型配置（如 `model.conf.1`）；
    - 对所有变更进行审计、版本化与可回滚。
- **范围**
  - 后端：基于 `apps/admin-api` 提供 Casbin 管理相关 API；
  - 前端：基于 `apps/hl8-admin` 提供配置 / 运营页面；
  - 不改动 `MikroORMAdapter` 与 `CasbinRule` 的现有行为，只是在其之上增加管理能力。

### 2. 整体架构方案

- **现有基础**
  - `MikroORMAdapter`：负责在运行期把 `CasbinRule` 与 Casbin `Model` 互相转换；
  - `CasbinRule` 实体：数据库中持久化策略规则（`ptype` + `v0~v5`）；
  - `model.conf.*`：以文件形式存在的 Casbin 模型定义。
- **新增组件（建议）**
  - `admin-api`：
    - `CasbinPolicyController` / `CasbinPolicyService`：用于策略规则（`CasbinRule`）管理；
    - `CasbinModelController` / `CasbinModelService`：用于模型配置版本化与发布管理；
    - `CasbinAuditController` / `CasbinAuditService`：用于记录与查询变更日志（可与现有审计模块集成）。
  - `hl8-admin`：
    - 页面「权限规则管理」：面向 `CasbinRule`；
    - 页面「权限模型配置」：面向 `model.conf` 版本。
  - 运行时：
    - 统一的 Casbin 管理服务负责在模型 / 策略变更后触发 Enforcer 重新加载（单实例或通过消息总线在集群中广播）。

### 3. 策略规则（CasbinRule）管理方案

#### 3.1 业务抽象

- **数据现状**
  - `ptype = 'p'`：权限策略，常用字段映射：
    - `v0` → `sub`（主体：角色编码 / 用户标识）；
    - `v1` → `obj`（资源：接口路径 / 资源编码）；
    - `v2` → `act`（操作：HTTP 方法 / 动作枚举）；
    - 其他字段 `v3~v5` 预留用于域、多租户、效果等扩展（视具体模型）。
  - `ptype = 'g'`：角色继承或用户-角色关系：
    - `v0` → 子主体（用户 / 子角色）；
    - `v1` → 父角色；
    - `v2` → 域 / 其他附加维度（视具体模型）。
- **前端展示建议**
  - 不直接暴露 `ptype`、`v0~v5`，而是封装为语义化 DTO：
    - 主体类型（用户 / 角色）+ 主体标识；
    - 资源类型（菜单 / 接口 / 资源编码）+ 资源标识；
    - 操作（查看 / 新增 / 编辑 / 删除 / 自定义字符串）；
    - 可选：域 / 租户 / 业务线。

#### 3.2 后端 API 设计（示例）

- **策略规则管理**
  - `GET /casbin/policies`：分页查询策略列表，支持按主体、资源、操作、ptype 过滤；
  - `POST /casbin/policies`：新增单条策略；
  - `DELETE /casbin/policies/:id`：删除单条策略；
  - `POST /casbin/policies/batch`：批量新增 / 删除策略（用于导入导出）。
- **角色 / 继承关系管理**
  - `GET /casbin/relations`：查询 `g` 规则（用户-角色 / 角色-角色继承）；
  - `POST /casbin/relations`：新增继承关系；
  - `DELETE /casbin/relations/:id`：删除继承关系。
- **实现要点**
  - DTO 层完成业务语义与 `CasbinRule`（`ptype + v0~v5`）之间的映射；
  - 所有写操作成功后：
    - 要么通过 Enforcer 的增量 API 同步规则；
    - 要么标记为“变更待刷新”，由后台作业统一触发 Enforcer `loadPolicy()`。

#### 3.3 前端页面交互（示例）

- **页面：权限规则管理**
  - 表格列：
    - 主体类型 / 主体标识；
    - 资源类型 / 资源标识；
    - 操作；
    - ptype（策略 / 继承）；
    - 创建时间 / 创建人。
  - 功能：
    - 条件筛选：主体、资源、操作、ptype；
    - 新增策略：通过表单选择主体、资源、操作，内部映射为 `p, sub, obj, act`；
    - 批量导入导出：CSV / JSON，方便初始化或迁移；
    - 删除 / 批量删除策略（需二次确认）。

### 4. 模型配置（model.conf.\*）版本化与管理

#### 4.1 模型配置持久化与版本表

- **新增建议表：`casbin_model_config`**
  - 字段示例：
    - `id`：主键；
    - `content`：完整 `model.conf` 文本；
    - `version`：自增版本号；
    - `status`：`draft` | `active` | `archived`；
    - `remark`：变更说明；
    - `created_by` / `created_at`；
    - `approved_by` / `approved_at`（可选审批链）。
- **加载策略**
  - 运行时优先从 `casbin_model_config` 中加载最新 `active` 版本；
  - 若表为空，则退回使用默认文件配置（例如当前的 `model.conf.1`），并在首次启动时写入一份初始版本；
  - `AuthZModule` 的 `enforcerProvider` 改造：
    - 从配置中心读取“当前模型 ID / 版本号”或直接查询 `active` 记录；
    - 用 `newModelFromString(content)` 或临时落盘再 `newEnforcer(path, adapter)` 方式初始化。

#### 4.2 模型变更流程

- **1）草稿创建**
  - 管理员在前端页面「权限模型配置」中：
    - 读取当前 `active` 版本内容；
    - 在代码编辑器中修改后提交，调用 `POST /casbin/model/drafts` 创建 `draft` 版本。
- **2）语法与安全校验**
  - 后端保存草稿时必须进行基础校验：
    - 使用 Casbin 官方 API 尝试解析 `content`，解析失败则拒绝保存；
    - 校验必备段落，如 `[request_definition]`、`[policy_definition]`、`[matchers]` 等；
    - 可根据业务规则加额外约束（例如强制保留某些 matcher 模板）。
- **3）审批与发布**
  - 高权限运维 / 安全管理员在版本列表中：
    - 查看草稿详情与与当前版本的 diff；
    - 填写发布说明，调用 `POST /casbin/model/:id/publish` 将 `draft` 标记为 `active`；
    - 同时将原 `active` 版本改为 `archived`。
  - 发布成功后：
    - 触发 Enforcer 重新加载模型；
    - 如是集群，需要通过消息总线（如 Redis PUB/SUB、NATS 等）通知其它实例重载。
- **4）回滚**
  - 从版本列表选择任何历史 `archived` 版本，点击「回滚」：
    - 直接将该版本重新标记为 `active`，原 `active` 版本变为 `archived`；
    - 同步触发 Enforcer 重新加载。

#### 4.3 前端页面交互（示例）

- **页面：权限模型配置**
  - 左侧：模型版本列表（版本号、状态、创建人、创建时间、备注）；
  - 右侧：代码编辑器（高亮 INI/Conf 语法），支持只读 / 编辑模式；
  - 功能：
    - 查看当前 `active` 版本；
    - 新建草稿 / 编辑草稿；
    - 查看任意两个版本的 diff；
    - 提交审批 / 审批发布；
    - 一键回滚到历史版本。
  - 权限控制：
    - 一般管理员：仅查看模型和历史；
    - 高级管理员：可创建草稿；
    - 安全 / 运维负责人：拥有审批与发布权限。

### 5. 安全、审计与测试要求

- **安全**
  - 所有 Casbin 管理相关接口必须本身受严格权限控制（例如仅 `super_admin` 或安全管理角色可访问）；
  - 对模型变更操作建议引入双人审核或至少「编辑者 ≠ 审批者」约束；
  - 前端页面需清晰标注模型变更的高风险性，并增加多次确认提示。
- **审计**
  - 对以下行为记录操作日志（可复用全局审计系统）：
    - 策略规则新增 / 删除 / 批量导入导出；
    - 模型草稿创建 / 修改 / 发布 / 回滚；
    - Enforcer 重载触发记录（包含源版本与目标版本信息）。
  - 日志字段至少包含：操作者、时间、请求来源、变更前内容摘要、变更后内容摘要、结果状态。
- **测试**
  - 单元测试：
    - DTO 与 `CasbinRule` 映射测试；
    - 模型字符串解析与校验逻辑测试；
    - 策略 CRUD 与 Enforcer 同步行为测试。
  - 集成 / 端到端测试：
    - 在真实环境中验证模型变更后关键权限路径（登录 / 菜单访问 / 核心接口）的正确性；
    - 对常见误操作场景（模型缺段落、语法错误、策略冲突）进行回归验证。

### 6. 实施步骤建议

1. **阶段一：策略规则管理**
   - 增加 `CasbinRule` 管理 API；
   - 在 `hl8-admin` 新增「权限规则管理」页面；
   - 只读展示当前模型配置，暂不开放在线修改。
2. **阶段二：模型版本化**
   - 引入 `casbin_model_config` 表与对应 Service / Controller；
   - 改造 `enforcerProvider` 以支持从 DB 中加载模型；
   - 在 `hl8-admin` 增加「权限模型配置」页面，支持草稿 + 发布 + 回滚。
3. **阶段三：安全与体验打磨**
   - 引入审批流与更细粒度的角色控制；
   - 完善操作审计与告警（例如高危模型变更时通知安全负责人）；
   - 与菜单 / 角色等 IAM 模块联动，提供从业务实体跳转查看相关 Casbin 策略的能力。

## 📄 许可证

本项目遵循项目根目录的许可证。
