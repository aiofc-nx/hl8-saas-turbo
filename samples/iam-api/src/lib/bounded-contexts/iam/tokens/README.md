# Tokens（令牌模块）开发档案

## 1. 模块概述

### 1.1 业务定位

Tokens（令牌模块）是 IAM 有界上下文的核心子模块，负责访问令牌（Access Token）和刷新令牌（Refresh Token）的生命周期管理。令牌是用户认证和授权的凭证，通过 JWT（JSON Web Token）实现无状态的身份验证。该模块确保令牌的唯一性、安全性和可追溯性，支持令牌生成记录、刷新令牌使用检查等核心功能。

### 1.2 核心职责

- **令牌生命周期管理**：记录令牌的生成、使用状态，支持令牌的持久化和审计
- **刷新令牌安全控制**：防止刷新令牌被重复使用，确保令牌只能使用一次
- **令牌查询服务**：根据刷新令牌查询令牌信息，支持令牌刷新流程
- **令牌审计追踪**：记录令牌生成时的用户信息、IP 地址、地理位置等元数据，支持安全审计

### 1.3 技术架构

本模块采用 **Clean Architecture + CQRS + 事件驱动架构（EDA）** 模式：

- **Clean Architecture**：领域层、应用层、基础设施层清晰分离
- **CQRS**：查询用于读操作（查询令牌信息），写操作通过事件驱动实现
- **事件驱动**：通过领域事件实现模块间解耦和异步处理（令牌生成时持久化、刷新令牌使用时更新状态）
- **端口适配器模式**：通过端口接口定义仓储契约，由基础设施层实现

### 1.4 令牌类型

- **访问令牌（Access Token）**：用于 API 请求的身份验证，有效期较短（通常几分钟到几小时）
- **刷新令牌（Refresh Token）**：用于获取新的访问令牌，有效期较长（通常几天到几周），且只能使用一次

## 2. 目录结构

```
tokens/
├── application/                    # 应用层
│   ├── query-handlers/            # 查询处理器
│   │   ├── tokens.by-refresh_token.query.handler.ts
│   │   └── index.ts
│   └── event-handlers/            # 事件处理器
│       ├── token-generated.event.handler.ts
│       ├── refresh-token-used-event.handler.ts
│       └── index.ts
├── domain/                        # 领域层
│   ├── tokens.entity.ts           # 令牌聚合根
│   ├── tokens.read.model.ts       # 令牌读取模型
│   └── events/                    # 领域事件
│       ├── token-generated.event.ts
│       └── refreshtoken-used.event.ts
├── queries/                       # 查询对象
│   └── tokens.by-refresh_token.query.ts
├── ports/                         # 端口接口
│   ├── tokens.read.repo-port.ts   # 令牌读取仓储端口
│   └── tokens.write.repo-port.ts  # 令牌写入仓储端口
├── constants.ts                    # 常量定义
└── tokens.module.ts                # 模块定义
```

## 3. 领域模型

### 3.1 TokensEntity（令牌聚合根）

令牌聚合根是令牌模块的核心实体，负责管理令牌的生命周期和业务规则。

#### 3.1.1 属性定义

| 属性名         | 类型             | 说明                                  | 约束                                                          |
| -------------- | ---------------- | ------------------------------------- | ------------------------------------------------------------- |
| `accessToken`  | `string`         | JWT 访问令牌，用于 API 请求的身份验证 | 必填，只读                                                    |
| `refreshToken` | `string`         | JWT 刷新令牌，用于获取新的访问令牌    | 必填，只读                                                    |
| `status`       | `string`         | 令牌的使用状态                        | 必填，可选值：`UNUSED`（未使用）、`USED`（已使用）            |
| `userId`       | `string`         | 令牌所属用户的唯一标识符              | 必填，只读                                                    |
| `username`     | `string`         | 令牌所属用户的用户名                  | 必填，只读                                                    |
| `domain`       | `string`         | 用户所属的域代码，用于多租户隔离      | 必填，只读                                                    |
| `ip`           | `string`         | 生成令牌时的客户端 IP 地址            | 必填，只读                                                    |
| `address`      | `string`         | 生成令牌时的地理位置信息              | 必填，只读                                                    |
| `userAgent`    | `string`         | 生成令牌时的用户代理信息              | 必填，只读                                                    |
| `requestId`    | `string`         | 生成令牌时的请求唯一标识符            | 必填，只读                                                    |
| `type`         | `string`         | 令牌生成类型                          | 必填，只读，例如：`password`（密码登录）、`token`（令牌刷新） |
| `createdBy`    | `string`         | 创建令牌的用户 ID                     | 必填，只读                                                    |
| `port`         | `number \| null` | 生成令牌时的端口号                    | 可选，只读                                                    |

