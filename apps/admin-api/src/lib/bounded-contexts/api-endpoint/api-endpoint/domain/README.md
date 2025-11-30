# API 端点领域层（Domain Layer）开发文档

## 1. 概述

领域层（Domain Layer）是 API 端点有界上下文的核心业务逻辑层，包含领域模型、业务规则和领域概念。本层采用 **领域驱动设计（DDD）** 和 **Clean Architecture** 原则，确保业务逻辑独立于技术实现。

### 1.1 目录结构

```
domain/
├── api-endpoint.model.ts      # API 端点聚合根
├── endpoint.read.model.ts     # 端点读模型和类型定义
└── README.md                  # 本文档
```

### 1.2 架构原则

1. **业务逻辑独立**：领域层不依赖任何外部框架和技术细节
2. **聚合根管理**：通过聚合根维护业务不变性和一致性
3. **只读属性**：聚合根属性使用 `readonly`，确保不可变性
4. **类型安全**：使用 TypeScript 类型系统确保类型安全

### 1.3 核心概念

- **聚合根（Aggregate Root）**：`ApiEndpoint` - API 端点的领域模型
- **读模型（Read Model）**：`EndpointReadModel` - 用于查询和展示的模型
- **类型定义（Type Definitions）**：端点属性的类型定义

## 2. 聚合根（Aggregate Root）

### 2.1 ApiEndpoint（API 端点聚合根）

#### 2.1.1 定义

`ApiEndpoint` 是 API 端点有界上下文的聚合根，继承自 NestJS CQRS 的 `AggregateRoot`，表示一个后端 API 接口。

```typescript
export class ApiEndpoint extends AggregateRoot {
  readonly id: string;
  readonly path: string;
  readonly method: string;
  readonly action: string;
  readonly resource: string;
  readonly controller: string;
  readonly summary?: string;
}
```

#### 2.1.2 职责

1. **封装业务概念**：表示一个 API 端点的完整概念
2. **维护业务不变性**：确保端点数据的完整性和一致性
3. **发布领域事件**：可以发布领域事件（虽然当前实现中未使用）

#### 2.1.3 属性说明

| 属性名 | 类型 | 必填 | 说明 | 示例 |
|--------|------|------|------|------|
| `id` | `string` | 是 | API 端点的唯一标识符 | `"01ARZ3NDEKTSV4RRFFQ69G5FAV"` |
| `path` | `string` | 是 | API 端点的 URL 路径 | `"/api/users"` 或 `"/api/users/:id"` |
| `method` | `string` | 是 | HTTP 方法 | `"GET"`, `"POST"`, `"PUT"`, `"DELETE"` |
| `action` | `string` | 是 | 操作类型 | `"read"`, `"write"`, `"delete"` |
| `resource` | `string` | 是 | 资源类型 | `"user"`, `"role"`, `"domain"` |
| `controller` | `string` | 是 | 控制器名称 | `"UserController"` |
| `summary` | `string \| undefined` | 否 | 摘要描述 | `"查询用户列表"` |

#### 2.1.4 唯一性约束

端点的唯一性由以下组合确定：

- **`path` + `method`**

即同一个路径的不同 HTTP 方法被视为不同的端点。

**示例**：

```typescript
// 这些是不同的端点
new ApiEndpoint('id1', '/api/users', 'GET', 'read', 'user', 'UserController');
new ApiEndpoint('id2', '/api/users', 'POST', 'write', 'user', 'UserController');
new ApiEndpoint('id3', '/api/users', 'PUT', 'write', 'user', 'UserController');
```

#### 2.1.5 使用场景

1. **系统启动时自动收集**
   - 系统启动时扫描所有控制器和路由
   - 创建 `ApiEndpoint` 实例并保存到数据库

2. **Casbin 权限规则配置**
   - 端点的 `resource` 和 `action` 用于构建 Casbin 规则
   - 规则格式：`p, roleCode, resource, action, domain`

3. **接口文档生成**
   - 端点的 `path`、`method`、`summary` 用于生成 API 文档

4. **权限分配和管理**
   - 端点的完整信息用于权限分配界面展示

#### 2.1.6 创建方式

**构造函数创建**：

```typescript
const endpoint = new ApiEndpoint(
  '01ARZ3NDEKTSV4RRFFQ69G5FAV',  // id
  '/api/users',                   // path
  'GET',                          // method
  'read',                         // action
  'user',                         // resource
  'UserController',               // controller
  '查询用户列表'                   // summary (可选)
);
```

#### 2.1.7 设计说明

**为什么使用构造函数而不是工厂方法？**

