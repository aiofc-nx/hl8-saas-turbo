# 架构原理与术语定义文档

## 1. 架构概述

本项目采用 **Clean Architecture（清洁架构）+ CQRS（命令查询职责分离）+ 事件驱动架构（EDA）+ 事件溯源（Event Sourcing, ES）** 的组合架构模式。这四种架构模式相互配合，共同构建了一个高内聚、低耦合、易于扩展和维护的系统。

> 📖 **事件溯源扩展**：关于事件溯源的详细说明，请参阅 [事件溯源架构扩展文档](./EVENT-SOURCING.md)

### 1.1 架构目标

- **高内聚、低耦合**：通过分层架构和清晰的边界，确保各层职责明确，降低依赖关系
- **业务逻辑独立**：核心业务逻辑不依赖技术框架和基础设施，易于测试和维护
- **读写分离**：通过 CQRS 实现读写操作的优化和独立扩展
- **事件驱动**：通过领域事件实现模块间解耦和异步处理，提升系统响应性和可扩展性
- **事件溯源**：通过事件溯源实现完整的历史记录、时间旅行和审计功能
- **可测试性**：清晰的依赖方向使得单元测试和集成测试更容易编写

### 1.2 架构原则

1. **依赖倒置原则（DIP）**：高层模块不依赖低层模块，两者都依赖抽象
2. **单一职责原则（SRP）**：每个类或模块只有一个变化的理由
3. **开闭原则（OCP）**：对扩展开放，对修改关闭
4. **关注点分离**：将业务逻辑、技术细节、基础设施分开处理

## 2. Clean Architecture（清洁架构）

### 2.1 架构原理

Clean Architecture 是由 Robert C. Martin（Uncle Bob）提出的分层架构模式。它的核心思想是**依赖规则**：源代码依赖只能指向内层，外层依赖内层，内层不依赖外层。

#### 2.1.1 分层结构

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

### 2.2 各层职责

#### 2.2.1 Domain Layer（领域层）

**职责**：

- 包含核心业务逻辑和业务规则
- 定义领域模型（聚合根、实体、值对象）
- 定义领域事件
- **不依赖任何外部框架和技术细节**

**核心概念**：

- **聚合根（Aggregate Root）**：聚合的入口，负责维护聚合内部的业务不变性和一致性

  ```typescript
  // 示例：User 聚合根
  export class User extends AggregateRoot {
    async loginUser(password: string) {
      // 业务逻辑：验证密码、检查状态
      if (this.status !== Status.ENABLED) {
        return { success: false, message: 'User is disabled' };
      }
      // ...
    }
  }
  ```

- **值对象（Value Object）**：没有唯一标识的对象，通过值相等性判断

  ```typescript
  // 示例：Password 值对象
  export class Password {
    static fromHashed(hashed: string): Password {
      return new Password(hashed);
    }
    async compare(plainPassword: string): Promise<boolean> {
      // 密码比较逻辑
    }
  }
  ```

- **领域事件（Domain Event）**：领域内发生的业务事件
  ```typescript
  // 示例：用户创建事件
  export class UserCreatedEvent implements IEvent {
    constructor(
      public readonly userId: string,
      public readonly username: string,
      public readonly domain: string,
    ) {}
  }
  ```

**特点**：

- 纯业务逻辑，不包含技术实现
- 可以被多个应用服务复用
- 易于单元测试（不需要 Mock 框架）

#### 2.2.2 Application Layer（应用层）

**职责**：

- **实现业务用例（Use Case）**：应用层的核心是 Use Case，每个 Use Case 代表一个完整的业务操作
- 协调领域对象完成业务用例
- 处理命令和查询（CQRS）
- 处理领域事件
- 不包含业务逻辑，只负责编排

**核心概念：Use Case（用例）**

Use Case 是应用层的核心，代表一个完整的、独立的业务操作。在 CQRS 模式下，Use Case 通过以下方式实现：

- **命令处理器（Command Handler）** = **写操作 Use Case**
- **查询处理器（Query Handler）** = **读操作 Use Case**
- **应用服务（Application Service）** = **复杂业务流程 Use Case**

**核心组件**：

- **命令处理器（Command Handler）**：实现写操作 Use Case

  ```typescript
  /**
   * 用户创建 Use Case
   *
   * @description
   * 这是一个完整的业务用例：创建新用户。
   * 用例步骤：
   * 1. 验证用户名唯一性
   * 2. 加密密码
   * 3. 创建用户聚合根
   * 4. 保存到数据库
   * 5. 发布用户创建事件
   */
  @CommandHandler(UserCreateCommand)
  export class UserCreateHandler implements ICommandHandler {
    async execute(command: UserCreateCommand) {
      // Use Case 实现：创建用户的完整业务流程
      // 1. 验证业务规则（通过领域对象）
      // 2. 创建聚合根
      // 3. 调用仓储保存
      // 4. 发布领域事件
    }
  }
  ```

- **查询处理器（Query Handler）**：实现读操作 Use Case

  ```typescript
  /**
   * 根据 ID 查询用户 Use Case
   *
   * @description
   * 这是一个查询用例：根据用户 ID 获取用户信息。
   */
  @QueryHandler(FindUserByIdQuery)
  export class FindUserByIdQueryHandler implements IQueryHandler {
    async execute(query: FindUserByIdQuery) {
      // Use Case 实现：查询用户信息
      return this.repository.getUserById(query.id);
    }
  }
  ```

- **应用服务（Application Service）**：实现复杂业务流程 Use Case

  ```typescript
  /**
   * 密码登录 Use Case
   *
   * @description
   * 这是一个复杂的业务用例：用户通过密码登录。
   * 用例步骤：
   * 1. 查找用户
   * 2. 验证密码（通过领域模型）
   * 3. 生成 JWT 令牌
   * 4. 发布登录事件
   * 5. 缓存用户角色
   */
  @Injectable()
  export class AuthenticationService {
    async execPasswordLogin(dto: PasswordIdentifierDTO) {
      // Use Case 实现：密码登录的完整业务流程
      // 1. 查找用户
      // 2. 验证密码
      // 3. 生成令牌
      // 4. 发布事件
    }
  }
  ```