#### 3.1.2 领域方法

##### `async refreshTokenCheck(): Promise<void>`

检查刷新令牌是否可用。

**说明**：

- 验证刷新令牌是否已被使用
- 如果令牌状态为未使用（`UNUSED`），则发布 `RefreshTokenUsedEvent` 事件，将状态标记为已使用（`USED`）
- 如果令牌已被使用，则抛出异常

**业务流程**：

1. 检查令牌状态是否为 `UNUSED`
2. 如果已被使用，抛出异常：`Token has already been used.`
3. 如果未使用，发布 `RefreshTokenUsedEvent` 事件

**使用场景**：在令牌刷新流程中使用，确保刷新令牌只能使用一次

**异常处理**：

- 当刷新令牌已被使用时，抛出 `Error`，错误消息：`Token has already been used.`

**示例**：

```typescript
const tokens = new TokensEntity(tokenProperties);
await tokens.refreshTokenCheck(); // 检查刷新令牌是否可用
tokens.commit(); // 提交事件到事件总线
```

##### `commit(): void`

提交领域事件到事件总线。

**说明**：

- 继承自 `AggregateRoot` 的方法
- 将所有待处理的领域事件提交到 NestJS CQRS 事件总线

**使用场景**：在处理完聚合根操作后调用，确保领域事件被发布

### 3.2 TokensProperties（令牌属性类型）

定义令牌的属性结构，用于数据传输和持久化。

#### 3.2.1 类型定义

```typescript
type TokensEssentialProperties = Readonly<
  Required<{
    accessToken: string;
    refreshToken: string;
    status: string;
    userId: string;
    username: string;
    domain: string;
    ip: string;
    address: string;
    userAgent: string;
    requestId: string;
    type: string;
    createdBy: string;
  }>
>;

type TokensOptionalProperties = Readonly<
  Partial<{
    port: number | null;
  }>
>;

type TokensProperties = TokensEssentialProperties & TokensOptionalProperties;
```

#### 3.2.2 TokensReadModel（令牌读取模型）

用于 API 响应和查询结果的数据传输对象。

**属性说明**：

- 使用 `@ApiProperty` 装饰器提供 Swagger 文档支持
- 包含 `loginTime` 字段（登录时间）用于展示
- 所有字段均用于只读查询场景

**与聚合根的差异**：

- 读取模型包含 `loginTime` 字段，对应数据库中的创建时间
- 读取模型不包含 `accessToken` 和 `refreshToken` 的敏感字段（取决于实际实现）

### 3.3 TokenStatus（令牌状态枚举）

定义令牌的使用状态。

```typescript
enum TokenStatus {
  UNUSED = 'unused', // 未使用，可以用于刷新访问令牌
  USED = 'used', // 已使用，不能再用于刷新访问令牌
}
```

**状态说明**：

- **UNUSED**：令牌尚未被使用，可以用于刷新访问令牌
- **USED**：令牌已被使用，不能再用于刷新访问令牌，防止令牌被重复使用

## 4. 查询与处理器

### 4.1 TokensByRefreshTokenQuery（根据刷新令牌查询令牌）

用于根据刷新令牌查询令牌信息，主要用于令牌刷新流程。

#### 4.1.1 查询定义

```typescript
class TokensByRefreshTokenQuery implements IQuery {
  readonly refreshToken: string; // 刷新令牌字符串
}
```

#### 4.1.2 TokensByRefreshTokenQueryHandler（查询处理器）

**职责**：

- 根据刷新令牌查询令牌信息
- 用于验证刷新令牌的有效性

**返回值**：

- `TokensReadModel | null`：找到则返回令牌读取模型，未找到返回 `null`

**使用场景**：

- 令牌刷新流程中验证刷新令牌的有效性
- 查询令牌的元数据信息（用户、IP、位置等）

**业务流程**：

1. 接收刷新令牌
2. 调用仓储端口查询令牌信息
3. 返回令牌读取模型或 `null`

**示例**：

