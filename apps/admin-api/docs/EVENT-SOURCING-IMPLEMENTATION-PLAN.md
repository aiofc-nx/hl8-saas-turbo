# 事件溯源（Event Sourcing）实施技术方案

## 1. 概述

本文档描述了在现有 `admin-api` 项目基础上实施事件溯源（Event Sourcing, ES）的技术方案。该方案采用**渐进式实施**策略，在保持现有状态存储的基础上，增加事件存储功能，实现双写模式（Dual Write Pattern），确保系统平滑过渡。

### 1.1 实施目标

- ✅ 在现有 PostgreSQL 存储基础上增加事件存储
- ✅ 实现事件存储的端口适配器模式
- ✅ 保持现有状态存储功能不变（向后兼容）
- ✅ 支持从事件重建聚合根状态
- ✅ 提供事件查询和审计功能
- ✅ 为未来完全迁移到事件溯源做准备

### 1.2 实施原则

1. **渐进式实施**：不破坏现有功能，逐步增加 ES 能力
2. **双写模式**：同时保存状态和事件，确保数据一致性
3. **向后兼容**：现有代码继续工作，新功能可选启用
4. **可测试性**：每个组件都可以独立测试
5. **可扩展性**：为未来完全迁移到 ES 预留接口

## 2. 当前架构分析

### 2.1 现有实现

#### 2.1.1 事件发布流程

```typescript
// 当前实现：使用 NestJS CQRS EventPublisher
const user = new User(userCreateProperties);
await this.userWriteRepository.save(user);  // 保存状态
await user.created();                        // 创建领域事件
this.publisher.mergeObjectContext(user);    // 合并事件上下文
user.commit();                              // 发布事件（仅内存，不持久化）
```

**问题**：
- 事件只在内存中发布，不持久化
- 无法追溯历史事件
- 无法从事件重建状态
- 无法进行事件审计

#### 2.1.2 状态存储

```typescript
// 当前实现：直接保存聚合根状态
async save(user: User): Promise<void> {
  const userData = {
    ...user,
    password: user.password.getValue(),
  };
  const newUser = this.em.create('SysUser', userData);
  await this.em.persistAndFlush(newUser);
}
```

**特点**：
- 使用 MikroORM 保存到 PostgreSQL
- 只保存当前状态
- 历史变更不可追溯

### 2.2 架构改进方向

```
当前架构：
┌─────────────┐
│ 聚合根      │
│ (User)      │
└──────┬──────┘
       │
       ├──→ 状态存储 (PostgreSQL)
       │    └──→ sys_user 表
       │
       └──→ 事件发布 (内存)
            └──→ EventPublisher (不持久化)

改进后架构：
┌─────────────┐
│ 聚合根      │
│ (User)      │
└──────┬──────┘
       │
       ├──→ 状态存储 (PostgreSQL) ← 保持现有功能
       │    └──→ sys_user 表
       │
       └──→ 事件存储 (PostgreSQL) ← 新增功能
            └──→ domain_events 表
```

## 3. 技术方案设计

### 3.1 数据库设计

#### 3.1.1 事件存储表结构

```sql
-- 领域事件表
CREATE TABLE domain_events (
  -- 主键
  id VARCHAR(26) PRIMARY KEY,                    -- ULID
  
  -- 聚合信息
  aggregate_id VARCHAR(26) NOT NULL,              -- 聚合根 ID
  aggregate_type VARCHAR(100) NOT NULL,          -- 聚合类型（如 'User', 'Role'）
  
  -- 事件信息
  event_type VARCHAR(100) NOT NULL,               -- 事件类型（如 'UserCreatedEvent'）
  event_data JSONB NOT NULL,                     -- 事件数据（JSON 格式）
  
  -- 版本控制
  version INT NOT NULL,                          -- 事件版本（用于乐观锁）
  
  -- 元数据
  occurred_at TIMESTAMP NOT NULL DEFAULT NOW(),  -- 事件发生时间
  created_by VARCHAR(26),                        -- 创建者 ID
  correlation_id VARCHAR(26),                    -- 关联 ID（用于追踪）
  causation_id VARCHAR(26),                      -- 原因 ID（用于追踪事件链）
  
  -- 索引
  INDEX idx_aggregate (aggregate_id, aggregate_type),
  INDEX idx_event_type (event_type),
  INDEX idx_occurred_at (occurred_at),
  INDEX idx_version (aggregate_id, version)
);
```

#### 3.1.2 快照表结构（可选，用于性能优化）

