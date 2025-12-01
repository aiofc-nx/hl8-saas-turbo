# API 端点查询层（Queries Layer）开发文档

## 1. 概述

查询层（Queries Layer）是 API 端点有界上下文的查询对象定义层，遵循 **CQRS（命令查询职责分离）模式**，定义了所有查询操作的查询对象。查询对象是只读的、不可变的，用于表示查询意图。

### 1.1 目录结构

```
queries/
├── endpoints.query.ts              # 端点树形查询
├── endpoints.by-ids.query.ts      # 根据 ID 列表查询
├── page-endpoints.query.ts        # 分页查询
└── README.md                       # 本文档
```

### 1.2 架构原则

1. **只读性**：查询对象是只读的，不修改系统状态
2. **不可变性**：查询对象是不可变的，创建后不能修改
3. **单一职责**：每个查询对象只表示一个查询意图
4. **类型安全**：使用 TypeScript 类型系统确保类型安全

### 1.3 CQRS 模式

CQRS（Command Query Responsibility Segregation）是一种架构模式，将数据修改操作（命令）和数据查询操作（查询）完全分离。

**查询的特点**：

- **只读**：查询不修改系统状态
- **幂等**：可以安全地重复执行
- **返回数据**：查询返回数据，不返回 void
- **无副作用**：查询不应该有副作用

## 2. 查询对象（Query Objects）

### 2.1 EndpointsQuery（端点树形查询）

#### 2.1.1 定义

查询所有需要权限控制的 API 端点，返回树形结构。

```typescript
export class EndpointsQuery implements IQuery {
  constructor() {}
}
```

#### 2.1.2 特点

- **无参数**：不需要任何参数，查询所有需要权限控制的端点
- **简单查询**：最简单的查询对象，只表示查询意图
- **树形结构**：返回结果组织成树形结构，按控制器分组

#### 2.1.3 返回类型

`Readonly<EndpointTreeProperties[]> | []`

- 返回树形结构的端点列表
- 如果没有任何端点则返回空数组
- 每个控制器作为父节点，其下的端点作为子节点

#### 2.1.4 使用场景

1. **权限分配界面**
   - 展示所有可分配的端点
   - 按控制器分组，方便选择

2. **接口文档树形展示**
   - 树形展示所有 API 端点
   - 按控制器组织，结构清晰

3. **权限管理界面**
   - 展示所有需要权限控制的端点
   - 用于权限配置和管理

#### 2.1.5 使用示例

```typescript
// 在 Controller 中使用
@Controller('api-endpoints')
export class ApiEndpointController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get('tree')
  async getEndpointsTree() {
    const query = new EndpointsQuery();
    return this.queryBus.execute(query);
  }
}
```

#### 2.1.6 处理流程

```
1. 创建 EndpointsQuery 实例
   ↓
2. 通过 QueryBus 发送查询
   ↓
3. EndpointsQueryHandler 接收查询
   ↓
4. 调用仓储接口查询所有需要权限控制的端点
   ↓
5. 将扁平化的端点列表转换为树形结构
   ↓
6. 返回树形结构的端点列表
```

### 2.2 FindEndpointsByIdsQuery（根据 ID 列表查询）

#### 2.2.1 定义

根据端点 ID 列表批量查询 API 端点信息。

```typescript
export class FindEndpointsByIdsQuery implements IQuery {
  constructor(readonly ids: string[]) {}
}
```

#### 2.2.2 特点

- **批量查询**：支持根据多个 ID 批量查询
- **必需参数**：`ids` 参数是必需的，不能为空数组
- **精确查询**：根据精确的 ID 列表查询

#### 2.2.3 参数说明

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `ids` | `string[]` | 是 | 要查询的端点 ID 数组 |

**参数验证**：

- `ids` 不能为 `null` 或 `undefined`
- `ids` 可以为空数组（返回空数组）
- `ids` 中的每个 ID 应该是有效的字符串

#### 2.2.4 返回类型

`EndpointProperties[]`

- 返回端点属性数组
- 如果某些 ID 不存在，则不会包含在结果中（不会抛出异常）
- 返回顺序可能与输入顺序不同