```typescript
const query = new TokensByRefreshTokenQuery(refreshToken);
const tokens = await queryBus.execute(query);
if (tokens) {
  console.log(`找到令牌，用户: ${tokens.username}, 状态: ${tokens.status}`);
  // 检查令牌状态是否未使用
  if (tokens.status === TokenStatus.UNUSED) {
    // 可以使用刷新令牌
  }
}
```

## 5. 领域事件

### 5.1 TokenGeneratedEvent（令牌生成事件）

当新的访问令牌和刷新令牌被生成时发布的领域事件。

#### 5.1.1 事件定义

```typescript
class TokenGeneratedEvent implements IEvent {
  readonly accessToken: string; // 生成的访问令牌
  readonly refreshToken: string; // 生成的刷新令牌
  readonly userId: string; // 用户的唯一标识符
  readonly username: string; // 用户名
  readonly domain: string; // 用户所属的域代码
  readonly ip: string; // 生成令牌时的 IP 地址
  readonly address: string; // 生成令牌时的地理位置信息
  readonly userAgent: string; // 生成令牌时的用户代理信息
  readonly requestId: string; // 请求的唯一标识符
  readonly type: string; // 令牌生成类型
  readonly port?: number | null; // 生成令牌时的端口号，可选
}
```

#### 5.1.2 TokenGeneratedEventHandler（事件处理器）

**职责**：

- 将新生成的令牌信息持久化到数据库
- 设置令牌初始状态为未使用（`UNUSED`）

**业务流程**：

1. 接收 `TokenGeneratedEvent` 事件
2. 创建令牌属性对象，设置状态为 `UNUSED`
3. 创建令牌聚合根实例
4. 保存到数据库

**使用场景**：

- 用户登录时，authentication 服务生成令牌后发布此事件
- 令牌刷新时，authentication 服务生成新令牌后发布此事件

**注意事项**：

- 该事件处理器会自动执行，无需手动调用
- 持久化操作是异步的，不会阻塞令牌生成流程

**示例**：

```typescript
// 在 authentication 服务中
const tokens = await this.generateAccessToken(userId, username, domain);
tokensAggregate.apply(
  new TokenGeneratedEvent(
    tokens.token,
    tokens.refreshToken,
    userId,
    username,
    domain,
    ip,
    address,
    userAgent,
    requestId,
    type,
    port,
  ),
);
tokensAggregate.commit(); // 触发事件处理器保存令牌
```

### 5.2 RefreshTokenUsedEvent（刷新令牌使用事件）

当刷新令牌被使用时发布的领域事件。

#### 5.2.1 事件定义

```typescript
class RefreshTokenUsedEvent implements IEvent {
  readonly refreshToken: string; // 被使用的刷新令牌
  readonly status: string; // 令牌的新状态，通常为 USED（已使用）
}
```

#### 5.2.2 RefreshTokenUsedEventHandler（事件处理器）

**职责**：

- 更新刷新令牌的状态为已使用（`USED`）
- 确保刷新令牌只能使用一次

**业务流程**：

1. 接收 `RefreshTokenUsedEvent` 事件
2. 调用仓储端口更新令牌状态为 `USED`
3. 防止刷新令牌被重复使用

**使用场景**：

- 令牌刷新流程中，使用刷新令牌获取新访问令牌时
- 确保刷新令牌的一次性使用特性

**安全性**：

- 刷新令牌只能使用一次，防止令牌被重复使用
- 令牌状态更新后，该刷新令牌不能再用于刷新

**示例**：

```typescript
// 在令牌刷新流程中
const tokens = await queryBus.execute(
  new TokensByRefreshTokenQuery(refreshToken),
);
const tokensEntity = new TokensEntity(tokens);
await tokensEntity.refreshTokenCheck(); // 检查并发布 RefreshTokenUsedEvent
tokensEntity.commit(); // 触发事件处理器更新状态
```

## 6. 端口接口

### 6.1 TokensWriteRepoPort（令牌写入仓储端口）

定义令牌的写入操作接口，由基础设施层实现。

#### 6.1.1 接口定义

```typescript
interface TokensWriteRepoPort {
  save(tokens: TokensEntity): Promise<void>;
  updateTokensStatus(refreshToken: string, status: string): Promise<void>;
}
```

#### 6.1.2 方法说明

##### `save(tokens: TokensEntity): Promise<void>`

保存或创建令牌到数据库。

