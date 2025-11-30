# Use Case 实现说明文档

## 1. 问题说明

在传统的 Clean Architecture 中，应用层的核心是 **Use Case（用例）**。但在 CQRS 模式下，Use Case 的实现方式有所不同，本文档说明本项目中的 Use Case 实现方式。

## 2. Use Case 的本质

### 2.1 什么是 Use Case？

**Use Case（用例）** 是应用层的核心概念，代表一个完整的、独立的业务操作。

**特点**：

- **独立性**：每个 Use Case 是独立的业务操作，可以单独测试
- **完整性**：Use Case 包含完成业务目标所需的所有步骤
- **编排性**：Use Case 协调领域对象完成业务目标，不包含业务逻辑
- **可测试性**：Use Case 可以独立测试，不依赖外部框架

### 2.2 Use Case 的经典实现

在传统的 Clean Architecture 中，Use Case 通常这样实现：

```typescript
// 传统方式：专门的 Use Case 类
export class CreateUserUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(input: CreateUserInput): Promise<void> {
    // Use Case 实现
    // 1. 验证业务规则
    // 2. 创建聚合根
    // 3. 保存到数据库
    // 4. 发布事件
  }
}
```

## 3. CQRS 模式下的 Use Case 实现

### 3.1 实现方式

在 CQRS 模式下，Use Case 通过以下方式实现：

1. **命令处理器（Command Handler）** = **写操作 Use Case**
2. **查询处理器（Query Handler）** = **读操作 Use Case**
3. **应用服务（Application Service）** = **复杂业务流程 Use Case**

### 3.2 为什么这样实现？

**CQRS 模式的特点**：

- 命令和查询分离
- 使用命令总线（Command Bus）和查询总线（Query Bus）
- 通过装饰器（@CommandHandler、@QueryHandler）注册处理器

**优势**：

- ✅ 自动路由：命令/查询自动路由到对应的处理器
- ✅ 解耦：Controller 不需要知道具体的 Use Case 实现
- ✅ 统一接口：所有 Use Case 实现相同的接口（ICommandHandler、IQueryHandler）
- ✅ 易于扩展：可以轻松添加新的 Use Case

## 4. Use Case 实现对比

### 4.1 传统方式 vs CQRS 方式

#### 传统方式

```typescript
// 专门的 Use Case 类
export class CreateUserUseCase {
  async execute(input: CreateUserInput): Promise<void> {
    // Use Case 实现
  }
}

// Controller 中直接调用
@Controller('users')
export class UserController {
  constructor(private readonly createUserUseCase: CreateUserUseCase) {}

  @Post()
  async createUser(@Body() dto: CreateUserDTO) {
    await this.createUserUseCase.execute(dto);
  }
}
```

#### CQRS 方式（本项目）

```typescript
// Command Handler 就是 Use Case
@CommandHandler(UserCreateCommand)
export class UserCreateHandler implements ICommandHandler {
  async execute(command: UserCreateCommand): Promise<void> {
    // Use Case 实现
  }
}

// Controller 通过命令总线调用
@Controller('users')
export class UserController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post()
  async createUser(@Body() dto: CreateUserDTO) {
    const command = new UserCreateCommand(...);
    await this.commandBus.execute(command);  // 自动路由到 UserCreateHandler
  }
}
```

### 4.2 对应关系

| 传统 Clean Architecture | CQRS 模式（本项目）                         | 说明                  |
| ----------------------- | ------------------------------------------- | --------------------- |
| `CreateUserUseCase`     | `UserCreateHandler`                         | 写操作 Use Case       |
| `FindUserByIdUseCase`   | `FindUserByIdQueryHandler`                  | 读操作 Use Case       |
| `LoginUserUseCase`      | `AuthenticationService.execPasswordLogin()` | 复杂业务流程 Use Case |

## 5. 实际代码中的 Use Case

### 5.1 写操作 Use Case

```typescript
/**
 * Use Case: 创建用户
 *
 * 用例标识：UserCreateHandler.execute()
 * 用例描述：创建一个新用户，包括验证、创建、保存、发布事件
 */
@CommandHandler(UserCreateCommand)
export class UserCreateHandler implements ICommandHandler {
  async execute(command: UserCreateCommand): Promise<void> {
    // Use Case 步骤：
    // 1. 验证用户名唯一性
    // 2. 创建用户聚合根
    // 3. 保存到数据库
    // 4. 发布用户创建事件
  }
}
```

**Use Case 标识**：`UserCreateHandler.execute()`

### 5.2 读操作 Use Case

```typescript
/**
 * Use Case: 根据 ID 查询用户
 *
 * 用例标识：FindUserByIdQueryHandler.execute()
 * 用例描述：根据用户 ID 查询用户信息
 */
@QueryHandler(FindUserByIdQuery)
export class FindUserByIdQueryHandler implements IQueryHandler {
  async execute(query: FindUserByIdQuery): Promise<UserProperties | null> {
    // Use Case 实现：查询用户信息
    return this.repository.getUserById(query.id);
  }
}
```

