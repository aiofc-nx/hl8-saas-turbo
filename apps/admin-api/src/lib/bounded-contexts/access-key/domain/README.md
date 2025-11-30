# 访问密钥领域层（Domain Layer）开发文档

## 1. 概述

领域层（Domain Layer）是访问密钥有界上下文的核心业务逻辑层，包含领域模型、业务规则和领域概念。本层采用 **领域驱动设计（DDD）** 和 **Clean Architecture** 原则，确保业务逻辑独立于技术实现。

### 1.1 目录结构

```
domain/
├── access_key.model.ts              # 访问密钥聚合根
├── access_key.read.model.ts         # 访问密钥读模型和类型定义
├── events/                          # 领域事件
│   ├── access_key-created.event.ts  # 访问密钥创建事件
│   └── access_key-deleted.event.ts  # 访问密钥删除事件
└── README.md                        # 本文档
```

### 1.2 架构原则

1. **业务逻辑独立**：领域层不依赖任何外部框架和技术细节
2. **聚合根管理**：通过聚合根维护业务不变性和一致性
3. **领域事件**：通过领域事件实现模块间解耦
4. **类型安全**：使用 TypeScript 类型系统确保类型安全

### 1.3 核心概念

- **聚合根（Aggregate Root）**：`AccessKey` - 访问密钥的领域模型
- **读模型（Read Model）**：`AccessKeyReadModel` - 用于查询和展示的模型（不包含敏感信息）
- **领域事件（Domain Events）**：`AccessKeyCreatedEvent`、`AccessKeyDeletedEvent`
- **类型定义（Type Definitions）**：访问密钥属性的类型定义

## 2. 聚合根（Aggregate Root）

### 2.1 AccessKey（访问密钥聚合根）

#### 2.1.1 定义

`AccessKey` 是访问密钥有界上下文的聚合根，继承自 NestJS CQRS 的 `AggregateRoot`，表示一个用于 API 调用认证的访问密钥。

```typescript
export class AccessKey extends AggregateRoot implements IAccessKey {
  id: string;
  domain: string;
  AccessKeyID: string;
  AccessKeySecret: string;
  status: Status;
  description?: string | null;
  createdAt: Date;
  createdBy: string;
}
```

#### 2.1.2 职责

1. **封装业务概念**：表示一个访问密钥的完整概念
2. **维护业务不变性**：确保访问密钥数据的完整性和一致性
3. **发布领域事件**：在关键业务操作时发布领域事件
4. **密钥管理**：管理密钥的生命周期（创建、删除）

#### 2.1.3 属性说明

| 属性名 | 类型 | 必填 | 说明 | 示例 |
|--------|------|------|------|------|
| `id` | `string` | 是 | 访问密钥的唯一标识符（ULID） | `"01ARZ3NDEKTSV4RRFFQ69G5FAV"` |
| `domain` | `string` | 是 | 访问密钥所属的域代码，用于多租户隔离 | `"example.com"` |
| `AccessKeyID` | `string` | 是 | 用于 API 认证的密钥 ID（ULID） | `"01ARZ3NDEKTSV4RRFFQ69G5FAV"` |
| `AccessKeySecret` | `string` | 是 | 用于 API 认证的密钥值（ULID），**敏感信息** | `"01ARZ3NDEKTSV4RRFFQ69G5FAV"` |
| `status` | `Status` | 是 | 访问密钥状态 | `Status.ENABLED` 或 `Status.DISABLED` |
| `description` | `string \| null` | 否 | 访问密钥的描述信息 | `"用于生产环境的 API 密钥"` |
| `createdAt` | `Date` | 是 | 创建时间 | `new Date()` |
| `createdBy` | `string` | 是 | 创建者用户 ID | `"user-123"` |

#### 2.1.4 安全注意事项

**AccessKeySecret 是敏感信息**：

1. **不包含在读模型中**：`AccessKeyReadModel` 不包含 `AccessKeySecret`，确保不会在 API 响应中泄露
2. **加密存储**：在数据库中应该加密存储（由基础设施层处理）
3. **最小权限**：只有创建时返回一次，之后不再返回
4. **审计日志**：访问密钥的操作应该记录审计日志