#### 2.2.5 使用场景

1. **权限分配**
   - 获取指定的端点详情
   - 用于权限配置界面

2. **批量操作**
   - 批量获取端点信息
   - 用于批量处理场景

3. **端点详情展示**
   - 根据选中的端点 ID 获取详情
   - 用于详情页面展示

#### 2.2.6 使用示例

```typescript
// 在 Controller 中使用
@Get('by-ids')
async getEndpointsByIds(@Query('ids') ids: string[]) {
  const query = new FindEndpointsByIdsQuery(ids);
  return this.queryBus.execute(query);
}

// 在应用层使用
async getSelectedEndpoints(ids: string[]) {
  const query = new FindEndpointsByIdsQuery(ids);
  return this.queryBus.execute(query);
}
```

#### 2.2.7 处理流程

```
1. 创建 FindEndpointsByIdsQuery 实例（传入 ID 数组）
   ↓
2. 通过 QueryBus 发送查询
   ↓
3. FindEndpointsByIdsQueryHandler 接收查询
   ↓
4. 调用仓储接口根据 ID 列表批量查询端点
   ↓
5. 返回端点属性数组
```

### 2.3 PageEndpointsQuery（分页查询）

#### 2.3.1 定义

分页查询 API 端点列表，支持多条件筛选。

```typescript
export class PageEndpointsQuery extends PaginationParams implements IQuery {
  readonly path?: string;
  readonly method?: string;
  readonly action?: string;
  readonly resource?: string;

  constructor(options: PageEndpointsQuery) {
    super();
    Object.assign(this, options);
  }
}
```

#### 2.3.2 特点

- **继承分页参数**：继承自 `PaginationParams`，提供分页功能
- **多条件筛选**：支持按路径、方法、操作、资源筛选
- **可选参数**：所有筛选条件都是可选的
- **灵活查询**：可以组合多个筛选条件

#### 2.3.3 参数说明

**分页参数**（继承自 `PaginationParams`）：

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `current` | `number` | 是 | 当前页码（从 1 开始） |
| `size` | `number` | 是 | 每页大小 |

**筛选参数**：

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `path` | `string` | 否 | 路径筛选条件，支持模糊查询 |
| `method` | `string` | 否 | HTTP 方法筛选（GET、POST、PUT、DELETE 等） |
| `action` | `string` | 否 | 操作类型筛选（read、write、delete 等） |
| `resource` | `string` | 否 | 资源类型筛选（user、role、domain 等） |

#### 2.3.4 返回类型

`PaginationResult<EndpointProperties>`

包含以下属性：

- `data: EndpointProperties[]` - 端点列表
- `total: number` - 总记录数
- `current: number` - 当前页码
- `size: number` - 每页大小

#### 2.3.5 使用场景

1. **端点管理界面列表展示**
   - 分页展示所有端点
   - 支持搜索和筛选

2. **端点搜索**
   - 根据路径、方法等条件搜索端点
   - 支持模糊查询

3. **接口文档列表展示**
   - 分页展示 API 端点
   - 支持按资源类型筛选

#### 2.3.6 使用示例

```typescript
// 在 Controller 中使用
@Get('page')
async pageEndpoints(
  @Query('current') current: number,
  @Query('size') size: number,
  @Query('path') path?: string,
  @Query('method') method?: string,
  @Query('action') action?: string,
  @Query('resource') resource?: string,
) {
  const query = new PageEndpointsQuery({
    current,
    size,
    path,
    method,
    action,
    resource,
  });
  return this.queryBus.execute(query);
}

// 在应用层使用
async searchEndpoints(
  page: number,
  pageSize: number,
  filters: {
    path?: string;
    method?: string;
    action?: string;
    resource?: string;
  },
) {
  const query = new PageEndpointsQuery({
    current: page,
    size: pageSize,
    ...filters,
  });
  return this.queryBus.execute(query);
}
```

#### 2.3.7 筛选条件说明

**路径筛选（path）**：

- 支持模糊查询（使用 `LIKE` 查询）
- 例如：`path: '/user'` 会匹配 `/api/users`、`/user/profile` 等

**方法筛选（method）**：