- **事件处理器（Event Handler）**：实现事件处理 Use Case
  ```typescript
  /**
   * 用户创建后处理 Use Case
   *
   * @description
   * 这是一个事件处理用例：当用户创建后执行后续操作。
   */
  @EventsHandler(UserCreatedEvent)
  export class UserCreatedHandler implements IEventHandler {
    async handle(event: UserCreatedEvent) {
      // Use Case 实现：处理用户创建后的后续操作
      // 例如：初始化权限、发送通知等
    }
  }
  ```

**Use Case 的特点**：

- **独立性**：每个 Use Case 是独立的业务操作，可以单独测试
- **完整性**：Use Case 包含完成业务目标所需的所有步骤
- **编排性**：Use Case 协调领域对象完成业务目标，不包含业务逻辑
- **可测试性**：Use Case 可以独立测试，不依赖外部框架

**Use Case 与 CQRS 的关系**：

在 CQRS 模式下，Use Case 分为两类：

1. **命令 Use Case（Command Use Case）**：通过 Command Handler 实现
   - 修改系统状态
   - 返回 void 或简单结果
   - 可以发布领域事件

2. **查询 Use Case（Query Use Case）**：通过 Query Handler 实现
   - 不修改系统状态
   - 返回数据
   - 不发布领域事件

**特点**：

- 薄薄的一层，主要是编排逻辑
- 依赖领域层，不依赖基础设施层
- 通过端口接口（Port）访问基础设施
- **每个 Handler 或 Service 方法就是一个 Use Case**

#### 2.2.3 Infrastructure Layer（基础设施层）

**职责**：

- 实现技术细节（数据库访问、HTTP 请求、消息队列等）
- 实现端口接口（Port）的具体实现（Adapter）
- 提供框架集成（NestJS、MikroORM 等）

**核心组件**：

- **仓储实现（Repository Implementation）**：实现端口接口

```typescript
@Injectable()
export class UserPostgresRepository implements UserReadRepoPort {
  async getUserById(id: string): Promise<UserProperties | null> {
    // 数据库查询实现
    const entity = await this.em.findOne(UserEntity, id);
    return entity ? this.mapToDomain(entity) : null;
  }
}
```

- **HTTP 控制器（Controller）**：处理 HTTP 请求
  ```typescript
  @Controller('users')
  export class UserController {
  @Post()
    async createUser(@Body() dto: CreateUserDTO) {
      const command = new UserCreateCommand(...);
    await this.commandBus.execute(command);
  }
  }
  ```

````

- **数据库实体（Entity）**：ORM 实体映射
  ```typescript
  @Entity({ tableName: 'users' })
  export class UserEntity {
    @PrimaryKey()
    id: string;

    @Property()
    username: string;
  }
````

**特点**：

- 可以随时替换实现（如数据库从 PostgreSQL 换到 MongoDB）
- 依赖应用层和领域层
- 包含所有技术细节

### 2.3 端口适配器模式（Port and Adapter）

端口适配器模式是 Clean Architecture 实现的核心机制：

- **端口（Port）**：在应用层定义的接口，表示"需要什么"

  ```typescript
  // 端口：定义接口
  export interface UserReadRepoPort {
    getUserById(id: string): Promise<UserProperties | null>;
    findUserByIdentifier(identifier: string): Promise<UserProperties | null>;
  }
  ```

- **适配器（Adapter）**：在基础设施层实现的类，表示"如何实现"
  ```typescript
  // 适配器：实现接口
  @Injectable()
  export class UserPostgresRepository implements UserReadRepoPort {
    async getUserById(id: string) {
      // PostgreSQL 实现
    }
  }
  ```

**优势**：

- 应用层不依赖具体实现，只依赖抽象接口
- 可以轻松替换实现（如从 PostgreSQL 切换到 MongoDB）
- 便于测试（可以使用 Mock 实现）

### 2.4 依赖注入

依赖注入是实现依赖倒置的关键机制：

```typescript
// 1. 定义端口令牌
export const UserReadRepoPortToken = Symbol('UserReadRepoPort');

// 2. 在应用层注入端口接口
@CommandHandler(UserCreateCommand)
export class UserCreateHandler {
  @Inject(UserReadRepoPortToken)
  private readonly repository: UserReadRepoPort; // 依赖抽象
}

// 3. 在基础设施层注册实现
@Module({
  providers: [
    {
      provide: UserReadRepoPortToken,
      useClass: UserPostgresRepository, // 提供具体实现
    },
  ],
})
export class UserInfraModule {}
```

## 3. CQRS（命令查询职责分离）

### 3.1 架构原理

CQRS（Command Query Responsibility Segregation）是一种架构模式，将数据修改操作（命令）和数据查询操作（查询）完全分离。

#### 3.1.1 基本概念

```
┌─────────────┐      ┌─────────────┐
│   Command   │      │    Query    │
│  (写操作)    │      │   (读操作)   │
└──────┬──────┘      └──────┬──────┘
       │                    │
       ▼                    ▼
┌─────────────┐      ┌─────────────┐
│ Command     │      │ Query       │
│ Handler     │      │ Handler     │
└──────┬──────┘      └──────┬──────┘
       │                    │
       ▼                    ▼
┌─────────────┐      ┌─────────────┐
│ Write       │      │ Read        │
│ Repository  │      │ Repository  │
└─────────────┘      └─────────────┘
```

### 3.2 命令（Command）

**定义**：命令表示用户的意图，用于修改系统状态。

**特点**：

- 不返回数据，只返回成功/失败
- 可能会改变系统状态
- 可以被验证、授权、审计
- 可以发布事件

**示例**：

```typescript
export class UserCreateCommand implements ICommand {
  constructor(
    readonly username: string,
    readonly password: string,
    readonly domain: string,
    readonly uid: string,
  ) {}
}

