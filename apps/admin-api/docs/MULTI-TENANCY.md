# 多租户机制（Multi-Tenancy）文档

## 1. 概述

### 1.1 什么是多租户？

多租户（Multi-Tenancy）是一种软件架构模式，允许单个应用程序实例为多个租户（Tenant）提供服务，每个租户的数据和配置相互隔离。

在 `apps/admin-api` 中，多租户通过 **域（Domain）** 概念实现，每个域代表一个独立的租户空间。

### 1.2 多租户架构模式

本系统采用 **共享数据库、共享架构（Shared Database, Shared Schema）** 模式：

- **共享数据库**：所有租户共享同一个数据库实例
- **共享架构**：所有租户共享相同的数据库表结构
- **数据隔离**：通过 `domain` 字段在应用层实现数据隔离

**优势**：
- 资源利用率高，成本低
- 维护简单，升级方便
- 性能好，无需跨数据库查询

**挑战**：
- 需要在应用层确保数据隔离
- 需要仔细设计查询和权限控制

### 1.3 核心概念

#### 域（Domain）

域是多租户系统中的核心概念，代表一个独立的租户空间。

- **域代码（Domain Code）**：域的唯一标识符，例如 `"example.com"`、`"tenant-a"` 等
- **域隔离**：每个域的数据相互独立，不能互相访问
- **域管理**：通过 `Domain` 聚合根管理域的生命周期

#### 域字段（Domain Field）

所有需要多租户隔离的聚合根都包含 `domain` 字段：

- **用户（User）**：`domain: string` - 用户所属的域
- **角色（Role）**：`domain: string` - 角色所属的域
- **访问密钥（AccessKey）**：`domain: string` - 访问密钥所属的域
- **操作日志（OperationLog）**：`domain: string` - 操作日志所属的域
- **登录日志（LoginLog）**：`domain: string` - 登录日志所属的域

## 2. 域（Domain）模型

### 2.1 Domain 聚合根

`Domain` 是域有界上下文的聚合根，负责管理域的生命周期。

```typescript
export class Domain extends AggregateRoot implements IDomain {
  id: string;              // 域 ID
  code: string;            // 域代码（唯一标识符）
  name: string;            // 域名称
  description: string;      // 域描述
  status: Status;          // 域状态（ENABLED/DISABLED）
  createdAt: Date;        // 创建时间
  createdBy: string;       // 创建者
}
```

### 2.2 域的唯一性

- **域代码（code）**：全局唯一，用于标识不同的租户
- **域状态（status）**：可以启用或禁用域

### 2.3 域的使用场景

1. **租户管理**：创建、更新、删除租户
2. **数据隔离**：通过域代码实现数据隔离
3. **权限控制**：Casbin 权限规则中包含域信息

## 3. 数据隔离机制

### 3.1 应用层隔离

数据隔离在应用层实现，通过在查询中添加 `domain` 条件实现。

#### 3.1.1 查询隔离

**示例：分页查询用户**

```typescript
// queries/page-users.query.ts
export class PageUsersQuery extends PaginationParams implements IQuery {
  readonly username?: string;
  readonly nickName?: string;
  readonly status?: Status;
  // 注意：domain 字段通常从当前用户上下文获取，不通过查询参数传入
}
```

**仓储实现**：

```typescript
// repository/user.read.pg.repository.ts
async pageUsers(query: PageUsersQuery): Promise<PaginationResult<UserProperties>> {
  const where: FilterQuery<any> = {};
  
  // 从用户上下文获取当前用户的 domain
  const currentDomain = this.getCurrentUserDomain();
  
  // 添加 domain 过滤条件
  where.domain = currentDomain;
  
  // 其他筛选条件
  if (query.username) {
    where.username = { $like: `%${query.username}%` };
  }
  
  // ... 执行查询
}
```

#### 3.1.2 创建隔离

创建新资源时，自动设置 `domain` 字段：

```typescript
// commands/access-key-create.command.ts
export class AccessKeyCreateCommand implements ICommand {
  constructor(
    readonly domain: string,        // 从当前用户上下文获取
    readonly description: string | null,
    readonly uid: string,
  ) {}
}

// handlers/access-key-create.command.handler.ts
async execute(command: AccessKeyCreateCommand) {
  const accessKey = AccessKey.fromProp({
    id: UlidGenerator.generate(),
    domain: command.domain,  // 使用命令中的 domain
    AccessKeyID: UlidGenerator.generate(),
    AccessKeySecret: UlidGenerator.generate(),
    status: Status.ENABLED,
    // ...
  });
  
  await this.writeRepository.save(accessKey);
}
```