#### 2.1.5 唯一性约束

访问密钥的唯一性由以下组合确定：

- **`AccessKeyID`**：全局唯一
- **`domain` + `AccessKeyID`**：在域内唯一（用于多租户隔离）

#### 2.1.6 使用场景

1. **API 认证**
   - 客户端使用 `AccessKeyID` 和 `AccessKeySecret` 进行 API 调用认证
   - 系统验证密钥的有效性和状态

2. **密钥管理**
   - 创建新的访问密钥
   - 删除访问密钥（使其失效）
   - 查询访问密钥列表

3. **多租户隔离**
   - 通过 `domain` 字段实现多租户数据隔离
   - 每个域下的密钥相互独立

#### 2.1.7 创建方式

**静态工厂方法**：

```typescript
const accessKey = AccessKey.fromProp({
  id: UlidGenerator.generate(),
  domain: 'example.com',
  AccessKeyID: UlidGenerator.generate(),
  AccessKeySecret: UlidGenerator.generate(),
  status: Status.ENABLED,
  description: '用于生产环境的 API 密钥',
  createdAt: new Date(),
  createdBy: 'user-123',
});
```

**为什么使用工厂方法？**

1. **封装创建逻辑**：可以添加业务规则验证
2. **类型安全**：确保所有必需属性都被提供
3. **一致性**：统一创建方式，便于维护

#### 2.1.8 领域方法

##### created(): Promise<void>

**功能**：发布访问密钥创建事件

**使用场景**：
- 当访问密钥被创建时调用
- 用于触发后续操作（如密钥同步、缓存更新）

**事件内容**：
- `domain`: 域代码
- `AccessKeyID`: 密钥 ID
- `AccessKeySecret`: 密钥值
- `status`: 密钥状态

**使用示例**：

```typescript
const accessKey = AccessKey.fromProp(properties);
await accessKey.created();
this.publisher.mergeObjectContext(accessKey);
accessKey.commit();
```

##### deleted(): Promise<void>

**功能**：发布访问密钥删除事件

**使用场景**：
- 当访问密钥被删除时调用
- 用于触发后续操作（如清理缓存、撤销权限）

**事件内容**：
- `domain`: 域代码
- `AccessKeyID`: 密钥 ID
- `AccessKeySecret`: 密钥值
- `status`: 密钥状态

**使用示例**：

```typescript
const accessKey = AccessKey.fromProp(properties);
await accessKey.deleted();
this.publisher.mergeObjectContext(accessKey);
accessKey.commit();
```

##### commit(): void

**功能**：提交所有待处理的领域事件到事件总线

**说明**：
- 继承自 `AggregateRoot`
- 必须在发布事件后调用，才能将事件发送到事件总线

**使用示例**：

```typescript
await accessKey.created();
this.publisher.mergeObjectContext(accessKey);
accessKey.commit(); // 提交事件到事件总线
```

#### 2.1.9 接口实现

`AccessKey` 实现了 `IAccessKey` 接口：

```typescript
export interface IAccessKey {
  commit(): void;
}
```

**为什么需要接口？**

1. **类型约束**：确保聚合根实现必要的方法
2. **可测试性**：可以使用接口进行 Mock
3. **扩展性**：未来可以添加更多接口方法

## 3. 读模型（Read Model）

### 3.1 AccessKeyReadModel（访问密钥读模型）

#### 3.1.1 定义

`AccessKeyReadModel` 是用于 API 响应的访问密钥读取模型，**不包含敏感信息**（如 `AccessKeySecret`）。

```typescript
export class AccessKeyReadModel {
  id: string;
  domain: string;
  AccessKeyID: string;
  status: Status;
  description: string | null;
}
```

#### 3.1.2 职责

1. **数据展示**：用于 API 响应，展示访问密钥信息
2. **安全保护**：不包含敏感信息（`AccessKeySecret`），确保安全
3. **Swagger 文档**：使用 `@ApiProperty` 装饰器生成 Swagger 文档
4. **类型安全**：提供类型定义，确保类型安全

#### 3.1.3 与聚合根的区别