// 命令处理器
@CommandHandler(UserCreateCommand)
export class UserCreateHandler implements ICommandHandler {
  async execute(command: UserCreateCommand): Promise<void> {
    // 1. 验证业务规则
    const existing = await this.repository.findUserByUsername(command.username);
    if (existing) {
      throw new BadRequestException('User already exists');
    }

    // 2. 创建聚合根
    const user = User.fromCreate({
      id: UlidGenerator.generate(),
      username: command.username,
      // ...
    });

    // 3. 保存到数据库
    await this.writeRepository.save(user);

    // 4. 发布领域事件
    await user.created();
    user.commit();
  }
}
```

**命令设计原则**：

- 命名使用动词：`CreateUser`、`UpdateUser`、`DeleteUser`
- 包含执行操作所需的所有数据
- 不可变（immutable）
- 具有明确的业务意图

### 3.3 查询（Query）

**定义**：查询用于获取数据，不改变系统状态。

**特点**：

- 返回数据
- 不改变系统状态（幂等）
- 可以优化（缓存、只读数据库等）
- 可以有多种查询模型

**示例**：

```typescript
export class FindUserByIdQuery implements IQuery {
  constructor(readonly id: string) {}
}

// 查询处理器
@QueryHandler(FindUserByIdQuery)
export class FindUserByIdQueryHandler implements IQueryHandler {
  async execute(query: FindUserByIdQuery): Promise<UserProperties | null> {
    // 直接查询，不经过领域模型
    return this.readRepository.getUserById(query.id);
  }
}
```

**查询设计原则**：

- 命名使用名词或查询动词：`FindUserById`、`PageUsers`、`GetUserRoles`
- 可以返回读取模型（Read Model），不一定是领域模型
- 可以针对查询优化（索引、缓存等）
- 不包含业务逻辑，只是数据查询

### 3.4 命令与查询的对比

| 特性       | 命令（Command）      | 查询（Query）    |
| ---------- | -------------------- | ---------------- |
| **目的**   | 改变系统状态         | 获取数据         |
| **返回**   | void 或简单结果      | 数据对象         |
| **副作用** | 有副作用（修改状态） | 无副作用（幂等） |
| **验证**   | 需要业务规则验证     | 通常不需要验证   |
| **事务**   | 需要事务             | 可以不需要事务   |
| **事件**   | 可以发布事件         | 不发布事件       |
| **优化**   | 优化写性能           | 优化读性能       |

### 3.5 CQRS 的优势

1. **读写分离**：可以为读写操作分别优化
   - 写操作：使用领域模型，保证一致性
   - 读操作：使用读取模型，优化查询性能

2. **独立扩展**：读写操作可以独立扩展
   - 读操作可以使用只读数据库副本
   - 写操作可以使用主数据库

3. **简化领域模型**：查询不需要经过领域模型，简化了领域层的复杂度

4. **性能优化**：查询可以针对特定场景优化（索引、缓存、物化视图等）

## 4. 事件驱动架构（EDA）

### 4.1 架构原理

事件驱动架构（Event-Driven Architecture）是一种架构模式，系统的各个组件通过事件进行通信，而不是直接调用。

#### 4.1.1 基本概念

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│  Aggregate  │ publish │  Event Bus   │ notify  │   Event     │
│    Root     │────────▶│              │────────▶│  Handler    │
└─────────────┘  Event  └──────────────┘         └─────────────┘
```

### 4.2 领域事件（Domain Event）

**定义**：领域事件是领域内发生的、对业务有重要意义的事情。

**特点**：

- 表示过去发生的事情（已发生的事实）
- 不可变（immutable）
- 包含事件发生的上下文信息
- 命名使用过去时态

**示例**：

```typescript
export class UserCreatedEvent implements IEvent {
  constructor(
    public readonly userId: string,
    public readonly username: string,
    public readonly domain: string,
  ) {}
}

export class RoleDeletedEvent implements IEvent {
  constructor(
    public readonly roleId: string,
    public readonly code: string,
  ) {}
}
```

### 4.3 事件发布

领域事件由聚合根发布：

```typescript
export class User extends AggregateRoot {
  async created() {
    // 应用领域事件
    this.apply(new UserCreatedEvent(this.id, this.username, this.domain));
  }

  async deleted() {
    this.apply(new UserDeletedEvent(this.id, this.username, this.domain));
  }
}

// 使用
const user = User.fromCreate(properties);
await user.created(); // 发布事件
this.publisher.mergeObjectContext(user);
user.commit(); // 提交事件到事件总线
```

**事件发布流程**：

1. 聚合根通过 `apply()` 方法应用事件
2. 事件存储在聚合根的未提交事件列表中
3. 调用 `commit()` 方法将事件提交到事件总线
4. 事件总线分发事件给所有订阅者

### 4.4 事件处理

事件处理器订阅并处理领域事件：

```typescript
@EventsHandler(UserCreatedEvent)
export class UserCreatedHandler implements IEventHandler {
  constructor(
    private readonly roleService: RoleService,
    private readonly notificationService: NotificationService,
  ) {}

  async handle(event: UserCreatedEvent) {
    // 1. 初始化用户默认权限
    await this.roleService.assignDefaultRole(event.userId, event.domain);

    // 2. 发送欢迎通知
    await this.notificationService.sendWelcomeEmail(event.userId);
  }
}
```

**事件处理特点**：

- 异步执行，不阻塞主流程
- 可以并行处理多个事件
- 失败可以重试
- 可以发布新的事件

### 4.5 事件驱动架构的优势

1. **解耦**：发布者和订阅者不需要知道对方的存在
2. **可扩展性**：可以轻松添加新的事件处理器
3. **异步处理**：提升系统响应性
4. **最终一致性**：通过事件实现系统间的最终一致性

## 5. 事件溯源（Event Sourcing, ES）

### 5.1 架构原理

事件溯源（Event Sourcing）是一种数据存储模式，其核心思想是：

- **不存储当前状态**，而是存储所有发生的事件
- **通过重放事件**来重建当前状态
- **事件是不可变的**，只能追加，不能修改

### 5.2 与现有架构的结合

**架构组合**：

```
Clean Architecture + CQRS + EDA + Event Sourcing
```

**结合方式**：

