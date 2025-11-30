# 聚合根与数据库实体同步维护指南

## 1. 问题说明

### 1.1 核心问题

**是的，当聚合根发生改变时，需要手动修改数据库实体类。**

这是 Clean Architecture 的必然结果，但可以通过一些策略和工具来减少维护成本。

### 1.2 为什么需要手动修改？

在 Clean Architecture 中，领域模型和数据库实体是**分离的**，这是有意为之的设计：

```
领域模型（聚合根）         数据库实体
     ↓                        ↓
业务逻辑和规则          技术实现细节
独立于技术            依赖 ORM 框架
易于测试              需要数据库迁移
```

**分离的好处**：

- ✅ 领域模型独立于数据库技术
- ✅ 可以替换数据库或 ORM 框架
- ✅ 领域模型可以独立测试
- ✅ 业务逻辑不受数据库限制

**分离的代价**：

- ⚠️ 需要手动保持同步
- ⚠️ 需要编写数据库迁移脚本

## 2. 变更影响分析

### 2.1 聚合根变更类型

#### 类型 1: 新增属性 ✅ 需要修改

**聚合根变更**：

```typescript
// 之前
export class User extends AggregateRoot {
  readonly id: string;
  readonly username: string;
  // ...
}

// 之后：新增 lastLoginAt 属性
export class User extends AggregateRoot {
  readonly id: string;
  readonly username: string;
  readonly lastLoginAt: Date | null; // 新增
  // ...
}
```

**需要修改的地方**：

1. ✅ 数据库实体类：添加字段
2. ✅ 数据库迁移脚本：添加列
3. ✅ 仓储映射逻辑：处理新字段
4. ✅ 读取模型（UserProperties）：添加类型定义

**修改步骤**：

```typescript
// 1. 修改数据库实体
@Entity({ tableName: 'sys_user' })
export class SysUser {
  // ... 现有字段
  @Property({ nullable: true })
  lastLoginAt?: Date | null;  // 新增
}

// 2. 创建数据库迁移
// migration:create AddLastLoginAtToUser
ALTER TABLE sys_user ADD COLUMN last_login_at TIMESTAMP;

// 3. 更新读取模型类型
export type UserProperties = {
  // ... 现有属性
  lastLoginAt: Date | null;  // 新增
};

// 4. 更新仓储映射（如果需要特殊处理）
async save(user: User): Promise<void> {
  const userData = {
    ...user,
    password: user.password.getValue(),
    lastLoginAt: user.lastLoginAt,  // 自动包含
  };
  // ...
}
```

#### 类型 2: 删除属性 ✅ 需要修改

**聚合根变更**：

```typescript
// 之前
export class User extends AggregateRoot {
  readonly avatar: string | null; // 要删除
  // ...
}

// 之后
export class User extends AggregateRoot {
  // avatar 已删除
  // ...
}
```

**需要修改的地方**：

1. ✅ 数据库实体类：删除字段（或标记为废弃）
2. ✅ 数据库迁移脚本：删除列（或保留，标记为废弃）
3. ✅ 仓储映射逻辑：移除字段处理
4. ✅ 读取模型：删除类型定义

**注意**：删除字段需要谨慎，考虑数据迁移策略。

#### 类型 3: 修改属性类型 ✅ 需要修改

**聚合根变更**：

```typescript
// 之前
export class User extends AggregateRoot {
  readonly status: Status; // 枚举
}

// 之后：改为更细粒度的状态
export class User extends AggregateRoot {
  readonly status: UserStatus; // 新的枚举类型
}
```

**需要修改的地方**：

1. ✅ 数据库实体类：更新字段类型
2. ✅ 数据库迁移脚本：可能需要数据迁移
3. ✅ 仓储映射逻辑：确保类型兼容

#### 类型 4: 新增值对象 ✅ 需要修改

**聚合根变更**：

```typescript
// 之前
export class User extends AggregateRoot {
  readonly email: string | null;
}

// 之后：使用值对象
export class User extends AggregateRoot {
  readonly email: Email | null; // 值对象
}
```

**需要修改的地方**：

