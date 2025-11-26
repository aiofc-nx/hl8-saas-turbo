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

Casbin 模型文件（`model.conf`）示例：

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

## 📄 许可证

本项目遵循项目根目录的许可证。