- **CQRS + Event Sourcing**：写操作保存事件，读操作从读取模型查询
- **EDA + Event Sourcing**：领域事件既是事件驱动的事件，也是事件溯源的事件
- **Clean Architecture + Event Sourcing**：事件存储是基础设施层，通过端口接口访问

### 5.3 事件存储（Event Store）

**事件存储设计**：

```typescript
// 事件存储端口接口
export interface EventStorePort {
  saveEvents(
    aggregateId: string,
    aggregateType: string,
    events: IEvent[],
    expectedVersion: number,
  ): Promise<void>;

  getEvents(aggregateId: string, aggregateType: string): Promise<IEvent[]>;
}
```

**事件表结构**：

```sql
CREATE TABLE domain_events (
  id VARCHAR PRIMARY KEY,
  aggregate_id VARCHAR NOT NULL,
  aggregate_type VARCHAR NOT NULL,
  event_type VARCHAR NOT NULL,
  event_data JSONB NOT NULL,
  occurred_at TIMESTAMP NOT NULL,
  version INT NOT NULL,
  INDEX idx_aggregate (aggregate_id, aggregate_type)
);
```

### 5.4 状态重建

**从事件重建聚合根**：

```typescript
export class User extends AggregateRoot {
  // 从事件重建聚合根
  static async fromEvents(
    eventStore: EventStorePort,
    userId: string,
  ): Promise<User> {
    const events = await eventStore.getEvents(userId, 'User');

    let user = null;
    for (const event of events) {
      user = User.applyEvent(user, event);
    }

    return user;
  }
}
```

### 5.5 事件溯源的优势

1. **完整的历史记录**：所有变更都有记录
2. **时间旅行**：可以查看任何历史时间点的状态
3. **审计功能**：完整的审计日志
4. **调试便利**：可以重放事件重现问题
5. **与 CQRS 完美结合**：写操作只追加事件，性能好

### 5.6 实施建议

**渐进式实施**：

1. **阶段 1**：保持现有架构，添加事件存储（双重写入）
2. **阶段 2**：实现事件重放逻辑，验证重建状态
3. **阶段 3**：完全切换到事件溯源

**详细说明**：请参阅 [事件溯源架构扩展文档](./EVENT-SOURCING.md)

## 6. 四种架构模式的组合

### 4.6 事件流示例（含事件溯源）

**用户创建流程**：

```
1. Controller 接收请求
   ↓
2. 创建 UserCreateCommand
   ↓
3. CommandHandler 执行命令
   ↓
4. 创建 User 聚合根
   ↓
5. User.created() 发布 UserCreatedEvent
   ↓
6. 保存事件到 Event Store（事件溯源）
   ↓
7. 保存当前状态到数据库（可选，双重写入）
   ↓
8. 提交事件到事件总线
   ↓
9. 事件总线分发事件
   ↓
10. Event Handlers 处理事件
    ├── 构建读取模型
    ├── 初始化权限
    ├── 发送通知
    └── 更新缓存
```

### 6.1 架构分层与职责

```
┌──────────────────────────────────────────────────────────┐
│              Infrastructure Layer                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  Controllers │  │ Repositories │  │ Event Store  │  │
│  │   (REST API) │  │   (Database) │  │ (事件存储)    │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
├──────────────────────────────────────────────────────────┤
│              Application Layer                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  Command     │  │   Query      │  │    Event     │  │
│  │  Handlers    │  │  Handlers    │  │   Handlers   │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│  ┌────────────────────────────────────────────────────┐ │
│  │         Application Services                       │ │
│  └────────────────────────────────────────────────────┘ │
├──────────────────────────────────────────────────────────┤
│              Domain Layer                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  Aggregate   │  │    Value     │  │    Domain    │  │
│  │    Roots     │  │   Objects   │  │    Events    │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└──────────────────────────────────────────────────────────┘
```

### 6.2 数据流

**写操作（Command）流程（含事件溯源）**：

```
HTTP Request
    ↓
Controller
    ↓
Command
    ↓
CommandHandler (Use Case: 写操作用例)
    ↓
Domain Aggregate (业务逻辑)
    ↓
发布领域事件
    ↓
Event Store (事件存储) ← 事件溯源：保存所有事件
    ↓
Write Repository (当前状态) ← 可选，双重写入
    ↓
Database
    ↓
Event Bus
    ↓
Event Handlers (Use Case: 事件处理用例)
    ├── 构建读取模型
    ├── 发送通知
    └── 更新缓存
```

**状态重建流程（事件溯源）**：

```
Event Store
    ↓
获取聚合的所有事件
    ↓
重放事件
    ↓
重建聚合根状态
    ↓
返回当前状态
```

**读操作（Query）流程**：

```
HTTP Request
    ↓
Controller
    ↓
Query
    ↓
QueryHandler (Use Case: 读操作用例)
    ↓
Read Repository
    ↓
Database
    ↓
Read Model (DTO)
    ↓
HTTP Response
```

### 5.3 完整示例

**用户创建完整流程**：