当前实现使用构造函数创建聚合根，这是合理的，因为：

1. **简单性**：API 端点聚合根结构简单，不需要复杂的创建逻辑
2. **无业务规则**：创建端点时不需要验证业务规则（业务规则在应用层验证）
3. **直接映射**：端点信息直接从路由信息映射而来，无需转换

**如果未来需要工厂方法**：

如果未来需要在创建时添加业务规则验证，可以添加静态工厂方法：

```typescript
export class ApiEndpoint extends AggregateRoot {
  // ... 现有代码

  /**
   * 从路由信息创建端点
   *
   * @description 工厂方法，用于从路由信息创建端点，包含业务规则验证
   */
  static fromRoute(routeInfo: RouteInfo): ApiEndpoint {
    // 验证业务规则
    if (!routeInfo.path || !routeInfo.method) {
      throw new Error('Path and method are required');
    }

    // 创建端点
    return new ApiEndpoint(
      UlidGenerator.generate(),
      routeInfo.path,
      routeInfo.method,
      routeInfo.action || this.inferAction(routeInfo.method),
      routeInfo.resource || this.inferResource(routeInfo.controller),
      routeInfo.controller,
      routeInfo.summary,
    );
  }

  private static inferAction(method: string): string {
    const methodToAction: Record<string, string> = {
      GET: 'read',
      POST: 'write',
      PUT: 'write',
      DELETE: 'delete',
    };
    return methodToAction[method] || 'read';
  }

  private static inferResource(controller: string): string {
    return controller.replace('Controller', '').toLowerCase();
  }
}
```

#### 2.1.8 不可变性

所有属性都使用 `readonly` 修饰符，确保：

1. **创建后不可修改**：端点创建后，属性值不能改变
2. **业务不变性**：确保端点的业务规则不会被破坏
3. **线程安全**：不可变对象在多线程环境下是安全的

**如果需要修改端点**：

由于端点是不可变的，如果需要修改端点信息，应该：

1. **创建新端点**：创建新的端点实例
2. **替换旧端点**：在数据库中替换旧的端点记录
3. **更新权限规则**：同步更新相关的 Casbin 权限规则

#### 2.1.9 领域事件（可选）

虽然当前实现中 `ApiEndpoint` 没有发布领域事件，但继承自 `AggregateRoot`，具备发布事件的能力。

**如果未来需要发布事件**：

```typescript
export class ApiEndpoint extends AggregateRoot {
  // ... 现有代码

  /**
   * 端点创建事件
   *
   * @description 发布端点创建事件，用于后续处理（如权限初始化）
   */
  created(): void {
    this.apply(
      new ApiEndpointCreatedEvent(
        this.id,
        this.path,
        this.method,
        this.resource,
        this.action,
      ),
    );
  }
}
```

## 3. 读模型（Read Model）

### 3.1 EndpointReadModel（端点读模型）

#### 3.1.1 定义

`EndpointReadModel` 是用于 API 响应的端点读取模型，包含端点的完整信息，用于查询和展示。

```typescript
export class EndpointReadModel {
  id: string;
  path: string;
  method: string;
  action: string;
  resource: string;
  controller: string;
  summary: string | null;
  createdAt: Date;
  updatedAt: Date | null;
}
```

#### 3.1.2 职责

1. **数据展示**：用于 API 响应，展示端点信息
2. **Swagger 文档**：使用 `@ApiProperty` 装饰器生成 Swagger 文档
3. **类型安全**：提供类型定义，确保类型安全

#### 3.1.3 与聚合根的区别

| 特性 | ApiEndpoint（聚合根） | EndpointReadModel（读模型） |
|------|----------------------|---------------------------|
| **用途** | 领域模型，表示业务概念 | 读取模型，用于展示 |
| **继承** | 继承 `AggregateRoot` | 普通类 |
| **事件** | 可以发布领域事件 | 不发布事件 |
| **Swagger** | 不使用 `@ApiProperty` | 使用 `@ApiProperty` |
| **时间字段** | 不包含 `createdAt`、`updatedAt` | 包含 `createdAt`、`updatedAt` |
| **不可变性** | 所有属性 `readonly` | 属性可变（用于数据绑定） |

#### 3.1.4 使用场景

1. **API 响应**：作为 API 响应的数据模型
2. **Swagger 文档**：自动生成 API 文档
3. **数据转换**：从数据库实体转换为 API 响应

#### 3.1.5 映射关系

**从聚合根到读模型**：

