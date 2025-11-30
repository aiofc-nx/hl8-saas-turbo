# DDD 编程思想：面向领域 vs 面向数据库

## 学习目标

- 理解 DDD 的编程思想本质
- 理解"面向领域"和"面向数据库"的区别
- 理解为什么领域模型优先于数据库设计
- 掌握正确的开发思维方式

## 1. 你的理解是正确的！

### ✅ **核心观点**

**DDD 首先是面向对象的编程（更准确说是面向领域的编程），然后才是面向数据库的编程。**

这个理解完全正确！让我们深入理解这个思想。

## 2. DDD 的本质

### 2.1 DDD 是什么？

**DDD（Domain-Driven Design，领域驱动设计）** 是一种软件开发方法论，其核心思想是：

- **以业务领域为中心**：业务逻辑是核心，技术实现是细节
- **领域模型优先**：先设计领域模型（对象），再考虑如何持久化
- **业务语言**：使用业务术语，而不是技术术语

### 2.2 面向领域 vs 面向数据库

#### 面向领域（Domain-Oriented）

**特点**：

- 以业务概念为中心
- 使用业务语言
- 领域模型反映业务规则
- 不关心如何存储

**示例**：

```typescript
// 领域模型：User（用户）
export class User extends AggregateRoot {
  readonly id: string; // 业务标识
  readonly username: string; // 业务属性
  readonly password: Password; // 值对象，封装业务逻辑
  readonly status: Status; // 业务状态

  // 领域方法：业务行为
  async loginUser(password: string) {
    // 业务逻辑：验证密码、检查状态
    if (this.status !== Status.ENABLED) {
      return { success: false, message: 'User is disabled' };
    }
    // ...
  }
}
```

#### 面向数据库（Database-Oriented）

**特点**：

- 以数据表为中心
- 使用数据库术语
- 受数据库结构限制
- 先设计表结构

**示例**（❌ 错误的方式）：

```typescript
// 先设计数据库表
CREATE TABLE sys_user (
  id SERIAL PRIMARY KEY,      -- 自增 ID（数据库特性）
  username VARCHAR(50),
  password_hash VARCHAR(255),
  status VARCHAR(20),
  created_at TIMESTAMP
);

// 然后领域模型受数据库限制
export class User {
  id: number;              // 被迫使用自增 ID
  username: string;
  passwordHash: string;    // 没有值对象封装
  status: string;          // 没有枚举类型
}
```

## 3. 为什么领域模型优先？

### 3.1 业务驱动技术

**原则**：业务需求应该驱动技术实现，而不是技术实现限制业务需求。

**示例对比**：

#### ❌ 错误：数据库驱动

```
1. 设计数据库表结构
   ↓
2. 根据表结构设计领域模型
   ↓
3. 领域模型受数据库限制
   - 必须使用自增 ID
   - 不能使用值对象
   - 业务逻辑受限
```

#### ✅ 正确：领域驱动

```
1. 分析业务需求
   ↓
2. 设计领域模型（对象）
   ↓
3. 根据领域模型设计数据库
   ↓
4. 数据库适配领域模型
```

### 3.2 实际项目示例

让我们看看项目中的实际例子：

#### 步骤 1: 设计领域模型（面向对象）

```typescript
// lib/bounded-contexts/iam/authentication/domain/user.ts
export class User extends AggregateRoot {
  readonly id: string; // ULID，业务需求
  readonly username: string; // 业务属性
  readonly password: Password; // 值对象，封装业务逻辑
  readonly domain: string; // 业务概念：域
  readonly status: Status; // 枚举类型，业务状态

  // 领域方法：业务行为
  async loginUser(password: string) {
    // 业务逻辑
  }

  async verifyPassword(password: string): Promise<boolean> {
    // 业务逻辑
  }
}
```

**特点**：

- ✅ 使用业务语言（User、Password、Status）
- ✅ 封装业务逻辑（loginUser、verifyPassword）
- ✅ 使用值对象（Password）
- ✅ 不依赖数据库

#### 步骤 2: 设计数据库实体（面向数据库）

```typescript
// infra/entities/sys-user.entity.ts
@Entity({ tableName: 'sys_user' })
export class SysUser {
  @PrimaryKey()
  id!: string; // 适配 ULID

  @Property()
  username!: string;

  @Property({ nullable: true })
  password?: string; // Password 值对象 → string

  @Property()
  domain!: string;

  @Property({ type: 'string' })
  status!: Status;
}
```

**特点**：

- ✅ 适配领域模型
- ✅ 值对象转换为基础类型
- ✅ 使用 ORM 装饰器
- ✅ 依赖数据库技术

### 3.3 映射关系

```
领域模型（面向对象）         数据库实体（面向数据库）
─────────────────────      ─────────────────────
User.id: string      ←→    SysUser.id: string
User.password: Password ←→ SysUser.password: string
User.status: Status  ←→    SysUser.status: string
```