**Use Case 标识**：`FindUserByIdQueryHandler.execute()`

### 5.3 复杂业务流程 Use Case

```typescript
/**
 * Use Case: 密码登录
 *
 * 用例标识：AuthenticationService.execPasswordLogin()
 * 用例描述：用户通过密码登录，包括查找用户、验证密码、生成令牌、发布事件
 */
@Injectable()
export class AuthenticationService {
  async execPasswordLogin(dto: PasswordIdentifierDTO) {
    // Use Case 步骤：
    // 1. 查找用户
    // 2. 验证密码（通过领域模型）
    // 3. 生成 JWT 令牌
    // 4. 发布登录事件
    // 5. 缓存用户角色
  }
}
```

**Use Case 标识**：`AuthenticationService.execPasswordLogin()`

## 6. Use Case 识别方法

### 6.1 如何识别一个 Use Case？

**规则**：

- 一个 **Command Handler** 的 `execute()` 方法 = 一个写操作 Use Case
- 一个 **Query Handler** 的 `execute()` 方法 = 一个读操作 Use Case
- 一个 **Application Service** 的公共方法 = 一个复杂业务流程 Use Case
- 一个 **Event Handler** 的 `handle()` 方法 = 一个事件处理 Use Case

### 6.2 Use Case 命名

**命名规范**：

- Use Case 名称通常与 Handler 或 Service 方法名称对应
- 使用动词开头：`CreateUser`、`FindUserById`、`ExecPasswordLogin`

**示例**：

```typescript
// Use Case: CreateUser
UserCreateHandler.execute();

// Use Case: FindUserById
FindUserByIdQueryHandler.execute();

// Use Case: ExecPasswordLogin
AuthenticationService.execPasswordLogin();

// Use Case: HandleUserCreated
UserCreatedHandler.handle();
```

## 7. Use Case 的特点

### 7.1 独立性

每个 Use Case 是独立的，可以单独测试：

```typescript
describe('CreateUser Use Case', () => {
  it('应该创建新用户', async () => {
    const handler = new UserCreateHandler(/* dependencies */);
    const command = new UserCreateCommand(...);
    await handler.execute(command);
    // 验证结果
  });
});
```

### 7.2 完整性

Use Case 包含完成业务目标所需的所有步骤：

```typescript
async execute(command: UserCreateCommand) {
  // 步骤 1: 验证
  // 步骤 2: 创建
  // 步骤 3: 保存
  // 步骤 4: 发布事件
  // 完整的业务流程
}
```

### 7.3 编排性

Use Case 协调领域对象，不包含业务逻辑：

```typescript
async execute(command: UserCreateCommand) {
  // 编排领域对象
  const user = User.fromCreate(...);  // 使用领域对象
  await this.repository.save(user);   // 使用仓储
  await user.created();                // 使用领域方法
  user.commit();                       // 提交事件
}
```

## 8. 为什么文档之前没有明确说明？

### 8.1 原因分析

1. **CQRS 模式的特殊性**：在 CQRS 模式下，Use Case 的实现方式与传统 Clean Architecture 有所不同
2. **术语差异**：项目中使用的是 "Command Handler"、"Query Handler" 等术语，而不是 "Use Case"
3. **实现即 Use Case**：虽然代码中使用了不同的术语，但实际上每个 Handler 就是 Use Case 的实现

### 8.2 现在已明确

文档已更新，明确说明：

- ✅ **Use Case 是应用层的核心**
- ✅ **Command Handler = 写操作 Use Case**
- ✅ **Query Handler = 读操作 Use Case**
- ✅ **Application Service 方法 = 复杂业务流程 Use Case**

## 9. 总结

### 9.1 核心要点

1. **Use Case 是应用层的核心**：这是 Clean Architecture 的基本原则
2. **CQRS 模式下的实现**：Use Case 通过 Command Handler、Query Handler、Application Service 实现
3. **本质相同**：虽然实现方式不同，但本质都是 Use Case

### 9.2 对应关系

```
传统 Clean Architecture          CQRS 模式（本项目）
─────────────────────────      ──────────────────────
CreateUserUseCase        ←→    UserCreateHandler.execute()
FindUserByIdUseCase      ←→    FindUserByIdQueryHandler.execute()
LoginUserUseCase         ←→    AuthenticationService.execPasswordLogin()
```

### 9.3 开发建议

1. ✅ **理解 Use Case 概念**：每个 Handler 或 Service 方法就是一个 Use Case
2. ✅ **保持 Use Case 独立性**：每个 Use Case 应该是独立的、可测试的
3. ✅ **Use Case 命名清晰**：Handler 和 Service 方法的命名应该清晰表达 Use Case 的意图
4. ✅ **文档化 Use Case**：在代码注释中说明 Use Case 的步骤和目的

---

**文档版本**：v1.0.0  
**最后更新**：2024-01-XX  
**维护者**：架构团队
