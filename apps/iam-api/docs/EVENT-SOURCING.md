# 事件溯源（Event Sourcing）架构扩展

## 1. 概述

在 **Clean Architecture + CQRS + 事件驱动架构（EDA）** 的基础上，增加 **事件溯源（Event Sourcing, ES）** 架构模式。

### 1.1 架构组合

```
Clean Architecture（清洁架构）
    +
CQRS（命令查询职责分离）
    +
事件驱动架构（EDA）
    +
事件溯源（Event Sourcing, ES）
```

### 1.2 事件溯源的核心思想

**传统方式**：存储当前状态

```
CREATE TABLE sys_user (
  id VARCHAR,
  username VARCHAR,
  status VARCHAR,
  ...
);
```

**事件溯源方式**：存储所有发生的事件

```
CREATE TABLE domain_events (
  id VARCHAR,
  aggregate_id VARCHAR,
  event_type VARCHAR,
  event_data JSONB,
  occurred_at TIMESTAMP,
  version INT,
  ...
);
```

**重建状态**：通过重放事件重建当前状态

```
初始状态 → 事件1 → 事件2 → 事件3 → 当前状态
```

## 2. 事件溯源原理

### 2.1 基本概念

**事件溯源（Event Sourcing）** 是一种数据存储模式，其核心思想是：

- **不存储当前状态**，而是存储所有发生的事件
- **通过重放事件**来重建当前状态
- **事件是不可变的**，只能追加，不能修改

### 2.2 与传统方式的对比

#### 传统方式（当前状态存储）

```
用户创建 → 保存用户状态到数据库
用户更新 → 更新用户状态
用户删除 → 删除用户记录

问题：
- 丢失历史记录
- 无法追溯变更历史
- 难以审计
```

#### 事件溯源方式

```
用户创建 → 保存 UserCreatedEvent
用户更新 → 保存 UserUpdatedEvent
用户删除 → 保存 UserDeletedEvent

优势：
- 完整的历史记录
- 可以追溯任何时间点的状态
- 易于审计
- 可以重建状态
```

### 2.3 状态重建

**通过重放事件重建状态**：

```typescript
// 重建用户状态
const events = await eventStore.getEvents('user-123');

let user = null;
for (const event of events) {
  switch (event.type) {
    case 'UserCreatedEvent':
      user = new User(event.data);
      break;
    case 'UserUpdatedEvent':
      user = applyUpdate(user, event.data);
      break;
    case 'UserDeletedEvent':
      user = null;
      break;
  }
}

// user 就是当前状态
```

## 3. 与现有架构的结合

### 3.1 架构层次

```
┌─────────────────────────────────────────┐
│    Infrastructure Layer                  │
│  - Event Store (事件存储)                │
│  - Snapshot Store (快照存储)            │
│  - Repository 实现                       │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│    Application Layer                    │
│  - Command Handler                      │
│  - Query Handler                        │
│  - Event Handler                        │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│    Domain Layer                         │
│  - Aggregate Root                       │
│  - Domain Events                         │
└─────────────────────────────────────────┘
```

### 3.2 与 CQRS 的结合

**CQRS + Event Sourcing** 是经典的组合：

- **写操作（Command）**：保存事件到事件存储
- **读操作（Query）**：从读取模型查询（或从事件重建）

**优势**：

- 写操作只追加事件，性能好
- 读操作可以从读取模型查询，性能好
- 可以异步构建读取模型

### 3.3 与 EDA 的结合

**EDA + Event Sourcing** 天然契合：

- **领域事件**：既是事件驱动的事件，也是事件溯源的事件
- **事件存储**：统一存储所有领域事件
- **事件重放**：可以重放事件处理副作用

## 4. 事件存储（Event Store）

