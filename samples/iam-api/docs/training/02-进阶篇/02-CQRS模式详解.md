# CQRS 模式详解

## 学习目标

- 深入理解 CQRS 模式的原理和优势
- 理解命令和查询的分离
- 掌握 Use Case 在 CQRS 模式下的实现
- 理解读写分离的设计

## 1. CQRS 原理

### 1.1 核心思想

**CQRS（Command Query Responsibility Segregation，命令查询职责分离）** 的核心思想是：

**将写操作（命令）和读操作（查询）完全分离。**

### 1.2 分离的原因

**传统方式的问题**：

- 读写操作使用相同的数据模型
- 难以针对读写操作分别优化
- 读操作可能影响写操作的性能

**CQRS 的优势**：

- 读写操作可以独立优化
- 可以为读写操作使用不同的数据模型
- 提升系统性能和可扩展性

## 2. 命令（Command）

### 2.1 命令定义

**定义**：表示用户意图的对象，用于修改系统状态。

**特点**：

- 不可变（immutable）
- 包含执行操作所需的所有信息
- 返回 void 或简单结果
- 命名使用动词

**示例**：

```typescript
export class UserCreateCommand implements ICommand {
  constructor(
    readonly username: string,
    readonly password: string,
    readonly domain: string,
    readonly nickName: string,
    readonly uid: string,
  ) {}
}
```

### 2.2 命令处理器（Command Handler）

**定义**：处理命令的类，负责执行写操作。

**本质**：命令处理器就是**写操作 Use Case**的实现。

**示例**：

```typescript
@CommandHandler(UserCreateCommand)
export class UserCreateHandler implements ICommandHandler<UserCreateCommand, void> {
  @Inject(UserWriteRepoPortToken)
  private readonly userWriteRepository: UserWriteRepoPort;

  @Inject(UserReadRepoPortToken)
  private readonly userReadRepoPort: UserReadRepoPort;

  async execute(command: UserCreateCommand): Promise<void> {
    // Use Case: 创建用户
    // 步骤 1: 验证用户名唯一性
    const existingUser = await this.userReadRepoPort.getUserByUsername(command.username);
    if (existingUser) {
      throw new BadRequestException(`User already exists`);
    }

    // 步骤 2: 创建聚合根
    const user = new User({...});

    // 步骤 3: 保存到数据库
    await this.userWriteRepository.save(user);

    // 步骤 4: 发布领域事件
    await user.created();
    user.commit();
  }
}
```

### 2.3 命令的特点

- **修改状态**：命令会修改系统状态
- **返回 void**：命令通常返回 void 或简单结果
- **可以发布事件**：命令可以发布领域事件
- **使用写入仓储**：命令使用 Write Repository

## 3. 查询（Query）

### 3.1 查询定义

**定义**：用于获取数据的对象，不改变系统状态。

**特点**：

- 不可变（immutable）
- 不修改系统状态
- 返回数据
- 命名使用名词或查询动词

**示例**：

```typescript
export class FindUserByIdQuery implements IQuery {
  constructor(readonly id: string) {}
}

export class PageUsersQuery implements IQuery {
  constructor(
    readonly current: number,
    readonly size: number,
    readonly username?: string,
    readonly status?: Status,
  ) {}
}
```

### 3.2 查询处理器（Query Handler）

**定义**：处理查询的类，负责执行读操作。

**本质**：查询处理器就是**读操作 Use Case**的实现。

**示例**：

```typescript
@QueryHandler(FindUserByIdQuery)
export class FindUserByIdQueryHandler
  implements IQueryHandler<FindUserByIdQuery, UserProperties | null>
{
  @Inject(UserReadRepoPortToken)
  private readonly repository: UserReadRepoPort;

  async execute(query: FindUserByIdQuery): Promise<UserProperties | null> {
    // Use Case: 根据 ID 查询用户
    return this.repository.findUserById(query.id);
  }
}
```

### 3.3 查询的特点

- **不修改状态**：查询不修改系统状态
- **返回数据**：查询返回数据
- **不发布事件**：查询不发布领域事件
- **使用读取仓储**：查询使用 Read Repository

## 4. Use Case 在 CQRS 模式下的实现

### 4.1 Use Case 的本质

**Use Case** 是应用层的核心，代表一个完整的、独立的业务操作。

**在 CQRS 模式下的实现**：

- **命令 Use Case**：通过 Command Handler 实现
- **查询 Use Case**：通过 Query Handler 实现
- **复杂业务流程 Use Case**：通过 Application Service 实现

### 4.2 命令 Use Case