```sql
-- 聚合快照表（用于加速重建）
CREATE TABLE aggregate_snapshots (
  id VARCHAR(26) PRIMARY KEY,
  aggregate_id VARCHAR(26) NOT NULL,
  aggregate_type VARCHAR(100) NOT NULL,
  snapshot_data JSONB NOT NULL,                  -- 快照数据
  version INT NOT NULL,                          -- 快照版本
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  UNIQUE (aggregate_id, aggregate_type),
  INDEX idx_aggregate (aggregate_id, aggregate_type)
);
```

### 3.2 领域层设计

#### 3.2.1 事件存储端口接口

```typescript
// src/lib/shared/ports/event-store.port.ts

/**
 * 事件存储端口接口
 *
 * @description
 * 定义事件存储的抽象接口，遵循端口适配器模式。
 * 实现类可以基于 PostgreSQL、MongoDB 或其他存储系统。
 */
export interface EventStorePort {
  /**
   * 保存事件
   *
   * @param aggregateId - 聚合根 ID
   * @param aggregateType - 聚合类型
   * @param event - 领域事件
   * @param version - 事件版本
   * @param metadata - 事件元数据（可选）
   */
  saveEvent(
    aggregateId: string,
    aggregateType: string,
    event: IEvent,
    version: number,
    metadata?: EventMetadata,
  ): Promise<void>;

  /**
   * 获取聚合的所有事件
   *
   * @param aggregateId - 聚合根 ID
   * @param aggregateType - 聚合类型
   * @param fromVersion - 起始版本（可选，默认从 0 开始）
   * @returns 事件列表
   */
  getEvents(
    aggregateId: string,
    aggregateType: string,
    fromVersion?: number,
  ): Promise<StoredEvent[]>;

  /**
   * 获取聚合的当前版本
   *
   * @param aggregateId - 聚合根 ID
   * @param aggregateType - 聚合类型
   * @returns 当前版本号，如果不存在返回 0
   */
  getCurrentVersion(
    aggregateId: string,
    aggregateType: string,
  ): Promise<number>;

  /**
   * 检查聚合是否存在
   *
   * @param aggregateId - 聚合根 ID
   * @param aggregateType - 聚合类型
   * @returns 是否存在
   */
  exists(
    aggregateId: string,
    aggregateType: string,
  ): Promise<boolean>;
}

/**
 * 存储的事件接口
 */
export interface StoredEvent {
  id: string;
  aggregateId: string;
  aggregateType: string;
  eventType: string;
  eventData: any;
  version: number;
  occurredAt: Date;
  createdBy?: string;
  correlationId?: string;
  causationId?: string;
}

/**
 * 事件元数据
 */
export interface EventMetadata {
  createdBy?: string;
  correlationId?: string;
  causationId?: string;
}
```

#### 3.2.2 扩展聚合根基类

```typescript
// src/lib/shared/domain/aggregate-root-with-es.ts

import { AggregateRoot } from '@nestjs/cqrs';
import type { EventStorePort } from '../ports/event-store.port';

/**
 * 支持事件溯源的聚合根基类
 *
 * @description
 * 扩展 NestJS CQRS 的 AggregateRoot，增加事件溯源能力。
 * 子类可以继承此类以获得事件溯源功能。
 */
export abstract class AggregateRootWithES extends AggregateRoot {
  protected _version: number = 0;
  protected _uncommittedEvents: IEvent[] = [];

  /**
   * 获取当前版本
   */
  get version(): number {
    return this._version;
  }

  /**
   * 获取未提交的事件
   */
  get uncommittedEvents(): IEvent[] {
    return [...this._uncommittedEvents];
  }

  /**
   * 应用事件（用于从事件重建状态）
   *
   * @param event - 领域事件
   */
  protected applyEvent(event: IEvent): void {
    this._version++;
    this.apply(event, true); // 应用事件但不添加到未提交列表
  }

  /**
   * 应用并记录事件
   *
   * @param event - 领域事件
   */
  protected applyAndRecord(event: IEvent): void {
    this._version++;
    this.apply(event, true);
    this._uncommittedEvents.push(event);
  }

  /**
   * 从事件重建聚合根
   *
   * @param eventStore - 事件存储端口
   * @param aggregateId - 聚合根 ID
   * @param AggregateClass - 聚合根类
   * @returns 重建的聚合根实例
   */
  static async fromEvents<T extends AggregateRootWithES>(
    eventStore: EventStorePort,
    aggregateId: string,
    AggregateClass: new (...args: any[]) => T,
  ): Promise<T> {
    const events = await eventStore.getEvents(
      aggregateId,
      AggregateClass.name,
    );

    // 创建聚合根实例（需要子类提供工厂方法）
    const aggregate = new AggregateClass();

    // 重放所有事件
    for (const storedEvent of events) {
      aggregate.applyEvent(storedEvent.eventData);
    }

    return aggregate;
  }

  /**
   * 标记事件已提交
   */
  markEventsAsCommitted(): void {
    this._uncommittedEvents = [];
  }
}
```