#### 3.1.3 更新隔离

更新资源时，确保只能更新同一域下的资源：

```typescript
async execute(command: AccessKeyUpdateCommand) {
  // 1. 查找资源
  const accessKey = await this.readRepository.findById(command.id);
  
  // 2. 验证 domain 匹配
  if (accessKey.domain !== command.domain) {
    throw new ForbiddenException('Cannot update access key from different domain');
  }
  
  // 3. 执行更新
  // ...
}
```

### 3.2 数据库层隔离

虽然所有租户共享同一个数据库，但可以通过以下方式增强隔离：

#### 3.2.1 唯一性约束

在数据库层面，某些字段需要在域内唯一：

**示例：用户名在域内唯一**

```sql
-- 用户名在域内唯一
CREATE UNIQUE INDEX idx_user_username_domain ON sys_user(username, domain);
```

**领域模型中的约束**：

```typescript
export class User extends AggregateRoot {
  readonly username: string;  // 在 domain 内唯一
  readonly domain: string;   // 域代码
}
```

#### 3.2.2 索引优化

为 `domain` 字段创建索引，提升查询性能：

```sql
-- 为 domain 字段创建索引
CREATE INDEX idx_user_domain ON sys_user(domain);
CREATE INDEX idx_role_domain ON sys_role(domain);
CREATE INDEX idx_access_key_domain ON sys_access_key(domain);
```

### 3.3 权限层隔离

#### 3.3.1 Casbin 权限规则

Casbin 权限规则中包含域信息，实现权限隔离：

**规则格式**：

```
p, roleCode, resource, action, domain
```

**示例规则**：

```
p, admin, user, read, example.com
p, admin, user, write, example.com
p, user, user, read, example.com
```

**权限验证**：

```typescript
// 查询角色在指定域下的权限
async authApiEndpoint(roleCode: string, domain: string) {
  return this.em.find('CasbinRule', {
    ptype: 'p',
    v0: roleCode,    // 角色代码
    v3: domain,      // 域代码（多租户隔离）
  });
}
```

#### 3.3.2 权限分配

权限分配时，必须指定域：

```typescript
// 为角色分配权限
async assignPermission(
  roleCode: string,
  domain: string,      // 必须指定域
  resource: string,
  action: string,
) {
  // 创建 Casbin 规则
  const rule = {
    ptype: 'p',
    v0: roleCode,
    v1: resource,
    v2: action,
    v3: domain,        // 域信息
  };
  
  await this.casbinService.addPolicy(rule);
}
```

## 4. 用户上下文（User Context）

### 4.1 当前用户域

系统需要从当前用户上下文中获取域信息，用于数据隔离。

#### 4.1.1 JWT Token

用户登录后，JWT Token 中包含用户信息：

```typescript
interface JwtPayload {
  userId: string;
  username: string;
  domain: string;      // 用户所属的域
  roles: string[];
  // ...
}
```

#### 4.1.2 请求上下文

在请求处理过程中，从 JWT Token 中提取域信息：

```typescript
// guards/jwt-auth.guard.ts
@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;  // 从 JWT 解析的用户信息
    
    // 将用户信息存储到请求上下文
    request.userContext = {
      userId: user.userId,
      domain: user.domain,      // 当前用户的域
      // ...
    };
    
    return true;
  }
}
```

#### 4.1.3 命令和查询

在命令和查询中，从请求上下文获取域信息：

```typescript
// controllers/access-key.controller.ts
@Controller('access-keys')
export class AccessKeyController {
  @Post()
  async createAccessKey(
    @Body() dto: CreateAccessKeyDTO,
    @Request() req: any,  // 包含用户上下文
  ) {
    const command = new AccessKeyCreateCommand(
      req.userContext.domain,  // 从请求上下文获取域
      dto.description,
      req.userContext.userId,
    );
    
    await this.commandBus.execute(command);
  }
}
```

### 4.2 域验证

在关键操作中，验证用户是否有权限访问指定域：

```typescript
// 验证用户是否可以访问指定域
async validateDomainAccess(userDomain: string, targetDomain: string): Promise<boolean> {
  // 1. 用户只能访问自己域下的资源
  if (userDomain === targetDomain) {
    return true;
  }
  
  // 2. 超级管理员可以访问所有域（如果需要）
  if (this.isSuperAdmin(userDomain)) {
    return true;
  }
  
  return false;
}
```