- 精确匹配
- 例如：`method: 'GET'` 只匹配 GET 请求

**操作筛选（action）**：

- 精确匹配
- 例如：`action: 'read'` 只匹配 read 操作

**资源筛选（resource）**：

- 支持模糊查询（使用 `LIKE` 查询）
- 例如：`resource: 'user'` 会匹配 `user`、`userRole` 等

#### 2.3.8 处理流程

```
1. 创建 PageEndpointsQuery 实例（传入分页参数和筛选条件）
   ↓
2. 通过 QueryBus 发送查询
   ↓
3. PageEndpointsQueryHandler 接收查询
   ↓
4. 调用仓储接口分页查询端点（仓储层处理筛选逻辑）
   ↓
5. 返回分页结果（包含端点列表和分页信息）
```

## 3. 查询设计原则

### 3.1 命名规范

1. **查询命名**：使用查询动词 + 名词，例如 `FindEndpointsByIdsQuery`
2. **类名后缀**：所有查询类以 `Query` 结尾
3. **业务语义**：查询名称应该表达业务意图

**示例**：

- ✅ `EndpointsQuery` - 查询端点
- ✅ `FindEndpointsByIdsQuery` - 根据 ID 列表查找端点
- ✅ `PageEndpointsQuery` - 分页查询端点
- ❌ `GetEndpointsQuery` - 避免使用 Get（不够明确）
- ❌ `QueryEndpoints` - 不符合命名规范

### 3.2 参数设计

1. **必需参数**：使用构造函数参数，类型为 `readonly`
2. **可选参数**：使用可选属性（`?`），在构造函数中通过对象传入
3. **类型安全**：使用明确的类型，避免使用 `any`

**示例**：

```typescript
// ✅ 好的设计
export class FindEndpointsByIdsQuery implements IQuery {
  constructor(readonly ids: string[]) {}
}

export class PageEndpointsQuery extends PaginationParams implements IQuery {
  readonly path?: string;
  readonly method?: string;

  constructor(options: PageEndpointsQuery) {
    super();
    Object.assign(this, options);
  }
}

// ❌ 不好的设计
export class BadQuery implements IQuery {
  ids: any; // 类型不明确
  path: string | undefined; // 应该使用可选属性
}
```

### 3.3 继承和组合

1. **继承分页参数**：分页查询继承 `PaginationParams`
2. **实现 IQuery**：所有查询必须实现 `IQuery` 接口
3. **避免过度继承**：不要继承业务相关的类

**示例**：

```typescript
// ✅ 好的设计
export class PageEndpointsQuery extends PaginationParams implements IQuery {
  // ...
}

// ❌ 不好的设计
export class PageEndpointsQuery extends BaseQuery implements IQuery {
  // 不应该继承业务相关的基类
}
```

## 4. 开发指南

### 4.1 创建新的查询对象

#### 步骤 1：定义查询类

```typescript
// queries/find-endpoint-by-path.query.ts
import { IQuery } from '@nestjs/cqrs';

/**
 * 根据路径和方法查找端点查询
 *
 * @description
 * CQRS 查询对象，用于根据路径和 HTTP 方法查找 API 端点。
 *
 * @implements {IQuery}
 */
export class FindEndpointByPathQuery implements IQuery {
  /**
   * 构造函数
   *
   * @param path - API 路径
   * @param method - HTTP 方法
   */
  constructor(
    readonly path: string,
    readonly method: string,
  ) {}
}
```

#### 步骤 2：创建查询处理器

```typescript
// application/query-handlers/find-endpoint-by-path.query.handler.ts
import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ApiEndpointReadRepoPortToken } from '../../constants';
import type { ApiEndpointReadRepoPort } from '../../ports/api-endpoint.read.repo-port';
import { FindEndpointByPathQuery } from '../../queries/find-endpoint-by-path.query';

@QueryHandler(FindEndpointByPathQuery)
export class FindEndpointByPathQueryHandler
  implements IQueryHandler<FindEndpointByPathQuery, EndpointProperties | null>
{
  @Inject(ApiEndpointReadRepoPortToken)
  private readonly repository: ApiEndpointReadRepoPort;

  async execute(query: FindEndpointByPathQuery): Promise<EndpointProperties | null> {
    return this.repository.findByPathAndMethod(query.path, query.method);
  }
}
```