```typescript
function toReadModel(endpoint: ApiEndpoint, createdAt: Date, updatedAt: Date | null): EndpointReadModel {
  const model = new EndpointReadModel();
  model.id = endpoint.id;
  model.path = endpoint.path;
  model.method = endpoint.method;
  model.action = endpoint.action;
  model.resource = endpoint.resource;
  model.controller = endpoint.controller;
  model.summary = endpoint.summary || null;
  model.createdAt = createdAt;
  model.updatedAt = updatedAt;
  return model;
}
```

**从数据库实体到读模型**：

```typescript
function entityToReadModel(entity: ApiEndpointEntity): EndpointReadModel {
  const model = new EndpointReadModel();
  model.id = entity.id;
  model.path = entity.path;
  model.method = entity.method;
  model.action = entity.action;
  model.resource = entity.resource;
  model.controller = entity.controller;
  model.summary = entity.summary;
  model.createdAt = entity.createdAt;
  model.updatedAt = entity.updatedAt;
  return model;
}
```

## 4. 类型定义（Type Definitions）

### 4.1 EndpointEssentialProperties（端点必需属性）

#### 4.1.1 定义

定义 API 端点的必需属性，所有字段均为只读且必需。

```typescript
export type EndpointEssentialProperties = Readonly<
  Required<{
    id: string;
    path: string;
    method: string;
    action: string;
    resource: string;
    controller: string;
    summary: string | null;
    createdAt: Date;
    updatedAt: Date | null;
  }>
>;
```

#### 4.1.2 特点

- **只读（Readonly）**：所有字段都是只读的，确保不可变性
- **必需（Required）**：所有字段都是必需的，包括 `summary`（可以为 `null`）
- **类型安全**：使用 TypeScript 类型系统确保类型安全

#### 4.1.3 使用场景

- 作为函数参数类型
- 作为返回值类型
- 作为数据转换的中间类型

### 4.2 EndpointProperties（端点完整属性）

#### 4.2.1 定义

包含 API 端点的所有属性，当前实现中与 `EndpointEssentialProperties` 相同。

```typescript
export type EndpointProperties = EndpointEssentialProperties;
```

#### 4.2.2 使用场景

- 作为查询结果的类型
- 作为仓储接口的返回类型
- 作为数据转换的目标类型

### 4.3 EndpointTreeProperties（端点树形属性）

#### 4.3.1 定义

用于树形结构的端点属性，包含子节点数组。

```typescript
export type EndpointTreeProperties = EndpointProperties & {
  children?: EndpointTreeProperties[];
};
```

#### 4.3.2 特点

- **继承自 EndpointProperties**：包含端点的所有属性
- **可选的子节点**：`children` 是可选的，用于构建树形结构
- **递归结构**：子节点也是 `EndpointTreeProperties` 类型，支持多级树形结构

#### 4.3.3 使用场景

- **树形查询结果**：用于返回树形结构的端点列表
- **权限分配界面**：按控制器分组展示端点
- **接口文档树形展示**：树形展示 API 端点

#### 4.3.4 树形结构示例

```typescript
const tree: EndpointTreeProperties[] = [
  {
    id: 'controller-UserController',
    path: '',
    method: '',
    action: '',
    resource: '',
    controller: 'UserController',
    summary: null,
    createdAt: new Date(),
    updatedAt: null,
    children: [
      {
        id: 'endpoint-1',
        path: '/api/users',
        method: 'GET',
        action: 'read',
        resource: 'user',
        controller: 'UserController',
        summary: '查询用户列表',
        createdAt: new Date(),
        updatedAt: null,
        children: [],
      },
      {
        id: 'endpoint-2',
        path: '/api/users',
        method: 'POST',
        action: 'write',
        resource: 'user',
        controller: 'UserController',
        summary: '创建用户',
        createdAt: new Date(),
        updatedAt: null,
        children: [],
      },
    ],
  },
];
```

## 5. 开发指南

### 5.1 创建新的聚合根

#### 步骤 1：定义聚合根类

```typescript
// domain/my-aggregate.model.ts
import { AggregateRoot } from '@nestjs/cqrs';

/**
 * 我的聚合根
 *
 * @description 聚合根的说明
 * @extends {AggregateRoot}
 */
export class MyAggregate extends AggregateRoot {
  /**
   * 聚合根 ID
   */
  readonly id: string;

  /**
   * 其他属性
   */
  readonly name: string;

  /**
   * 构造函数
   */
  constructor(id: string, name: string) {
    super();
    this.id = id;
    this.name = name;
  }
}
```

#### 步骤 2：定义领域方法（如果需要）