### 4.1 事件存储设计

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
  metadata JSONB,
  INDEX idx_aggregate (aggregate_id, aggregate_type),
  INDEX idx_occurred_at (occurred_at)
);
```

**事件数据示例**：

```json
{
  "id": "evt-123",
  "aggregate_id": "user-456",
  "aggregate_type": "User",
  "event_type": "UserCreatedEvent",
  "event_data": {
    "userId": "user-456",
    "username": "john",
    "domain": "example.com"
  },
  "occurred_at": "2024-01-01T10:00:00Z",
  "version": 1
}
```

### 4.2 事件存储接口

```typescript
// 事件存储端口接口
export interface EventStorePort {
  /**
   * 保存事件
   */
  saveEvents(
    aggregateId: string,
    aggregateType: string,
    events: IEvent[],
    expectedVersion: number,
  ): Promise<void>;

  /**
   * 获取聚合的所有事件
   */
  getEvents(aggregateId: string, aggregateType: string): Promise<IEvent[]>;

  /**
   * 获取事件流
   */
  getEventStream(
    aggregateId: string,
    aggregateType: string,
    fromVersion?: number,
  ): Promise<EventStream>;
}
```

### 4.3 事件存储实现

```typescript
// 事件存储适配器实现
@Injectable()
export class EventStoreRepository implements EventStorePort {
  constructor(private readonly em: EntityManager) {}

  async saveEvents(
    aggregateId: string,
    aggregateType: string,
    events: IEvent[],
    expectedVersion: number,
  ): Promise<void> {
    // 乐观锁检查
    const currentVersion = await this.getCurrentVersion(
      aggregateId,
      aggregateType,
    );
    if (currentVersion !== expectedVersion) {
      throw new ConcurrencyException('Version mismatch');
    }

    // 保存事件
    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      const eventRecord = {
        id: UlidGenerator.generate(),
        aggregateId,
        aggregateType,
        eventType: event.constructor.name,
        eventData: event,
        occurredAt: new Date(),
        version: expectedVersion + i + 1,
      };
      await this.em.persistAndFlush(eventRecord);
    }
  }

  async getEvents(
    aggregateId: string,
    aggregateType: string,
  ): Promise<IEvent[]> {
    const events = await this.em.find(
      'DomainEvent',
      {
        aggregateId,
        aggregateType,
      },
      {
        orderBy: { version: 'ASC' },
      },
    );

    return events.map((event) => this.deserializeEvent(event));
  }
}
```

## 5. 聚合根与事件溯源

### 5.1 从事件重建聚合根

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

  // 应用事件重建状态
  private static applyEvent(user: User | null, event: IEvent): User {
    switch (event.constructor.name) {
      case 'UserCreatedEvent':
        return new User({
          id: event.userId,
          username: event.username,
          domain: event.domain,
          // ...
        });
      case 'UserUpdatedEvent':
        return { ...user, ...event.data };
      case 'UserDeletedEvent':
        return null;
      default:
        return user;
    }
  }
}
```

### 5.2 保存事件

```typescript
@CommandHandler(UserCreateCommand)
export class UserCreateHandler {
  async execute(command: UserCreateCommand) {
    // 1. 创建聚合根
    const user = new User(...);

    // 2. 发布事件
    await user.created();

    // 3. 保存事件到事件存储
    await this.eventStore.saveEvents(
      user.id,
      'User',
      user.getUncommittedEvents(),
      user.version,
    );

    // 4. 提交事件到事件总线（用于事件处理）
    this.publisher.mergeObjectContext(user);
    user.commit();
  }
}
```

## 6. 快照（Snapshot）

### 6.1 快照的作用

**问题**：如果事件很多，重建状态会很慢。

**解决方案**：定期创建快照，从快照开始重建。

```
事件1 → 事件2 → ... → 事件1000 → [快照] → 事件1001 → ... → 当前状态
                                    ↑
                              从快照开始重建
```

### 6.2 快照实现