| 特性 | AccessKey（聚合根） | AccessKeyReadModel（读模型） |
|------|-------------------|----------------------------|
| **用途** | 领域模型，表示业务概念 | 读取模型，用于展示 |
| **继承** | 继承 `AggregateRoot` | 普通类 |
| **事件** | 可以发布领域事件 | 不发布事件 |
| **Swagger** | 不使用 `@ApiProperty` | 使用 `@ApiProperty` |
| **敏感信息** | 包含 `AccessKeySecret` | **不包含** `AccessKeySecret` |
| **时间字段** | 包含 `createdAt`、`createdBy` | 不包含（如果需要可以添加） |

#### 3.1.4 安全设计

**为什么读模型不包含 AccessKeySecret？**

1. **安全原则**：最小权限原则，只返回必要的信息
2. **防止泄露**：避免在 API 响应中泄露敏感信息
3. **审计要求**：符合安全审计要求

**AccessKeySecret 的返回策略**：

- **创建时返回一次**：创建访问密钥时，在响应中返回 `AccessKeySecret`（仅此一次）
- **之后不再返回**：查询、列表等操作都不返回 `AccessKeySecret`
- **单独接口**：如果需要重新获取密钥，需要提供单独的接口（通常不支持）

#### 3.1.5 使用场景

1. **API 响应**：作为 API 响应的数据模型
2. **Swagger 文档**：自动生成 API 文档
3. **数据转换**：从数据库实体转换为 API 响应

#### 3.1.6 映射关系

**从聚合根到读模型**：

```typescript
function toReadModel(accessKey: AccessKey): AccessKeyReadModel {
  const model = new AccessKeyReadModel();
  model.id = accessKey.id;
  model.domain = accessKey.domain;
  model.AccessKeyID = accessKey.AccessKeyID;
  model.status = accessKey.status;
  model.description = accessKey.description || null;
  // 注意：不包含 AccessKeySecret
  return model;
}
```

**从数据库实体到读模型**：

```typescript
function entityToReadModel(entity: AccessKeyEntity): AccessKeyReadModel {
  const model = new AccessKeyReadModel();
  model.id = entity.id;
  model.domain = entity.domain;
  model.AccessKeyID = entity.AccessKeyID;
  model.status = entity.status;
  model.description = entity.description;
  // 注意：不包含 AccessKeySecret
  return model;
}
```

## 4. 领域事件（Domain Events）

### 4.1 AccessKeyCreatedEvent（访问密钥创建事件）

#### 4.1.1 定义

当访问密钥被创建时发布的领域事件。

```typescript
export class AccessKeyCreatedEvent implements IEvent {
  constructor(
    public readonly domain: string,
    public readonly AccessKeyID: string,
    public readonly AccessKeySecret: string,
    public readonly status: Status,
  ) {}
}
```

#### 4.1.2 事件属性

| 属性名 | 类型 | 说明 |
|--------|------|------|
| `domain` | `string` | 访问密钥所属的域代码 |
| `AccessKeyID` | `string` | 访问密钥 ID |
| `AccessKeySecret` | `string` | 访问密钥值（敏感信息） |
| `status` | `Status` | 访问密钥状态 |

#### 4.1.3 使用场景

1. **密钥同步**：将密钥信息同步到 API 密钥服务
2. **缓存更新**：更新密钥缓存，提升认证性能
3. **通知发送**：发送密钥创建通知
4. **审计日志**：记录密钥创建操作

#### 4.1.4 事件处理

**事件处理器**：`AccessKeyCreatedHandler`

**处理逻辑**：
1. 接收 `AccessKeyCreatedEvent` 事件
2. 将密钥信息同步到 API 密钥服务
3. 更新密钥缓存（如果需要）

### 4.2 AccessKeyDeletedEvent（访问密钥删除事件）

#### 4.2.1 定义

当访问密钥被删除时发布的领域事件。

```typescript
export class AccessKeyDeletedEvent implements IEvent {
  constructor(
    public readonly domain: string,
    public readonly AccessKeyID: string,
    public readonly AccessKeySecret: string,
    public readonly status: Status,
  ) {}
}
```

#### 4.2.2 事件属性