- **参数**：`tokens` - 令牌聚合根实例
- **行为**：当新令牌生成时，保存令牌信息到数据库
- **异常**：当保存操作失败时抛出异常
- **使用场景**：令牌生成事件处理器中使用

##### `updateTokensStatus(refreshToken: string, status: string): Promise<void>`

更新指定刷新令牌的状态。

- **参数**：
  - `refreshToken` - 刷新令牌字符串
  - `status` - 新的令牌状态，通常为 `USED`（已使用）
- **行为**：更新数据库中对应刷新令牌的状态
- **异常**：当更新操作失败时抛出异常
- **使用场景**：刷新令牌使用事件处理器中使用

### 6.2 TokensReadRepoPort（令牌读取仓储端口）

定义令牌的读取操作接口，由基础设施层实现。

#### 6.2.1 接口定义

```typescript
interface TokensReadRepoPort {
  findTokensByRefreshToken(
    refreshToken: string,
  ): Promise<TokensReadModel | null>;
}
```

#### 6.2.2 方法说明

##### `findTokensByRefreshToken(refreshToken: string): Promise<TokensReadModel | null>`

根据刷新令牌查找令牌。

- **参数**：`refreshToken` - 刷新令牌字符串
- **返回值**：令牌读取模型，如果不存在则返回 `null`
- **用途**：令牌刷新流程中验证刷新令牌的有效性
- **使用场景**：查询令牌信息，检查令牌状态和元数据

## 7. 模块注册

### 7.1 TokensModule（令牌模块）

动态模块，用于注册令牌相关的处理器和依赖。

#### 7.1.1 模块定义

```typescript
@Module({})
export class TokensModule {
  static register(options: {
    inject: Provider[];
    imports: any[];
  }): DynamicModule;
}
```

#### 7.1.2 注册方式

在基础设施层通过 `register` 方法注册模块：

```typescript
TokensModule.register({
  imports: [
    /* 其他模块 */
  ],
  inject: [
    {
      provide: TokensReadRepoPortToken,
      useClass: TokensReadPostgresRepository,
    },
    {
      provide: TokensWriteRepoPortToken,
      useClass: TokensWritePostgresRepository,
    },
  ],
});
```

#### 7.1.3 提供的处理器

- **查询处理器**：`TokensByRefreshTokenQueryHandler`
- **事件处理器**：`TokenGeneratedEventHandler`、`RefreshTokenUsedEventHandler`

#### 7.1.4 依赖注入令牌

- `TokensWriteRepoPortToken`：令牌写入仓储端口令牌
- `TokensReadRepoPortToken`：令牌读取仓储端口令牌

## 8. 业务规则

### 8.1 令牌生成规则

- **事件驱动**：令牌生成通过 `TokenGeneratedEvent` 事件触发持久化
- **初始状态**：新生成的令牌状态默认为 `UNUSED`（未使用）
- **完整记录**：令牌生成时必须记录用户信息、IP 地址、地理位置等元数据

### 8.2 刷新令牌使用规则

- **一次性使用**：刷新令牌只能使用一次，使用后状态变为 `USED`
- **状态检查**：使用刷新令牌前必须检查状态是否为 `UNUSED`
- **自动更新**：使用刷新令牌后，自动发布事件更新状态为 `USED`
- **安全防护**：已使用的刷新令牌不能再次使用，防止令牌被盗用

### 8.3 令牌查询规则

- **根据刷新令牌查询**：通过刷新令牌可以查询完整的令牌信息
- **状态验证**：查询后应检查令牌状态，确保令牌可用
- **元数据访问**：可以通过令牌查询用户、IP、位置等审计信息

### 8.4 令牌类型规则

- **密码登录**：`type` 为 `password`，表示通过用户名密码登录生成
- **令牌刷新**：`type` 为 `token`，表示通过刷新令牌生成新令牌

### 8.5 审计信息规则

- **完整记录**：记录令牌生成时的所有元数据（IP、地址、用户代理等）
- **用户追踪**：记录令牌所属的用户和域
- **请求追踪**：记录请求 ID，用于日志关联和问题排查

## 9. 使用示例

### 9.1 令牌刷新流程