```typescript
// 命令 Use Case：创建用户
@CommandHandler(UserCreateCommand)
export class UserCreateHandler {
  async execute(command: UserCreateCommand) {
    // Use Case 步骤：
    // 1. 验证业务规则
    // 2. 创建聚合根
    // 3. 保存到数据库
    // 4. 发布领域事件
  }
}
```

### 4.3 查询 Use Case

```typescript
// 查询 Use Case：查询用户
@QueryHandler(FindUserByIdQuery)
export class FindUserByIdQueryHandler {
  async execute(query: FindUserByIdQuery) {
    // Use Case：查询用户信息
    return this.repository.findUserById(query.id);
  }
}
```

## 5. 读写分离

### 5.1 写入仓储（Write Repository）

**用途**：用于命令操作，操作聚合根。

**特点**：

- 操作领域模型（聚合根）
- 处理业务逻辑
- 可以发布领域事件

**示例**：

```typescript
export interface UserWriteRepoPort {
  save(user: User): Promise<void>;
  update(user: User): Promise<void>;
  deleteById(id: string): Promise<void>;
}
```

### 5.2 读取仓储（Read Repository）

**用途**：用于查询操作，返回读模型。

**特点**：

- 返回读模型（Properties）
- 不包含业务逻辑
- 优化查询性能

**示例**：

```typescript
export interface UserReadRepoPort {
  findUserById(id: string): Promise<UserProperties | null>;
  pageUsers(query: PageUsersQuery): Promise<PaginationResult<UserProperties>>;
  getUserByUsername(username: string): Promise<Readonly<UserProperties> | null>;
}
```

### 5.3 读写分离的优势

- ✅ **独立优化**：可以为读写操作分别优化
- ✅ **不同数据模型**：可以为读写操作使用不同的数据模型
- ✅ **性能提升**：读操作不影响写操作性能
- ✅ **可扩展性**：可以独立扩展读写操作

## 6. 数据流

### 6.1 写操作流程（Command Flow）

```
HTTP Request
    ↓
Controller
    ↓
Command
    ↓
CommandBus
    ↓
CommandHandler (Use Case: 写操作用例)
    ↓
Domain Aggregate (业务逻辑)
    ↓
Write Repository
    ↓
Database
    ↓
Domain Event
    ↓
Event Bus
    ↓
Event Handlers (Use Case: 事件处理用例)
```

### 6.2 读操作流程（Query Flow）

```
HTTP Request
    ↓
Controller
    ↓
Query
    ↓
QueryBus
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

## 7. 命名规范

### 7.1 命令命名

**规范**：使用动词，表示操作意图。

**示例**：

- `UserCreateCommand` - 创建用户
- `UserUpdateCommand` - 更新用户
- `UserDeleteCommand` - 删除用户

### 7.2 查询命名

**规范**：使用查询动词或名词。

**示例**：

- `FindUserByIdQuery` - 根据 ID 查询用户
- `PageUsersQuery` - 分页查询用户
- `GetUserRolesQuery` - 获取用户角色

### 7.3 处理器命名

**规范**：命令/查询名称 + Handler。

**示例**：

- `UserCreateHandler` - 处理 UserCreateCommand
- `FindUserByIdQueryHandler` - 处理 FindUserByIdQuery

## 8. CQRS 的优势

### 8.1 性能优势

- ✅ **读写分离**：可以为读写操作分别优化
- ✅ **独立扩展**：可以独立扩展读写操作
- ✅ **性能提升**：读操作不影响写操作性能

### 8.2 架构优势

- ✅ **职责清晰**：命令和查询职责明确
- ✅ **易于理解**：代码结构清晰
- ✅ **易于维护**：修改不影响其他操作

### 8.3 业务优势

- ✅ **业务逻辑集中**：业务逻辑在命令处理器中
- ✅ **查询优化**：可以为查询优化数据模型
- ✅ **易于扩展**：可以轻松添加新的命令或查询

## 9. 学习检查

完成本章学习后，请回答以下问题：

1. CQRS 的核心思想是什么？
2. 命令和查询的区别是什么？
3. Use Case 在 CQRS 模式下如何实现？
4. 读写分离的优势是什么？
5. 命令和查询的命名规范是什么？

## 10. 下一步

- 学习 [事件驱动架构详解](./03-事件驱动架构详解.md)
- 查看 [架构原理文档 - CQRS](../../ARCHITECTURE.md#3-cqrs命令查询职责分离)

---

**上一章**：[Clean Architecture 详解](./01-Clean-Architecture详解.md)  
**下一章**：[事件驱动架构详解](./03-事件驱动架构详解.md)  
**返回**：[培训大纲](../README.md)