```typescript
// 1. Infrastructure Layer: Controller
@Controller('users')
export class UserController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post()
  async createUser(@Body() dto: CreateUserDTO) {
    const command = new UserCreateCommand(
      dto.username,
      dto.password,
      dto.domain,
      this.currentUserId,
    );
    await this.commandBus.execute(command);
  }
}

// 2. Application Layer: Use Case (写操作用例)
// UserCreateHandler.execute() 就是一个完整的 Use Case：创建用户
@CommandHandler(UserCreateCommand)
export class UserCreateHandler implements ICommandHandler {
  constructor(
    @Inject(UserReadRepoPortToken)
    private readonly readRepo: UserReadRepoPort,
    @Inject(UserWriteRepoPortToken)
    private readonly writeRepo: UserWriteRepoPort,
  ) {}

  /**
   * Use Case: 创建用户
   *
   * 用例步骤：
   * 1. 验证用户名唯一性
   * 2. 创建用户聚合根
   * 3. 保存到数据库
   * 4. 发布用户创建事件
   */
  async execute(command: UserCreateCommand) {
    // 步骤 1: 验证业务规则
    const existing = await this.readRepo.findUserByUsername(command.username);
    if (existing) {
      throw new BadRequestException('User already exists');
    }

    // 步骤 2: 创建领域对象
    const user = User.fromCreate({
      id: UlidGenerator.generate(),
      username: command.username,
      password: Password.fromPlain(command.password),
      domain: command.domain,
      status: Status.ENABLED,
      createdAt: new Date(),
      createdBy: command.uid,
    });

    // 步骤 3: 保存到数据库
    await this.writeRepo.save(user);

    // 步骤 4: 发布领域事件
    await user.created();
    user.commit();
  }
}

// 3. Domain Layer: Aggregate Root
export class User extends AggregateRoot {
  async created() {
    this.apply(new UserCreatedEvent(this.id, this.username, this.domain));
  }
}

// 4. Application Layer: Use Case (事件处理用例)
// UserCreatedHandler.handle() 就是一个完整的 Use Case：处理用户创建后的后续操作
@EventsHandler(UserCreatedEvent)
export class UserCreatedHandler implements IEventHandler {
  /**
   * Use Case: 处理用户创建后的后续操作
   *
   * 用例步骤：
   * 1. 初始化用户默认权限
   * 2. 发送欢迎通知
   */
  async handle(event: UserCreatedEvent) {
    // 异步处理：初始化权限、发送通知等
    await this.roleService.assignDefaultRole(event.userId);
    await this.notificationService.sendWelcomeEmail(event.userId);
  }
}
```

## 6. 关键术语定义

### 6.1 Clean Architecture 术语

#### 聚合（Aggregate）

一组相关对象的集合，作为一个整体被处理。聚合根是聚合的入口点。

**特点**：

- 聚合内部维护业务不变性
- 外部只能通过聚合根访问聚合内的对象
- 聚合边界是事务边界

#### 聚合根（Aggregate Root）

聚合的入口点，负责维护聚合内部的业务规则和一致性。

**示例**：

- `User` 是用户聚合的聚合根
- `Role` 是角色聚合的聚合根
- `Menu` 是菜单聚合的聚合根

#### 实体（Entity）

具有唯一标识的对象，通过标识符区分不同的实例。

**特点**：

- 有唯一标识（ID）
- 有生命周期
- 可变（mutable）

#### 值对象（Value Object）

没有唯一标识的对象，通过值相等性判断。

**特点**：

- 无唯一标识
- 不可变（immutable）
- 通过值相等

**示例**：

- `Password`：密码值对象
- `Money`：金额值对象（如果有）
- `Email`：邮箱值对象（如果有）

#### 领域服务（Domain Service）

当业务逻辑不适合放在实体或值对象中时，可以使用领域服务。

**使用场景**：

- 业务逻辑涉及多个聚合
- 业务逻辑是无状态的
- 业务逻辑是复杂的算法

#### 端口（Port）

在应用层定义的接口，表示"需要什么功能"。

#### 适配器（Adapter）

在基础设施层实现的类，实现端口接口，表示"如何实现"。

### 6.2 CQRS 术语

#### 命令（Command）

表示用户意图的对象，用于修改系统状态。

**命名规范**：

- 使用动词：`CreateUser`、`UpdateUser`、`DeleteUser`
- 使用过去式表示意图：`UserCreateCommand`

#### 查询（Query）

用于获取数据的对象，不改变系统状态。

**命名规范**：

- 使用查询动词：`FindUserById`、`PageUsers`、`GetUserRoles`
- 使用名词：`UserByIdQuery`

#### 命令处理器（Command Handler）

处理命令的类，负责执行写操作。

**本质**：命令处理器就是**写操作 Use Case**的实现。每个 Command Handler 的 `execute()` 方法代表一个完整的写操作业务用例。

#### 查询处理器（Query Handler）

处理查询的类，负责执行读操作。

**本质**：查询处理器就是**读操作 Use Case**的实现。每个 Query Handler 的 `execute()` 方法代表一个完整的查询业务用例。

#### 读取模型（Read Model）

为查询优化的数据模型，通常扁平化，不包含复杂的业务逻辑。

#### 写入模型（Write Model）

领域模型，用于保证业务规则和一致性。

### 6.3 事件驱动架构术语

#### 领域事件（Domain Event）

领域内发生的、对业务有重要意义的事情。

**命名规范**：

- 使用过去式：`UserCreated`、`RoleDeleted`、`TokenGenerated`
- 表示已发生的事情

#### 事件发布（Event Publishing）

将领域事件发送到事件总线的过程。

#### 事件订阅（Event Subscription）

订阅并处理特定类型的事件。

#### 事件处理器（Event Handler）

处理领域事件的类。

#### 事件总线（Event Bus）

分发事件给所有订阅者的机制。

#### 最终一致性（Eventual Consistency）

系统通过异步事件处理，最终达到一致的状态。

### 6.5 事件溯源术语

#### 事件溯源（Event Sourcing）

一种数据存储模式，不存储当前状态，而是存储所有发生的事件，通过重放事件来重建当前状态。

**特点**：

- 事件是不可变的，只能追加
- 通过重放事件重建状态
- 完整的历史记录

#### 事件存储（Event Store）

存储所有领域事件的存储系统。

**特点**：

- 存储所有事件
- 支持按聚合查询事件
- 支持版本控制（乐观锁）

#### 状态重建（State Reconstruction）

通过重放事件重建聚合根当前状态的过程。

**流程**：

1. 从事件存储获取所有事件
2. 按顺序重放事件
3. 应用每个事件到状态
4. 得到当前状态

#### 快照（Snapshot）

聚合根在某个时间点的状态快照，用于优化状态重建性能。

**作用**：

- 减少需要重放的事件数量
- 提升状态重建性能
- 从快照开始重建，而不是从初始状态

#### 事件版本（Event Version）

事件的版本号，用于乐观锁和并发控制。

**用途**：

- 检测并发冲突
- 确保事件顺序
- 支持乐观锁

#### 事件流（Event Stream）

一个聚合的所有事件，按时间顺序排列。

**特点**：

- 按版本号排序
- 不可变
- 可以按版本范围查询

### 6.4 通用术语

#### 用例（Use Case）

应用层的核心概念，代表一个完整的、独立的业务操作。