1. ✅ 数据库实体类：字段类型改为基础类型（string）
2. ✅ 仓储映射逻辑：添加值对象转换
3. ✅ 读取模型：保持基础类型

**修改示例**：

```typescript
// 数据库实体（不变，仍然是 string）
@Entity({ tableName: 'sys_user' })
export class SysUser {
  @Property({ nullable: true })
  email?: string | null;  // 仍然是 string
}

// 仓储映射（需要转换）
async save(user: User): Promise<void> {
  const userData = {
    ...user,
    password: user.password.getValue(),
    email: user.email?.getValue() ?? null,  // Email 值对象 → string
  };
  // ...
}
```

#### 类型 5: 仅修改业务逻辑 ✅ 不需要修改

**聚合根变更**：

```typescript
// 之前
async loginUser(password: string) {
  // 简单验证
}

// 之后：增强业务逻辑
async loginUser(password: string) {
  // 更复杂的验证逻辑
  // 但属性没有变化
}
```

**需要修改的地方**：

- ✅ 不需要修改数据库实体
- ✅ 不需要修改数据库迁移
- ✅ 只需要更新业务逻辑

## 3. 同步维护策略

### 3.1 检查清单方法

创建一个变更检查清单，确保不遗漏任何地方：

```markdown
## 聚合根变更检查清单

### 领域层变更

- [ ] 修改聚合根类
- [ ] 更新 UserProperties 类型
- [ ] 更新 UserCreateProperties 类型
- [ ] 更新 UserUpdateProperties 类型
- [ ] 更新 UserReadModel 类（如果使用）

### 基础设施层变更

- [ ] 修改数据库实体类（SysUser）
- [ ] 创建数据库迁移脚本
- [ ] 更新写入仓储映射逻辑
- [ ] 更新读取仓储映射逻辑（如果需要）

### 应用层变更

- [ ] 更新命令对象（如果需要新字段）
- [ ] 更新查询对象（如果需要新字段）
- [ ] 更新命令处理器
- [ ] 更新查询处理器

### 测试

- [ ] 更新单元测试
- [ ] 更新集成测试
- [ ] 测试数据库迁移
```

### 3.2 命名一致性策略

保持字段名称一致，减少映射复杂度：

```typescript
// ✅ 推荐：字段名称一致
// 聚合根
export class User {
  readonly lastLoginAt: Date | null;
}

// 数据库实体
@Entity()
export class SysUser {
  @Property({ nullable: true })
  lastLoginAt?: Date | null; // 名称一致
}

// ❌ 不推荐：字段名称不一致
// 聚合根
export class User {
  readonly lastLoginAt: Date | null;
}

// 数据库实体
@Entity()
export class SysUser {
  @Property({ nullable: true })
  last_login_at?: Date | null; // 名称不一致，需要额外映射
}
```

### 3.3 类型定义共享策略

使用共享的类型定义，减少重复：

```typescript
// 共享类型定义
export type UserEssentialProperties = Readonly<{
  id: string;
  username: string;
  // ...
}>;

// 聚合根使用
export class User extends AggregateRoot {
  // 属性定义与类型保持一致
}

// 读取模型使用
export type UserProperties = UserEssentialProperties & UserOptionalProperties;
```

### 3.4 自动化检查工具（可选）

可以创建 TypeScript 类型检查，确保同步：

```typescript
// 类型检查工具（示例）
type EntityFields<T> = {
  [K in keyof T]: T[K];
};

// 检查聚合根和实体字段是否匹配
type UserEntityFields = EntityFields<SysUser>;
type UserDomainFields = EntityFields<UserProperties>;

// 如果字段不匹配，TypeScript 会报错
```

## 4. 实际维护流程

### 4.1 标准变更流程

假设要添加 `lastLoginAt` 字段：

#### 步骤 1: 修改聚合根 ✅

```typescript
// lib/bounded-contexts/iam/authentication/domain/user.ts
export class User extends AggregateRoot {
  // ... 现有属性
  readonly lastLoginAt: Date | null; // 新增
}
```

