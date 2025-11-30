# Clean Architecture 详解

## 学习目标

- 深入理解 Clean Architecture 的分层架构原理
- 理解依赖规则和依赖倒置原则
- 掌握端口适配器模式的应用
- 理解各层的职责和边界

## 1. Clean Architecture 原理

### 1.1 核心思想

Clean Architecture 是由 Robert C. Martin（Uncle Bob）提出的分层架构模式。

**核心思想**：**依赖规则** - 源代码依赖只能指向内层，外层依赖内层，内层不依赖外层。

### 1.2 分层结构

```
┌─────────────────────────────────────────────────┐
│         Infrastructure Layer                    │
│  (数据库、Web框架、外部服务、文件系统等)          │
├─────────────────────────────────────────────────┤
│         Application Layer                       │
│  (用例、服务编排、命令/查询处理器)                │
├─────────────────────────────────────────────────┤
│         Domain Layer                            │
│  (实体、值对象、领域服务、领域事件)               │
└─────────────────────────────────────────────────┘
```

**依赖方向**：外层 → 内层（Infrastructure → Application → Domain）

### 1.3 依赖规则

**规则**：内层不依赖外层，外层依赖内层。

**实现方式**：

- 应用层定义端口接口（Port）
- 基础设施层实现适配器（Adapter）
- 通过依赖注入连接

## 2. 各层详解

### 2.1 Domain Layer（领域层）

**职责**：

- 包含核心业务逻辑和业务规则
- 定义领域模型（聚合根、实体、值对象）
- 定义领域事件
- **不依赖任何外部框架和技术细节**

**特点**：

- 纯业务逻辑，不包含技术实现
- 可以被多个应用服务复用
- 易于单元测试（不需要 Mock 框架）

**示例**：

```typescript
// 领域层：User 聚合根
export class User extends AggregateRoot {
  readonly id: string;
  readonly username: string;
  readonly password: Password; // 值对象

  // 领域方法：业务逻辑
  async loginUser(password: string) {
    if (this.status !== Status.ENABLED) {
      return { success: false, message: 'User is disabled' };
    }
    // 业务逻辑
  }

  // 领域方法：发布事件
  async created() {
    this.apply(new UserCreatedEvent(this.id, this.username, this.domain));
  }
}
```

### 2.2 Application Layer（应用层）

**职责**：

- **实现业务用例（Use Case）**：应用层的核心是 Use Case
- 协调领域对象完成业务用例
- 处理命令和查询（CQRS）
- 处理领域事件
- 不包含业务逻辑，只负责编排

**核心概念：Use Case（用例）**

Use Case 是应用层的核心，代表一个完整的、独立的业务操作。

**实现方式**：

- **命令处理器（Command Handler）** = **写操作 Use Case**
- **查询处理器（Query Handler）** = **读操作 Use Case**
- **应用服务（Application Service）** = **复杂业务流程 Use Case**

**示例**：

```typescript
// 应用层：Use Case 实现
@CommandHandler(UserCreateCommand)
export class UserCreateHandler implements ICommandHandler {
  async execute(command: UserCreateCommand) {
    // Use Case: 创建用户
    // 1. 验证业务规则
    // 2. 创建聚合根
    // 3. 保存到数据库
    // 4. 发布领域事件
  }
}
```

**端口接口（Ports）**：

端口接口定义在应用层，表示"需要什么功能"：

```typescript
// 应用层：端口接口定义
export interface UserWriteRepoPort {
  save(user: User): Promise<void>;
  update(user: User): Promise<void>;
  deleteById(id: string): Promise<void>;
}
```

### 2.3 Infrastructure Layer（基础设施层）

**职责**：

- 实现技术细节（数据库访问、HTTP 请求等）
- 实现端口接口（Port）的具体实现（Adapter）
- 提供框架集成

**适配器（Adapters）**：

适配器在基础设施层实现，表示"如何实现"：

```typescript
// 基础设施层：适配器实现
@Injectable()
export class UserWriteRepository implements UserWriteRepoPort {
  constructor(private readonly em: EntityManager) {}

  async save(user: User): Promise<void> {
    // 具体实现：使用 MikroORM 保存到数据库
    const userData = {
      ...user,
      password: user.password.getValue(),
    };
    const newUser = this.em.create('SysUser', userData);
    await this.em.persistAndFlush(newUser);
  }
}
```

## 3. 端口适配器模式

### 3.1 端口（Port）

**定义**：在应用层定义的接口，表示"需要什么功能"。

**特点**：

- 定义在应用层
- 使用领域模型（不是数据库实体）
- 表示需求，不关心实现

**示例**：

```typescript
// 端口：定义接口
export interface UserReadRepoPort {
  getUserById(id: string): Promise<UserProperties | null>;
  pageUsers(query: PageUsersQuery): Promise<PaginationResult<UserProperties>>;
}
```

### 3.2 适配器（Adapter）

**定义**：在基础设施层实现的类，实现端口接口，表示"如何实现"。

**特点**：

- 实现端口接口
- 处理技术细节
- 可以替换实现

**示例**：

```typescript
// 适配器：实现接口
@Injectable()
export class UserReadRepository implements UserReadRepoPort {
  constructor(private readonly em: EntityManager) {}

  async getUserById(id: string): Promise<UserProperties | null> {
    // 具体实现：数据库查询
    const user = await this.em.findOne('SysUser', { id });
    return user as UserProperties | null;
  }
}
```