**特点**：

- **独立性**：每个 Use Case 是独立的业务操作
- **完整性**：Use Case 包含完成业务目标所需的所有步骤
- **编排性**：Use Case 协调领域对象完成业务目标，不包含业务逻辑
- **可测试性**：Use Case 可以独立测试

**实现方式**（在 CQRS 模式下）：

- **命令 Use Case**：通过 Command Handler 实现

  ```typescript
  @CommandHandler(UserCreateCommand)
  export class UserCreateHandler {
    async execute(command: UserCreateCommand) {
      // 这就是一个 Use Case：创建用户
    }
  }
  ```

- **查询 Use Case**：通过 Query Handler 实现

  ```typescript
  @QueryHandler(FindUserByIdQuery)
  export class FindUserByIdQueryHandler {
    async execute(query: FindUserByIdQuery) {
      // 这就是一个 Use Case：查询用户
    }
  }
  ```

- **复杂业务流程 Use Case**：通过 Application Service 实现
  ```typescript
  @Injectable()
  export class AuthenticationService {
    async execPasswordLogin(dto: PasswordIdentifierDTO) {
      // 这就是一个 Use Case：密码登录
    }
  }
  ```

**命名规范**：

- Use Case 通常以动词开头：`CreateUser`、`FindUserById`、`ExecPasswordLogin`
- 一个 Use Case = 一个 Handler 的 `execute()` 方法 或 一个 Service 的公共方法

#### 有界上下文（Bounded Context）

领域驱动设计中的概念，表示一个业务边界，在这个边界内，领域模型有明确的含义。

**示例**：

- IAM 有界上下文：身份和访问管理
- Order 有界上下文：订单管理
- Product 有界上下文：商品管理

#### 仓储（Repository）

封装数据访问逻辑的抽象，提供领域对象的持久化接口。

**类型**：

- 写入仓储（Write Repository）：用于命令操作
- 读取仓储（Read Repository）：用于查询操作

#### 应用服务（Application Service）

协调领域对象完成业务用例的服务，不包含业务逻辑。

**本质**：应用服务中的每个公共方法就是一个**复杂业务流程 Use Case**。当业务用例涉及多个聚合或复杂编排时，使用应用服务实现。

**与 Command/Query Handler 的关系**：

- **简单用例**：使用 Command Handler 或 Query Handler 实现
- **复杂用例**：使用 Application Service 实现（如 `execPasswordLogin` 涉及用户查找、密码验证、令牌生成等多个步骤）

#### 领域方法（Domain Method）

定义在聚合根或值对象上的方法，用于封装业务逻辑和业务规则。

**特点**：

- 封装业务逻辑和业务规则
- 维护数据一致性和业务不变量
- 表达业务意图，使用业务术语命名
- 可以发布领域事件

**类型**：

- **业务行为方法**：执行具体的业务操作

  ```typescript
  // 示例：用户登录
  async loginUser(password: string) {
    // 业务逻辑：验证密码、检查状态
  }
  ```

- **业务规则验证方法**：检查业务规则和约束

  ```typescript
  // 示例：检查是否可以登录
  async canLogin(): Promise<boolean> {
    return this.status === Status.ENABLED;
  }
  ```

- **事件发布方法**：发布领域事件
  ```typescript
  // 示例：发布用户创建事件
  async created() {
    this.apply(new UserCreatedEvent(...));
  }
  ```

**示例**：

```typescript
export class User extends AggregateRoot {
  // 领域方法：验证密码
  async verifyPassword(password: string): Promise<boolean> {
    return this.password.compare(password);
  }

  // 领域方法：用户登录
  async loginUser(password: string) {
    // 业务逻辑
  }

  // 领域方法：发布创建事件
  async created() {
    this.apply(new UserCreatedEvent(...));
  }
}
```

#### 实例方法（Instance Method）

定义在类上的非静态方法，需要通过类的实例调用。

**特点**：

- 需要通过实例调用：`user.loginUser(password)`
- 可以访问实例属性：`this.status`、`this.password`
- 可以修改实例状态（在领域方法中通常不修改，只读取）

**示例**：

```typescript
export class User extends AggregateRoot {
  // 实例方法：需要通过 user 实例调用
  async loginUser(password: string) {
    // 可以访问 this.status, this.password 等实例属性
    if (this.status !== Status.ENABLED) {
      // ...
    }
  }
}

// 使用
const user = new User(...);
await user.loginUser('password');  // 通过实例调用
```

#### 静态方法（Static Method）

定义在类上的静态方法，通过类名直接调用，不需要实例。

**特点**：

- 通过类名调用：`User.fromCreate(...)`、`Password.hash(...)`
- 不能访问实例属性（没有 `this`）
- 通常用于工厂方法、工具方法等

**示例**：

```typescript
export class User extends AggregateRoot {
  // 静态方法：通过类名调用
  static fromCreate(properties: UserCreateProperties): User {
    return Object.assign(new User(), properties);
  }
}

// 使用
const user = User.fromCreate(properties); // 通过类名调用
```

#### 工厂方法（Factory Method）

用于创建聚合根或值对象实例的静态方法。

**常见模式**：

- `fromCreate()`：从创建属性创建
- `fromUpdate()`：从更新属性创建
- `fromProp()`：从完整属性创建
- `fromHashed()`：从已哈希的值创建（值对象）

**示例**：

```typescript
export class User extends AggregateRoot {
  // 工厂方法：从创建属性创建
  static fromCreate(properties: UserCreateProperties): User {
    return Object.assign(new User(), properties);
  }

  // 工厂方法：从更新属性创建
  static fromUpdate(properties: UserUpdateProperties): User {
    return Object.assign(new User(), properties);
  }

  // 工厂方法：从完整属性创建
  static fromProp(properties: UserProperties): User {
    return Object.assign(new User(), properties);
  }
}

// 值对象的工厂方法
export class Password {
  // 工厂方法：从明文密码创建
  static async hash(password: string): Promise<Password> {
    // ...
  }

  // 工厂方法：从已哈希的密码创建
  static fromHashed(password: string): Password {
    return new Password(password);
  }
}
```

