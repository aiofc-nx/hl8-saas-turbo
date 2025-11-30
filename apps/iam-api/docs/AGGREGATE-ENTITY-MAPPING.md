# 聚合根到数据库实体映射实现文档

## 1. 概述

本文档详细说明项目中聚合根（Aggregate Root）到数据库实体（Database Entity）之间的映射实现机制。在 Clean Architecture 中，领域模型和数据库实体是分离的，需要通过映射机制进行转换。

## 2. 架构层次

### 2.1 三层模型

```
┌─────────────────────────────────────────┐
│      Domain Layer (领域层)               │
│  ┌───────────────────────────────────┐  │
│  │  Aggregate Root (聚合根)          │  │
│  │  - User                           │  │
│  │  - Role                           │  │
│  │  - Menu                           │  │
│  │  - Domain                         │  │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │  Properties (属性类型)             │  │
│  │  - UserProperties                 │  │
│  │  - RoleProperties                 │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
              ↕ 映射转换
┌─────────────────────────────────────────┐
│   Infrastructure Layer (基础设施层)      │
│  ┌───────────────────────────────────┐  │
│  │  Database Entity (数据库实体)      │  │
│  │  - SysUser                        │  │
│  │  - SysRole                        │  │
│  │  - SysMenu                        │  │
│  │  - SysDomain                      │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

### 2.2 映射位置

映射在**仓储实现（Repository Implementation）**中进行，位于基础设施层：

```
src/infra/bounded-contexts/
  └── iam/
      └── authentication/
          └── repository/
              ├── user.write.pg.repository.ts  # 写入映射
              └── user.read.pg.repository.ts   # 读取映射
```

## 3. 映射实现方式

### 3.1 写入映射（Domain → Entity）

**场景**：将聚合根保存到数据库

#### 实现方式：对象展开 + 值对象提取

```typescript
// 示例：UserWriteRepository.save()
async save(user: User): Promise<void> {
  // 1. 将聚合根转换为普通对象
  const userData = {
    ...user,                    // 展开聚合根的所有属性
    password: user.password.getValue(),  // 提取值对象的值
  };

  // 2. 使用 MikroORM 创建实体
  const newUser = this.em.create('SysUser', userData);

  // 3. 持久化到数据库
  await this.em.persistAndFlush(newUser);
}
```

**关键点**：

- 使用对象展开运算符 `...user` 复制所有属性
- 对于值对象（如 `Password`），需要调用 `getValue()` 提取实际值
- 直接使用实体名称字符串 `'SysUser'` 而不是实体类（MikroORM 支持）

#### 完整示例

```typescript
// 领域模型：User 聚合根
export class User extends AggregateRoot {
  readonly id: string;
  readonly username: string;
  readonly password: Password;  // 值对象
  readonly domain: string;
  readonly status: Status;
  // ...
}

// 数据库实体：SysUser
@Entity({ tableName: 'sys_user' })
export class SysUser {
  @PrimaryKey()
  id!: string;

  @Property()
  username!: string;

  @Property({ nullable: true })
  password?: string;  // 普通字符串

  @Property()
  domain!: string;
  // ...
}

// 仓储实现：映射逻辑
async save(user: User): Promise<void> {
  const userData = {
    ...user,
    password: user.password.getValue(),  // Password 值对象 → string
  };
  const newUser = this.em.create('SysUser', userData);
  await this.em.persistAndFlush(newUser);
}
```

### 3.2 读取映射（Entity → Domain）

**场景**：从数据库读取数据并转换为领域模型

#### 实现方式：类型断言

```typescript
// 示例：UserReadRepository.findUserById()
async findUserById(id: string): Promise<UserProperties | null> {
  // 1. 从数据库查询实体
  const user = await this.em.findOne('SysUser', { id } as FilterQuery<any>);

  // 2. 类型断言转换为 Properties
  return user as UserProperties | null;
}
```

**关键点**：

- 直接使用类型断言 `as UserProperties`
- 不进行显式的字段映射，依赖结构兼容性
- 返回 `UserProperties` 而不是聚合根（读取操作）

#### 完整示例

```typescript
// 读取仓储实现
async findUserById(id: string): Promise<UserProperties | null> {
  const user = await this.em.findOne('SysUser', { id } as FilterQuery<any>);
  return user as UserProperties | null;
}

