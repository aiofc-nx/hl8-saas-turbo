# API 端点端口层（Ports Layer）开发文档

## 1. 概述

端口层（Ports Layer）是 API 端点有界上下文的接口定义层，遵循**端口适配器模式（Port and Adapter Pattern）**，定义了应用层需要的数据访问接口。该层不包含具体实现，只定义契约，由基础设施层提供具体实现。

### 1.1 目录结构

```
ports/
├── api-endpoint.write.repo-port.ts   # 写入仓储端口接口
├── api-endpoint.read.repo-port.ts    # 读取仓储端口接口
└── README.md                         # 本文档
```

### 1.2 架构原则

1. **依赖倒置**：应用层依赖抽象接口，不依赖具体实现
2. **接口隔离**：读写操作分离，定义独立的接口
3. **单一职责**：每个端口接口只负责一种类型的操作
4. **可替换性**：可以轻松替换实现（如从 PostgreSQL 切换到 MongoDB）

### 1.3 端口适配器模式

端口适配器模式是 Clean Architecture 的核心机制：

- **端口（Port）**：在应用层定义的接口，表示"需要什么功能"
- **适配器（Adapter）**：在基础设施层实现的类，表示"如何实现"

**优势**：

- 应用层不依赖具体实现，只依赖抽象接口
- 可以轻松替换实现（如从 PostgreSQL 切换到 MongoDB）
- 便于测试（可以使用 Mock 实现）

## 2. 写入仓储端口（Write Repository Port）

### 2.1 ApiEndpointWriteRepoPort（写入仓储端口接口）

#### 2.1.1 定义

定义 API 端点的写入操作接口，用于持久化 API 端点数据。

```typescript
export interface ApiEndpointWriteRepoPort {
  save(endpoints: ApiEndpoint[]): Promise<void>;
}
```

#### 2.1.2 职责

- **数据持久化**：负责将 API 端点聚合根保存到数据库
- **批量操作**：支持批量保存端点，提高性能
- **事务管理**：确保数据一致性（由实现层处理）

#### 2.1.3 方法说明

##### save(endpoints: ApiEndpoint[]): Promise<void>

**功能**：批量保存 API 端点到数据库

**参数**：

| 参数名 | 类型 | 说明 |
|--------|------|------|
| `endpoints` | `ApiEndpoint[]` | 要保存的 API 端点聚合根数组 |

**返回**：`Promise<void>` - 保存成功时返回，失败时抛出异常

**行为说明**：

1. **批量保存**：一次性保存多个端点，提高性能
2. **更新或插入**：如果端点已存在则更新，不存在则插入
3. **删除不存在的端点**：删除数据库中不存在于输入数组中的端点
4. **事务保证**：使用数据库事务确保操作的原子性

**异常**：

- 当保存操作失败时抛出异常
- 当数据库连接失败时抛出异常

#### 2.1.4 使用场景

1. **系统启动时自动收集**
   - 系统启动时扫描所有控制器和路由
   - 批量保存收集到的端点

2. **端点信息更新**
   - 当端点信息发生变化时，重新保存端点

#### 2.1.5 实现示例

**PostgreSQL 实现**：

```typescript
@Injectable()
export class ApiEndpointWriteRepository implements ApiEndpointWriteRepoPort {
  constructor(private readonly em: EntityManager) {}

  async save(endpoints: ApiEndpoint[]): Promise<void> {
    await this.em.transactional(async (em) => {
      // 1. 查询现有端点
      const existingEndpoints = await em.find('SysEndpoint', {});
      const existingIds = existingEndpoints.map((ep: any) => ep.id);
      const newIds = endpoints.map((ep) => ep.id);
      const idsToDelete = existingIds.filter((id) => !newIds.includes(id));

      // 2. 删除不存在的端点
      if (idsToDelete.length > 0) {
        await em.nativeDelete('SysEndpoint', { id: { $in: idsToDelete } });
      }

      // 3. 批量更新或插入端点
      for (const endpoint of endpoints) {
        const existing = await em.findOne('SysEndpoint', { id: endpoint.id });
        if (existing) {
          await em.nativeUpdate('SysEndpoint', { id: endpoint.id }, { /* 更新数据 */ });
        } else {
          const newEndpoint = em.create('SysEndpoint', { /* 创建数据 */ });
          await em.persist(newEndpoint);
        }
      }

      await em.flush();
    });
  }
}
```