**使用场景**：

- 创建聚合根实例时使用工厂方法，而不是直接使用 `new`
- 封装创建逻辑，确保对象正确初始化
- 支持不同的创建场景（创建、更新、从属性创建）

#### 构造函数（Constructor）

类的构造函数，用于初始化类的实例。

**特点**：

- 在创建实例时自动调用
- 可以接收参数进行初始化
- 可以调用其他方法（如值对象的创建）

**示例**：

```typescript
export class User extends AggregateRoot {
  // 构造函数
  constructor(properties: UserProperties) {
    super(); // 调用父类构造函数
    Object.assign(this, properties);
    // 可以在这里进行初始化逻辑
    if ('password' in properties && properties.password) {
      this.password = Password.fromHashed(properties.password);
    }
  }
}

// 使用
const user = new User(properties); // 构造函数自动调用
```

**注意**：

- 在领域驱动设计中，通常使用工厂方法而不是直接使用构造函数
- 构造函数主要用于内部初始化，工厂方法用于外部创建

#### 访问修饰符（Access Modifier）

控制类成员（属性、方法）的访问权限的关键字。

**类型**：

- **public（公共）**：可以在任何地方访问（默认）

  ```typescript
  export class User {
    public id: string; // 公共属性，可以在任何地方访问
    public loginUser() {} // 公共方法
  }
  ```

- **private（私有）**：只能在类内部访问

  ```typescript
  export class Password {
    private readonly value: string; // 私有属性，只能在类内部访问

    private constructor(value: string) {
      // 私有构造函数
      this.value = value;
    }

    getValue(): string {
      // 公共方法可以访问私有属性
      return this.value;
    }
  }
  ```

- **protected（受保护）**：可以在类内部和子类中访问

  ```typescript
  export class BaseAggregate {
    protected id: string; // 受保护属性，子类可以访问
  }

  export class User extends BaseAggregate {
    // 可以访问父类的 protected 属性
  }
  ```

- **readonly（只读）**：属性只能读取，不能修改
  ```typescript
  export class User extends AggregateRoot {
    readonly id: string; // 只读属性，创建后不能修改
    readonly username: string; // 只读属性
  }
  ```

**在领域模型中的使用**：

- 聚合根属性通常使用 `readonly`，确保不可变性
- 值对象的内部状态使用 `private`，通过公共方法访问
- 领域方法通常是 `public`，供应用层调用

#### 只读属性（Readonly Property）

使用 `readonly` 关键字修饰的属性，创建后不能修改。

**特点**：

- 只能在声明时或构造函数中初始化
- 创建后不能重新赋值
- 确保对象的不变性

**示例**：

```typescript
export class User extends AggregateRoot {
  readonly id: string; // 只读属性
  readonly username: string; // 只读属性
  readonly domain: string; // 只读属性

  constructor(properties: UserProperties) {
    super();
    // 在构造函数中可以赋值
    this.id = properties.id;
    this.username = properties.username;
    this.domain = properties.domain;
  }

  // 错误：不能在方法中修改只读属性
  // changeUsername(newName: string) {
  //   this.username = newName;  // ❌ 编译错误
  // }
}
```

**使用场景**：

- 聚合根的标识符（id）应该是只读的
- 聚合根的核心属性应该是只读的，确保业务不变性
- 值对象的所有属性都应该是只读的

#### 私有方法/属性（Private Method/Property）

使用 `private` 关键字修饰的方法或属性，只能在类内部访问。

**特点**：

- 只能在类内部访问
- 外部无法直接访问
- 用于封装内部实现细节

**示例**：

```typescript
export class Password {
  private readonly value: string; // 私有属性

  private constructor(value: string) {
    // 私有构造函数
    this.value = value;
  }

  // 公共方法可以访问私有属性
  getValue(): string {
    return this.value; // 可以访问私有属性
  }

  // 私有方法（如果有）
  private validateFormat(password: string): boolean {
    // 内部验证逻辑
  }
}
```

**使用场景**：

- 值对象的内部状态应该是私有的
- 内部辅助方法可以是私有的
- 防止外部直接访问内部实现

#### 公共方法/属性（Public Method/Property）

使用 `public` 关键字修饰的方法或属性（或不使用修饰符，默认是 public），可以在任何地方访问。

**特点**：

- 可以在任何地方访问
- 是类的公共接口
- 领域方法通常是公共的

**示例**：

```typescript
export class User extends AggregateRoot {
  // 公共属性（readonly 确保不可变）
  readonly id: string;
  readonly username: string;

  // 公共方法：领域方法
  public async loginUser(password: string) {
    // 业务逻辑
  }

  // public 可以省略（默认就是 public）
  async verifyPassword(password: string) {
    // 业务逻辑
  }
}
```

#### 方法类型总结

| 类型         | 调用方式                  | 访问权限  | 典型用途           |
| ------------ | ------------------------- | --------- | ------------------ |
| **静态方法** | `ClassName.method()`      | 公共      | 工厂方法、工具方法 |
| **实例方法** | `instance.method()`       | 公共/私有 | 领域方法、业务逻辑 |
| **私有方法** | `this.method()`（仅内部） | 私有      | 内部辅助方法       |
| **公共方法** | `instance.method()`       | 公共      | 领域方法、公共接口 |

#### 属性类型总结

| 类型         | 修饰符          | 特点               | 典型用途                          |
| ------------ | --------------- | ------------------ | --------------------------------- |
| **只读属性** | `readonly`      | 创建后不可修改     | 聚合根的核心属性                  |
| **私有属性** | `private`       | 只能在类内部访问   | 值对象的内部状态                  |
| **公共属性** | `public` 或默认 | 可以在任何地方访问 | 聚合根的属性（通常配合 readonly） |

#### 接口（Interface）

定义对象或类的契约，指定必须实现的方法和属性。

**特点**：

- 只定义结构，不包含实现
- 类可以实现（implements）接口
- 用于定义契约和规范

**示例**：