### 3.3 基础设施层设计

#### 3.3.1 事件存储实体

```typescript
// src/infra/entities/domain-event.entity.ts

import { Entity, PrimaryKey, Property, Index } from '@mikro-orm/core';

/**
 * 领域事件实体
 *
 * @description 用于持久化领域事件的数据库实体
 */
@Entity({ tableName: 'domain_events' })
@Index({ properties: ['aggregateId', 'aggregateType'] })
@Index({ properties: ['eventType'] })
@Index({ properties: ['occurredAt'] })
@Index({ properties: ['aggregateId', 'version'] })
export class DomainEvent {
  @PrimaryKey()
  id!: string;

  @Property()
  aggregateId!: string;

  @Property()
  aggregateType!: string;

  @Property()
  eventType!: string;

  @Property({ type: 'jsonb' })
  eventData!: any;

  @Property()
  version!: number;

  @Property()
  occurredAt: Date = new Date();

  @Property({ nullable: true })
  createdBy?: string;

  @Property({ nullable: true })
  correlationId?: string;

  @Property({ nullable: true })
  causationId?: string;
}
```

#### 3.3.2 事件存储适配器实现

```typescript
// src/infra/event-store/event-store.pg.adapter.ts

import { EntityManager } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { IEvent } from '@nestjs/cqrs';
import { UlidGenerator } from '@hl8/utils';
import type {
  EventStorePort,
  StoredEvent,
  EventMetadata,
} from '@/lib/shared/ports/event-store.port';
import { DomainEvent } from '../entities/domain-event.entity';

/**
 * PostgreSQL 事件存储适配器
 *
 * @description
 * 使用 PostgreSQL 和 MikroORM 实现事件存储。
 * 支持事件的保存、查询和版本控制。
 */
@Injectable()
export class EventStorePgAdapter implements EventStorePort {
  constructor(private readonly em: EntityManager) {}

  async saveEvent(
    aggregateId: string,
    aggregateType: string,
    event: IEvent,
    version: number,
    metadata?: EventMetadata,
  ): Promise<void> {
    const domainEvent = this.em.create(DomainEvent, {
      id: UlidGenerator.generate(),
      aggregateId,
      aggregateType,
      eventType: event.constructor.name,
      eventData: event,
      version,
      occurredAt: new Date(),
      createdBy: metadata?.createdBy,
      correlationId: metadata?.correlationId,
      causationId: metadata?.causationId,
    });

    await this.em.persistAndFlush(domainEvent);
  }

  async getEvents(
    aggregateId: string,
    aggregateType: string,
    fromVersion: number = 0,
  ): Promise<StoredEvent[]> {
    const events = await this.em.find(
      DomainEvent,
      {
        aggregateId,
        aggregateType,
        version: { $gte: fromVersion },
      },
      {
        orderBy: { version: 'ASC' },
      },
    );

    return events.map((e) => ({
      id: e.id,
      aggregateId: e.aggregateId,
      aggregateType: e.aggregateType,
      eventType: e.eventType,
      eventData: e.eventData,
      version: e.version,
      occurredAt: e.occurredAt,
      createdBy: e.createdBy,
      correlationId: e.correlationId,
      causationId: e.causationId,
    }));
  }

  async getCurrentVersion(
    aggregateId: string,
    aggregateType: string,
  ): Promise<number> {
    const lastEvent = await this.em.findOne(
      DomainEvent,
      {
        aggregateId,
        aggregateType,
      },
      {
        orderBy: { version: 'DESC' },
        fields: ['version'],
      },
    );

    return lastEvent?.version ?? 0;
  }

  async exists(aggregateId: string, aggregateType: string): Promise<boolean> {
    const count = await this.em.count(DomainEvent, {
      aggregateId,
      aggregateType,
    });
    return count > 0;
  }
}
```

### 3.4 应用层设计

#### 3.4.1 事件存储服务