// 使用：在查询处理器中
@QueryHandler(FindUserByIdQuery)
export class FindUserByIdQueryHandler {
  async execute(query: FindUserByIdQuery): Promise<UserProperties | null> {
    return this.repository.findUserById(query.id);
    // 返回 UserProperties，不是 User 聚合根
  }
}
```

### 3.3 更新映射（Domain → Entity）

**场景**：更新已存在的数据库记录

#### 实现方式：选择性字段更新

```typescript
// 示例：UserWriteRepository.update()
async update(user: User): Promise<void> {
  await this.em.nativeUpdate(
    'SysUser',
    { id: user.id },  // 查询条件
    {
      // 只更新允许修改的字段
      nickName: user.nickName,
      status: user.status,
      avatar: user.avatar,
      email: user.email,
      phoneNumber: user.phoneNumber,
      updatedAt: user.createdAt,  // 注意：这里可能有 bug
      updatedBy: user.createdBy,
    },
  );
}
```

**关键点**：

- 使用 `nativeUpdate` 进行部分字段更新
- 只更新允许修改的字段（不更新 `id`、`username`、`password`、`domain` 等）
- 需要手动指定要更新的字段

## 4. 映射模式分析

### 4.1 当前实现模式：**隐式映射（Implicit Mapping）**

**特点**：

- 不使用专门的 Mapper 类
- 依赖对象结构兼容性
- 在仓储方法中直接处理映射逻辑
- 使用类型断言进行类型转换

**优点**：

- 实现简单，代码量少
- 不需要维护额外的映射类
- 性能好（无额外转换开销）

**缺点**：

- 映射逻辑分散在多个仓储方法中
- 字段不匹配时容易出错（运行时才能发现）
- 值对象需要手动提取
- 更新时需要手动指定字段

### 4.2 映射流程

#### 写入流程（Command）

```
CommandHandler
    ↓
创建聚合根 (User.fromCreate())
    ↓
仓储.save(user: User)
    ↓
提取值对象 (user.password.getValue())
    ↓
对象展开 ({ ...user, password: ... })
    ↓
em.create('SysUser', userData)
    ↓
em.persistAndFlush()
    ↓
数据库
```

#### 读取流程（Query）

```
QueryHandler
    ↓
仓储.findUserById(id)
    ↓
em.findOne('SysUser', { id })
    ↓
类型断言 (as UserProperties)
    ↓
返回 UserProperties
    ↓
QueryHandler 返回给 Controller
```

## 5. 值对象映射

### 5.1 Password 值对象映射

**领域模型**：

```typescript
export class Password {
  private constructor(private readonly value: string) {}

  static fromHashed(hashed: string): Password {
    return new Password(hashed);
  }

  getValue(): string {
    return this.value;
  }

  async compare(plainPassword: string): Promise<boolean> {
    // 密码比较逻辑
  }
}
```

**映射处理**：

```typescript
// 写入：值对象 → 字符串
async save(user: User): Promise<void> {
  const userData = {
    ...user,
    password: user.password.getValue(),  // Password → string
  };
  // ...
}

// 读取：字符串 → 值对象（在聚合根构造函数中）
constructor(properties: UserProperties) {
  Object.assign(this, properties);
  if ('password' in properties && properties.password) {
    this.password = Password.fromHashed(properties.password);  // string → Password
  }
}
```

## 6. 映射示例对比

### 6.1 用户创建完整流程

```typescript
// 1. CommandHandler 创建聚合根
const userCreateProperties: UserCreateProperties = {
  id: UlidGenerator.generate(),
  username: command.username,
  password: hashedPassword, // 已经是字符串
  domain: command.domain,
  // ...
};

const user = new User(userCreateProperties);
// User 构造函数会将 password 字符串转换为 Password 值对象

// 2. 仓储保存（聚合根 → 实体）
await this.userWriteRepository.save(user);
// 在 save() 方法中：
// - 展开 user 对象
// - 提取 password.getValue() 转换为字符串
// - 创建 SysUser 实体
// - 保存到数据库

// 3. 数据库存储
// SysUser 表中的 password 字段存储为字符串
```

### 6.2 用户查询完整流程

```typescript
// 1. QueryHandler 查询
const userProperties = await this.repository.findUserById(id);

// 2. 仓储查询（实体 → Properties）
async findUserById(id: string): Promise<UserProperties | null> {
  const user = await this.em.findOne('SysUser', { id });
  return user as UserProperties | null;  // 类型断言
}