#### 步骤 3：在仓储接口中添加方法（如果需要）

```typescript
// ports/api-endpoint.read.repo-port.ts
export interface ApiEndpointReadRepoPort {
  // ... 现有方法

  findByPathAndMethod(
    path: string,
    method: string,
  ): Promise<EndpointProperties | null>;
}
```

#### 步骤 4：注册查询处理器

```typescript
// api-endpoint.module.ts
@Module({
  providers: [
    // ... 其他处理器
    FindEndpointByPathQueryHandler,
  ],
})
export class ApiEndpointModule {}
```

### 4.2 创建分页查询

#### 步骤 1：定义分页查询类

```typescript
// queries/page-endpoints-by-resource.query.ts
import { IQuery } from '@nestjs/cqrs';
import { PaginationParams } from '@hl8/rest';

/**
 * 按资源分页查询端点
 *
 * @description
 * CQRS 查询对象，用于按资源类型分页查询 API 端点。
 *
 * @extends {PaginationParams}
 * @implements {IQuery}
 */
export class PageEndpointsByResourceQuery
  extends PaginationParams
  implements IQuery
{
  /**
   * 资源类型
   *
   * @description 用于按资源类型筛选端点
   */
  readonly resource: string;

  /**
   * 构造函数
   *
   * @param options - 查询选项，包含分页参数和资源类型
   */
  constructor(options: PageEndpointsByResourceQuery) {
    super();
    Object.assign(this, options);
  }
}
```

### 4.3 添加查询验证

如果需要添加查询参数验证，可以在查询类中添加验证逻辑：

```typescript
export class FindEndpointsByIdsQuery implements IQuery {
  constructor(readonly ids: string[]) {
    // 参数验证
    if (!ids || ids.length === 0) {
      throw new Error('IDs array cannot be empty');
    }
    if (ids.some((id) => !id || typeof id !== 'string')) {
      throw new Error('All IDs must be non-empty strings');
    }
  }
}
```

**注意**：通常验证逻辑放在应用层或基础设施层，而不是查询对象中。

## 5. 最佳实践

### 5.1 查询对象设计

1. **简单明了**：查询对象应该简单，只包含查询参数
2. **不可变**：所有属性使用 `readonly`，确保不可变性
3. **类型安全**：使用明确的类型，避免使用 `any`
4. **业务语义**：查询名称应该表达业务意图

### 5.2 参数设计

1. **必需参数**：使用构造函数参数
2. **可选参数**：使用可选属性，通过对象传入
3. **参数验证**：在应用层或基础设施层进行验证
4. **默认值**：避免在查询对象中设置默认值

### 5.3 命名规范

1. **查询动词**：使用 `Find`、`Page`、`Get` 等查询动词
2. **业务名词**：使用业务领域的名词
3. **后缀**：所有查询类以 `Query` 结尾
4. **清晰性**：名称应该清晰表达查询意图

### 5.4 继承和组合

1. **继承分页参数**：分页查询继承 `PaginationParams`
2. **实现 IQuery**：所有查询必须实现 `IQuery` 接口
3. **避免过度继承**：不要继承业务相关的类
4. **组合优于继承**：优先使用组合而不是继承

## 6. 测试指南

### 6.1 查询对象测试