```typescript
// src/lib/shared/application/services/event-store.service.ts

import { Injectable, Inject } from '@nestjs/common';
import { EventPublisher } from '@nestjs/cqrs';
import type { EventStorePort } from '../ports/event-store.port';
import { EventStorePortToken } from '../constants';

/**
 * 事件存储服务
 *
 * @description
 * 协调事件存储和事件发布，实现双写模式。
 * 同时保存事件到事件存储和发布到事件总线。
 */
@Injectable()
export class EventStoreService {
  constructor(
    @Inject(EventStorePortToken)
    private readonly eventStore: EventStorePort,
    private readonly publisher: EventPublisher,
  ) {}

  /**
   * 保存事件并发布
   *
   * @param aggregateId - 聚合根 ID
   * @param aggregateType - 聚合类型
   * @param event - 领域事件
   * @param version - 事件版本
   * @param metadata - 事件元数据
   */
  async saveAndPublish(
    aggregateId: string,
    aggregateType: string,
    event: IEvent,
    version: number,
    metadata?: EventMetadata,
  ): Promise<void> {
    // 1. 保存到事件存储
    await this.eventStore.saveEvent(
      aggregateId,
      aggregateType,
      event,
      version,
      metadata,
    );

    // 2. 发布到事件总线（保持现有功能）
    this.publisher.publish(event);
  }
}
```

#### 3.4.2 修改命令处理器

```typescript
// src/lib/bounded-contexts/iam/authentication/application/command-handlers/user-create.command.handler.ts

import { Inject } from '@nestjs/common';
import { CommandHandler, EventPublisher, ICommandHandler } from '@nestjs/cqrs';
import { EventStoreService } from '@/lib/shared/application/services/event-store.service';
// ... 其他导入

@CommandHandler(UserCreateCommand)
export class UserCreateHandler implements ICommandHandler<UserCreateCommand, void> {
  constructor(
    private readonly publisher: EventPublisher,
    private readonly eventStoreService: EventStoreService, // 新增
    @Inject(UserWriteRepoPortToken)
    private readonly userWriteRepository: UserWriteRepoPort,
    @Inject(UserReadRepoPortToken)
    private readonly userReadRepoPort: UserReadRepoPort,
  ) {}

  async execute(command: UserCreateCommand) {
    // ... 验证逻辑 ...

    const user = new User(userCreateProperties);
    
    // 1. 保存状态（保持现有功能）
    await this.userWriteRepository.save(user);
    
    // 2. 创建并保存事件（新增功能）
    await user.created();
    const events = user.uncommittedEvents;
    
    for (const event of events) {
      await this.eventStoreService.saveAndPublish(
        user.id,
        'User',
        event,
        user.version,
        {
          createdBy: command.uid,
          correlationId: command.correlationId, // 如果命令中有
        },
      );
    }
    
    // 3. 标记事件已提交
    user.markEventsAsCommitted();
    
    // 4. 合并事件上下文（保持现有功能）
    this.publisher.mergeObjectContext(user);
    user.commit();
  }
}
```

### 3.5 模块配置

#### 3.5.1 事件存储模块

```typescript
// src/infra/event-store/event-store.module.ts

import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { EventStorePgAdapter } from './event-store.pg.adapter';
import { DomainEvent } from '../entities/domain-event.entity';
import { EventStorePortToken } from '@/lib/shared/constants';

@Module({
  imports: [MikroOrmModule.forFeature([DomainEvent])],
  providers: [
    {
      provide: EventStorePortToken,
      useClass: EventStorePgAdapter,
    },
  ],
  exports: [EventStorePortToken],
})
export class EventStoreModule {}
```

#### 3.5.2 共享模块更新

```typescript
// src/lib/shared/shared.module.ts

import { Module } from '@nestjs/common';
import { EventStoreModule } from '@/infra/event-store/event-store.module';
import { EventStoreService } from './application/services/event-store.service';

@Module({
  imports: [EventStoreModule],
  providers: [EventStoreService],
  exports: [EventStoreService],
})
export class SharedModule {}
```

## 4. 实施步骤

### 阶段 1：基础设施准备（1-2 天）

1. ✅ 创建数据库迁移脚本
   - 创建 `domain_events` 表
   - 创建必要的索引
   - 可选：创建 `aggregate_snapshots` 表

2. ✅ 创建领域层接口
   - 创建 `EventStorePort` 接口
   - 创建 `AggregateRootWithES` 基类
   - 定义相关类型和常量

3. ✅ 创建基础设施层实现
   - 创建 `DomainEvent` 实体
   - 实现 `EventStorePgAdapter`
   - 创建 `EventStoreModule`

### 阶段 2：应用层集成（2-3 天）

4. ✅ 创建事件存储服务
   - 实现 `EventStoreService`
   - 集成到共享模块

5. ✅ 修改现有聚合根
   - 将 `User` 继承改为 `AggregateRootWithES`
   - 更新事件应用逻辑
   - 添加版本控制

6. ✅ 修改命令处理器
   - 更新 `UserCreateHandler`
   - 更新 `UserUpdateHandler`
   - 更新 `UserDeleteHandler`
   - 其他聚合的命令处理器