**MongoDB 实现（示例）**：

```typescript
@Injectable()
export class ApiEndpointWriteMongoRepository implements ApiEndpointWriteRepoPort {
  constructor(private readonly collection: Collection) {}

  async save(endpoints: ApiEndpoint[]): Promise<void> {
    const session = this.collection.startSession();
    try {
      await session.withTransaction(async () => {
        // MongoDB 实现逻辑
      });
    } finally {
      await session.endSession();
    }
  }
}
```

#### 2.1.6 端口令牌（Port Token）

**定义**：

```typescript
export const ApiEndpointWriteRepoPortToken = Symbol('ApiEndpointWriteRepoPort');
```

**用途**：用于依赖注入，标识写入仓储端口的实现

**注册方式**：

```typescript
@Module({
  providers: [
    {
      provide: ApiEndpointWriteRepoPortToken,
      useClass: ApiEndpointWriteRepository, // 具体实现
    },
  ],
})
export class ApiEndpointInfraModule {}
```

**注入方式**：

```typescript
@CommandHandler(UserCreateCommand)
export class UserCreateHandler {
  @Inject(ApiEndpointWriteRepoPortToken)
  private readonly endpointWriteRepo: ApiEndpointWriteRepoPort;
}
```

## 3. 读取仓储端口（Read Repository Port）

### 3.1 ApiEndpointReadRepoPort（读取仓储端口接口）

#### 3.1.1 定义

定义 API 端点的读取操作接口，用于查询 API 端点数据。

```typescript
export interface ApiEndpointReadRepoPort {
  pageEndpoints(query: PageEndpointsQuery): Promise<PaginationResult<EndpointProperties>>;
  findEndpointsByIds(ids: string[]): Promise<EndpointProperties[]>;
  findAll(): Promise<EndpointProperties[]>;
  findAllPermissionApi(): Promise<EndpointProperties[]>;
}
```

#### 3.1.2 职责

- **数据查询**：负责从数据库查询 API 端点数据
- **查询优化**：支持多种查询方式，满足不同业务需求
- **数据转换**：将数据库实体转换为领域模型（读模型）

#### 3.1.3 方法说明

##### pageEndpoints(query: PageEndpointsQuery): Promise<PaginationResult<EndpointProperties>>

**功能**：分页查询 API 端点列表，支持多条件筛选

**参数**：

| 参数名 | 类型 | 说明 |
|--------|------|------|
| `query` | `PageEndpointsQuery` | 分页查询对象，包含分页参数和筛选条件 |

**查询条件**：

- `page: number` - 页码（从 1 开始）
- `pageSize: number` - 每页大小
- `path?: string` - 路径筛选条件，支持模糊查询
- `method?: string` - HTTP 方法筛选（GET、POST、PUT、DELETE 等）
- `action?: string` - 操作类型筛选（read、write、delete 等）
- `resource?: string` - 资源类型筛选（user、role、domain 等）

**返回**：`Promise<PaginationResult<EndpointProperties>>` - 分页结果，包含端点列表和分页信息

**使用场景**：

- 端点管理界面列表展示
- 端点搜索和筛选
- 接口文档列表展示

##### findEndpointsByIds(ids: string[]): Promise<EndpointProperties[]>

**功能**：根据端点 ID 列表批量查询 API 端点信息

**参数**：

| 参数名 | 类型 | 说明 |
|--------|------|------|
| `ids` | `string[]` | 端点 ID 数组 |

**返回**：`Promise<EndpointProperties[]>` - 端点属性数组，如果某些 ID 不存在则不会包含在结果中

**行为说明**：

- 批量查询指定 ID 的端点
- 不存在的 ID 不会包含在结果中（不会抛出异常）
- 返回顺序可能与输入顺序不同

**使用场景**：

- 权限分配时获取指定的端点详情
- 批量操作时获取端点信息

##### findAll(): Promise<EndpointProperties[]>

**功能**：查询所有 API 端点

**参数**：无

**返回**：`Promise<EndpointProperties[]>` - 所有端点的属性数组

**使用场景**：

- 需要获取所有端点的场景
- 数据导出
- 统计分析

**注意事项**：