## 5. 多租户实现示例

### 5.1 用户管理

#### 5.1.1 创建用户

```typescript
// commands/user-create.command.ts
export class UserCreateCommand implements ICommand {
  constructor(
    readonly username: string,
    readonly password: string,
    readonly domain: string,      // 从当前用户上下文获取
    readonly nickName: string,
    readonly uid: string,
  ) {}
}

// handlers/user-create.command.handler.ts
async execute(command: UserCreateCommand) {
  // 1. 验证用户名在域内唯一
  const existing = await this.readRepo.findUserByUsername(
    command.username,
    command.domain,  // 指定域
  );
  
  if (existing) {
    throw new BadRequestException('Username already exists in this domain');
  }
  
  // 2. 创建用户（自动设置 domain）
  const user = User.fromCreate({
    id: UlidGenerator.generate(),
    username: command.username,
    domain: command.domain,  // 使用命令中的 domain
    // ...
  });
  
  await this.writeRepo.save(user);
}
```

#### 5.1.2 查询用户

```typescript
// queries/page-users.query.ts
export class PageUsersQuery extends PaginationParams implements IQuery {
  readonly username?: string;
  readonly nickName?: string;
  readonly status?: Status;
  // domain 从用户上下文获取，不通过查询参数
}

// handlers/page-users.query.handler.ts
async execute(query: PageUsersQuery) {
  // 从用户上下文获取当前用户的 domain
  const currentDomain = this.getCurrentUserDomain();
  
  // 调用仓储查询（仓储层会自动添加 domain 过滤）
  return this.repository.pageUsers(query, currentDomain);
}
```

### 5.2 访问密钥管理

#### 5.2.1 创建访问密钥

```typescript
// commands/access-key-create.command.ts
export class AccessKeyCreateCommand implements ICommand {
  constructor(
    readonly domain: string,      // 从当前用户上下文获取
    readonly description: string | null,
    readonly uid: string,
  ) {}
}

// handlers/access-key-create.command.handler.ts
async execute(command: AccessKeyCreateCommand) {
  const accessKey = AccessKey.fromProp({
    id: UlidGenerator.generate(),
    domain: command.domain,  // 使用命令中的 domain
    AccessKeyID: UlidGenerator.generate(),
    AccessKeySecret: UlidGenerator.generate(),
    status: Status.ENABLED,
    description: command.description,
    createdAt: new Date(),
    createdBy: command.uid,
  });
  
  await this.writeRepo.save(accessKey);
  await accessKey.created();
  this.publisher.mergeObjectContext(accessKey);
  accessKey.commit();
}
```

#### 5.2.2 查询访问密钥

```typescript
// queries/page-access_key.query.ts
export class PageAccessKeysQuery extends PaginationParams implements IQuery {
  readonly domain?: string;  // 可选，非内置域用户只能查询自己域
  readonly status?: Status;
}

// handlers/page-access_keys.query.handler.ts
async execute(query: PageAccessKeysQuery) {
  // 从用户上下文获取当前用户的 domain
  const currentDomain = this.getCurrentUserDomain();
  
  // 非内置域用户只能查询自己域下的密钥
  if (!this.isBuiltInDomain(currentDomain)) {
    query.domain = currentDomain;
  }
  
  return this.repository.pageAccessKeys(query);
}
```

### 5.3 权限管理

#### 5.3.1 分配权限

```typescript
// 为角色分配权限
async assignPermission(
  roleCode: string,
  domain: string,      // 必须指定域
  resource: string,
  action: string,
) {
  // 验证角色属于指定域
  const role = await this.roleRepo.findByCode(roleCode, domain);
  if (!role) {
    throw new NotFoundException('Role not found in this domain');
  }
  
  // 创建 Casbin 规则
  const rule = {
    ptype: 'p',
    v0: roleCode,
    v1: resource,
    v2: action,
    v3: domain,        // 域信息
  };
  
  await this.casbinService.addPolicy(rule);
}
```

#### 5.3.2 权限验证