```typescript
// 快照存储接口
export interface SnapshotStorePort {
  saveSnapshot(
    aggregateId: string,
    aggregateType: string,
    snapshot: any,
  ): Promise<void>;
  getSnapshot(aggregateId: string, aggregateType: string): Promise<any | null>;
}

// 快照策略
export class SnapshotStrategy {
  // 每 N 个事件创建一个快照
  shouldCreateSnapshot(
    currentVersion: number,
    snapshotInterval: number,
  ): boolean {
    return currentVersion % snapshotInterval === 0;
  }
}
```

## 7. 读取模型构建

### 7.1 从事件构建读取模型

```typescript
// 事件处理器：构建读取模型
@EventsHandler(UserCreatedEvent)
export class UserReadModelBuilder implements IEventHandler {
  async handle(event: UserCreatedEvent) {
    // 从事件构建读取模型
    await this.readModelRepository.save({
      id: event.userId,
      username: event.username,
      domain: event.domain,
      // ...
    });
  }
}
```

### 7.2 读取模型更新

```typescript
@EventsHandler(UserUpdatedEvent)
export class UserReadModelUpdater implements IEventHandler {
  async handle(event: UserUpdatedEvent) {
    // 更新读取模型
    await this.readModelRepository.update(event.userId, {
      nickName: event.nickName,
      status: event.status,
      // ...
    });
  }
}
```

## 8. 事件溯源的优势

### 8.1 完整的历史记录

- ✅ 所有变更都有记录
- ✅ 可以追溯任何时间点的状态
- ✅ 完整的审计日志

### 8.2 时间旅行

- ✅ 可以查看任何历史时间点的状态
- ✅ 可以重放事件到特定时间点
- ✅ 支持时间点查询

### 8.3 调试和问题排查

- ✅ 可以重放事件重现问题
- ✅ 可以查看完整的变更历史
- ✅ 易于调试

### 8.4 与 CQRS 完美结合

- ✅ 写操作只追加事件，性能好
- ✅ 读操作从读取模型查询，性能好
- ✅ 可以异步构建读取模型

## 9. 事件溯源的挑战

### 9.1 事件版本管理

**挑战**：事件结构可能变化

**解决方案**：

- 事件版本化
- 事件迁移策略
- 向后兼容

### 9.2 快照管理

**挑战**：快照需要与事件同步

**解决方案**：

- 定期创建快照
- 快照验证
- 快照重建

### 9.3 性能考虑

**挑战**：重建状态可能很慢

**解决方案**：

- 使用快照
- 异步构建读取模型
- 缓存重建的状态

## 10. 实施建议

### 10.1 渐进式实施

**阶段 1**：保持现有架构，添加事件存储

- 保存事件到事件存储
- 同时保存当前状态（双重写入）

**阶段 2**：从事件重建状态

- 实现事件重放逻辑
- 验证重建的状态

**阶段 3**：完全切换到事件溯源

- 移除当前状态存储
- 完全依赖事件存储

### 10.2 适用场景

**适合使用事件溯源**：

- ✅ 需要完整审计日志
- ✅ 需要时间旅行功能
- ✅ 需要追溯历史
- ✅ 复杂的业务领域

**不适合使用事件溯源**：

- ❌ 简单的 CRUD 应用
- ❌ 不需要历史记录
- ❌ 性能要求极高的场景

## 11. 总结

### 11.1 架构组合

```
Clean Architecture + CQRS + EDA + Event Sourcing
```

**优势**：

- ✅ Clean Architecture：清晰的层次和依赖
- ✅ CQRS：读写分离
- ✅ EDA：事件驱动解耦
- ✅ Event Sourcing：完整的历史记录

### 11.2 实施要点

1. **事件存储**：设计事件存储结构
2. **事件重放**：实现从事件重建状态
3. **快照策略**：优化重建性能
4. **读取模型**：从事件构建读取模型
5. **渐进式实施**：逐步迁移到事件溯源

---

**文档版本**：v1.0.0  
**最后更新**：2024-01-XX  
**维护者**：架构团队