- 如果端点数量很大，可能影响性能
- 建议使用分页查询替代

##### findAllPermissionApi(): Promise<EndpointProperties[]>

**功能**：查询所有需要权限控制的 API 端点

**参数**：无

**返回**：`Promise<EndpointProperties[]>` - 需要权限控制的端点属性数组

**筛选条件**：

- `action` 不为空字符串
- `resource` 不为空字符串

**使用场景**：

- 权限分配界面展示所有可分配的端点
- 接口文档树形展示
- 权限管理界面

#### 3.1.4 实现示例

**PostgreSQL 实现**：

```typescript
@Injectable()
export class ApiEndpointReadRepository implements ApiEndpointReadRepoPort {
  constructor(private readonly em: EntityManager) {}

  async pageEndpoints(
    query: PageEndpointsQuery,
  ): Promise<PaginationResult<EndpointProperties>> {
    const where: FilterQuery<any> = {};

    // 构建查询条件
    if (query.path) {
      where.path = { $like: `%${query.path}%` };
    }
    if (query.method) {
      where.method = query.method;
    }
    // ... 其他条件

    const [endpoints, total] = await this.em.findAndCount(
      'SysEndpoint',
      where,
      {
        limit: query.size,
        offset: (query.current - 1) * query.size,
        orderBy: [{ createdAt: 'ASC' }],
      },
    );

    return new PaginationResult<EndpointProperties>(
      query.current,
      query.size,
      total,
      endpoints as EndpointProperties[],
    );
  }

  async findEndpointsByIds(ids: string[]): Promise<EndpointProperties[]> {
    const endpoints = await this.em.find('SysEndpoint', {
      id: { $in: ids },
    } as FilterQuery<any>);
    return endpoints as EndpointProperties[];
  }

  async findAll(): Promise<EndpointProperties[]> {
    const endpoints = await this.em.find('SysEndpoint', {} as FilterQuery<any>);
    return endpoints as EndpointProperties[];
  }

  async findAllPermissionApi(): Promise<EndpointProperties[]> {
    const endpoints = await this.em.find('SysEndpoint', {
      $and: [
        { action: { $ne: '' } },
        { resource: { $ne: '' } },
      ],
    } as FilterQuery<any>);
    return endpoints as EndpointProperties[];
  }
}
```

#### 3.1.5 端口令牌（Port Token）

**定义**：

```typescript
export const ApiEndpointReadRepoPortToken = Symbol('ApiEndpointReadRepoPort');
```

**用途**：用于依赖注入，标识读取仓储端口的实现

**注册方式**：

```typescript
@Module({
  providers: [
    {
      provide: ApiEndpointReadRepoPortToken,
      useClass: ApiEndpointReadRepository, // 具体实现
    },
  ],
})
export class ApiEndpointInfraModule {}
```

**注入方式**：

```typescript
@QueryHandler(EndpointsQuery)
export class EndpointsQueryHandler {
  @Inject(ApiEndpointReadRepoPortToken)
  private readonly repository: ApiEndpointReadRepoPort;
}
```

## 4. 端口令牌（Port Tokens）

### 4.1 定义位置

端口令牌定义在 `constants.ts` 文件中：

```typescript
export const ApiEndpointWriteRepoPortToken = Symbol('ApiEndpointWriteRepoPort');
export const ApiEndpointReadRepoPortToken = Symbol('ApiEndpointReadRepoPort');
```

### 4.2 为什么使用 Symbol？

使用 `Symbol` 作为令牌的原因：

1. **唯一性**：每个 Symbol 都是唯一的，避免命名冲突
2. **类型安全**：TypeScript 可以正确推断类型
3. **不可变**：Symbol 是不可变的，确保令牌的唯一性

### 4.3 使用方式

#### 4.3.1 在基础设施层注册

```typescript
@Module({
  providers: [
    {
      provide: ApiEndpointWriteRepoPortToken,
      useClass: ApiEndpointWriteRepository,
    },
    {
      provide: ApiEndpointReadRepoPortToken,
      useClass: ApiEndpointReadRepository,
    },
  ],
})
export class ApiEndpointInfraModule {}
```

#### 4.3.2 在应用层注入