```typescript
// 定义接口
export interface IUser {
  verifyPassword(password: string): Promise<boolean>;
  canLogin(): Promise<boolean>;
  loginUser(password: string): Promise<{ success: boolean; message: string }>;
  commit(): void;
}

// 类实现接口
export class User extends AggregateRoot implements IUser {
  async verifyPassword(password: string): Promise<boolean> {
    // 实现接口方法
  }

  async canLogin(): Promise<boolean> {
    // 实现接口方法
  }

  // ... 其他方法
}
```

**使用场景**：

- 定义聚合根的公共接口
- 确保类实现必要的方法
- 提供类型检查和契约约束

#### 继承（Inheritance）

类从另一个类继承属性和方法，使用 `extends` 关键字。

**特点**：

- 子类继承父类的所有公共和受保护成员
- 子类可以重写（override）父类方法
- 支持代码复用

**示例**：

```typescript
// 父类
export class AggregateRoot {
  commit(): void {
    // 提交领域事件
  }
}

// 子类继承父类
export class User extends AggregateRoot {
  // 继承 commit() 方法
  // 可以添加自己的方法和属性
}
```

**使用场景**：

- 聚合根继承 `AggregateRoot`，获得事件发布能力
- 共享通用功能和行为

#### 实现（Implementation）

类实现接口中定义的方法，使用 `implements` 关键字。

**特点**：

- 类必须实现接口中定义的所有方法
- 可以提供多个接口的实现
- 确保类符合接口契约

**示例**：

```typescript
// 接口
export interface IUser {
  loginUser(password: string): Promise<{ success: boolean; message: string }>;
}

// 类实现接口
export class User extends AggregateRoot implements IUser {
  async loginUser(password: string) {
    // 必须实现接口中定义的方法
    // ...
  }
}
```

**与继承的区别**：

- **继承（extends）**：从类继承，获得实现
- **实现（implements）**：实现接口，提供契约

#### 属性（Property）

类的成员变量，用于存储对象的状态。

**特点**：

- 可以是只读的（readonly）
- 可以是私有的（private）、受保护的（protected）或公共的（public）
- 可以有类型注解

**示例**：

```typescript
export class User extends AggregateRoot {
  // 属性定义
  readonly id: string; // 只读属性
  readonly username: string; // 只读属性
  readonly password: Password; // 只读属性，类型是值对象
  createdAt: Date; // 可变属性
}
```

#### 方法（Method）

类的成员函数，用于定义对象的行为。

**特点**：

- 可以是静态的（static）或实例的
- 可以是私有的、受保护的或公共的
- 可以返回类型或 void

**示例**：

```typescript
export class User extends AggregateRoot {
  // 实例方法
  async loginUser(password: string) {
    // 方法实现
  }

  // 静态方法
  static fromCreate(properties: UserCreateProperties): User {
    // 方法实现
  }
}
```

#### 依赖注入（Dependency Injection）

通过构造函数或属性注入依赖，而不是在类内部创建依赖。

#### 依赖倒置（Dependency Inversion）

高层模块不依赖低层模块，两者都依赖抽象。

## 7. 架构优势总结

### 7.1 Clean Architecture 优势

1. **独立于框架**：可以替换框架而不影响业务逻辑
2. **可测试性**：业务逻辑可以独立测试，不需要框架
3. **独立于 UI**：可以替换 UI 而不影响业务逻辑
4. **独立于数据库**：可以替换数据库而不影响业务逻辑
5. **独立于外部服务**：可以替换外部服务而不影响业务逻辑

### 7.2 CQRS 优势

1. **读写分离**：可以为读写操作分别优化
2. **独立扩展**：读写操作可以独立扩展
3. **简化领域模型**：查询不需要经过领域模型
4. **性能优化**：查询可以针对特定场景优化

### 7.3 事件驱动架构优势

1. **解耦**：组件之间通过事件通信，降低耦合
2. **可扩展性**：可以轻松添加新的事件处理器
3. **异步处理**：提升系统响应性
4. **最终一致性**：通过事件实现系统间的最终一致性

### 7.4 组合架构优势

1. **高内聚、低耦合**：清晰的边界和职责
2. **易于测试**：各层可以独立测试
3. **易于维护**：业务逻辑集中，技术细节隔离
4. **易于扩展**：可以轻松添加新功能
5. **性能优化**：读写分离，事件异步处理

## 8. 最佳实践

### 8.1 Clean Architecture 最佳实践

1. **保持领域层纯净**：领域层不依赖任何外部框架
2. **使用端口适配器模式**：通过接口定义依赖
3. **依赖注入**：使用依赖注入管理依赖关系
4. **单一职责**：每个类只有一个职责

### 8.2 CQRS 最佳实践

1. **命令不返回数据**：命令只返回成功/失败
2. **查询不修改状态**：查询是幂等的
3. **命令和查询分离**：不要在同一处理器中混合读写操作
4. **优化读取模型**：为查询优化读取模型

### 8.3 事件驱动架构最佳实践

1. **事件不可变**：事件是过去发生的事情，不可修改
2. **事件命名使用过去式**：表示已发生的事情
3. **事件处理器幂等**：事件处理器应该可以安全地重复执行
4. **异步处理**：事件处理应该是异步的，不阻塞主流程

### 8.4 组合架构最佳实践

1. **清晰的边界**：保持各层之间的清晰边界
2. **依赖方向正确**：确保依赖方向从外向内
3. **适当的抽象**：在合适的层定义抽象
4. **测试覆盖**：确保各层都有适当的测试覆盖

## 9. 总结

本项目的架构采用了 Clean Architecture + CQRS + 事件驱动架构的组合模式，这种架构模式带来了以下好处：

1. **清晰的职责分离**：各层职责明确，易于理解和维护
2. **高度的可测试性**：业务逻辑可以独立测试
3. **良好的可扩展性**：可以轻松添加新功能而不影响现有代码
4. **优秀的性能**：读写分离和异步事件处理提升了系统性能
5. **强大的灵活性**：可以替换技术实现而不影响业务逻辑

通过遵循这些架构原则和最佳实践，我们可以构建出高质量、可维护、可扩展的软件系统。

---

**文档版本**：v1.0.0  
**最后更新**：2024-01-XX  
**维护者**：架构团队