#### 步骤 2: 更新类型定义 ✅

```typescript
// lib/bounded-contexts/iam/authentication/domain/user.read.model.ts
export type UserOptionalProperties = Readonly<
  Partial<{
    // ... 现有属性
    lastLoginAt: Date | null; // 新增
  }>
>;
```

#### 步骤 3: 修改数据库实体 ✅

```typescript
// infra/entities/sys-user.entity.ts
@Entity({ tableName: 'sys_user' })
export class SysUser {
  // ... 现有字段
  @Property({ nullable: true })
  lastLoginAt?: Date | null; // 新增
}
```

#### 步骤 4: 创建数据库迁移 ✅

```bash
# 创建迁移
pnpm migration:create AddLastLoginAtToUser

# 迁移文件内容
export class AddLastLoginAtToUser1234567890 extends Migration {
  async up(): Promise<void> {
    this.addSql('alter table "sys_user" add column "last_login_at" timestamptz null;');
  }

  async down(): Promise<void> {
    this.addSql('alter table "sys_user" drop column "last_login_at";');
  }
}
```

#### 步骤 5: 更新仓储映射（如果需要）✅

```typescript
// 通常不需要修改，因为使用对象展开
async save(user: User): Promise<void> {
  const userData = {
    ...user,  // 自动包含 lastLoginAt
    password: user.password.getValue(),
  };
  // ...
}
```

#### 步骤 6: 更新命令/查询（如果需要）✅

```typescript
// 如果需要在创建命令中包含新字段
export class UserCreateCommand implements ICommand {
  constructor(
    // ... 现有参数
    readonly lastLoginAt: Date | null, // 新增
  ) {}
}
```

### 4.2 快速检查脚本（建议）

可以创建一个检查脚本，验证聚合根和实体的一致性：

```typescript
// scripts/check-domain-entity-sync.ts
// 检查聚合根和数据库实体的字段是否匹配

import { User } from '../lib/bounded-contexts/iam/authentication/domain/user';
import { SysUser } from '../infra/entities/sys-user.entity';

// 通过 TypeScript 类型系统检查
// 如果字段不匹配，编译时会报错
```

## 5. 减少维护成本的方法

### 5.1 方法 1: 保持字段名称一致 ✅ **推荐**

**策略**：聚合根和数据库实体使用相同的字段名称

```typescript
// ✅ 好：名称一致
// 聚合根
readonly lastLoginAt: Date | null;

// 数据库实体
@Property({ nullable: true })
lastLoginAt?: Date | null;
```

**好处**：

- 映射逻辑简单（使用对象展开）
- 减少映射错误
- 易于维护

### 5.2 方法 2: 使用类型定义共享 ✅ **推荐**

**策略**：定义共享的类型，聚合根和实体都使用

```typescript
// 共享类型定义
export type UserProperties = {
  id: string;
  username: string;
  lastLoginAt: Date | null;
  // ...
};

// 聚合根使用
export class User extends AggregateRoot {
  // 属性与 UserProperties 保持一致
}

// 数据库实体使用（通过类型检查）
@Entity()
export class SysUser implements UserProperties {
  // 字段与 UserProperties 保持一致
}
```

### 5.3 方法 3: 显式映射器（可选）

**策略**：使用专门的 Mapper 类，集中管理映射逻辑

```typescript
// 映射器类
export class UserMapper {
  static toEntity(user: User): Partial<SysUser> {
    return {
      id: user.id,
      username: user.username,
      password: user.password.getValue(),
      lastLoginAt: user.lastLoginAt, // 集中管理
      // ...
    };
  }

  static toDomain(entity: SysUser): UserProperties {
    return {
      id: entity.id,
      username: entity.username,
      password: entity.password,
      lastLoginAt: entity.lastLoginAt, // 集中管理
      // ...
    };
  }
}
```

**优点**：

- 映射逻辑集中
- 易于维护和测试
- 字段不匹配时容易发现

**缺点**：

- 增加代码量
- 需要维护映射器类

### 5.4 方法 4: 代码生成工具（高级）

**策略**：使用代码生成工具，从聚合根生成数据库实体