```typescript
export class MyAggregate extends AggregateRoot {
  // ... 属性

  /**
   * 业务方法
   *
   * @description 执行业务操作
   */
  doSomething(): void {
    // 业务逻辑
    // 可以发布领域事件
    this.apply(new SomethingHappenedEvent(this.id));
  }
}
```

### 5.2 创建新的读模型

#### 步骤 1：定义读模型类

```typescript
// domain/my-read.model.ts
import { ApiProperty } from '@nestjs/swagger';

/**
 * 我的读模型
 *
 * @description 用于 API 响应的读取模型
 */
export class MyReadModel {
  @ApiProperty({ description: 'ID' })
  id: string;

  @ApiProperty({ description: '名称' })
  name: string;

  @ApiProperty({ description: '创建时间', type: 'string', format: 'date-time' })
  createdAt: Date;
}
```

#### 步骤 2：定义类型定义（如果需要）

```typescript
/**
 * 我的属性类型
 */
export type MyProperties = Readonly<
  Required<{
    id: string;
    name: string;
    createdAt: Date;
  }>
>;
```

### 5.3 添加领域事件（可选）

#### 步骤 1：定义领域事件

```typescript
// domain/events/my-event.event.ts
import { IEvent } from '@nestjs/cqrs';

/**
 * 我的领域事件
 *
 * @description 表示某个业务事件已发生
 */
export class MyEvent implements IEvent {
  constructor(
    public readonly aggregateId: string,
    public readonly data: any,
  ) {}
}
```

#### 步骤 2：在聚合根中发布事件

```typescript
export class MyAggregate extends AggregateRoot {
  // ... 属性

  /**
   * 业务方法
   */
  doSomething(): void {
    // 业务逻辑
    // 发布领域事件
    this.apply(new MyEvent(this.id, { /* 事件数据 */ }));
  }
}
```

### 5.4 添加值对象（如果需要）

如果未来需要值对象，可以创建：

```typescript
// domain/value-objects/path.value-object.ts

/**
 * 路径值对象
 *
 * @description 表示 API 路径的值对象，包含路径验证逻辑
 */
export class Path {
  private readonly value: string;

  private constructor(value: string) {
    this.validate(value);
    this.value = value;
  }

  /**
   * 从字符串创建路径值对象
   */
  static fromString(value: string): Path {
    return new Path(value);
  }

  /**
   * 获取路径值
   */
  getValue(): string {
    return this.value;
  }

  /**
   * 验证路径格式
   */
  private validate(value: string): void {
    if (!value || !value.startsWith('/')) {
      throw new Error('Path must start with /');
    }
  }
}
```

然后在聚合根中使用：

```typescript
export class ApiEndpoint extends AggregateRoot {
  readonly path: Path; // 使用值对象而不是 string

  constructor(id: string, path: Path, /* ... */) {
    super();
    this.id = id;
    this.path = path;
    // ...
  }
}
```

## 6. 最佳实践

### 6.1 聚合根最佳实践

1. **只读属性**：所有属性使用 `readonly`，确保不可变性
2. **业务逻辑封装**：业务逻辑封装在聚合根的方法中
3. **领域事件**：重要的业务操作应该发布领域事件
4. **构造函数简单**：构造函数只负责初始化，不包含复杂逻辑

### 6.2 读模型最佳实践

1. **Swagger 装饰器**：使用 `@ApiProperty` 装饰器生成 API 文档
2. **类型安全**：使用 TypeScript 类型系统确保类型安全
3. **数据转换**：在应用层或基础设施层进行数据转换
4. **可空字段**：使用 `| null` 明确表示可空字段

### 6.3 类型定义最佳实践

1. **只读类型**：使用 `Readonly<>` 确保类型不可变
2. **必需类型**：使用 `Required<>` 明确表示必需字段
3. **可选类型**：使用 `?` 或 `| undefined` 表示可选字段
4. **类型复用**：通过类型组合复用类型定义

### 6.4 领域事件最佳实践

1. **过去时命名**：事件名称使用过去时，表示已发生的事情
2. **不可变数据**：事件数据应该是不可变的
3. **包含上下文**：事件应该包含足够的上下文信息
4. **业务语义**：事件应该表达业务语义，而不是技术细节

## 7. 测试指南

### 7.1 聚合根测试

