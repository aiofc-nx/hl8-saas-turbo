# 开发流程指南：从聚合根到数据库实体

## 1. 核心原则

### ✅ **正确的开发顺序**

**必须先编写聚合根，然后再编写数据库实体类。**

这是 Clean Architecture 的核心原则，符合依赖倒置原则（Dependency Inversion Principle）。

## 2. 为什么必须先写聚合根？

### 2.1 依赖方向

```
┌─────────────────────────┐
│   Infrastructure Layer  │  ← 依赖领域层
│   (数据库实体)          │
└───────────┬─────────────┘
            │ 依赖
            ↓
┌─────────────────────────┐
│   Domain Layer          │  ← 核心，不依赖任何层
│   (聚合根)              │
└─────────────────────────┘
```

**原则**：

- 领域层是核心，不依赖任何外部层
- 基础设施层依赖领域层，适配领域模型
- 数据库实体应该适配聚合根，而不是反过来

### 2.2 业务驱动

- **聚合根**：反映业务概念和业务规则，是业务的真实表达
- **数据库实体**：技术实现，用于持久化数据

业务应该驱动技术实现，而不是技术实现驱动业务。

### 2.3 可替换性

如果先设计数据库实体，领域模型就会受到数据库结构的限制。如果先设计聚合根：

- 可以轻松替换数据库（PostgreSQL → MongoDB）
- 可以替换 ORM 框架
- 领域模型保持独立

## 3. 正确的开发流程

### 3.1 开发步骤

```
步骤 1: 分析业务需求
    ↓
步骤 2: 设计领域模型（聚合根、值对象、领域事件）
    ↓
步骤 3: 编写聚合根代码
    ↓
步骤 4: 定义端口接口（Repository Port）
    ↓
步骤 5: 设计数据库表结构
    ↓
步骤 6: 编写数据库实体类
    ↓
步骤 7: 实现仓储适配器（Repository Adapter）
    ↓
步骤 8: 编写映射逻辑
```

### 3.2 详细流程说明

#### 步骤 1: 分析业务需求

理解业务需求，识别核心业务概念。

**示例**：

- 业务概念：用户（User）
- 业务规则：用户密码必须加密、用户名在域内唯一、用户有状态（启用/禁用）

#### 步骤 2: 设计领域模型

设计聚合根、值对象、领域事件。

**示例**：

```typescript
// 设计思路
- 聚合根：User
- 值对象：Password（封装密码加密和验证逻辑）
- 领域事件：UserCreatedEvent, UserDeletedEvent
- 属性：id, username, password, domain, status, ...
```

#### 步骤 3: 编写聚合根代码 ✅ **从这里开始**

**位置**：`src/lib/bounded-contexts/{context}/{module}/domain/{aggregate}.ts`

**示例**：

```typescript
// lib/bounded-contexts/iam/authentication/domain/user.ts
export class User extends AggregateRoot implements IUser {
  readonly id: string;
  readonly username: string;
  readonly password: Password;  // 值对象
  readonly domain: string;
  readonly status: Status;

  async loginUser(password: string) {
    // 业务逻辑
  }

  async created() {
    this.apply(new UserCreatedEvent(...));
  }
}
```

**关键点**：

- ✅ 先定义属性和业务方法
- ✅ 实现领域逻辑
- ✅ 定义领域事件
- ✅ 不依赖任何数据库相关代码

#### 步骤 4: 定义端口接口

定义仓储接口，指定需要什么功能。

**位置**：`src/lib/bounded-contexts/{context}/{module}/ports/{module}.read.repo-port.ts`

**示例**：

```typescript
// ports/user.write.repo-port.ts
export interface UserWriteRepoPort {
  save(user: User): Promise<void>;
  update(user: User): Promise<void>;
  deleteById(id: string): Promise<void>;
}
```

**关键点**：

- ✅ 接口使用领域模型（User），不是数据库实体
- ✅ 定义需要什么功能，不关心如何实现

#### 步骤 5: 设计数据库表结构

根据聚合根设计数据库表结构。

**示例**：

```sql
-- 根据 User 聚合根设计表结构
CREATE TABLE sys_user (
  id VARCHAR PRIMARY KEY,
  username VARCHAR NOT NULL,
  password VARCHAR,           -- Password 值对象存储为字符串
  domain VARCHAR NOT NULL,
  status VARCHAR NOT NULL,
  nick_name VARCHAR,
  avatar VARCHAR,
  email VARCHAR,
  phone_number VARCHAR,
  created_at TIMESTAMP,
  created_by VARCHAR,
  updated_at TIMESTAMP,
  updated_by VARCHAR
);
```

**关键点**：

- ✅ 数据库表结构适配领域模型
- ✅ 值对象（Password）存储为普通字段（string）
- ✅ 考虑数据库约束（唯一索引、外键等）

#### 步骤 6: 编写数据库实体类 ✅ **然后写这个**

**位置**：`src/infra/entities/{entity}.entity.ts`

**示例**：

