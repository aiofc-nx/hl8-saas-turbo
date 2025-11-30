# Use Case 开发

## 学习目标

- 理解 Use Case 在应用层的作用
- 掌握如何识别和设计 Use Case
- 掌握 Command Handler 的编写
- 掌握 Query Handler 的编写
- 掌握 Application Service 的编写

## 1. Use Case 概述

### 1.1 什么是 Use Case？

**定义**：Use Case 是应用层的核心，代表一个完整的、独立的业务操作。

**特点**：

- **独立性**：每个 Use Case 是独立的业务操作，可以单独测试
- **完整性**：Use Case 包含完成业务目标所需的所有步骤
- **编排性**：Use Case 协调领域对象完成业务目标，不包含业务逻辑
- **可测试性**：Use Case 可以独立测试，不依赖外部框架

### 1.2 Use Case 的实现方式

在 CQRS 模式下，Use Case 通过以下方式实现：

- **Command Handler** = **写操作 Use Case**
- **Query Handler** = **读操作 Use Case**
- **Application Service** = **复杂业务流程 Use Case**
- **Event Handler** = **事件处理 Use Case**

## 2. Use Case 识别

### 2.1 如何识别 Use Case？

**规则**：

- 一个业务操作 = 一个 Use Case
- 一个 Command Handler 的 `execute()` 方法 = 一个写操作 Use Case
- 一个 Query Handler 的 `execute()` 方法 = 一个读操作 Use Case
- 一个 Application Service 的公共方法 = 一个复杂业务流程 Use Case

### 2.2 Use Case 命名

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
```

## 3. 命令 Use Case 开发

### 3.1 Command Handler 结构

```typescript
@CommandHandler(UserCreateCommand)
export class UserCreateHandler
  implements ICommandHandler<UserCreateCommand, void>
{
  // 1. 依赖注入
  constructor(private readonly publisher: EventPublisher) {}

  @Inject(UserWriteRepoPortToken)
  private readonly userWriteRepository: UserWriteRepoPort;

  @Inject(UserReadRepoPortToken)
  private readonly userReadRepoPort: UserReadRepoPort;

  // 2. Use Case 实现
  async execute(command: UserCreateCommand): Promise<void> {
    // Use Case 步骤
  }
}
```

### 3.2 Use Case 步骤

**典型的写操作 Use Case 步骤**：

1. **验证业务规则**（通过读取仓储）
2. **创建或修改聚合根**
3. **保存到数据库**（通过写入仓储）
4. **发布领域事件**

**示例**：

```typescript
@CommandHandler(UserCreateCommand)
export class UserCreateHandler
  implements ICommandHandler<UserCreateCommand, void>
{
  async execute(command: UserCreateCommand): Promise<void> {
    // 步骤 1: 验证业务规则
    const existingUser = await this.userReadRepoPort.getUserByUsername(
      command.username,
    );
    if (existingUser) {
      throw new BadRequestException(`User already exists`);
    }

    // 步骤 2: 创建聚合根
    const hashedPassword = await Password.hash(command.password);
    const userCreateProperties: UserCreateProperties = {
      id: UlidGenerator.generate(),
      username: command.username,
      password: hashedPassword.getValue(),
      // ...
    };
    const user = new User(userCreateProperties);

    // 步骤 3: 保存到数据库
    await this.userWriteRepository.save(user);

    // 步骤 4: 发布领域事件
    await user.created();
    this.publisher.mergeObjectContext(user);
    user.commit();
  }
}
```

### 3.3 命令 Use Case 的特点

- **修改状态**：命令会修改系统状态
- **返回 void**：命令通常返回 void 或简单结果
- **可以发布事件**：命令可以发布领域事件
- **使用写入仓储**：命令使用 Write Repository

## 4. 查询 Use Case 开发

### 4.1 Query Handler 结构

```typescript
@QueryHandler(FindUserByIdQuery)
export class FindUserByIdQueryHandler
  implements IQueryHandler<FindUserByIdQuery, UserProperties | null>
{
  // 依赖注入
  @Inject(UserReadRepoPortToken)
  private readonly repository: UserReadRepoPort;

  // Use Case 实现
  async execute(query: FindUserByIdQuery): Promise<UserProperties | null> {
    // Use Case: 查询用户
    return this.repository.findUserById(query.id);
  }
}
```

### 4.2 查询 Use Case 的特点

- **不修改状态**：查询不修改系统状态
- **返回数据**：查询返回数据
- **不发布事件**：查询不发布领域事件
- **使用读取仓储**：查询使用 Read Repository

### 4.3 复杂查询 Use Case

**示例**：分页查询

```typescript
@QueryHandler(PageUsersQuery)
export class PageUsersQueryHandler
  implements IQueryHandler<PageUsersQuery, PaginationResult<UserProperties>>
{
  @Inject(UserReadRepoPortToken)
  private readonly repository: UserReadRepoPort;

  async execute(
    query: PageUsersQuery,
  ): Promise<PaginationResult<UserProperties>> {
    // Use Case: 分页查询用户
    return this.repository.pageUsers(query);
  }
}
```

## 5. 复杂业务流程 Use Case 开发

### 5.1 Application Service 结构

**使用场景**：当业务用例涉及多个聚合或复杂编排时，使用 Application Service。

**示例**：密码登录

```typescript
@Injectable()
export class AuthenticationService {
  constructor(
    private jwtService: JwtService,
    private readonly publisher: EventPublisher,
    @Inject(UserReadRepoPortToken)
    private readonly repository: UserReadRepoPort,
    private queryBus: QueryBus,
  ) {}