```typescript
// 验证用户是否有权限
async checkPermission(
  userId: string,
  resource: string,
  action: string,
) {
  // 1. 获取用户信息
  const user = await this.userRepo.findById(userId);
  
  // 2. 获取用户角色
  const roles = await this.getUserRoles(userId, user.domain);
  
  // 3. 查询权限规则（包含域信息）
  for (const role of roles) {
    const rules = await this.casbinService.authApiEndpoint(
      role.code,
      user.domain,  // 使用用户所属的域
    );
    
    const hasPermission = rules.some(
      (rule) => rule.v1 === resource && rule.v2 === action,
    );
    
    if (hasPermission) {
      return true;
    }
  }
  
  return false;
}
```

## 6. 最佳实践

### 6.1 数据隔离

1. **始终验证域**：在查询、更新、删除操作中，始终验证域匹配
2. **自动设置域**：创建资源时，自动从用户上下文获取域
3. **不信任客户端**：不要从客户端接收域参数，始终从服务器端获取

### 6.2 查询设计

1. **隐式域过滤**：查询时自动添加域过滤条件，不需要客户端传入
2. **显式域参数**：对于需要跨域查询的场景（如超级管理员），使用显式参数
3. **索引优化**：为 `domain` 字段创建索引，提升查询性能

### 6.3 权限控制

1. **域级权限**：权限规则必须包含域信息
2. **角色隔离**：角色属于特定域，不能跨域使用
3. **权限验证**：权限验证时，必须使用用户所属的域

### 6.4 安全考虑

1. **防止域越权**：确保用户不能访问其他域的数据
2. **域验证**：在关键操作中验证域匹配
3. **审计日志**：记录域相关的操作，便于审计

## 7. 常见问题

### 7.1 如何实现跨域访问？

**回答**：通常不允许跨域访问。如果需要，可以：

1. **超级管理员**：创建超级管理员角色，可以访问所有域
2. **域间授权**：通过域间授权机制，允许特定域访问其他域
3. **数据共享**：通过数据共享机制，在域间共享特定数据

### 7.2 如何迁移域数据？

**回答**：域数据迁移需要谨慎处理：

1. **数据导出**：导出源域的数据
2. **数据转换**：转换数据格式，更新域代码
3. **数据导入**：导入到目标域
4. **验证完整性**：验证数据完整性

### 7.3 如何删除域？

**回答**：删除域需要处理相关数据：

1. **检查依赖**：检查是否有用户、角色等资源依赖该域
2. **清理数据**：清理域相关的所有数据
3. **清理权限**：清理域相关的 Casbin 权限规则
4. **发布事件**：发布域删除事件，通知其他系统

### 7.4 如何实现域级别的配置？

**回答**：可以为每个域设置独立的配置：

1. **域配置表**：创建域配置表，存储域级别的配置
2. **配置继承**：支持从全局配置继承，域配置覆盖全局配置
3. **配置缓存**：缓存域配置，提升性能

## 8. 未来扩展

### 8.1 域级别配额

未来可以添加域级别的资源配额：

```typescript
export class Domain extends AggregateRoot {
  // ... 现有属性
  
  readonly quota: {
    maxUsers: number;        // 最大用户数
    maxRoles: number;        // 最大角色数
    maxAccessKeys: number;   // 最大访问密钥数
  };
}
```

### 8.2 域级别功能开关

未来可以添加域级别的功能开关：

```typescript
export class Domain extends AggregateRoot {
  // ... 现有属性
  
  readonly features: {
    enableAccessKey: boolean;    // 是否启用访问密钥
    enableAuditLog: boolean;     // 是否启用审计日志
    enableCustomRole: boolean;   // 是否允许自定义角色
  };
}
```

### 8.3 域级别计费

未来可以添加域级别的计费功能：

```typescript
export class Domain extends AggregateRoot {
  // ... 现有属性
  
  readonly billing: {
    plan: string;           // 计费计划
    usage: {
      apiCalls: number;      // API 调用次数
      storage: number;       // 存储使用量
    };
  };
}
```

## 9. 总结

多租户机制是 `apps/admin-api` 的核心架构特性，通过域（Domain）概念实现数据隔离和权限控制。

**核心要点**：

1. **域是租户标识**：每个域代表一个独立的租户空间
2. **应用层隔离**：数据隔离在应用层实现，通过 `domain` 字段过滤
3. **权限层隔离**：Casbin 权限规则包含域信息，实现权限隔离
4. **用户上下文**：从用户上下文获取域信息，确保数据安全

遵循本文档的最佳实践，可以确保多租户系统的数据安全和隔离性。

---

**文档版本**：v1.0.0  
**最后更新**：2024-01-XX  
**维护者**：架构团队