// 3. 返回 Properties（不是聚合根）
// 查询操作不返回聚合根，只返回数据属性
```

## 7. 映射注意事项

### 7.1 字段兼容性

**要求**：数据库实体字段必须与领域模型属性兼容

```typescript
// ✅ 正确：字段名称和类型匹配
// Domain
readonly username: string;
readonly status: Status;

// Entity
@Property()
username!: string;
@Property({ type: 'string' })
status!: Status;
```

### 7.2 值对象处理

**要求**：值对象需要显式转换

```typescript
// ❌ 错误：直接使用值对象
const userData = { ...user }; // password 是 Password 对象

// ✅ 正确：提取值对象的值
const userData = {
  ...user,
  password: user.password.getValue(), // 转换为 string
};
```

### 7.3 可选字段处理

**要求**：正确处理可选字段和 null 值

```typescript
// Domain
readonly avatar: string | null;
readonly email: string | null;

// Entity
@Property({ nullable: true })
avatar?: string | null;
@Property({ nullable: true })
email?: string | null;

// 映射时保持 null 值
const userData = {
  ...user,  // null 值会被正确传递
};
```

### 7.4 更新字段选择

**要求**：更新时只更新允许修改的字段

```typescript
// ✅ 正确：明确指定要更新的字段
await this.em.nativeUpdate(
  'SysUser',
  { id: user.id },
  {
    nickName: user.nickName, // 允许修改
    status: user.status, // 允许修改
    // 不包含 id, username, password, domain 等不可变字段
  },
);

// ❌ 错误：更新所有字段（可能包含不可变字段）
await this.em.nativeUpdate('SysUser', { id: user.id }, { ...user });
```

## 8. 改进建议

### 8.1 显式映射器（可选）

如果需要更严格的映射控制，可以引入 Mapper 类：

```typescript
// 映射器类
export class UserMapper {
  static toEntity(user: User): SysUser {
    return {
      id: user.id,
      username: user.username,
      password: user.password.getValue(),
      domain: user.domain,
      status: user.status,
      // ... 显式映射所有字段
    } as SysUser;
  }

  static toDomain(entity: SysUser): UserProperties {
    return {
      id: entity.id,
      username: entity.username,
      password: entity.password,
      domain: entity.domain,
      status: entity.status,
      // ... 显式映射所有字段
    };
  }
}

// 使用
async save(user: User): Promise<void> {
  const entity = UserMapper.toEntity(user);
  const newUser = this.em.create('SysUser', entity);
  await this.em.persistAndFlush(newUser);
}
```

**优点**：

- 映射逻辑集中管理
- 字段不匹配时编译时就能发现
- 更容易维护和测试

**缺点**：

- 增加代码量
- 需要维护映射器类
- 性能略低（多一层转换）

### 8.2 当前实现的适用场景

**当前隐式映射适合**：

- 领域模型和数据库实体结构高度一致
- 字段名称和类型匹配
- 映射逻辑简单（主要是值对象转换）
- 团队熟悉这种模式

**显式映射器适合**：

- 领域模型和数据库实体差异较大
- 需要复杂的字段转换逻辑
- 需要映射验证和错误处理
- 团队规模较大，需要更严格的规范

## 9. 总结

### 9.1 映射实现总结

| 方面           | 实现方式                      | 位置                 |
| -------------- | ----------------------------- | -------------------- |
| **写入映射**   | 对象展开 + 值对象提取         | 仓储 `save()` 方法   |
| **读取映射**   | 类型断言                      | 仓储查询方法         |
| **更新映射**   | 选择性字段更新                | 仓储 `update()` 方法 |
| **值对象映射** | `getValue()` / `fromHashed()` | 仓储和聚合根构造函数 |

### 9.2 映射原则

1. **领域模型优先**：映射以领域模型为准，数据库实体适配领域模型
2. **值对象显式转换**：值对象需要显式提取和创建
3. **类型安全**：使用 TypeScript 类型系统保证类型安全
4. **最小化映射**：只在必要时进行映射，避免过度设计

### 9.3 最佳实践

1. ✅ **保持字段一致性**：确保领域模型和数据库实体字段名称一致
2. ✅ **值对象处理**：在仓储中正确处理值对象的转换
3. ✅ **更新字段选择**：更新时明确指定允许修改的字段
4. ✅ **类型断言谨慎使用**：确保类型兼容性
5. ✅ **文档化映射规则**：在代码注释中说明特殊的映射逻辑

---

**文档版本**：v1.0.0  
**最后更新**：2024-01-XX  
**维护者**：架构团队