```typescript
describe('ApiEndpoint', () => {
  it('should create endpoint with all properties', () => {
    // Arrange
    const id = '01ARZ3NDEKTSV4RRFFQ69G5FAV';
    const path = '/api/users';
    const method = 'GET';
    const action = 'read';
    const resource = 'user';
    const controller = 'UserController';
    const summary = '查询用户列表';

    // Act
    const endpoint = new ApiEndpoint(
      id,
      path,
      method,
      action,
      resource,
      controller,
      summary,
    );

    // Assert
    expect(endpoint.id).toBe(id);
    expect(endpoint.path).toBe(path);
    expect(endpoint.method).toBe(method);
    expect(endpoint.action).toBe(action);
    expect(endpoint.resource).toBe(resource);
    expect(endpoint.controller).toBe(controller);
    expect(endpoint.summary).toBe(summary);
  });

  it('should create endpoint without summary', () => {
    // Arrange & Act
    const endpoint = new ApiEndpoint(
      'id',
      '/api/users',
      'GET',
      'read',
      'user',
      'UserController',
    );

    // Assert
    expect(endpoint.summary).toBeUndefined();
  });
});
```

### 7.2 读模型测试

```typescript
describe('EndpointReadModel', () => {
  it('should create read model with all properties', () => {
    // Arrange
    const model = new EndpointReadModel();
    model.id = 'id';
    model.path = '/api/users';
    model.method = 'GET';
    model.action = 'read';
    model.resource = 'user';
    model.controller = 'UserController';
    model.summary = '查询用户列表';
    model.createdAt = new Date();
    model.updatedAt = null;

    // Assert
    expect(model.id).toBe('id');
    expect(model.path).toBe('/api/users');
    // ... 其他断言
  });
});
```

### 7.3 类型定义测试

```typescript
describe('EndpointProperties', () => {
  it('should have all required properties', () => {
    // Arrange
    const properties: EndpointProperties = {
      id: 'id',
      path: '/api/users',
      method: 'GET',
      action: 'read',
      resource: 'user',
      controller: 'UserController',
      summary: null,
      createdAt: new Date(),
      updatedAt: null,
    };

    // Assert
    expect(properties).toBeDefined();
    expect(properties.id).toBe('id');
    // ... 其他断言
  });
});
```

## 8. 常见问题

### 8.1 为什么聚合根属性都是只读的？

**回答**：使用 `readonly` 确保聚合根的不可变性，这是领域驱动设计的重要原则：

1. **业务不变性**：确保业务规则不会被意外修改
2. **线程安全**：不可变对象在多线程环境下是安全的
3. **可预测性**：不可变对象的行为更容易预测

### 8.2 为什么需要读模型？

**回答**：读模型和聚合根有不同的职责：

1. **聚合根**：表示业务概念，用于业务逻辑处理
2. **读模型**：用于数据展示，包含 Swagger 装饰器和时间字段

### 8.3 什么时候使用值对象？

**回答**：当需要封装业务规则和验证逻辑时，使用值对象：

1. **复杂验证**：需要复杂的验证逻辑（如路径格式验证）
2. **业务语义**：需要表达业务语义（如金额、邮箱）
3. **复用逻辑**：需要在多个地方复用的逻辑

### 8.4 什么时候发布领域事件？

**回答**：当业务操作对系统其他部分有影响时，发布领域事件：

1. **跨聚合通信**：需要通知其他聚合
2. **异步处理**：需要异步处理后续操作
3. **审计需求**：需要记录重要的业务操作

## 9. 未来扩展

### 9.1 端点版本管理

未来可以添加端点版本管理：

```typescript
export class ApiEndpoint extends AggregateRoot {
  readonly version: string; // 端点版本号
  readonly deprecated: boolean; // 是否已废弃
  readonly deprecatedAt?: Date; // 废弃时间
}
```

### 9.2 端点分组

未来可以添加端点分组功能：

```typescript
export class ApiEndpoint extends AggregateRoot {
  readonly group: string; // 端点分组
  readonly tags: string[]; // 端点标签
}
```

### 9.3 端点统计

未来可以添加端点统计信息：

```typescript
export class ApiEndpoint extends AggregateRoot {
  readonly callCount: number; // 调用次数
  readonly lastCalledAt?: Date; // 最后调用时间
  readonly averageResponseTime?: number; // 平均响应时间
}
```

## 10. 总结

领域层是 API 端点有界上下文的核心业务逻辑层，包含：

- **聚合根**：`ApiEndpoint` - 表示 API 端点的业务概念
- **读模型**：`EndpointReadModel` - 用于数据展示
- **类型定义**：端点属性的类型定义

遵循本文档的开发指南和最佳实践，可以确保领域层的代码质量、可维护性和可扩展性。

---

**文档版本**：v1.0.0  
**最后更新**：2024-01-XX  
**维护者**：开发团队