```typescript
// 工具：从聚合根生成实体（伪代码）
function generateEntity(aggregateRoot: Class) {
  // 分析聚合根属性
  // 生成数据库实体类
  // 生成迁移脚本
}
```

**注意**：这需要自定义工具，复杂度较高。

## 6. 最佳实践

### 6.1 ✅ 推荐做法

1. **保持字段名称一致**
   - 聚合根和数据库实体使用相同的字段名称
   - 减少映射复杂度

2. **使用类型定义共享**
   - 定义共享的 Properties 类型
   - 聚合根和实体都参考这个类型

3. **创建变更检查清单**
   - 每次变更时使用检查清单
   - 确保不遗漏任何地方

4. **编写数据库迁移脚本**
   - 使用 ORM 迁移工具（MikroORM）
   - 确保数据库结构同步

5. **更新测试**
   - 更新单元测试
   - 更新集成测试
   - 测试数据库迁移

### 6.2 ❌ 避免的做法

1. ❌ **忽略数据库实体更新**
   - 只修改聚合根，忘记修改实体
   - 导致运行时错误

2. ❌ **忘记数据库迁移**
   - 只修改实体类，忘记创建迁移
   - 导致数据库结构不一致

3. ❌ **字段名称不一致**
   - 聚合根和实体使用不同的命名
   - 增加映射复杂度

4. ❌ **手动修改数据库**
   - 不通过迁移脚本修改数据库
   - 导致环境不一致

## 7. 维护成本分析

### 7.1 当前实现的维护成本

**优点**：

- ✅ 映射逻辑简单（对象展开）
- ✅ 字段名称一致，减少映射错误
- ✅ 类型系统提供编译时检查

**缺点**：

- ⚠️ 需要手动保持同步
- ⚠️ 需要手动创建迁移脚本
- ⚠️ 容易遗漏某些地方的更新

### 7.2 维护成本对比

| 方法                     | 维护成本 | 灵活性 | 推荐度   |
| ------------------------ | -------- | ------ | -------- |
| **当前方法（隐式映射）** | 中等     | 高     | ⭐⭐⭐⭐ |
| **显式映射器**           | 中等     | 高     | ⭐⭐⭐   |
| **代码生成工具**         | 低       | 中     | ⭐⭐     |
| **完全自动化**           | 低       | 低     | ⭐       |

### 7.3 实际维护时间估算

**小型变更**（添加一个字段）：

- 修改聚合根：5 分钟
- 修改数据库实体：2 分钟
- 创建迁移脚本：3 分钟
- 更新类型定义：2 分钟
- 测试：5 分钟
- **总计：约 20 分钟**

**中型变更**（修改多个字段）：

- 约 30-60 分钟

**大型变更**（重构聚合根）：

- 需要更仔细的规划和测试
- 可能需要数据迁移策略

## 8. 总结

### 8.1 核心答案

**是的，聚合根改变时需要手动修改数据库实体类，这是 Clean Architecture 的正常维护成本。**

### 8.2 为什么这是合理的？

1. **架构优势**：领域模型独立于数据库，带来更大的灵活性
2. **可控性**：手动维护确保变更的可见性和可控性
3. **类型安全**：TypeScript 类型系统可以帮助发现不一致

### 8.3 如何减少维护成本？

1. ✅ **保持字段名称一致**：减少映射复杂度
2. ✅ **使用类型定义共享**：确保类型一致性
3. ✅ **创建变更检查清单**：避免遗漏
4. ✅ **使用迁移工具**：确保数据库结构同步
5. ✅ **编写测试**：验证变更正确性

### 8.4 权衡

**Clean Architecture 的权衡**：

- ✅ 获得：领域模型独立性、可测试性、可替换性
- ⚠️ 代价：需要手动保持同步

**这个代价是值得的**，因为：

- 维护成本是可控的（每次变更约 20 分钟）
- 架构优势带来的收益更大
- 可以通过工具和流程减少成本

---

**文档版本**：v1.0.0  
**最后更新**：2024-01-XX  
**维护者**：架构团队