| 属性名 | 类型 | 说明 |
|--------|------|------|
| `domain` | `string` | 访问密钥所属的域代码 |
| `AccessKeyID` | `string` | 访问密钥 ID |
| `AccessKeySecret` | `string` | 访问密钥值（敏感信息） |
| `status` | `Status` | 访问密钥状态 |

#### 4.2.3 使用场景

1. **密钥移除**：从 API 密钥服务中移除密钥
2. **缓存清理**：清理密钥缓存
3. **权限撤销**：撤销与该密钥相关的权限
4. **通知发送**：发送密钥删除通知
5. **审计日志**：记录密钥删除操作

#### 4.2.4 事件处理

**事件处理器**：`AccessKeyDeletedHandler`

**处理逻辑**：
1. 接收 `AccessKeyDeletedEvent` 事件
2. 从 API 密钥服务中移除密钥
3. 清理密钥缓存
4. 撤销相关权限（如果需要）

### 4.3 领域事件设计原则

1. **过去时命名**：事件名称使用过去时，表示已发生的事情
2. **不可变数据**：事件数据应该是不可变的（使用 `readonly`）
3. **包含上下文**：事件应该包含足够的上下文信息
4. **业务语义**：事件应该表达业务语义，而不是技术细节

## 5. 类型定义（Type Definitions）

### 5.1 AccessKeyEssentialProperties（访问密钥必需属性）

#### 5.1.1 定义

定义访问密钥的必需属性，所有字段均为只读且必需。

```typescript
export type AccessKeyEssentialProperties = Readonly<
  Required<{
    id: string;
    domain: string;
    AccessKeyID: string;
    AccessKeySecret: string;
    status: Status;
  }>
>;
```

#### 5.1.2 特点

- **只读（Readonly）**：所有字段都是只读的，确保不可变性
- **必需（Required）**：所有字段都是必需的
- **类型安全**：使用 TypeScript 类型系统确保类型安全

### 5.2 AccessKeyOptionalProperties（访问密钥可选属性）

#### 5.2.1 定义

定义访问密钥的可选属性。

```typescript
export type AccessKeyOptionalProperties = Readonly<
  Partial<{
    description: string | null;
  }>
>;
```

#### 5.2.2 特点

- **只读（Readonly）**：所有字段都是只读的
- **可选（Partial）**：所有字段都是可选的
- **可空值**：`description` 可以是 `string` 或 `null`

### 5.3 AccessKeyProperties（访问密钥完整属性）

#### 5.3.1 定义

包含访问密钥的所有属性，包括必需属性、可选属性和创建审计信息。

```typescript
export type AccessKeyProperties = AccessKeyEssentialProperties &
  Required<AccessKeyOptionalProperties> &
  CreationAuditInfoProperties;
```

#### 5.3.2 特点

- **组合类型**：通过类型组合复用类型定义
- **必需可选属性**：可选属性通过 `Required<>` 转换为必需（但值可以为 `null`）
- **审计信息**：包含创建审计信息（`createdAt`、`createdBy`）

#### 5.3.3 使用场景

- 作为函数参数类型
- 作为返回值类型
- 作为数据转换的中间类型

## 6. 开发指南

### 6.1 创建新的聚合根

参考 `AccessKey` 的实现，创建新的聚合根：

```typescript
// domain/my-aggregate.model.ts
import { AggregateRoot } from '@nestjs/cqrs';
import type { MyProperties } from './my.read.model';

export interface IMyAggregate {
  commit(): void;
}

export class MyAggregate extends AggregateRoot implements IMyAggregate {
  id: string;
  name: string;
  // ... 其他属性

  static fromProp(properties: MyProperties): MyAggregate {
    return Object.assign(new MyAggregate(), properties);
  }

  async created() {
    this.apply(new MyCreatedEvent(this.id, this.name));
  }
}
```

### 6.2 创建新的读模型

参考 `AccessKeyReadModel` 的实现，创建新的读模型：

```typescript
// domain/my.read.model.ts
import { ApiProperty } from '@nestjs/swagger';

export class MyReadModel {
  @ApiProperty({ description: 'ID' })
  id: string;

  @ApiProperty({ description: '名称' })
  name: string;
}
```

### 6.3 添加领域事件