```typescript
// infra/entities/sys-user.entity.ts
@Entity({ tableName: 'sys_user' })
export class SysUser {
  @PrimaryKey()
  id!: string;

  @Property()
  username!: string;

  @Property({ nullable: true })
  password?: string; // Password 值对象 → string

  @Property()
  domain!: string;

  @Property({ type: 'string' })
  status!: Status;

  // ... 其他字段
}
```

**关键点**：

- ✅ 数据库实体字段与聚合根属性对应
- ✅ 值对象在数据库中存储为基础类型
- ✅ 使用 ORM 装饰器（@Entity, @Property 等）

#### 步骤 7: 实现仓储适配器

实现仓储接口，编写映射逻辑。

**位置**：`src/infra/bounded-contexts/{context}/{module}/repository/{module}.write.pg.repository.ts`

**示例**：

```typescript
// infra/bounded-contexts/iam/authentication/repository/user.write.pg.repository.ts
@Injectable()
export class UserWriteRepository implements UserWriteRepoPort {
  constructor(private readonly em: EntityManager) {}

  async save(user: User): Promise<void> {
    // 聚合根 → 数据库实体
    const userData = {
      ...user,
      password: user.password.getValue(), // 值对象转换
    };
    const newUser = this.em.create('SysUser', userData);
    await this.em.persistAndFlush(newUser);
  }
}
```

**关键点**：

- ✅ 实现端口接口
- ✅ 处理聚合根到数据库实体的映射
- ✅ 处理值对象的转换

## 4. 实际开发示例

### 4.1 完整的开发流程示例

假设要开发一个新的"产品"（Product）模块：

#### ✅ 步骤 1: 编写聚合根（先做这个）

```typescript
// lib/bounded-contexts/product/domain/product.ts
export class Product extends AggregateRoot {
  readonly id: string;
  readonly name: string;
  readonly price: Money; // 值对象
  readonly status: ProductStatus;

  static fromCreate(properties: ProductCreateProperties): Product {
    return Object.assign(new Product(), properties);
  }

  async activate() {
    if (this.status === ProductStatus.ACTIVE) {
      throw new Error('Product is already active');
    }
    // 业务逻辑
  }
}
```

#### ✅ 步骤 2: 定义端口接口

```typescript
// lib/bounded-contexts/product/ports/product.write.repo-port.ts
export interface ProductWriteRepoPort {
  save(product: Product): Promise<void>;
  update(product: Product): Promise<void>;
  deleteById(id: string): Promise<void>;
}
```

#### ✅ 步骤 3: 编写数据库实体（后做这个）

```typescript
// infra/entities/sys-product.entity.ts
@Entity({ tableName: 'sys_product' })
export class SysProduct {
  @PrimaryKey()
  id!: string;

  @Property()
  name!: string;

  @Property()
  price!: number; // Money 值对象 → number

  @Property({ type: 'string' })
  status!: ProductStatus;
}
```

#### ✅ 步骤 4: 实现仓储适配器

```typescript
// infra/bounded-contexts/product/repository/product.write.pg.repository.ts
@Injectable()
export class ProductWriteRepository implements ProductWriteRepoPort {
  async save(product: Product): Promise<void> {
    const productData = {
      ...product,
      price: product.price.getValue(), // Money → number
    };
    const newProduct = this.em.create('SysProduct', productData);
    await this.em.persistAndFlush(newProduct);
  }
}
```

## 5. 错误的开发顺序 ⚠️

### 5.1 错误示例

```typescript
// ❌ 错误：先设计数据库实体
@Entity({ tableName: 'sys_product' })
export class SysProduct {
  @PrimaryKey()
  id!: number; // 使用自增 ID

  @Property()
  name!: string;

  @Property()
  price!: number;
}

// ❌ 然后聚合根受数据库限制
export class Product extends AggregateRoot {
  readonly id: number; // 被迫使用自增 ID，而不是 ULID
  readonly name: string;
  readonly price: number; // 没有 Money 值对象
}
```

**问题**：

- 领域模型受数据库技术限制
- 无法使用值对象（因为数据库中没有对应概念）
- 业务逻辑可能不合理（如使用自增 ID 而不是 ULID）

### 5.2 正确的顺序

```typescript
// ✅ 正确：先设计聚合根（业务驱动）
export class Product extends AggregateRoot {
  readonly id: string; // 使用 ULID，业务需求
  readonly name: string;
  readonly price: Money; // 值对象，封装业务逻辑

  // 业务方法
  async activate() {
    /* ... */
  }
}

// ✅ 然后数据库实体适配聚合根
@Entity({ tableName: 'sys_product' })
export class SysProduct {
  @PrimaryKey()
  id!: string; // 适配 ULID

  @Property()
  name!: string;

  @Property()
  price!: number; // Money 值对象存储为 number
}
```

## 6. 开发检查清单

### ✅ 聚合根开发清单