**映射在仓储中处理**：

```typescript
// 写入：领域模型 → 数据库实体
async save(user: User): Promise<void> {
  const userData = {
    ...user,
    password: user.password.getValue(),  // Password 值对象 → string
  };
  const newUser = this.em.create('SysUser', userData);
  await this.em.persistAndFlush(newUser);
}
```

## 4. 编程思维的转变

### 4.1 传统思维（面向数据库）

```
数据库表 → 实体类 → 业务逻辑
```

**问题**：

- 业务逻辑受数据库结构限制
- 难以表达复杂的业务概念
- 难以测试业务逻辑

### 4.2 DDD 思维（面向领域）

```
业务需求 → 领域模型 → 数据库实体
```

**优势**：

- 业务逻辑独立于数据库
- 可以表达复杂的业务概念
- 易于测试业务逻辑

## 5. 实际开发中的体现

### 5.1 开发顺序

**正确的顺序**：

1. **分析业务需求**（业务语言）
   - 用户需要登录
   - 密码需要加密
   - 用户有状态（启用/禁用）

2. **设计领域模型**（面向对象）

   ```typescript
   export class User extends AggregateRoot {
     readonly password: Password; // 值对象
     readonly status: Status; // 枚举

     async loginUser(password: string) {
       // 业务逻辑
     }
   }
   ```

3. **设计数据库实体**（面向数据库）
   ```typescript
   @Entity({ tableName: 'sys_user' })
   export class SysUser {
     password?: string; // 值对象 → string
     status!: Status; // 枚举 → string
   }
   ```

### 5.2 值对象的体现

**领域模型中的值对象**（面向对象）：

```typescript
export class Password {
  private constructor(private readonly value: string) {}

  static async hash(password: string): Promise<Password> {
    // 业务逻辑：加密密码
  }

  async compare(plainPassword: string): Promise<boolean> {
    // 业务逻辑：比较密码
  }
}
```

**数据库中的存储**（面向数据库）：

```typescript
// 数据库实体
@Entity()
export class SysUser {
  @Property()
  password?: string;  // 值对象存储为字符串
}

// 映射逻辑
async save(user: User): Promise<void> {
  const userData = {
    ...user,
    password: user.password.getValue(),  // 值对象 → 字符串
  };
}
```

## 6. 为什么这样设计？

### 6.1 业务逻辑独立

**优势**：

- 业务逻辑不依赖数据库
- 可以替换数据库（PostgreSQL → MongoDB）
- 可以替换 ORM 框架

### 6.2 易于测试

**优势**：

- 领域模型可以独立测试
- 不需要数据库就可以测试业务逻辑
- 测试速度快

### 6.3 易于理解

**优势**：

- 使用业务语言，易于理解
- 领域模型反映业务概念
- 代码即文档

### 6.4 易于扩展

**优势**：

- 可以轻松添加新的业务逻辑
- 可以轻松添加新的值对象
- 不受数据库结构限制

## 7. 常见误解

### 7.1 ❌ 误解：DDD 就是数据库设计

**正确理解**：

- DDD 是领域模型设计，不是数据库设计
- 数据库是技术实现细节
- 领域模型优先于数据库设计

### 7.2 ❌ 误解：领域模型就是数据库实体

**正确理解**：

- 领域模型是业务概念的表达
- 数据库实体是技术实现
- 两者是分离的，通过映射连接

### 7.3 ❌ 误解：先设计数据库，再设计领域模型

**正确理解**：

- 先设计领域模型（面向对象）
- 再设计数据库实体（面向数据库）
- 数据库适配领域模型

## 8. 总结

### 8.1 核心观点

**DDD 首先是面向领域的编程（面向对象），然后才是面向数据库的编程。**

### 8.2 开发思维

```
业务需求
    ↓
领域模型（面向对象）← 核心
    ↓
数据库实体（面向数据库）← 适配
```

### 8.3 关键原则

1. **业务驱动技术**：业务需求驱动技术实现
2. **领域模型优先**：先设计领域模型，再设计数据库
3. **数据库适配领域**：数据库实体适配领域模型
4. **关注点分离**：业务逻辑和技术实现分离

## 9. 学习检查

完成本章学习后，请回答以下问题：

1. DDD 的本质是什么？
2. 为什么领域模型优先于数据库设计？
3. 面向领域和面向数据库的区别是什么？
4. 正确的开发顺序是什么？

## 10. 下一步

- 学习 [开发流程指南](../03-实践篇/01-开发流程指南.md)
- 查看 [开发流程文档](../../DEVELOPMENT-WORKFLOW.md)

---

**上一章**：[项目结构](./03-项目结构.md)  
**下一章**：[开发流程指南](../03-实践篇/01-开发流程指南.md)  
**返回**：[培训大纲](../README.md)