```typescript
describe('EndpointsQuery', () => {
  it('should create query without parameters', () => {
    // Act
    const query = new EndpointsQuery();

    // Assert
    expect(query).toBeDefined();
  });
});

describe('FindEndpointsByIdsQuery', () => {
  it('should create query with ids', () => {
    // Arrange
    const ids = ['id1', 'id2', 'id3'];

    // Act
    const query = new FindEndpointsByIdsQuery(ids);

    // Assert
    expect(query.ids).toEqual(ids);
    expect(query.ids).toHaveLength(3);
  });

  it('should create query with empty ids array', () => {
    // Arrange
    const ids: string[] = [];

    // Act
    const query = new FindEndpointsByIdsQuery(ids);

    // Assert
    expect(query.ids).toEqual([]);
  });
});

describe('PageEndpointsQuery', () => {
  it('should create query with pagination and filters', () => {
    // Arrange
    const options = {
      current: 1,
      size: 10,
      path: '/user',
      method: 'GET',
      action: 'read',
      resource: 'user',
    };

    // Act
    const query = new PageEndpointsQuery(options);

    // Assert
    expect(query.current).toBe(1);
    expect(query.size).toBe(10);
    expect(query.path).toBe('/user');
    expect(query.method).toBe('GET');
    expect(query.action).toBe('read');
    expect(query.resource).toBe('user');
  });

  it('should create query with only pagination', () => {
    // Arrange
    const options = {
      current: 1,
      size: 10,
    };

    // Act
    const query = new PageEndpointsQuery(options);

    // Assert
    expect(query.current).toBe(1);
    expect(query.size).toBe(10);
    expect(query.path).toBeUndefined();
    expect(query.method).toBeUndefined();
  });
});
```

### 6.2 查询处理器测试

查询处理器的测试在应用层文档中说明，这里只测试查询对象本身。

## 7. 常见问题

### 7.1 查询对象和 DTO 的区别？

**回答**：

- **查询对象（Query）**：用于 CQRS 模式，表示查询意图，通过 QueryBus 发送
- **DTO（Data Transfer Object）**：用于数据传输，通常在 Controller 层使用

**使用场景**：

- 查询对象：应用层内部使用，通过 QueryBus 发送
- DTO：Controller 层使用，用于接收 HTTP 请求参数

### 7.2 查询对象可以包含业务逻辑吗？

**回答**：不建议。查询对象应该只包含查询参数，业务逻辑应该在查询处理器中。

**原因**：

1. **单一职责**：查询对象只负责表示查询意图
2. **可测试性**：简单的查询对象更容易测试
3. **可维护性**：业务逻辑集中在处理器中，更容易维护

### 7.3 查询对象可以继承其他类吗？

**回答**：可以，但应该谨慎使用。

**允许的继承**：

- 继承 `PaginationParams`（分页参数）
- 继承其他通用的参数类

**不允许的继承**：

- 继承业务相关的类
- 继承包含业务逻辑的类

### 7.4 查询对象需要验证参数吗？

**回答**：通常不需要。参数验证应该在以下层进行：

1. **Controller 层**：使用 DTO 和验证装饰器（如 `@IsString()`）
2. **应用层**：在查询处理器中进行业务验证
3. **基础设施层**：在仓储实现中进行数据验证

**例外情况**：

如果查询对象需要确保基本的数据完整性（如非空检查），可以在构造函数中进行简单验证。

## 8. 未来扩展

### 8.1 查询缓存

未来可以添加查询缓存支持：

```typescript
export class EndpointsQuery implements IQuery {
  readonly useCache?: boolean; // 是否使用缓存
  readonly cacheKey?: string; // 缓存键

  constructor(options?: { useCache?: boolean; cacheKey?: string }) {
    this.useCache = options?.useCache ?? true;
    this.cacheKey = options?.cacheKey;
  }
}
```

### 8.2 查询排序

未来可以添加查询排序支持：

```typescript
export class PageEndpointsQuery extends PaginationParams implements IQuery {
  // ... 现有属性

  readonly sortBy?: string; // 排序字段
  readonly sortOrder?: 'ASC' | 'DESC'; // 排序方向
}
```

### 8.3 查询聚合

未来可以添加查询聚合支持：

```typescript
export class AggregateEndpointsQuery implements IQuery {
  readonly groupBy?: string[]; // 分组字段
  readonly aggregate?: 'count' | 'sum' | 'avg'; // 聚合类型
}
```

## 9. 总结

查询层是 API 端点有界上下文的查询对象定义层，包含：

- **EndpointsQuery**：端点树形查询
- **FindEndpointsByIdsQuery**：根据 ID 列表查询
- **PageEndpointsQuery**：分页查询

遵循本文档的开发指南和最佳实践，可以确保查询层的代码质量、可维护性和可扩展性。

---

**文档版本**：v1.0.0  
**最后更新**：2024-01-XX  
**维护者**：开发团队