### 3.3 依赖注入

**实现方式**：

```typescript
// 1. 定义端口令牌
export const UserReadRepoPortToken = Symbol('UserReadRepoPort');

// 2. 在应用层注入端口接口
@Inject(UserReadRepoPortToken)
private readonly repository: UserReadRepoPort;

// 3. 在基础设施层注册实现
{
  provide: UserReadRepoPortToken,
  useClass: UserReadRepository,
}
```

**优势**：

- 应用层不依赖具体实现
- 可以轻松替换实现（如从 PostgreSQL 切换到 MongoDB）
- 便于测试（可以使用 Mock 实现）

## 4. 依赖倒置原则

### 4.1 原则说明

**依赖倒置原则（DIP）**：高层模块不依赖低层模块，两者都依赖抽象。

**在 Clean Architecture 中的应用**：

- 应用层（高层）定义端口接口（抽象）
- 基础设施层（低层）实现适配器（具体）
- 两者都依赖端口接口（抽象）

### 4.2 依赖方向

```
Infrastructure Layer (基础设施层)
   ↓ (依赖)
Application Layer (应用层，包含 Ports)
   ↓ (依赖)
Domain Layer (领域层)
```

**关键点**：

- 领域层不依赖任何层
- 应用层依赖领域层
- 基础设施层依赖应用层和领域层

## 5. 各层边界

### 5.1 领域层边界

**规则**：领域层不依赖任何外部框架和技术细节。

**允许**：

- ✅ 纯 TypeScript 代码
- ✅ 业务逻辑
- ✅ 领域模型

**禁止**：

- ❌ 数据库相关代码
- ❌ ORM 框架
- ❌ HTTP 框架
- ❌ 外部服务

### 5.2 应用层边界

**规则**：应用层依赖领域层，通过端口接口访问基础设施。

**允许**：

- ✅ 依赖领域层
- ✅ 定义端口接口
- ✅ 编排领域对象

**禁止**：

- ❌ 直接依赖基础设施层
- ❌ 包含业务逻辑（业务逻辑在领域层）

### 5.3 基础设施层边界

**规则**：基础设施层实现端口接口，依赖应用层和领域层。

**允许**：

- ✅ 实现端口接口
- ✅ 使用技术框架
- ✅ 处理技术细节

## 6. 实际应用示例

### 6.1 完整流程

```
1. Controller (Infrastructure Layer)
   - 接收 HTTP 请求
   ↓
2. CommandBus
   - 路由到 CommandHandler
   ↓
3. CommandHandler (Application Layer)
   - 注入端口接口（Port）
   - 调用领域对象
   - 调用仓储（通过端口接口）
   ↓
4. Repository (Infrastructure Layer)
   - 实现端口接口（Adapter）
   - 使用 MikroORM 操作数据库
   ↓
5. Domain Aggregate (Domain Layer)
   - 业务逻辑
   - 发布领域事件
```

### 6.2 代码示例

```typescript
// 1. 应用层：定义端口接口
export interface UserWriteRepoPort {
  save(user: User): Promise<void>;
}

// 2. 应用层：Use Case 使用端口接口
@CommandHandler(UserCreateCommand)
export class UserCreateHandler {
  @Inject(UserWriteRepoPortToken)
  private readonly repository: UserWriteRepoPort;  // 依赖抽象

  async execute(command: UserCreateCommand) {
    const user = new User(...);
    await this.repository.save(user);  // 通过接口调用
  }
}

// 3. 基础设施层：实现端口接口
@Injectable()
export class UserWriteRepository implements UserWriteRepoPort {
  constructor(private readonly em: EntityManager) {}

  async save(user: User): Promise<void> {
    // 具体实现
  }
}

// 4. 依赖注入配置
{
  provide: UserWriteRepoPortToken,
  useClass: UserWriteRepository,  // 绑定实现
}
```

## 7. Clean Architecture 的优势

### 7.1 技术优势

- ✅ **独立于框架**：可以替换框架而不影响业务逻辑
- ✅ **独立于数据库**：可以替换数据库而不影响业务逻辑
- ✅ **独立于 UI**：可以替换 UI 而不影响业务逻辑
- ✅ **独立于外部服务**：可以替换外部服务而不影响业务逻辑

### 7.2 业务优势

- ✅ **业务逻辑集中**：核心业务逻辑集中在领域层
- ✅ **易于理解**：清晰的架构层次，易于理解业务
- ✅ **易于维护**：职责清晰，易于维护和扩展
- ✅ **易于测试**：清晰的依赖方向，易于编写测试

## 8. 学习检查

完成本章学习后，请回答以下问题：

1. Clean Architecture 的核心思想是什么？
2. 各层的职责是什么？
3. 端口和适配器的区别是什么？
4. 依赖倒置原则如何应用？
5. 为什么领域层不依赖外部框架？

## 9. 下一步

- 学习 [CQRS 模式详解](./02-CQRS模式详解.md)
- 查看 [架构原理文档](../../ARCHITECTURE.md#2-clean-architecture清洁架构)

---

**上一章**：[DDD 编程思想](../01-基础篇/04-DDD编程思想.md)  
**下一章**：[CQRS 模式详解](./02-CQRS模式详解.md)  
**返回**：[培训大纲](../README.md)
