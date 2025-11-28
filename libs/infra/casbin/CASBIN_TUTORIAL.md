# Casbin 完整培训教程

## 目录

1. [什么是 Casbin](#什么是-casbin)
2. [核心概念](#核心概念)
3. [访问控制模型](#访问控制模型)
4. [模型文件详解](#模型文件详解)
5. [策略文件详解](#策略文件详解)
6. [适配器（Adapter）](#适配器adapter)
7. [执行器（Enforcer）](#执行器enforcer)
8. [与 NestJS 集成](#与-nestjs-集成)
9. [实际应用场景](#实际应用场景)
10. [最佳实践](#最佳实践)
11. [常见问题](#常见问题)
12. [项目代码实现深度解析](#项目代码实现深度解析)

---

## 什么是 Casbin

### 简介

Casbin 是一个强大的、开源的访问控制库，支持多种访问控制模型，包括：

- **ACL (Access Control List)** - 访问控制列表
- **RBAC (Role-Based Access Control)** - 基于角色的访问控制
- **ABAC (Attribute-Based Access Control)** - 基于属性的访问控制
- **RESTful** - RESTful API 访问控制
- **自定义模型** - 支持自定义访问控制模型

### 为什么选择 Casbin

1. **统一接口**：提供统一的授权 API，支持多种访问控制模型
2. **灵活配置**：通过配置文件定义访问控制模型，无需修改代码
3. **高性能**：使用高效的匹配算法，支持大规模策略
4. **多语言支持**：支持 Go、Java、Node.js、Python、PHP、.NET 等多种语言
5. **丰富的适配器**：支持文件、数据库（MySQL、PostgreSQL、MongoDB 等）、Redis 等多种存储方式

### 核心优势

- **策略与代码分离**：访问控制逻辑通过配置文件定义，易于维护
- **多租户支持**：原生支持多租户（domain）场景
- **策略继承**：支持角色继承和权限继承
- **动态权限**：支持运行时动态添加、删除、修改策略

---

## 核心概念

### 1. 模型（Model）

模型定义了访问控制的规则和逻辑，通常存储在 `model.conf` 文件中。模型包含以下部分：

- **请求定义（Request）**：定义请求的格式
- **策略定义（Policy）**：定义策略的格式
- **角色定义（Role）**：定义角色的继承关系
- **策略效果（Policy Effect）**：定义策略匹配后的效果
- **匹配器（Matcher）**：定义策略匹配的规则

### 2. 策略（Policy）

策略是具体的访问控制规则，定义了"谁可以对什么资源执行什么操作"。

策略可以存储在：

- 文件中（`.csv` 文件）
- 数据库中（通过适配器）
- 内存中（代码中定义）

### 3. 适配器（Adapter）

适配器负责策略的持久化存储和加载。Casbin 支持多种适配器：

- **文件适配器**：从 CSV 文件加载策略
- **数据库适配器**：从数据库加载策略（MySQL、PostgreSQL、MongoDB 等）
- **内存适配器**：在内存中存储策略

### 4. 执行器（Enforcer）

执行器是 Casbin 的核心组件，负责：

- 加载模型和策略
- 执行权限检查
- 管理策略（添加、删除、修改）
- 管理角色（添加、删除角色，分配角色给用户）

---

## 访问控制模型

### ACL（访问控制列表）

ACL 是最简单的访问控制模型，直接定义用户对资源的访问权限。

#### 模型文件示例

```ini
[request_definition]
r = sub, obj, act

[policy_definition]
p = sub, obj, act

[policy_effect]
e = some(where (p.eft == allow))

[matchers]
m = r.sub == p.sub && r.obj == p.obj && r.act == p.act
```

#### 策略文件示例

```csv
p, alice, data1, read
p, bob, data2, write
p, alice, data2, read
```

#### 说明

- `r = sub, obj, act`：请求格式为（主体，对象，动作）
- `p = sub, obj, act`：策略格式为（主体，对象，动作）
- `m = r.sub == p.sub && r.obj == p.obj && r.act == p.act`：匹配规则
- `e = some(where (p.eft == allow))`：至少有一个策略允许则允许

#### 使用示例

```typescript
// 检查 alice 是否可以读取 data1
const allowed = await enforcer.enforce('alice', 'data1', 'read'); // true

// 检查 bob 是否可以读取 data1
const allowed2 = await enforcer.enforce('bob', 'data1', 'read'); // false
```

### RBAC（基于角色的访问控制）

RBAC 通过角色来管理权限，用户被分配角色，角色拥有权限。

#### 模型文件示例

```ini
[request_definition]
r = sub, obj, act

[policy_definition]
p = sub, obj, act

[role_definition]
g = _, _

[policy_effect]
e = some(where (p.eft == allow))

[matchers]
m = g(r.sub, p.sub) && r.obj == p.obj && r.act == p.act
```

#### 策略文件示例

```csv
# 角色权限定义（p 策略）
p, admin, data1, read
p, admin, data1, write
p, user, data1, read

# 用户角色分配（g 策略）
g, alice, admin
g, bob, user
```

#### 说明

- `g = _, _`：定义角色继承关系，格式为（用户，角色）
- `g(r.sub, p.sub)`：检查用户是否拥有策略中定义的角色
- `g, alice, admin`：表示 alice 拥有 admin 角色

#### 使用示例

```typescript
// 检查 alice（admin 角色）是否可以读取 data1
const allowed = await enforcer.enforce('alice', 'data1', 'read'); // true

// 检查 alice 是否可以写入 data1
const allowed2 = await enforcer.enforce('alice', 'data1', 'write'); // true

// 检查 bob（user 角色）是否可以写入 data1
const allowed3 = await enforcer.enforce('bob', 'data1', 'write'); // false
```

### RBAC with Domain（多租户 RBAC）- 本项目实际模型

本项目使用多租户 RBAC 模型，实际的模型文件位于 `apps/fastify-api/src/resources/model.conf`：

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

**模型说明**：

1. **请求定义**：`r = sub, obj, act, dom`
   - `sub`: 主体（角色名）
   - `obj`: 对象（资源）
   - `act`: 动作（操作）
   - `dom`: 域名（租户）

2. **策略定义**：`p = sub, obj, act, dom, eft`
   - `eft`: 效果（allow 或 deny）

3. **角色定义**：`g = _, _, _`
   - 三个字段：用户、角色、域名

4. **策略效果**：`e = some(where (p.eft == allow)) && !some(where (p.eft == deny))`
   - 至少有一个 allow 且没有 deny

5. **匹配器**：`m = g(r.sub, p.sub, r.dom) && r.obj == p.obj && r.act == p.act && r.dom == p.dom`
   - 检查用户是否拥有角色（在指定域名下）
   - 检查资源、动作、域名是否匹配

#### 数据库策略示例

策略存储在 `casbin_rule` 表中，实际数据如下：

**权限策略（p 策略）**：

```sql
-- admin 角色在 domain1 中的权限
INSERT INTO casbin_rule (ptype, v0, v1, v2, v3, v4) VALUES
('p', 'admin', 'data1', 'read', 'domain1', 'allow'),
('p', 'admin', 'data1', 'write', 'domain1', 'allow'),
('p', 'admin', 'data1', 'delete', 'domain1', 'allow');

-- user 角色在 domain1 中的权限
INSERT INTO casbin_rule (ptype, v0, v1, v2, v3, v4) VALUES
('p', 'user', 'data1', 'read', 'domain1', 'allow');
```

**角色分配（g 策略）**：

```sql
-- 用户角色分配
INSERT INTO casbin_rule (ptype, v0, v1, v2) VALUES
('g', 'alice', 'admin', 'domain1'),
('g', 'bob', 'user', 'domain1'),
('g', 'alice', 'user', 'domain2');
```

#### 实际使用示例

**在服务中使用**：

```typescript
@Injectable()
export class PermissionService {
  constructor(private readonly authZService: AuthZService) {}

  // 检查 alice 在 domain1 中是否可以读取 data1
  async checkPermission() {
    // 注意：这里传入的是角色名，不是用户名
    // 实际使用时，AuthZGuard 会从 Redis 获取用户的角色列表
    const allowed = await this.authZService.enforce(
      'admin', // 角色名
      'data1', // 资源
      'read', // 动作
      'domain1', // 域名
    );
    return allowed; // true（因为 alice 有 admin 角色）
  }

  // 添加用户角色
  async assignRole() {
    await this.authZService.addRoleForUser('alice', 'admin', 'domain1');
  }

  // 添加角色权限
  async addPermission() {
    await this.authZService.addPolicy(
      'admin',
      'data1',
      'read',
      'domain1',
      'allow',
    );
  }
}
```

**在控制器中使用**（实际项目中的用法）：

```typescript
@Controller('api/data')
@UseGuards(JwtAuthGuard, AuthZGuard) // 先验证 JWT，再验证权限
export class DataController {
  @Get()
  @UsePermissions({ resource: 'data1', action: 'read' })
  async getData(@Request() req) {
    // 只有拥有 data1:read 权限的角色才能访问
    return { data: '...' };
  }

  @Post()
  @UsePermissions({ resource: 'data1', action: 'write' })
  async createData(@Body() data: any) {
    // 只有拥有 data1:write 权限的角色才能访问
    return { success: true };
  }
}
```

**权限验证流程**（实际执行过程）：

1. 用户请求 `/api/data`，携带 JWT Token
2. `JwtAuthGuard` 验证 Token，将用户信息设置到 `request.user`
3. `AuthZGuard` 执行：
   - 从 `@UsePermissions` 获取权限要求：`{ resource: 'data1', action: 'read' }`
   - 从 `request.user` 获取用户信息：`{ uid: 'alice', domain: 'domain1' }`
   - 从 Redis 获取用户角色：`['admin', 'user']`
   - 对每个角色调用 `enforcer.enforce(role, 'data1', 'read', 'domain1')`
   - 如果任何一个角色返回 `true`，则允许访问

### ABAC（基于属性的访问控制）

ABAC 基于主体、资源、环境的属性进行访问控制。

#### 模型文件示例

```ini
[request_definition]
r = sub, obj, act

[policy_definition]
p = sub, obj, act, eft

[policy_effect]
e = some(where (p.eft == allow))

[matchers]
m = r.sub.Age >= 18 && r.obj.Type == "book" && r.act == "read"
```

#### 说明

- `r.sub.Age`：访问请求中主体的 Age 属性
- `r.obj.Type`：访问请求中对象的 Type 属性
- 需要在使用时传入属性对象

#### 使用示例

```typescript
// 定义主体和对象的属性
const sub = { Name: 'alice', Age: 20 };
const obj = { Name: 'data1', Type: 'book' };

// 检查权限（需要自定义函数来访问属性）
const allowed = await enforcer.enforce(sub, obj, 'read');
```

---

## 模型文件详解

### 请求定义（Request Definition）

定义访问请求的格式，通常包含主体（subject）、对象（object）、动作（action）等。

```ini
[request_definition]
r = sub, obj, act
```

**说明**：

- `r` 是请求的标识符
- `sub` 是主体（通常是用户）
- `obj` 是对象（通常是资源）
- `act` 是动作（通常是操作）

**多租户场景**：

```ini
[request_definition]
r = sub, obj, act, dom
```

### 策略定义（Policy Definition）

定义策略的格式，通常与请求定义对应。

```ini
[policy_definition]
p = sub, obj, act
```

**带效果（Effect）的策略**：

```ini
[policy_definition]
p = sub, obj, act, eft
```

其中 `eft` 可以是 `allow` 或 `deny`。

### 角色定义（Role Definition）

定义角色的继承关系。

```ini
[role_definition]
g = _, _
```

**说明**：

- `g` 是角色关系的标识符
- 第一个 `_` 是用户
- 第二个 `_` 是角色

**多租户场景**：

```ini
[role_definition]
g = _, _, _
```

第三个 `_` 是租户（domain）。

**角色继承**：

```ini
[role_definition]
g = _, _
g2 = _, _
```

可以定义多个角色关系，支持角色继承：

```csv
g, alice, admin
g, admin, super_admin  # admin 继承 super_admin 的权限
```

### 策略效果（Policy Effect）

定义当策略匹配成功时的效果。

**允许（Allow）**：

```ini
[policy_effect]
e = some(where (p.eft == allow))
```

**拒绝优先（Deny Override）**：

```ini
[policy_effect]
e = !some(where (p.eft == deny))
```

**允许且不拒绝**：

```ini
[policy_effect]
e = some(where (p.eft == allow)) && !some(where (p.eft == deny))
```

**优先级**：

```ini
[policy_effect]
e = priority(p.eft) || deny
```

### 匹配器（Matcher）

定义策略匹配的规则，使用表达式语言。

**基本匹配**：

```ini
[matchers]
m = r.sub == p.sub && r.obj == p.obj && r.act == p.act
```

**RBAC 匹配**：

```ini
[matchers]
m = g(r.sub, p.sub) && r.obj == p.obj && r.act == p.act
```

**多租户匹配**：

```ini
[matchers]
m = g(r.sub, p.sub, r.dom) && r.obj == p.obj && r.act == p.act && r.dom == p.dom
```

**使用函数**：

```ini
[matchers]
m = r.sub == p.sub && r.obj == p.obj && r.act == p.act && r.sub.Age >= 18
```

**支持的函数**：

- 字符串函数：`keyMatch`, `keyMatch2`, `keyMatch3`, `keyMatch4`, `regexMatch`
- IP 匹配：`ipMatch`
- 时间函数：`timeMatch`
- 自定义函数：可以注册自定义函数

---

## 策略文件详解

### CSV 格式

策略通常存储在 CSV 文件中，每行代表一条策略。

**ACL 策略**：

```csv
p, alice, data1, read
p, bob, data2, write
```

**RBAC 策略**：

```csv
# 权限策略
p, admin, data1, read
p, admin, data1, write
p, user, data1, read

# 角色分配
g, alice, admin
g, bob, user
```

**多租户策略**：

```csv
# 权限策略（包含 domain）
p, admin, data1, read, domain1, allow
p, user, data1, read, domain1, allow

# 角色分配（包含 domain）
g, alice, admin, domain1
g, bob, user, domain1
```

### 策略类型

- **p 策略**：权限策略，定义角色或用户对资源的权限
- **g 策略**：角色分配策略，定义用户拥有的角色
- **g2, g3...**：额外的角色关系，用于复杂的角色继承

---

## 适配器（Adapter）

### 文件适配器

从 CSV 文件加载策略。

```typescript
import { FileAdapter } from 'casbin';

const adapter = new FileAdapter('path/to/policy.csv');
const enforcer = await casbin.newEnforcer('path/to/model.conf', adapter);
```

### 数据库适配器（MikroORMAdapter）

本项目使用 **MikroORMAdapter** 从 PostgreSQL 数据库加载策略（参考 `libs/infra/casbin/src/adapter/casbin-mikro-orm.adapter.ts`）。

#### 数据库实体

策略存储在 `casbin_rule` 表中，实体定义如下（参考 `libs/infra/casbin/src/adapter/casbin-rule.entity.ts`）：

```typescript
@Entity({ tableName: 'casbin_rule' })
@Unique({ properties: ['ptype', 'v0', 'v1', 'v2', 'v3', 'v4', 'v5'] })
export class CasbinRule {
  @PrimaryKey({ autoincrement: true })
  id!: number;

  @Property()
  ptype!: string; // 策略类型: 'p' 或 'g'

  @Property({ nullable: true })
  v0?: string; // 策略字段 0

  @Property({ nullable: true })
  v1?: string; // 策略字段 1

  @Property({ nullable: true })
  v2?: string; // 策略字段 2

  @Property({ nullable: true })
  v3?: string; // 策略字段 3（domain）

  @Property({ nullable: true })
  v4?: string; // 策略字段 4（effect）

  @Property({ nullable: true })
  v5?: string; // 策略字段 5
}
```

**数据库表结构**：

```sql
CREATE TABLE casbin_rule (
  id SERIAL PRIMARY KEY,
  ptype VARCHAR NOT NULL,
  v0 VARCHAR,
  v1 VARCHAR,
  v2 VARCHAR,
  v3 VARCHAR,
  v4 VARCHAR,
  v5 VARCHAR,
  UNIQUE(ptype, v0, v1, v2, v3, v4, v5)
);
```

#### 使用适配器

```typescript
import { MikroORMAdapter } from '@hl8/casbin';
import { EntityManager } from '@mikro-orm/core';
import * as casbin from 'casbin';

// 创建适配器
const adapter = MikroORMAdapter.newAdapter(entityManager);

// 创建执行器
const enforcer = await casbin.newEnforcer('path/to/model.conf', adapter);
```

#### 适配器功能

**MikroORMAdapter** 实现了以下功能：

1. **加载策略**：从数据库加载所有策略到内存

   ```typescript
   await adapter.loadPolicy(model);
   ```

2. **过滤加载**：只加载匹配条件的策略（性能优化）

   ```typescript
   await adapter.loadFilteredPolicy(model, {
     p: [['admin', 'data1', 'read', 'domain1']],
     g: [['alice', 'admin', 'domain1']],
   });
   ```

3. **保存策略**：将内存中的策略保存到数据库

   ```typescript
   await adapter.savePolicy(model);
   ```

4. **添加策略**：向数据库添加单条策略

   ```typescript
   await adapter.addPolicy('p', 'p', [
     'admin',
     'data1',
     'read',
     'domain1',
     'allow',
   ]);
   ```

5. **删除策略**：从数据库删除策略
   ```typescript
   await adapter.removePolicy('p', 'p', [
     'admin',
     'data1',
     'read',
     'domain1',
     'allow',
   ]);
   ```

**关键实现细节**：

- 使用 `EntityManager.find()` 查询策略
- 使用 `EntityManager.nativeDelete()` 删除策略
- 使用 `EntityManager.create()` 和 `persist()` 保存策略
- 支持过滤模式，只加载需要的策略（提高性能）

### 内存适配器

在内存中存储策略，适合测试场景。

```typescript
import { MemoryAdapter } from 'casbin';

const adapter = new MemoryAdapter();
const enforcer = await casbin.newEnforcer('path/to/model.conf', adapter);
```

### 自定义适配器

实现 `Adapter` 接口创建自定义适配器。

```typescript
import { Adapter } from 'casbin';

class CustomAdapter implements Adapter {
  async loadPolicy(model: Model): Promise<void> {
    // 加载策略
  }

  async savePolicy(model: Model): Promise<boolean> {
    // 保存策略
  }

  // 其他方法...
}
```

---

## 执行器（Enforcer）

### 创建执行器

```typescript
import * as casbin from 'casbin';

// 从文件加载
const enforcer = await casbin.newEnforcer('model.conf', 'policy.csv');

// 使用适配器
const adapter = new FileAdapter('policy.csv');
const enforcer = await casbin.newEnforcer('model.conf', adapter);
```

### 权限检查

```typescript
// 基本检查
const allowed = await enforcer.enforce('alice', 'data1', 'read');

// 多参数检查
const allowed2 = await enforcer.enforce('alice', 'data1', 'read', 'domain1');

// 使用自定义匹配器
const allowed3 = await enforcer.enforceWithMatcher(
  'custom_matcher',
  'alice',
  'data1',
  'read',
);

// 获取匹配的规则
const [allowed4, matchedRules] = await enforcer.enforceEx(
  'alice',
  'data1',
  'read',
);
```

### 策略管理

```typescript
// 添加策略
await enforcer.addPolicy('alice', 'data1', 'read');

// 删除策略
await enforcer.removePolicy('alice', 'data1', 'read');

// 批量添加
await enforcer.addPolicies([
  ['alice', 'data1', 'read'],
  ['bob', 'data2', 'write'],
]);

// 批量删除
await enforcer.removePolicies([
  ['alice', 'data1', 'read'],
  ['bob', 'data2', 'write'],
]);

// 过滤删除
await enforcer.removeFilteredPolicy(0, 'alice'); // 删除所有 alice 的策略
```

### 角色管理

```typescript
// 添加角色
await enforcer.addRoleForUser('alice', 'admin');

// 删除角色
await enforcer.deleteRoleForUser('alice', 'admin');

// 获取用户角色
const roles = await enforcer.getRolesForUser('alice');

// 获取角色用户
const users = await enforcer.getUsersForRole('admin');

// 检查用户是否有角色
const hasRole = await enforcer.hasRoleForUser('alice', 'admin');
```

### 隐式权限

```typescript
// 获取用户的隐式角色（包括继承的角色）
const implicitRoles = await enforcer.getImplicitRolesForUser('alice');

// 获取用户的隐式权限（包括通过角色获得的权限）
const implicitPermissions =
  await enforcer.getImplicitPermissionsForUser('alice');
```

---

## 与 NestJS 集成

### 安装和配置

本项目提供了完整的 NestJS 集成方案，深度集成 MikroORM 和 Redis。

#### 1. 安装依赖

该库是 monorepo 工作空间的一部分，通过 workspace 协议引用：

```json
{
  "dependencies": {
    "@hl8/casbin": "workspace:*"
  }
}
```

#### 2. 配置模块（实际项目代码）

参考 `apps/fastify-api/src/base-demo.module.ts` 的实际实现：

```typescript
import { EntityManager } from '@mikro-orm/core';
import { ExecutionContext, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as casbin from 'casbin';

import { AUTHZ_ENFORCER, AuthZModule, MikroORMAdapter } from '@hl8/casbin';
import { IAuthentication } from '@hl8/typings';
import { getConfigPath } from '@hl8/utils';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      expandVariables: true,
      envFilePath: ['.env.local', `.env.${process.env.NODE_ENV}`, '.env'],
      load: [...Object.values(config)],
    }),
    AuthZModule.register({
      imports: [ConfigModule],
      enforcerProvider: {
        provide: AUTHZ_ENFORCER,
        useFactory: async (configService: ConfigService, em: EntityManager) => {
          // 1. 创建 MikroORM 适配器，用于从数据库加载策略
          const adapter = MikroORMAdapter.newAdapter(em);

          // 2. 从配置中获取 Casbin 模型文件路径
          const { casbinModel } = configService.get<ISecurityConfig>(
            securityRegToken,
            { infer: true },
          );

          // 3. 获取完整的模型文件路径
          const casbinModelPath = getConfigPath(casbinModel);

          // 4. 创建 Casbin 执行器，使用模型文件和数据库适配器
          return casbin.newEnforcer(casbinModelPath, adapter);
        },
        inject: [ConfigService, EntityManager],
      },
      // 5. 定义如何从请求上下文中提取用户信息
      userFromContext: (ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest();
        const user: IAuthentication = request.user;
        return user; // 返回包含 uid、domain 等信息的用户对象
      },
    }),
  ],
})
export class BaseDemoModule {}
```

**关键点说明**：

1. **MikroORMAdapter**：使用数据库适配器，策略存储在 PostgreSQL 数据库中
2. **模型文件路径**：通过配置服务获取，支持环境变量配置
3. **用户信息提取**：从请求对象中提取已认证的用户信息（通常由 JWT Guard 设置）
4. **依赖注入**：`ConfigService` 和 `EntityManager` 通过 `inject` 注入到工厂函数中

#### 3. 使用守卫（实际实现逻辑）

**AuthZGuard 的工作流程**（参考 `libs/infra/casbin/src/guards/authz.guard.ts`）：

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthZGuard, UsePermissions } from '@hl8/casbin';

@Controller('data')
@UseGuards(AuthZGuard) // 应用权限守卫
export class DataController {
  @Get()
  @UsePermissions({ resource: 'data', action: 'read' })
  async getData() {
    return { message: 'Data' };
  }

  @Post()
  @UsePermissions({ resource: 'data', action: 'write' })
  async createData() {
    return { message: 'Created' };
  }
}
```

**权限验证流程详解**：

1. **获取权限要求**：从路由元数据中获取 `@UsePermissions` 装饰器定义的权限要求

   ```typescript
   const permissions: Permission[] = this.reflector.get<Permission[]>(
     PERMISSIONS_METADATA,
     context.getHandler(),
   );
   ```

2. **提取用户信息**：从请求上下文中提取已认证的用户

   ```typescript
   const user = this.options.userFromContext(context);
   // user 包含: { uid: string, domain: string, ... }
   ```

3. **获取用户角色**：从 Redis 中获取用户的角色列表

   ```typescript
   const userRoles = await RedisUtility.instance.smembers(
     `${CacheConstant.AUTH_TOKEN_PREFIX}${user.uid}`,
   );
   // 返回: ['admin', 'user', ...]
   ```

4. **验证权限**：检查用户的所有角色是否满足所有权限要求

   ```typescript
   // 对每个权限要求，检查用户是否有至少一个角色拥有该权限
   return await AuthZGuard.asyncEvery<Permission>(
     permissions,
     async (permission) =>
       this.hasPermission(
         new Set(userRoles),
         user.domain,
         permission,
         context,
         this.enforcer,
       ),
   );
   ```

5. **角色权限检查**：对每个角色，使用 Casbin 执行器检查权限

   ```typescript
   async hasPermission(
     roles: Set<string>,
     domain: string,
     permission: Permission,
     context: ExecutionContext,
     enforcer: casbin.Enforcer,
   ): Promise<boolean> {
     const { resource, action } = permission;

     // 检查是否有任何一个角色拥有该权限
     return AuthZGuard.asyncSome<string>(
       Array.from(roles),
       async (role) => {
         // 调用 Casbin: enforce(role, resource, action, domain)
         return enforcer.enforce(role, resource, action, domain);
       }
     );
   }
   ```

**关键特性**：

- **多权限支持**：`@UsePermissions` 可以定义多个权限，所有权限都必须满足（AND 逻辑）
- **多角色支持**：用户可以有多个角色，只要有一个角色满足权限即可（OR 逻辑）
- **多租户支持**：通过 `domain` 参数实现租户隔离
- **Redis 缓存**：用户角色从 Redis 缓存中获取，提高性能
- **错误处理**：使用 Logger 记录错误，抛出 `UnauthorizedException` 拒绝未授权访问

#### 4. 使用服务（实际 API）

**AuthZService** 提供了完整的 Casbin API 封装（参考 `libs/infra/casbin/src/services/authz.service.ts`）：

```typescript
import { Injectable, Inject } from '@nestjs/common';
import { AuthZService, AUTHZ_ENFORCER } from '@hl8/casbin';
import * as casbin from 'casbin';

@Injectable()
export class MyService {
  constructor(
    private readonly authZService: AuthZService,
    @Inject(AUTHZ_ENFORCER) private readonly enforcer: casbin.Enforcer,
  ) {}

  // 权限验证
  async checkPermission(
    role: string,
    resource: string,
    action: string,
    domain?: string,
  ) {
    return await this.authZService.enforce(role, resource, action, domain);
  }

  // RBAC API - 角色管理
  async getUserRoles(user: string, domain?: string) {
    return await this.authZService.getRolesForUser(user, domain);
  }

  async addUserRole(user: string, role: string, domain?: string) {
    return await this.authZService.addRoleForUser(user, role, domain);
  }

  async removeUserRole(user: string, role: string, domain?: string) {
    return await this.authZService.deleteRoleForUser(user, role, domain);
  }

  // 策略管理 API
  async addPolicy(
    role: string,
    resource: string,
    action: string,
    domain: string,
  ) {
    return await this.authZService.addPolicy(
      role,
      resource,
      action,
      domain,
      'allow',
    );
  }

  async removePolicy(
    role: string,
    resource: string,
    action: string,
    domain: string,
  ) {
    return await this.authZService.removePolicy(role, resource, action, domain);
  }

  // 隐式权限（包括角色继承的权限）
  async getImplicitRoles(user: string, domain?: string) {
    return await this.authZService.getImplicitRolesForUser(user, domain);
  }

  async getImplicitPermissions(user: string, domain?: string) {
    return await this.authZService.getImplicitPermissionsForUser(user, domain);
  }
}
```

**可用的服务方法**（参考实际代码）：

**RBAC API**：

- `getRolesForUser(name, domain?)` - 获取用户角色
- `getUsersForRole(name, domain?)` - 获取角色用户
- `hasRoleForUser(name, role, domain?)` - 检查用户是否有角色
- `addRoleForUser(user, role, domain?)` - 添加用户角色
- `deleteRoleForUser(user, role, domain?)` - 删除用户角色
- `deleteRolesForUser(user, domain?)` - 删除用户所有角色
- `deleteUser(user)` - 删除用户
- `deleteRole(role)` - 删除角色

**权限管理 API**：

- `enforce(...params)` - 权限验证
- `enforceWithMatcher(matcher, ...params)` - 使用自定义匹配器验证
- `addPolicy(...params)` - 添加策略
- `removePolicy(...params)` - 删除策略
- `addPolicies(rules)` - 批量添加策略
- `removePolicies(rules)` - 批量删除策略

**隐式权限 API**：

- `getImplicitRolesForUser(name, domain?)` - 获取隐式角色（包括继承）
- `getImplicitPermissionsForUser(name, domain?)` - 获取隐式权限
- `getImplicitUsersForPermission(...params)` - 获取拥有权限的用户

---

## 实际应用场景

### 场景 1：RESTful API 权限控制

**需求**：控制用户对 API 资源的访问权限。

**模型文件**：

```ini
[request_definition]
r = sub, obj, act

[policy_definition]
p = sub, obj, act

[role_definition]
g = _, _

[policy_effect]
e = some(where (p.eft == allow))

[matchers]
m = g(r.sub, p.sub) && keyMatch(r.obj, p.obj) && regexMatch(r.act, p.act)
```

**策略文件**：

```csv
p, admin, /api/*, (GET)|(POST)|(PUT)|(DELETE)
p, user, /api/data/*, GET
p, user, /api/data/:id, GET
```

**使用**：

```typescript
@Controller('api')
@UseGuards(AuthZGuard)
export class ApiController {
  @Get('data')
  @UsePermissions({ resource: '/api/data/*', action: 'GET' })
  async getData() {
    // ...
  }
}
```

### 场景 2：多租户 SaaS 系统（本项目核心场景）

**需求**：每个租户（domain）有独立的权限体系，用户在不同租户中可能有不同的角色。

**实际模型**：使用项目中的 `model.conf`（已支持多租户）

**数据库策略示例**：

```sql
-- 租户 1 的权限策略
INSERT INTO casbin_rule (ptype, v0, v1, v2, v3, v4) VALUES
('p', 'admin', 'data1', 'read', 'tenant1', 'allow'),
('p', 'admin', 'data1', 'write', 'tenant1', 'allow'),
('p', 'user', 'data1', 'read', 'tenant1', 'allow');

-- 租户 2 的权限策略
INSERT INTO casbin_rule (ptype, v0, v1, v2, v3, v4) VALUES
('p', 'admin', 'data1', 'read', 'tenant2', 'allow'),
('p', 'user', 'data1', 'read', 'tenant2', 'allow');

-- 用户在不同租户中的角色
INSERT INTO casbin_rule (ptype, v0, v1, v2) VALUES
('g', 'alice', 'admin', 'tenant1'),  -- alice 在 tenant1 中是 admin
('g', 'alice', 'user', 'tenant2'),    -- alice 在 tenant2 中是 user
('g', 'bob', 'user', 'tenant1');      -- bob 在 tenant1 中是 user
```

**实际使用**（参考 `AuthZGuard` 实现）：

```typescript
@Injectable()
export class TenantService {
  constructor(private readonly authZService: AuthZService) {}

  // 为租户添加用户角色
  async assignRoleToTenant(userId: string, role: string, tenantId: string) {
    // 将角色添加到数据库
    await this.authZService.addRoleForUser(userId, role, tenantId);

    // 同时更新 Redis 缓存（实际项目中需要）
    await RedisUtility.instance.sadd(
      `${CacheConstant.AUTH_TOKEN_PREFIX}${userId}`,
      role,
    );
  }

  // 检查租户权限（实际由 AuthZGuard 自动执行）
  async checkTenantPermission(
    userId: string,
    resource: string,
    action: string,
    tenantId: string,
  ) {
    // 1. 从 Redis 获取用户在租户中的角色
    const userRoles = await RedisUtility.instance.smembers(
      `${CacheConstant.AUTH_TOKEN_PREFIX}${userId}`,
    );

    // 2. 检查每个角色是否有权限
    for (const role of userRoles) {
      const allowed = await this.authZService.enforce(
        role,
        resource,
        action,
        tenantId,
      );
      if (allowed) return true;
    }

    return false;
  }
}
```

**在控制器中使用**：

```typescript
@Controller('api/tenant/:tenantId/data')
@UseGuards(JwtAuthGuard, AuthZGuard)
export class TenantDataController {
  @Get()
  @UsePermissions({ resource: 'data1', action: 'read' })
  async getData(@Param('tenantId') tenantId: string, @Request() req) {
    // request.user.domain 应该等于 tenantId
    // AuthZGuard 会自动使用 user.domain 进行权限验证
    const user = req.user; // { uid: 'alice', domain: 'tenant1', ... }

    // 权限验证逻辑：
    // 1. 从 Redis 获取 alice 的角色列表
    // 2. 对每个角色调用: enforce(role, 'data1', 'read', 'tenant1')
    // 3. 如果任何一个角色有权限，允许访问

    return { data: '...' };
  }
}
```

**关键实现细节**：

1. **域名提取**：`AuthZGuard` 从 `request.user.domain` 获取租户 ID
2. **角色缓存**：用户角色存储在 Redis 中，格式：`auth:token:{uid}`
3. **权限隔离**：每个租户的权限完全独立，通过 `domain` 参数隔离
4. **动态角色**：用户在不同租户中可以有不同的角色

### 场景 3：资源级别的权限控制

**需求**：控制用户对特定资源的访问（如：用户只能访问自己创建的数据）。

**模型文件**：

```ini
[request_definition]
r = sub, obj, act

[policy_definition]
p = sub, obj, act

[role_definition]
g = _, _

[policy_effect]
e = some(where (p.eft == allow))

[matchers]
m = g(r.sub, p.sub) && r.obj == p.obj && r.act == p.act
```

**策略管理**：

```typescript
// 用户创建资源时，自动添加权限
await authZService.addPolicy('alice', 'data:123', 'read');
await authZService.addPolicy('alice', 'data:123', 'write');
await authZService.addPolicy('alice', 'data:123', 'delete');

// 检查权限
const canRead = await authZService.enforce('alice', 'data:123', 'read');
```

### 场景 4：基于时间的权限控制

**需求**：某些权限只在特定时间段有效。

**模型文件**：

```ini
[request_definition]
r = sub, obj, act, time

[policy_definition]
p = sub, obj, act, time

[policy_effect]
e = some(where (p.eft == allow))

[matchers]
m = r.sub == p.sub && r.obj == p.obj && r.act == p.act && timeMatch(r.time, p.time)
```

**使用**：

```typescript
// 注册时间匹配函数
await enforcer.addFunction('timeMatch', (requestTime, policyTime) => {
  // 实现时间匹配逻辑
  return isTimeInRange(requestTime, policyTime);
});

// 检查权限
const allowed = await enforcer.enforce('alice', 'data1', 'read', '09:00-18:00');
```

---

## 最佳实践

### 1. 模型设计

- **保持模型简单**：避免过度复杂的匹配规则
- **使用命名策略**：对于复杂的权限体系，使用命名策略（p2, p3, g2, g3 等）
- **合理使用域（Domain）**：多租户场景使用 domain 隔离权限

### 2. 策略管理（基于本项目实现）

**使用 MikroORMAdapter**：

```typescript
// 策略存储在 PostgreSQL 的 casbin_rule 表中
// 使用 MikroORMAdapter 进行 CRUD 操作

// 添加策略
await authZService.addPolicy('admin', 'data1', 'read', 'domain1', 'allow');

// 批量添加
await authZService.addPolicies([
  ['admin', 'data1', 'read', 'domain1', 'allow'],
  ['admin', 'data1', 'write', 'domain1', 'allow'],
]);

// 删除策略
await authZService.removePolicy('admin', 'data1', 'read', 'domain1');

// 查询策略（直接查询数据库）
const policies = await entityManager.find(CasbinRule, {
  ptype: 'p',
  v0: 'admin',
  v3: 'domain1',
});
```

**角色管理**：

```typescript
// 添加用户角色（会写入数据库）
await authZService.addRoleForUser('alice', 'admin', 'domain1');

// 同时需要更新 Redis 缓存（实际项目中）
await RedisUtility.instance.sadd(
  `${CacheConstant.AUTH_TOKEN_PREFIX}alice`,
  'admin',
);

// 获取用户角色（从数据库）
const roles = await authZService.getRolesForUser('alice', 'domain1');

// 获取隐式角色（包括继承的角色）
const implicitRoles = await authZService.getImplicitRolesForUser(
  'alice',
  'domain1',
);
```

**性能优化**：

- **策略过滤加载**：使用 `loadFilteredPolicy` 只加载需要的策略
  ```typescript
  await adapter.loadFilteredPolicy(model, {
    p: [['admin', '', '', 'domain1']], // 只加载 domain1 的 admin 策略
  });
  ```
- **Redis 缓存角色**：用户角色缓存在 Redis 中，避免频繁查询数据库
- **批量操作**：大量策略变更时使用 `addPolicies` 和 `removePolicies`

### 3. 性能优化（基于本项目实现）

**策略过滤加载**（参考 `MikroORMAdapter.loadFilteredPolicy`）：

```typescript
// 只加载特定租户的策略
await adapter.loadFilteredPolicy(model, {
  p: [['', '', '', 'domain1', '']], // 只加载 domain1 的权限策略
  g: [['', '', 'domain1']], // 只加载 domain1 的角色分配
});

// 启用过滤模式
adapter.enableFiltered(true);
```

**Redis 缓存用户角色**（参考 `AuthZGuard` 实现）：

```typescript
// AuthZGuard 从 Redis 获取用户角色，避免每次查询数据库
const userRoles = await RedisUtility.instance.smembers(
  `${CacheConstant.AUTH_TOKEN_PREFIX}${user.uid}`,
);
```

**异步操作**：所有 API 都是异步的，避免阻塞事件循环

**数据库连接**：MikroORM 使用连接池管理数据库连接

### 4. 安全考虑

- **最小权限原则**：只授予用户必要的权限
- **定期审计**：定期检查和清理无效策略
- **权限继承控制**：避免过深的角色继承链

### 5. 错误处理（参考 AuthZGuard 实现）

**AuthZGuard 的错误处理**（`libs/infra/casbin/src/guards/authz.guard.ts`）：

```typescript
async canActivate(context: ExecutionContext): Promise<boolean> {
  try {
    // 权限验证逻辑
    const permissions = this.reflector.get<Permission[]>(
      PERMISSIONS_METADATA,
      context.getHandler(),
    );

    if (!permissions) {
      return true; // 没有权限要求，允许访问
    }

    const user = this.options.userFromContext(context);
    if (!user) {
      throw new UnauthorizedException(); // 用户未认证
    }

    const userRoles = await RedisUtility.instance.smembers(
      `${CacheConstant.AUTH_TOKEN_PREFIX}${user.uid}`,
    );

    if (userRoles && userRoles.length <= 0) {
      return false; // 用户没有角色，拒绝访问
    }

    // 检查权限
    return await AuthZGuard.asyncEvery<Permission>(
      permissions,
      async (permission) =>
        this.hasPermission(
          new Set(userRoles),
          user.domain,
          permission,
          context,
          this.enforcer,
        ),
    );
  } catch (e) {
    // 使用 Logger 记录错误（而不是 console.error）
    this.logger.error('权限验证失败', e);
    throw e; // 重新抛出异常
  }
}
```

**最佳实践**：

- 使用 NestJS `Logger` 记录错误
- 抛出适当的异常类型（`UnauthorizedException`）
- 在服务层处理业务逻辑错误
- 在控制器层处理 HTTP 错误响应

### 6. 测试（参考项目测试代码）

**AuthZGuard 测试**（`libs/infra/casbin/src/guards/authz.guard.spec.ts`）：

```typescript
import { describe, expect, it, jest } from '@jest/globals';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import * as casbin from 'casbin';

import { AuthZGuard } from './authz.guard';

describe('AuthZGuard', () => {
  let guard: AuthZGuard;
  let mockEnforcer: jest.Mocked<casbin.Enforcer>;
  let mockReflector: jest.Mocked<Reflector>;

  beforeEach(() => {
    mockEnforcer = {
      enforce: jest.fn(),
    } as any;

    mockReflector = {
      get: jest.fn(),
    } as any;

    guard = new AuthZGuard(mockReflector, mockEnforcer, {
      userFromContext: (ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest();
        return request.user;
      },
    });
  });

  it('应该在没有权限要求时允许访问', async () => {
    mockReflector.get.mockReturnValue(undefined);
    const context = createMockContext({
      user: { uid: 'alice', domain: 'domain1' },
    });

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
  });

  it('应该在用户未认证时抛出异常', async () => {
    mockReflector.get.mockReturnValue([{ resource: 'data1', action: 'read' }]);
    const context = createMockContext({ user: null });

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
```

**AuthZService 测试**（`libs/infra/casbin/src/services/authz.service.spec.ts`）：

```typescript
describe('AuthZService', () => {
  let service: AuthZService;
  let mockEnforcer: jest.Mocked<casbin.Enforcer>;

  beforeEach(() => {
    mockEnforcer = {
      enforce: jest.fn(),
      getRolesForUser: jest.fn(),
      addRoleForUser: jest.fn(),
      // ... 其他方法
    } as any;

    service = new AuthZService(mockEnforcer);
  });

  it('应该执行权限验证', async () => {
    mockEnforcer.enforce.mockResolvedValue(true);

    const result = await service.enforce('admin', 'data1', 'read', 'domain1');

    expect(result).toBe(true);
    expect(mockEnforcer.enforce).toHaveBeenCalledWith(
      'admin',
      'data1',
      'read',
      'domain1',
    );
  });
});
```

**MikroORMAdapter 测试**（`libs/infra/casbin/src/adapter/casbin-mikro-orm.adapter.spec.ts`）：

```typescript
describe('MikroORMAdapter', () => {
  let adapter: MikroORMAdapter;
  let mockEntityManager: jest.Mocked<EntityManager>;

  beforeEach(() => {
    mockEntityManager = {
      find: jest.fn(),
      nativeDelete: jest.fn(),
      create: jest.fn(),
      persist: jest.fn().mockReturnThis(),
      flush: jest.fn(),
    } as any;

    adapter = new MikroORMAdapter(mockEntityManager);
  });

  it('应该从数据库加载策略', async () => {
    const mockRules = [
      {
        id: 1,
        ptype: 'p',
        v0: 'admin',
        v1: 'data1',
        v2: 'read',
        v3: 'domain1',
        v4: 'allow',
      },
    ];
    mockEntityManager.find.mockResolvedValue(mockRules);
    jest.spyOn(Helper, 'loadPolicyLine').mockImplementation(() => {});

    await adapter.loadPolicy(mockModel);

    expect(mockEntityManager.find).toHaveBeenCalledWith(CasbinRule, {});
    expect(Helper.loadPolicyLine).toHaveBeenCalled();
  });
});
```

---

## 常见问题

### Q1: 如何实现"拒绝优先"策略？

**A**: 在策略定义中添加 `eft` 字段，并在策略效果中使用：

```ini
[policy_definition]
p = sub, obj, act, eft

[policy_effect]
e = some(where (p.eft == allow)) && !some(where (p.eft == deny))
```

策略文件：

```csv
p, alice, data1, read, allow
p, alice, data1, read, deny  # 这条会覆盖上面的 allow
```

### Q2: 如何实现角色继承？

**A**: 在角色定义中使用多级角色关系：

```ini
[role_definition]
g = _, _
g2 = _, _
```

策略文件：

```csv
g, admin, user        # admin 继承 user
g2, super_admin, admin  # super_admin 继承 admin
```

### Q3: 如何实现资源所有者权限？

**A**: 在策略中添加资源所有者信息：

```csv
p, alice, data:123, read, owner
p, alice, data:123, write, owner
p, alice, data:123, delete, owner
```

匹配器：

```ini
[matchers]
m = r.sub == p.sub && r.obj == p.obj && r.act == p.act && (p.eft == "owner" || g(r.sub, p.sub))
```

### Q4: 如何处理大量策略的性能问题？

**A**:

1. 使用 `loadFilteredPolicy` 只加载需要的策略
2. 使用 Redis 缓存策略
3. 定期清理无效策略
4. 考虑使用策略索引

### Q5: 如何实现动态权限（运行时添加/删除）？

**A**: 使用执行器的管理接口：

```typescript
// 添加权限
await enforcer.addPolicy('user', 'resource', 'action');

// 删除权限
await enforcer.removePolicy('user', 'resource', 'action');

// 保存到数据库（如果使用数据库适配器）
await enforcer.savePolicy();
```

### Q6: 如何实现基于 IP 的访问控制？

**A**: 使用 `ipMatch` 函数：

```ini
[matchers]
m = r.sub == p.sub && ipMatch(r.ip, p.ip) && r.obj == p.obj && r.act == p.act
```

策略：

```csv
p, alice, 192.168.1.0/24, data1, read
```

### Q7: 如何处理权限变更的实时性？

**A**:

1. 使用事件机制通知权限变更
2. 定期重新加载策略
3. 使用缓存失效机制
4. 考虑使用消息队列同步权限变更

---

## 项目代码实现深度解析

### 核心组件实现

#### 1. AuthZModule（模块注册）

**文件位置**：`libs/infra/casbin/src/authz.module.ts`

**核心实现**：

````12:91:libs/infra/casbin/src/authz.module.ts
@Global()
@Module({})
export class AuthZModule {
  /**
   * 注册授权模块
   *
   * @description 动态注册授权模块，配置 Casbin 执行器和相关服务
   *
   * @param options - 授权模块配置选项
   * @returns 返回动态模块配置
   *
   * @throws {Error} 当未提供 enforcerProvider 且未提供 model 和 policy 时抛出
   *
   * @example
   * ```typescript
   * AuthZModule.register({
   *   model: 'path/to/model.conf',
   *   policy: 'path/to/policy.csv',
   *   userFromContext: (ctx) => ctx.switchToHttp().getRequest().user
   * })
   * ```
   */
  static register(options: AuthZModuleOptions): DynamicModule {
    const moduleOptionsProvider = {
      provide: AUTHZ_MODULE_OPTIONS,
      useValue: options || {},
    };

    let enforcerProvider = options.enforcerProvider;
    const importsModule = options.imports || [];

    if (!enforcerProvider) {
      if (!options.model || !options.policy) {
        throw new Error(
          'must provide either enforcerProvider or both model and policy',
        );
      }

      enforcerProvider = {
        provide: AUTHZ_ENFORCER,
        useFactory: async () => {
          const isFile = typeof options.policy === 'string';

          let policyOption;

          if (isFile) {
            policyOption = options.policy as string;
          } else {
            policyOption = await options.policy;
          }

          return casbin.newEnforcer(options.model, policyOption);
        },
      };
    }

    return {
      module: AuthZModule,
      providers: [
        moduleOptionsProvider,
        enforcerProvider,
        AuthZGuard,
        AuthZService,
      ],
      imports: importsModule,
      exports: [
        moduleOptionsProvider,
        enforcerProvider,
        AuthZGuard,
        AuthZService,
      ],
    };
  }
}
````

**关键点**：

- 使用 `@Global()` 装饰器，使模块全局可用
- 支持两种方式创建执行器：直接提供 `enforcerProvider` 或使用 `model` + `policy`
- 导出 `AuthZGuard` 和 `AuthZService` 供其他模块使用

#### 2. AuthZGuard（权限守卫）

**文件位置**：`libs/infra/casbin/src/guards/authz.guard.ts`

**完整实现流程**：

```65:131:libs/infra/casbin/src/guards/authz.guard.ts
  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const permissions: Permission[] = this.reflector.get<Permission[]>(
        PERMISSIONS_METADATA,
        context.getHandler(),
      );

      if (!permissions) {
        return true;
      }

      const user = this.options.userFromContext(context);

      if (!user) {
        throw new UnauthorizedException();
      }

      const userRoles = await RedisUtility.instance.smembers(
        `${CacheConstant.AUTH_TOKEN_PREFIX}${user.uid}`,
      );

      if (userRoles && userRoles.length <= 0) {
        return false;
      }

      return await AuthZGuard.asyncEvery<Permission>(
        permissions,
        async (permission) =>
          this.hasPermission(
            new Set(userRoles),
            user.domain,
            permission,
            context,
            this.enforcer,
          ),
      );
    } catch (e) {
      this.logger.error('权限验证失败', e);
      throw e;
    }
  }

  /**
   * 检查是否拥有权限
   *
   * @description 检查用户的角色集合中是否有任何一个角色拥有指定的权限
   *
   * @param roles - 用户角色集合
   * @param domain - 域名
   * @param permission - 权限对象，包含资源（resource）和动作（action）
   * @param context - 执行上下文
   * @param enforcer - Casbin 执行器实例
   * @returns 返回 true 表示至少有一个角色拥有该权限，false 表示所有角色都不拥有
   */
  async hasPermission(
    roles: Set<string>,
    domain: string,
    permission: Permission,
    context: ExecutionContext,
    enforcer: casbin.Enforcer,
  ): Promise<boolean> {
    const { resource, action } = permission;

    return AuthZGuard.asyncSome<string>(Array.from(roles), async (role) => {
      return enforcer.enforce(role, resource, action, domain);
    });
  }
```

**权限验证逻辑**：

- **多权限 AND**：`@UsePermissions` 定义的多个权限必须全部满足
- **多角色 OR**：用户只要有任何一个角色满足权限即可
- **Redis 缓存**：用户角色从 Redis 获取，避免频繁查询数据库
- **错误处理**：使用 Logger 记录错误，抛出适当的异常

#### 3. MikroORMAdapter（数据库适配器）

**文件位置**：`libs/infra/casbin/src/adapter/casbin-mikro-orm.adapter.ts`

**核心方法实现**：

```76:82:libs/infra/casbin/src/adapter/casbin-mikro-orm.adapter.ts
  async loadPolicy(model: Model): Promise<void> {
    const lines = await this.#em.find(CasbinRule, {});

    for (const line of lines) {
      this.#loadPolicyLine(line, model);
    }
  }
```

**关键实现细节**：

- 使用 `EntityManager.find()` 查询策略
- 使用 `EntityManager.nativeDelete()` 删除策略
- 使用 `EntityManager.create()` 和 `persist()` 保存策略
- 支持过滤模式，只加载需要的策略

#### 4. CasbinRule 实体（数据库表结构）

**文件位置**：`libs/infra/casbin/src/adapter/casbin-rule.entity.ts`

**实体定义**：

```10:76:libs/infra/casbin/src/adapter/casbin-rule.entity.ts
@Entity({ tableName: 'casbin_rule' })
@Unique({ properties: ['ptype', 'v0', 'v1', 'v2', 'v3', 'v4', 'v5'] })
export class CasbinRule {
  /**
   * 主键 ID
   *
   * @description 自增主键
   */
  @PrimaryKey({ autoincrement: true })
  id!: number;

  /**
   * 策略类型
   *
   * @description 策略类型，通常为 'p'（策略）或 'g'（角色继承）
   */
  @Property()
  ptype!: string;

  /**
   * 策略规则字段 0
   *
   * @description 策略规则的第一个字段值
   */
  @Property({ nullable: true })
  v0?: string;

  /**
   * 策略规则字段 1
   *
   * @description 策略规则的第二个字段值
   */
  @Property({ nullable: true })
  v1?: string;

  /**
   * 策略规则字段 2
   *
   * @description 策略规则的第三个字段值
   */
  @Property({ nullable: true })
  v2?: string;

  /**
   * 策略规则字段 3
   *
   * @description 策略规则的第四个字段值
   */
  @Property({ nullable: true })
  v3?: string;

  /**
   * 策略规则字段 4
   *
   * @description 策略规则的第五个字段值
   */
  @Property({ nullable: true })
  v4?: string;

  /**
   * 策略规则字段 5
   *
   * @description 策略规则的第六个字段值
   */
  @Property({ nullable: true })
  v5?: string;
}
```

**数据库映射**：

- `ptype='p'`：权限策略，格式：`(角色, 资源, 动作, 域名, 效果)`
- `ptype='g'`：角色分配，格式：`(用户, 角色, 域名)`

### 实际使用流程

#### 完整的权限验证流程

1. **用户请求** → 携带 JWT Token
2. **JwtAuthGuard** → 验证 Token，设置 `request.user`
3. **AuthZGuard.canActivate()** → 执行权限验证
   - 获取权限要求：`@UsePermissions({ resource: 'data1', action: 'read' })`
   - 提取用户信息：`{ uid: 'alice', domain: 'domain1' }`
   - 从 Redis 获取角色：`['admin', 'user']`
   - 对每个角色调用：`enforcer.enforce('admin', 'data1', 'read', 'domain1')`
   - 检查数据库策略：查询 `casbin_rule` 表
   - 返回结果：`true` 或 `false`
4. **允许/拒绝** → 返回响应或抛出异常

#### 策略管理流程

1. **添加策略**：

   ```typescript
   await authZService.addPolicy('admin', 'data1', 'read', 'domain1', 'allow');
   ```

   - 调用 `MikroORMAdapter.addPolicy()`
   - 创建 `CasbinRule` 实体
   - 保存到数据库
   - 自动加载到内存（如果使用自动加载）

2. **添加用户角色**：

   ```typescript
   await authZService.addRoleForUser('alice', 'admin', 'domain1');
   ```

   - 写入数据库：`INSERT INTO casbin_rule (ptype, v0, v1, v2) VALUES ('g', 'alice', 'admin', 'domain1')`
   - 更新 Redis：`SADD auth:token:alice admin`
   - 立即生效（下次权限检查时）

---

## 总结

Casbin 是一个功能强大、灵活的访问控制库，通过模型文件和策略文件的配置，可以实现各种复杂的权限控制需求。本项目提供了完整的 NestJS 集成方案，深度结合 MikroORM 和 Redis，实现了高性能、可扩展的权限管理系统。

### 关键要点

1. **模型设计**：使用多租户 RBAC 模型，支持域名隔离
2. **策略管理**：使用 MikroORMAdapter 将策略存储在 PostgreSQL 数据库
3. **性能优化**：使用 Redis 缓存用户角色，使用过滤加载优化策略查询
4. **安全考虑**：遵循最小权限原则，支持拒绝优先策略
5. **测试覆盖**：完整的单元测试和集成测试，确保权限逻辑正确

### 项目特色

- **深度集成**：与 NestJS、MikroORM、Redis 深度集成
- **类型安全**：完整的 TypeScript 类型定义
- **中文文档**：所有代码注释和文档使用中文
- **测试完善**：高覆盖率的单元测试
- **生产就绪**：经过实际项目验证的稳定实现

### 进一步学习

- [Casbin 官方文档](https://casbin.org/)
- [Casbin 示例](https://github.com/casbin/node-casbin/tree/master/examples)
- [本项目 README](./README.md)
- [评估报告](./EVALUATION_REPORT.md)

---

## 项目代码结构

### 核心文件位置

```
libs/infra/casbin/
├── src/
│   ├── adapter/
│   │   ├── casbin-mikro-orm.adapter.ts      # MikroORM 适配器实现
│   │   ├── casbin-rule.entity.ts            # 数据库实体定义
│   │   └── casbin-mikro-orm.adapter.spec.ts # 适配器测试
│   ├── guards/
│   │   ├── authz.guard.ts                   # 权限守卫实现
│   │   └── authz.guard.spec.ts              # 守卫测试
│   ├── services/
│   │   ├── authz.service.ts                 # 授权服务（封装 Casbin API）
│   │   ├── authz-api.ts                     # Casbin API 封装
│   │   └── authz.service.spec.ts            # 服务测试
│   ├── decorators/
│   │   ├── use-permissions.decorator.ts     # 权限装饰器
│   │   └── use-permissions.decorator.spec.ts
│   ├── interfaces/
│   │   ├── authz-module-options.interface.ts # 模块配置接口
│   │   └── permission.interface.ts          # 权限接口
│   ├── constants/
│   │   └── authz.constants.ts               # 常量定义
│   └── authz.module.ts                      # 主模块
├── README.md                                 # 项目文档
├── CASBIN_TUTORIAL.md                       # 本教程文档
└── EVALUATION_REPORT.md                     # 评估报告

apps/fastify-api/
└── src/
    ├── resources/
    │   └── model.conf                       # Casbin 模型文件
    └── base-demo.module.ts                  # 模块注册示例
```

### 关键代码引用

- **模块注册**：`apps/fastify-api/src/base-demo.module.ts:78-103`
- **模型文件**：`apps/fastify-api/src/resources/model.conf`
- **守卫实现**：`libs/infra/casbin/src/guards/authz.guard.ts`
- **服务实现**：`libs/infra/casbin/src/services/authz.service.ts`
- **适配器实现**：`libs/infra/casbin/src/adapter/casbin-mikro-orm.adapter.ts`
- **实体定义**：`libs/infra/casbin/src/adapter/casbin-rule.entity.ts`

---

**文档版本**: 1.0.0  
**最后更新**: 2025-11-27  
**基于项目**: @hl8/casbin v1.0.0