```typescript
@QueryHandler(EndpointsQuery)
export class EndpointsQueryHandler {
  @Inject(ApiEndpointReadRepoPortToken)
  private readonly repository: ApiEndpointReadRepoPort;
}
```

## 5. 开发指南

### 5.1 创建新的端口接口

#### 步骤 1：定义端口接口

```typescript
// ports/my-repo-port.ts
/**
 * 我的仓储端口
 *
 * @description 定义我的仓储操作接口
 */
export interface MyRepoPort {
  /**
   * 查询方法
   */
  findById(id: string): Promise<MyProperties>;
}
```

#### 步骤 2：定义端口令牌

```typescript
// constants.ts
export const MyRepoPortToken = Symbol('MyRepoPort');
```

#### 步骤 3：在基础设施层实现

```typescript
// infra/repository/my-repo.repository.ts
@Injectable()
export class MyRepository implements MyRepoPort {
  async findById(id: string): Promise<MyProperties> {
    // 实现逻辑
  }
}
```

#### 步骤 4：注册端口实现

```typescript
@Module({
  providers: [
    {
      provide: MyRepoPortToken,
      useClass: MyRepository,
    },
  ],
})
export class MyInfraModule {}
```

### 5.2 添加新的查询方法

#### 步骤 1：在端口接口中添加方法

```typescript
export interface ApiEndpointReadRepoPort {
  // ... 现有方法

  /**
   * 根据路径和方法查找端点
   */
  findByPathAndMethod(
    path: string,
    method: string,
  ): Promise<EndpointProperties | null>;
}
```

#### 步骤 2：在实现类中实现方法

```typescript
export class ApiEndpointReadRepository implements ApiEndpointReadRepoPort {
  // ... 现有方法

  async findByPathAndMethod(
    path: string,
    method: string,
  ): Promise<EndpointProperties | null> {
    const endpoint = await this.em.findOne('SysEndpoint', {
      path,
      method,
    } as FilterQuery<any>);
    return endpoint as EndpointProperties | null;
  }
}
```

### 5.3 替换端口实现

如果需要替换端口实现（如从 PostgreSQL 切换到 MongoDB）：

#### 步骤 1：创建新的实现类

```typescript
@Injectable()
export class ApiEndpointMongoRepository implements ApiEndpointReadRepoPort {
  // MongoDB 实现
}
```

#### 步骤 2：更新模块注册

```typescript
@Module({
  providers: [
    {
      provide: ApiEndpointReadRepoPortToken,
      useClass: ApiEndpointMongoRepository, // 替换实现
    },
  ],
})
export class ApiEndpointInfraModule {}
```

**优势**：应用层代码无需修改，只需要替换实现即可。

## 6. 最佳实践

### 6.1 端口接口设计

1. **接口隔离**：读写操作分离，定义独立的接口
2. **方法命名**：使用清晰的业务语义命名方法
3. **参数类型**：使用领域模型类型，不直接使用数据库实体类型
4. **返回类型**：返回领域模型类型（读模型），不返回数据库实体

### 6.2 端口令牌管理

1. **统一管理**：所有端口令牌定义在 `constants.ts` 中
2. **命名规范**：使用 `{PortName}Token` 命名
3. **类型导出**：导出端口接口类型，方便类型推断

### 6.3 实现类设计

1. **单一职责**：每个实现类只实现一个端口接口
2. **错误处理**：适当的错误处理和异常抛出
3. **事务管理**：写入操作使用事务确保一致性
4. **性能优化**：批量操作、索引优化等

### 6.4 依赖注入

1. **使用令牌注入**：使用端口令牌而不是直接注入实现类
2. **类型安全**：使用接口类型而不是实现类类型
3. **可选注入**：使用 `@Optional()` 装饰器支持可选依赖

## 7. 测试指南

### 7.1 端口接口测试

端口接口本身不需要测试（因为只是接口定义），但需要测试实现类。

### 7.2 实现类测试

```typescript
describe('ApiEndpointReadRepository', () => {
  let repository: ApiEndpointReadRepository;
  let em: jest.Mocked<EntityManager>;

  beforeEach(() => {
    em = {
      find: jest.fn(),
      findAndCount: jest.fn(),
      findOne: jest.fn(),
    } as any;

    repository = new ApiEndpointReadRepository(em);
  });

  it('should find endpoints by ids', async () => {
    // Arrange
    const ids = ['id1', 'id2'];
    const mockEndpoints = [/* mock data */];
    em.find.mockResolvedValue(mockEndpoints);

    // Act
    const result = await repository.findEndpointsByIds(ids);

    // Assert
    expect(result).toEqual(mockEndpoints);
    expect(em.find).toHaveBeenCalledWith('SysEndpoint', {
      id: { $in: ids },
    });
  });
});
```