参考 `AccessKeyCreatedEvent` 的实现，创建新的领域事件：

```typescript
// domain/events/my-event.event.ts
import { IEvent } from '@nestjs/cqrs';

export class MyEvent implements IEvent {
  constructor(
    public readonly aggregateId: string,
    public readonly data: any,
  ) {}
}
```

然后在聚合根中发布事件：

```typescript
export class MyAggregate extends AggregateRoot {
  async doSomething() {
    // 业务逻辑
    this.apply(new MyEvent(this.id, { /* 事件数据 */ }));
  }
}
```

### 6.4 添加值对象（如果需要）

如果未来需要值对象，可以创建：

```typescript
// domain/value-objects/access-key-id.value-object.ts

/**
 * 访问密钥 ID 值对象
 *
 * @description 表示访问密钥 ID 的值对象，包含验证逻辑
 */
export class AccessKeyID {
  private readonly value: string;

  private constructor(value: string) {
    this.validate(value);
    this.value = value;
  }

  static fromString(value: string): AccessKeyID {
    return new AccessKeyID(value);
  }

  getValue(): string {
    return this.value;
  }

  private validate(value: string): void {
    if (!value || value.length < 10) {
      throw new Error('AccessKeyID must be at least 10 characters');
    }
  }
}
```

## 7. 最佳实践

### 7.1 聚合根最佳实践

1. **工厂方法**：使用静态工厂方法创建聚合根实例
2. **领域方法**：业务逻辑封装在聚合根的方法中
3. **领域事件**：重要的业务操作应该发布领域事件
4. **接口实现**：实现接口以提供类型约束

### 7.2 读模型最佳实践

1. **安全第一**：不包含敏感信息
2. **Swagger 装饰器**：使用 `@ApiProperty` 装饰器生成 API 文档
3. **类型安全**：使用 TypeScript 类型系统确保类型安全
4. **数据转换**：在应用层或基础设施层进行数据转换

### 7.3 领域事件最佳实践

1. **过去时命名**：事件名称使用过去时，表示已发生的事情
2. **不可变数据**：事件数据应该是不可变的（使用 `readonly`）
3. **包含上下文**：事件应该包含足够的上下文信息
4. **业务语义**：事件应该表达业务语义，而不是技术细节

### 7.4 类型定义最佳实践

1. **只读类型**：使用 `Readonly<>` 确保类型不可变
2. **类型组合**：通过类型组合复用类型定义
3. **明确可空**：使用 `| null` 明确表示可空字段
4. **类型复用**：通过类型组合复用类型定义

## 8. 测试指南

### 8.1 聚合根测试

```typescript
describe('AccessKey', () => {
  it('should create access key from properties', () => {
    // Arrange
    const properties: AccessKeyProperties = {
      id: 'id',
      domain: 'example.com',
      AccessKeyID: 'key-id',
      AccessKeySecret: 'key-secret',
      status: Status.ENABLED,
      description: 'Test key',
      createdAt: new Date(),
      createdBy: 'user-123',
    };

    // Act
    const accessKey = AccessKey.fromProp(properties);

    // Assert
    expect(accessKey.id).toBe('id');
    expect(accessKey.domain).toBe('example.com');
    expect(accessKey.AccessKeyID).toBe('key-id');
    expect(accessKey.AccessKeySecret).toBe('key-secret');
    expect(accessKey.status).toBe(Status.ENABLED);
  });

  it('should publish created event', async () => {
    // Arrange
    const accessKey = AccessKey.fromProp(/* ... */);
    const applySpy = jest.spyOn(accessKey, 'apply');

    // Act
    await accessKey.created();

    // Assert
    expect(applySpy).toHaveBeenCalledWith(
      expect.any(AccessKeyCreatedEvent),
    );
  });
});
```

### 8.2 读模型测试

```typescript
describe('AccessKeyReadModel', () => {
  it('should create read model without sensitive information', () => {
    // Arrange
    const model = new AccessKeyReadModel();
    model.id = 'id';
    model.domain = 'example.com';
    model.AccessKeyID = 'key-id';
    model.status = Status.ENABLED;
    model.description = 'Test key';

    // Assert
    expect(model.id).toBe('id');
    expect(model.domain).toBe('example.com');
    expect(model.AccessKeyID).toBe('key-id');
    // 注意：不应该有 AccessKeySecret 属性
    expect((model as any).AccessKeySecret).toBeUndefined();
  });
});
```