  /**
   * Use Case: 密码登录
   *
   * 用例步骤：
   * 1. 查找用户
   * 2. 验证密码（通过领域模型）
   * 3. 生成 JWT 令牌
   * 4. 发布登录事件
   * 5. 缓存用户角色
   */
  async execPasswordLogin(dto: PasswordIdentifierDTO) {
    // 步骤 1: 查找用户
    const user = await this.repository.findUserByIdentifier(dto.identifier);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // 步骤 2: 验证密码（通过领域模型）
    const userAggregate = User.fromProp(user);
    const loginResult = await userAggregate.loginUser(dto.password);
    if (!loginResult.success) {
      throw new UnauthorizedException(loginResult.message);
    }

    // 步骤 3: 生成 JWT 令牌
    const tokens = await this.generateTokens(user);

    // 步骤 4: 发布登录事件
    userAggregate.apply(new TokenGeneratedEvent(...));
    this.publisher.mergeObjectContext(userAggregate);
    userAggregate.commit();

    // 步骤 5: 缓存用户角色
    await this.cacheUserRoles(user.id);

    return tokens;
  }
}
```

### 5.2 Application Service 的特点

- **复杂编排**：协调多个领域对象
- **跨聚合**：可能涉及多个聚合
- **技术集成**：可能涉及外部服务（如 JWT、Redis）

## 6. 事件处理 Use Case 开发

### 6.1 Event Handler 结构

```typescript
@EventsHandler(UserCreatedEvent)
export class UserCreatedHandler implements IEventHandler<UserCreatedEvent> {
  constructor(
    private readonly roleService: RoleService,
    private readonly notificationService: NotificationService,
  ) {}

  /**
   * Use Case: 处理用户创建后的后续操作
   *
   * 用例步骤：
   * 1. 初始化用户默认权限
   * 2. 发送欢迎通知
   */
  async handle(event: UserCreatedEvent) {
    // 步骤 1: 初始化用户默认权限
    await this.roleService.assignDefaultRole(event.userId, event.domain);

    // 步骤 2: 发送欢迎通知
    await this.notificationService.sendWelcomeEmail(event.userId);
  }
}
```

### 6.2 事件处理 Use Case 的特点

- **异步处理**：事件处理是异步的
- **副作用**：执行副作用（如发送邮件、记录日志）
- **幂等性**：事件处理器应该是幂等的

## 7. Use Case 开发检查清单

### 7.1 Command Handler 检查清单

- [ ] 使用 `@CommandHandler` 装饰器
- [ ] 实现 `ICommandHandler` 接口
- [ ] 注入必要的依赖（Repository、Publisher 等）
- [ ] 实现 `execute()` 方法
- [ ] 验证业务规则
- [ ] 创建或修改聚合根
- [ ] 保存到数据库
- [ ] 发布领域事件（如果需要）

### 7.2 Query Handler 检查清单

- [ ] 使用 `@QueryHandler` 装饰器
- [ ] 实现 `IQueryHandler` 接口
- [ ] 注入读取仓储
- [ ] 实现 `execute()` 方法
- [ ] 不修改系统状态
- [ ] 返回数据

### 7.3 Application Service 检查清单

- [ ] 使用 `@Injectable()` 装饰器
- [ ] 注入必要的依赖
- [ ] 每个公共方法是一个 Use Case
- [ ] 协调多个领域对象
- [ ] 不包含业务逻辑（业务逻辑在领域层）

## 8. 常见错误

### 8.1 ❌ 错误：在 Use Case 中包含业务逻辑

```typescript
// ❌ 错误
@CommandHandler(UserCreateCommand)
export class UserCreateHandler {
  async execute(command: UserCreateCommand) {
    // 业务逻辑不应该在 Use Case 中
    if (command.password.length < 8) {
      throw new Error('Password too short');
    }
    // ...
  }
}
```

### 8.2 ✅ 正确：业务逻辑在领域层

```typescript
// ✅ 正确：业务逻辑在领域层
export class User extends AggregateRoot {
  async loginUser(password: string) {
    // 业务逻辑在这里
    if (this.status !== Status.ENABLED) {
      return { success: false, message: 'User is disabled' };
    }
    // ...
  }
}

// ✅ 正确：Use Case 只负责编排
@CommandHandler(UserCreateCommand)
export class UserCreateHandler {
  async execute(command: UserCreateCommand) {
    const user = new User(...);
    const result = await user.loginUser(command.password);  // 调用领域方法
    // ...
  }
}
```

## 9. 学习检查

完成本章学习后，请回答以下问题：

1. Use Case 的特点是什么？
2. 如何识别 Use Case？
3. Command Handler 的典型步骤是什么？
4. Query Handler 和 Command Handler 的区别是什么？
5. 什么时候使用 Application Service？

## 10. 下一步

- 学习 [端口适配器实现](./04-端口适配器实现.md)
- 查看 [Use Case 实现说明](../../USE-CASE-IMPLEMENTATION.md)

---

**上一章**：[聚合根开发](./02-聚合根开发.md)  
**下一章**：[端口适配器实现](./04-端口适配器实现.md)  
**返回**：[培训大纲](../README.md)