### 7.3 Mock 端口接口

在应用层测试中使用 Mock：

```typescript
describe('EndpointsQueryHandler', () => {
  let handler: EndpointsQueryHandler;
  let repository: jest.Mocked<ApiEndpointReadRepoPort>;

  beforeEach(() => {
    repository = {
      findAllPermissionApi: jest.fn(),
    } as any;

    handler = new EndpointsQueryHandler();
    (handler as any).repository = repository;
  });

  it('should return tree structure', async () => {
    // Arrange
    const endpoints = [/* mock data */];
    repository.findAllPermissionApi.mockResolvedValue(endpoints);

    // Act
    const result = await handler.execute(new EndpointsQuery());

    // Assert
    expect(result).toBeDefined();
    expect(repository.findAllPermissionApi).toHaveBeenCalled();
  });
});
```

## 8. 常见问题

### 8.1 为什么需要端口接口？

**回答**：端口接口实现了依赖倒置原则，带来以下好处：

1. **解耦**：应用层不依赖具体实现，只依赖抽象接口
2. **可替换性**：可以轻松替换实现（如从 PostgreSQL 切换到 MongoDB）
3. **可测试性**：可以使用 Mock 实现进行测试
4. **灵活性**：可以为不同环境提供不同实现

### 8.2 端口接口和实现类应该放在哪里？

**回答**：

- **端口接口**：放在 `lib/bounded-contexts/{context}/ports/` 目录
- **实现类**：放在 `infra/bounded-contexts/{context}/repository/` 目录

这样符合 Clean Architecture 的分层原则。

### 8.3 什么时候需要创建新的端口接口？

**回答**：在以下情况下需要创建新的端口接口：

1. **新的数据访问需求**：需要访问新的数据源或服务
2. **读写分离**：读写操作需要不同的优化策略
3. **接口隔离**：接口职责不同，需要分离

### 8.4 端口接口可以继承吗？

**回答**：可以，但不推荐。原因：

1. **接口组合**：使用接口组合而不是继承
2. **灵活性**：组合更灵活，可以按需组合接口
3. **清晰性**：组合使接口职责更清晰

**如果确实需要继承**：

```typescript
export interface BaseRepoPort {
  findById(id: string): Promise<any>;
}

export interface ApiEndpointReadRepoPort extends BaseRepoPort {
  pageEndpoints(query: PageEndpointsQuery): Promise<PaginationResult<EndpointProperties>>;
}
```

## 9. 未来扩展

### 9.1 缓存端口

未来可以添加缓存端口接口：

```typescript
export interface ApiEndpointCachePort {
  get(key: string): Promise<EndpointProperties | null>;
  set(key: string, value: EndpointProperties, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
}
```

### 9.2 搜索端口

未来可以添加搜索端口接口（如 Elasticsearch）：

```typescript
export interface ApiEndpointSearchPort {
  search(query: string): Promise<EndpointProperties[]>;
  index(endpoint: ApiEndpoint): Promise<void>;
  deleteIndex(id: string): Promise<void>;
}
```

### 9.3 事件端口

未来可以添加事件端口接口：

```typescript
export interface ApiEndpointEventPort {
  publish(event: ApiEndpointEvent): Promise<void>;
  subscribe(handler: (event: ApiEndpointEvent) => void): Promise<void>;
}
```

## 10. 总结

端口层是 API 端点有界上下文的接口定义层，包含：

- **写入仓储端口**：`ApiEndpointWriteRepoPort` - 定义写入操作接口
- **读取仓储端口**：`ApiEndpointReadRepoPort` - 定义读取操作接口
- **端口令牌**：用于依赖注入的符号令牌

遵循本文档的开发指南和最佳实践，可以确保端口层的代码质量、可维护性和可扩展性。

---

**文档版本**：v1.0.0  
**最后更新**：2024-01-XX  
**维护者**：开发团队