### 阶段 3：测试和验证（2-3 天）

7. ✅ 单元测试
   - 测试 `EventStorePort` 实现
   - 测试 `EventStoreService`
   - 测试聚合根事件应用

8. ✅ 集成测试
   - 测试事件保存和查询
   - 测试从事件重建聚合根
   - 测试双写模式一致性

9. ✅ 端到端测试
   - 测试完整的用户创建流程
   - 验证事件和状态的一致性

### 阶段 4：文档和优化（1-2 天）

10. ✅ 性能优化
    - 添加事件查询缓存（可选）
    - 实现快照机制（可选）
    - 优化索引

11. ✅ 文档更新
    - 更新架构文档
    - 更新开发指南
    - 添加使用示例

## 5. 数据库迁移脚本

```sql
-- migrations/XXXXXX_add_event_sourcing.sql

-- 创建领域事件表
CREATE TABLE IF NOT EXISTS domain_events (
  id VARCHAR(26) PRIMARY KEY,
  aggregate_id VARCHAR(26) NOT NULL,
  aggregate_type VARCHAR(100) NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  event_data JSONB NOT NULL,
  version INT NOT NULL,
  occurred_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_by VARCHAR(26),
  correlation_id VARCHAR(26),
  causation_id VARCHAR(26)
);

-- 创建索引
CREATE INDEX idx_domain_events_aggregate 
  ON domain_events(aggregate_id, aggregate_type);

CREATE INDEX idx_domain_events_event_type 
  ON domain_events(event_type);

CREATE INDEX idx_domain_events_occurred_at 
  ON domain_events(occurred_at);

CREATE INDEX idx_domain_events_version 
  ON domain_events(aggregate_id, version);

-- 可选：创建快照表
CREATE TABLE IF NOT EXISTS aggregate_snapshots (
  id VARCHAR(26) PRIMARY KEY,
  aggregate_id VARCHAR(26) NOT NULL,
  aggregate_type VARCHAR(100) NOT NULL,
  snapshot_data JSONB NOT NULL,
  version INT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (aggregate_id, aggregate_type)
);

CREATE INDEX idx_aggregate_snapshots_aggregate 
  ON aggregate_snapshots(aggregate_id, aggregate_type);
```

## 6. 使用示例

### 6.1 从事件重建聚合根

```typescript
// 示例：从事件重建用户
const eventStore = await app.get(EventStorePortToken);
const user = await AggregateRootWithES.fromEvents(
  eventStore,
  userId,
  User,
);
```

### 6.2 查询事件历史

```typescript
// 查询用户的所有事件
const events = await eventStore.getEvents(userId, 'User');

// 查询特定版本之后的事件
const recentEvents = await eventStore.getEvents(userId, 'User', 10);
```

### 6.3 事件审计

```typescript
// 查询特定类型的事件
const userCreatedEvents = await em.find(DomainEvent, {
  eventType: 'UserCreatedEvent',
  occurredAt: { $gte: startDate, $lte: endDate },
});
```

## 7. 注意事项

### 7.1 性能考虑

- **事件表增长**：事件表会持续增长，需要定期归档或清理
- **重建性能**：大量事件可能导致重建缓慢，考虑使用快照
- **索引优化**：根据查询模式优化索引

### 7.2 数据一致性

- **双写一致性**：确保状态和事件同时保存成功
- **事务处理**：使用数据库事务确保原子性
- **错误处理**：处理部分失败的情况

### 7.3 向后兼容

- **现有功能**：保持现有状态存储功能不变
- **渐进迁移**：可以逐步迁移各个聚合到 ES
- **回滚方案**：如果出现问题，可以禁用 ES 功能

## 8. 未来扩展

### 8.1 完全迁移到 ES

- 移除状态存储，只使用事件存储
- 使用读模型（Read Model）提供查询能力
- 实现 CQRS 的完整分离

### 8.2 事件重放

- 实现事件重放功能
- 支持时间旅行查询
- 支持事件回放和修复

### 8.3 事件流处理

- 集成事件流（如 Kafka）
- 实现事件溯源与事件流的桥接
- 支持跨服务事件溯源

## 9. 总结

本技术方案采用渐进式实施策略，在保持现有功能的基础上，增加事件溯源能力。通过双写模式，确保系统平滑过渡，为未来完全迁移到事件溯源做好准备。

**关键优势**：
- ✅ 不破坏现有功能
- ✅ 可以逐步实施
- ✅ 支持完整的历史追溯
- ✅ 为未来扩展预留空间

**实施时间估算**：6-10 个工作日

**风险等级**：低（采用双写模式，可以随时回滚）