- [ ] 分析业务需求，识别业务概念
- [ ] 设计聚合根属性和业务方法
- [ ] 识别值对象（Password、Money 等）
- [ ] 定义领域事件
- [ ] 实现业务逻辑和业务规则
- [ ] 编写工厂方法（fromCreate、fromUpdate 等）
- [ ] 不依赖任何数据库或 ORM 代码

### ✅ 数据库实体开发清单

- [ ] 根据聚合根设计数据库表结构
- [ ] 编写数据库实体类，字段对应聚合根属性
- [ ] 值对象字段使用基础类型（string、number 等）
- [ ] 使用 ORM 装饰器（@Entity、@Property 等）
- [ ] 考虑数据库约束（唯一索引、外键等）
- [ ] 编写数据库迁移脚本

### ✅ 仓储适配器开发清单

- [ ] 实现端口接口
- [ ] 编写聚合根到数据库实体的映射逻辑
- [ ] 处理值对象的转换（getValue()）
- [ ] 实现写入操作（save、update、delete）
- [ ] 实现读取操作（find、query）
- [ ] 注册依赖注入

## 7. 常见问题和解决方案

### 7.1 问题：聚合根和数据库实体字段不一致

**原因**：先设计数据库实体，后设计聚合根

**解决**：

- ✅ 先设计聚合根
- ✅ 数据库实体适配聚合根
- ✅ 如果字段名称不同，在映射逻辑中处理

### 7.2 问题：值对象如何存储？

**正确做法**：

```typescript
// 聚合根中使用值对象
export class User {
  readonly password: Password;  // 值对象
}

// 数据库实体中使用基础类型
@Entity()
export class SysUser {
  @Property()
  password?: string;  // 基础类型
}

// 仓储中转换
async save(user: User) {
  const userData = {
    ...user,
    password: user.password.getValue(),  // 转换
  };
}
```

### 7.3 问题：聚合根属性名和数据库字段名不同

**处理方式**：

```typescript
// 方式 1: 聚合根和实体字段名保持一致（推荐）
// User.nickName ↔ SysUser.nickName

// 方式 2: 在映射逻辑中转换
async save(user: User) {
  const userData = {
    id: user.id,
    user_name: user.username,  // 字段名转换
    nick_name: user.nickName,
    // ...
  };
}
```

## 8. 开发最佳实践

### 8.1 ✅ 推荐做法

1. **先业务后技术**：先设计聚合根，后设计数据库实体
2. **保持字段一致性**：尽量保持聚合根属性和数据库字段名称一致
3. **值对象显式转换**：在仓储中显式处理值对象的转换
4. **文档化映射规则**：在代码注释中说明特殊的映射逻辑

### 8.2 ❌ 避免的做法

1. ❌ 先设计数据库表，再设计聚合根
2. ❌ 在聚合根中直接使用数据库实体
3. ❌ 在领域层导入基础设施层代码
4. ❌ 忽略值对象的转换

## 9. 开发流程可视化

```
业务需求
    ↓
┌─────────────────────────┐
│  设计领域模型            │
│  - 聚合根               │
│  - 值对象               │
│  - 领域事件             │
└───────────┬─────────────┘
            ↓
┌─────────────────────────┐
│  编写聚合根代码 ✅       │
│  lib/.../domain/        │
│  - 业务逻辑             │
│  - 业务规则             │
│  - 领域事件             │
└───────────┬─────────────┘
            ↓
┌─────────────────────────┐
│  定义端口接口            │
│  lib/.../ports/         │
│  - Repository Port      │
└───────────┬─────────────┘
            ↓
┌─────────────────────────┐
│  设计数据库表结构        │
│  - 根据聚合根设计        │
│  - 考虑约束             │
└───────────┬─────────────┘
            ↓
┌─────────────────────────┐
│  编写数据库实体 ✅       │
│  infra/entities/        │
│  - ORM 装饰器           │
│  - 字段映射             │
└───────────┬─────────────┘
            ↓
┌─────────────────────────┐
│  实现仓储适配器          │
│  infra/.../repository/  │
│  - 映射逻辑             │
│  - 值对象转换           │
└─────────────────────────┘
```

## 10. 总结

### 核心答案

**✅ 是的，应该先编写聚合根，然后再编写对应的数据库实体类。**

### 原因

1. **依赖方向**：基础设施层依赖领域层，不是反过来
2. **业务驱动**：业务需求应该驱动技术实现
3. **可替换性**：领域模型独立于数据库实现
4. **测试性**：聚合根可以独立测试，不依赖数据库

### 开发顺序

1. ✅ **先写聚合根**：`lib/.../domain/{aggregate}.ts`
2. ✅ **再写数据库实体**：`infra/entities/{entity}.entity.ts`
3. ✅ **最后写仓储适配器**：`infra/.../repository/{repository}.ts`

### 关键原则

- **领域模型优先**：业务逻辑在聚合根中
- **数据库适配领域**：数据库实体适配聚合根
- **映射在仓储**：映射逻辑在仓储实现中

---

**文档版本**：v1.0.0  
**最后更新**：2024-01-XX  
**维护者**：架构团队