### 8.3 领域事件测试

```typescript
describe('AccessKeyCreatedEvent', () => {
  it('should create event with all properties', () => {
    // Arrange & Act
    const event = new AccessKeyCreatedEvent(
      'example.com',
      'key-id',
      'key-secret',
      Status.ENABLED,
    );

    // Assert
    expect(event.domain).toBe('example.com');
    expect(event.AccessKeyID).toBe('key-id');
    expect(event.AccessKeySecret).toBe('key-secret');
    expect(event.status).toBe(Status.ENABLED);
  });
});
```

## 9. 常见问题

### 9.1 为什么 AccessKeySecret 不在读模型中？

**回答**：这是安全设计原则：

1. **最小权限**：只返回必要的信息
2. **防止泄露**：避免在 API 响应中泄露敏感信息
3. **审计要求**：符合安全审计要求

### 9.2 什么时候返回 AccessKeySecret？

**回答**：只在创建访问密钥时返回一次：

1. **创建时返回**：创建访问密钥时，在响应中返回 `AccessKeySecret`（仅此一次）
2. **之后不再返回**：查询、列表等操作都不返回 `AccessKeySecret`
3. **单独接口**：如果需要重新获取密钥，需要提供单独的接口（通常不支持）

### 9.3 为什么使用工厂方法而不是构造函数？

**回答**：使用工厂方法的优势：

1. **封装创建逻辑**：可以添加业务规则验证
2. **类型安全**：确保所有必需属性都被提供
3. **一致性**：统一创建方式，便于维护
4. **扩展性**：未来可以添加更多创建场景（如 `fromCreate`、`fromUpdate`）

### 9.4 领域事件包含敏感信息吗？

**回答**：是的，领域事件包含 `AccessKeySecret`。原因：

1. **事件处理需要**：事件处理器需要完整的密钥信息进行同步
2. **内部使用**：事件只在系统内部使用，不对外暴露
3. **安全控制**：通过事件总线的安全机制控制访问

## 10. 未来扩展

### 10.1 密钥轮换

未来可以添加密钥轮换功能：

```typescript
export class AccessKey extends AggregateRoot {
  // ... 现有属性

  /**
   * 轮换密钥
   */
  async rotate(): Promise<void> {
    const oldAccessKeyID = this.AccessKeyID;
    this.AccessKeyID = UlidGenerator.generate();
    this.AccessKeySecret = UlidGenerator.generate();
    this.apply(new AccessKeyRotatedEvent(this.domain, oldAccessKeyID, this.AccessKeyID));
  }
}
```

### 10.2 密钥过期

未来可以添加密钥过期功能：

```typescript
export class AccessKey extends AggregateRoot {
  // ... 现有属性

  readonly expiresAt?: Date; // 过期时间

  /**
   * 检查密钥是否过期
   */
  isExpired(): boolean {
    if (!this.expiresAt) {
      return false;
    }
    return new Date() > this.expiresAt;
  }
}
```

### 10.3 密钥权限

未来可以添加密钥权限功能：

```typescript
export class AccessKey extends AggregateRoot {
  // ... 现有属性

  readonly permissions?: string[]; // 权限列表

  /**
   * 检查密钥是否有权限
   */
  hasPermission(permission: string): boolean {
    return this.permissions?.includes(permission) ?? false;
  }
}
```

## 11. 总结

领域层是访问密钥有界上下文的核心业务逻辑层，包含：

- **聚合根**：`AccessKey` - 表示访问密钥的业务概念
- **读模型**：`AccessKeyReadModel` - 用于数据展示（不包含敏感信息）
- **领域事件**：`AccessKeyCreatedEvent`、`AccessKeyDeletedEvent`
- **类型定义**：访问密钥属性的类型定义

遵循本文档的开发指南和最佳实践，可以确保领域层的代码质量、可维护性和安全性。

---

**文档版本**：v1.0.0  
**最后更新**：2024-01-XX  
**维护者**：开发团队