```typescript
import { QueryBus, CommandBus } from '@nestjs/cqrs';
import { TokensByRefreshTokenQuery } from './queries/tokens.by-refresh_token.query';
import { TokenStatus } from './constants';
import { TokensEntity } from './domain/tokens.entity';

// 在 authentication 服务中
async refreshToken(refreshToken: string) {
  // 1. 根据刷新令牌查询令牌信息
  const tokens = await this.queryBus.execute(
    new TokensByRefreshTokenQuery(refreshToken)
  );

  if (!tokens) {
    throw new NotFoundException('Refresh token not found.');
  }

  // 2. 检查刷新令牌是否可用
  const tokensEntity = new TokensEntity(tokens);
  await tokensEntity.refreshTokenCheck(); // 检查并发布事件
  tokensEntity.commit(); // 提交事件，更新状态为 USED

  // 3. 生成新的访问令牌和刷新令牌
  const newTokens = await this.generateAccessToken(
    tokens.userId,
    tokens.username,
    tokens.domain
  );

  // 4. 发布新令牌生成事件（会保存新令牌）
  const newTokensEntity = new TokensEntity({
    ...tokens,
    accessToken: newTokens.token,
    refreshToken: newTokens.refreshToken,
    status: TokenStatus.UNUSED,
  });
  newTokensEntity.apply(
    new TokenGeneratedEvent(/* ... */)
  );
  newTokensEntity.commit();

  return newTokens;
}
```

### 9.2 查询令牌信息

```typescript
import { QueryBus } from '@nestjs/cqrs';
import { TokensByRefreshTokenQuery } from './queries/tokens.by-refresh_token.query';

async getTokenInfo(refreshToken: string) {
  const query = new TokensByRefreshTokenQuery(refreshToken);
  const tokens = await this.queryBus.execute(query);

  if (tokens) {
    console.log(`用户: ${tokens.username}`);
    console.log(`域: ${tokens.domain}`);
    console.log(`IP: ${tokens.ip}`);
    console.log(`状态: ${tokens.status}`);
    console.log(`登录时间: ${tokens.loginTime}`);
  }

  return tokens;
}
```

### 9.3 令牌生成（在 authentication 服务中）

```typescript
import { EventBus } from '@nestjs/cqrs';
import { TokenGeneratedEvent } from '../tokens/domain/events/token-generated.event';

async generateAccessToken(userId: string, username: string, domain: string) {
  // 生成 JWT 令牌逻辑...
  const accessToken = '...';
  const refreshToken = '...';

  // 发布令牌生成事件
  const tokensAggregate = new TokensEntity({
    accessToken,
    refreshToken,
    status: TokenStatus.UNUSED,
    userId,
    username,
    domain,
    // ... 其他属性
  });

  tokensAggregate.apply(
    new TokenGeneratedEvent(
      accessToken,
      refreshToken,
      userId,
      username,
      domain,
      ip,
      address,
      userAgent,
      requestId,
      type,
      port,
    )
  );

  this.publisher.mergeObjectContext(tokensAggregate);
  tokensAggregate.commit(); // 触发事件处理器保存令牌

  return { token: accessToken, refreshToken };
}
```

## 10. 测试指南

### 10.1 单元测试

单元测试文件应放在与被测文件同目录下，命名为 `{filename}.spec.ts`。

#### 10.1.1 令牌聚合根测试

测试文件：`domain/tokens.entity.spec.ts`

**测试用例**：

- 测试 `refreshTokenCheck` 方法在令牌未使用时发布事件
- 测试 `refreshTokenCheck` 方法在令牌已使用时抛出异常
- 测试令牌聚合根正确创建

**示例**：

```typescript
describe('TokensEntity', () => {
  it('应该在刷新令牌未使用时发布 RefreshTokenUsedEvent', async () => {
    const properties: TokensProperties = {
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      status: TokenStatus.UNUSED,
      userId: 'user-123',
      username: 'testuser',
      domain: 'domain-001',
      ip: '192.168.1.1',
      address: 'Beijing',
      userAgent: 'Mozilla/5.0',
      requestId: 'req-123',
      type: 'password',
      createdBy: 'user-123',
    };
    const tokens = new TokensEntity(properties);

    await tokens.refreshTokenCheck();

    const events = tokens.getUncommittedEvents();
    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(RefreshTokenUsedEvent);
  });

  it('应该在刷新令牌已使用时抛出异常', async () => {
    const properties: TokensProperties = {
      // ... 其他属性
      status: TokenStatus.USED,
    };
    const tokens = new TokensEntity(properties);

    await expect(tokens.refreshTokenCheck()).rejects.toThrow(
      'Token has already been used.',
    );
  });
});
```

#### 10.1.2 事件处理器测试

测试文件：`application/event-handlers/token-generated.event.handler.spec.ts`

**测试用例**：

- 测试令牌生成事件处理器正确保存令牌
- 测试令牌初始状态为 `UNUSED`

**示例**：

```typescript
describe('TokenGeneratedEventHandler', () => {
  it('应该保存令牌并设置状态为 UNUSED', async () => {
    const handler = new TokenGeneratedEventHandler(/* mock dependencies */);
    const event = new TokenGeneratedEvent(/* ... */);

    await handler.handle(event);

    expect(mockRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        status: TokenStatus.UNUSED,
      }),
    );
  });
});
```

### 10.2 集成测试

集成测试应放置在 `tests/integration/` 目录下。

**测试场景**：

- 测试完整的令牌生成和持久化流程
- 测试刷新令牌使用检查流程
- 测试令牌状态更新流程
- 测试根据刷新令牌查询令牌

### 10.3 测试覆盖率要求

- 核心业务逻辑测试覆盖率须达到 80% 以上
- 关键路径（令牌生成、刷新令牌检查、状态更新）覆盖率须达到 90% 以上
- 所有公共 API 必须具备测试用例

## 11. 注意事项

### 11.1 安全性考虑

- **刷新令牌一次性使用**：确保刷新令牌只能使用一次，防止令牌被盗用后重复使用
- **令牌状态验证**：在使用刷新令牌前必须检查状态，防止使用已使用的令牌
- **敏感信息保护**：访问令牌和刷新令牌是敏感信息，不应在日志或响应中完整暴露

### 11.2 性能考虑

- **异步持久化**：令牌生成通过事件异步持久化，不会阻塞用户登录流程
- **数据库索引**：刷新令牌字段应建立唯一索引，提升查询性能
- **令牌清理**：建议定期清理过期令牌，避免数据库积累过多数据

### 11.3 令牌生命周期

- **访问令牌**：有效期较短，通常几分钟到几小时，过期后需使用刷新令牌获取新令牌
- **刷新令牌**：有效期较长，通常几天到几周，但只能使用一次
- **令牌记录**：令牌记录应保留一定时间，用于安全审计和问题排查

### 11.4 事件驱动设计

- **解耦设计**：令牌生成和持久化通过事件解耦，authentication 服务不需要直接依赖 tokens 仓储
- **异步处理**：事件处理器异步执行，不会阻塞主流程
- **事务一致性**：注意事件处理和数据库事务的一致性，确保数据完整性

### 11.5 错误处理

- **令牌不存在**：当查询的刷新令牌不存在时，应返回明确的错误信息
- **令牌已使用**：当尝试使用已使用的刷新令牌时，应返回明确的错误信息
- **持久化失败**：令牌持久化失败时，应记录日志并考虑重试机制

## 12. 扩展点

### 12.1 令牌撤销机制

可以扩展令牌撤销功能：

- 用户主动撤销令牌
- 管理员撤销用户令牌
- 批量撤销过期令牌

### 12.2 令牌设备管理

可以扩展设备级别的令牌管理：

- 记录令牌绑定的设备信息
- 限制用户同时登录的设备数量
- 设备级别的令牌撤销

### 12.3 令牌使用统计

可以扩展令牌使用统计功能：

- 统计令牌使用频率
- 分析异常登录行为
- 生成安全审计报告

### 12.4 令牌过期管理

可以扩展令牌过期管理：

- 自动清理过期令牌
- 令牌过期提醒
- 令牌续期机制

## 13. 相关模块

### 13.1 Authentication 模块

认证模块与令牌模块紧密关联：

- 用户登录时，authentication 服务生成令牌并发布 `TokenGeneratedEvent` 事件
- 令牌刷新时，authentication 服务使用 tokens 模块查询和验证刷新令牌
- 两个模块通过事件总线解耦

### 13.2 安全审计模块

令牌模块为安全审计提供数据：

- 记录用户登录的 IP、位置、设备等信息
- 记录令牌生成和使用的时间点
- 支持安全事件追溯和分析

## 14. 更新日志

### 2024-01-XX

- 初始版本，实现令牌生成和持久化
- 实现刷新令牌使用检查机制
- 实现根据刷新令牌查询令牌信息

---

**文档版本**：v1.0.0  
**最后更新**：2024-01-XX  
**维护者**：IAM 团队
