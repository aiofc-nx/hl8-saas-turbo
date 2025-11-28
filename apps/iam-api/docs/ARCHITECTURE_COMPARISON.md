# 架构对比：当前架构 vs Clean Architecture

## 概述

本文档对比 `iam-api` 当前采用的架构（**DDD + CQRS + 六边形架构**）与 **Clean Architecture** 的区别、相似点和适用场景。

## 架构概览

### 当前架构（DDD + CQRS + 六边形架构）

```
┌─────────────────────────────────────────┐
│         API Layer (接口层)              │
│  Controllers, DTOs                      │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│    Application Layer (应用层)            │
│  CommandHandlers, QueryHandlers         │
│  EventHandlers, Services                │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│      Domain Layer (领域层)              │
│  Aggregates, Entities, Value Objects    │
│  Domain Events                          │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│   Ports (端口接口)                       │
│  Repository Interfaces, Service Interfaces
└──────────────┬──────────────────────────┘
               │ 依赖注入
┌──────────────▼──────────────────────────┐
│  Infrastructure Layer (基础设施层)       │
│  Repository Implementations             │
│  External Service Adapters               │
└─────────────────────────────────────────┘

组织方式：按有界上下文 (Bounded Contexts) 组织
```

### Clean Architecture

```
┌─────────────────────────────────────────┐
│  Frameworks & Drivers (框架和驱动层)    │
│  Web, DB, External Interfaces          │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│  Interface Adapters (接口适配器层)       │
│  Controllers, Presenters, Gateways      │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│  Application Business Rules (用例层)     │
│  Use Cases, Application Services        │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│  Enterprise Business Rules (实体层)      │
│  Entities, Domain Models                │
└─────────────────────────────────────────┘

组织方式：按同心圆层次组织
依赖方向：外层依赖内层，内层不依赖外层
```

## 核心区别

### 1. 组织方式

#### 当前架构：按业务领域组织（有界上下文）

```
src/lib/bounded-contexts/
├── iam/
│   ├── authentication/
│   │   ├── domain/          # 领域层
│   │   ├── application/     # 应用层
│   │   └── ports/           # 端口层
│   ├── role/
│   └── menu/
├── access-key/
└── log-audit/
```

**特点**：

- ✅ 按业务领域划分，每个上下文独立
- ✅ 便于团队协作（不同团队负责不同上下文）
- ✅ 支持微服务拆分
- ❌ 可能产生代码重复
- ❌ 跨上下文通信需要额外机制（事件）

#### Clean Architecture：按技术层次组织

```
src/
├── entities/              # 实体层
├── usecases/             # 用例层
├── controllers/          # 接口适配器层
└── frameworks/           # 框架层
```

**特点**：

- ✅ 层次清晰，职责分明
- ✅ 易于理解依赖关系
- ✅ 技术无关性强
- ❌ 跨领域代码可能混在一起
- ❌ 大型项目可能层次过深

### 2. 依赖方向

#### 当前架构：依赖倒置 + 依赖注入

```
API Layer
   ↓ (依赖)
Application Layer
   ↓ (依赖)
Domain Layer
   ↑ (实现)
Infrastructure Layer (通过端口接口)
```

**依赖规则**：

- 外层依赖内层
- 通过端口接口实现依赖倒置
- 使用依赖注入连接端口和适配器

#### Clean Architecture：严格的同心圆依赖

```
Frameworks & Drivers
   ↓ (依赖)
Interface Adapters
   ↓ (依赖)
Application Business Rules
   ↓ (依赖)
Enterprise Business Rules
```

**依赖规则**：

- **只能从外向内依赖**
- 内层不能知道外层的任何信息
- 使用依赖倒置原则（DIP）实现

### 3. CQRS 模式

#### 当前架构：明确采用 CQRS

```
Commands (写操作)
   ↓
CommandHandlers
   ↓
Domain (修改状态)

Queries (读操作)
   ↓
QueryHandlers
   ↓
ReadModels (只读)
```

**特点**：

- ✅ 命令和查询完全分离
- ✅ 读模型和写模型可以独立优化
- ✅ 支持事件溯源（Event Sourcing）
- ❌ 增加了系统复杂度
- ❌ 需要维护两套模型

#### Clean Architecture：不强制 CQRS

```
Use Cases
   ↓
Entities
```

**特点**：

- ✅ 简单直接
- ✅ 适合大多数场景
- ❌ 读写模型耦合
- ❌ 难以独立优化读写性能

### 4. 领域驱动设计 (DDD)

#### 当前架构：深度集成 DDD

```
Bounded Contexts (有界上下文)
   ├── Aggregates (聚合)
   ├── Entities (实体)
   ├── Value Objects (值对象)
   ├── Domain Events (领域事件)
   └── Domain Services (领域服务)
```

**特点**：

- ✅ 业务逻辑集中在领域层
- ✅ 使用领域语言（Ubiquitous Language）
- ✅ 通过聚合保护业务不变量
- ✅ 领域事件实现跨上下文通信
- ❌ 学习曲线陡峭
- ❌ 需要领域专家参与

#### Clean Architecture：可以配合 DDD，但不强制

```
Entities (可以是 DDD 实体)
   ↓
Use Cases (可以是 DDD 应用服务)
```

**特点**：

- ✅ 灵活，可以配合多种设计模式
- ✅ 不强制特定的领域建模方式
- ❌ 需要团队自行决定如何组织领域逻辑

### 5. 端口和适配器

#### 当前架构：明确的端口-适配器模式

```typescript
// 端口（Port）- 在 lib/ports/
export interface UserReadRepoPort {
  findUserById(id: string): Promise<UserProperties | null>;
}

// 适配器（Adapter）- 在 infra/
@Injectable()
export class UserReadRepository implements UserReadRepoPort {
  constructor(private readonly em: EntityManager) {}
  // 实现...
}
```

**特点**：

- ✅ 端口和适配器分离明确
- ✅ 易于测试（可以轻松模拟端口）
- ✅ 支持多种实现（如：PostgreSQL、MongoDB）

#### Clean Architecture：接口适配器层

```typescript
// 接口适配器层
class UserRepository implements IUserRepository {
  // 实现...
}
```

**特点**：

- ✅ 概念类似，但更强调"适配器"的概念
- ✅ 适配器负责转换数据格式
- ✅ 适配器连接用例和外部世界

## 详细对比表

| 维度           | 当前架构 (DDD+CQRS+六边形) | Clean Architecture   |
| -------------- | -------------------------- | -------------------- |
| **组织方式**   | 按有界上下文组织           | 按技术层次组织       |
| **依赖方向**   | 依赖倒置 + 依赖注入        | 严格的同心圆依赖     |
| **CQRS**       | ✅ 明确采用                | ❌ 不强制            |
| **DDD**        | ✅ 深度集成                | ⚠️ 可以配合使用      |
| **端口适配器** | ✅ 明确分离                | ✅ 接口适配器层      |
| **领域事件**   | ✅ 支持                    | ⚠️ 需要自行实现      |
| **聚合根**     | ✅ 明确概念                | ⚠️ 需要自行实现      |
| **复杂度**     | 高                         | 中                   |
| **学习曲线**   | 陡峭                       | 中等                 |
| **适用场景**   | 复杂业务领域、大型系统     | 中小型项目、通用场景 |
| **团队协作**   | ✅ 按上下文分工            | ⚠️ 按层次分工        |
| **微服务支持** | ✅ 天然支持                | ⚠️ 需要额外设计      |

## 相似点

尽管两种架构有显著区别，但它们都遵循以下原则：

### 1. 依赖倒置原则 (DIP)

两种架构都通过接口实现依赖倒置：

**当前架构**：

```typescript
// 领域层定义接口
export interface UserReadRepoPort { ... }

// 基础设施层实现接口
export class UserReadRepository implements UserReadRepoPort { ... }
```

**Clean Architecture**：

```typescript
// 用例层定义接口
interface IUserRepository { ... }

// 接口适配器层实现
class UserRepository implements IUserRepository { ... }
```

### 2. 关注点分离

两种架构都强调将业务逻辑与技术细节分离：

- **业务逻辑**：集中在领域层/实体层
- **技术细节**：集中在基础设施层/框架层

### 3. 可测试性

两种架构都通过依赖注入和接口实现高可测试性：

```typescript
// 可以轻松创建 Mock 实现
const mockRepo: UserReadRepoPort = {
  findUserById: jest.fn().mockResolvedValue(mockUser),
};
```

### 4. 技术无关性

两种架构都确保核心业务逻辑不依赖具体技术：

- 不依赖特定的 ORM
- 不依赖特定的 Web 框架
- 不依赖特定的数据库

## 适用场景

### 当前架构（DDD + CQRS + 六边形）适合：

✅ **复杂业务领域**

- 业务规则复杂
- 需要领域专家参与
- 业务逻辑频繁变化

✅ **大型系统**

- 多个团队协作
- 需要按领域划分团队
- 支持微服务架构

✅ **高性能要求**

- 读写性能需要独立优化
- 需要事件溯源
- 需要 CQRS 带来的性能优势

✅ **长期维护**

- 系统需要长期演进
- 业务逻辑是核心资产
- 需要清晰的领域模型

### Clean Architecture 适合：

✅ **中小型项目**

- 业务逻辑相对简单
- 团队规模较小
- 快速迭代

✅ **通用场景**

- 不需要特定的领域建模
- 技术栈相对固定
- 标准 CRUD 操作为主

✅ **学习成本考虑**

- 团队对 DDD 不熟悉
- 需要快速上手
- 架构复杂度要求适中

## 混合使用

实际上，两种架构可以结合使用：

```
Clean Architecture 的层次结构
   +
DDD 的领域建模
   +
CQRS 的读写分离
   =
更强大的架构
```

**示例**：

```
src/
├── entities/                    # Clean Architecture 实体层
│   └── user/                    # DDD 聚合
│       ├── user.entity.ts      # 聚合根
│       └── password.vo.ts      # 值对象
├── usecases/                   # Clean Architecture 用例层
│   └── user/
│       ├── commands/           # CQRS 命令
│       └── queries/            # CQRS 查询
├── controllers/                # Clean Architecture 接口适配器
└── frameworks/                 # Clean Architecture 框架层
    └── repositories/           # 仓储实现
```

## 总结

### 当前架构的优势

1. **业务导向**：按业务领域组织，更贴近业务
2. **团队协作**：按上下文分工，减少冲突
3. **性能优化**：CQRS 支持读写独立优化
4. **领域建模**：DDD 提供丰富的建模工具
5. **微服务支持**：天然支持微服务拆分

### Clean Architecture 的优势

1. **简单清晰**：层次结构易于理解
2. **通用性强**：不绑定特定设计模式
3. **学习成本低**：概念相对简单
4. **灵活性强**：可以配合多种模式使用

### 选择建议

- **选择当前架构**：如果项目复杂、团队规模大、需要长期维护
- **选择 Clean Architecture**：如果项目相对简单、团队规模小、需要快速迭代
- **混合使用**：可以结合两者优势，在 Clean Architecture 基础上应用 DDD 和 CQRS

## 参考资料

- [Clean Architecture by Robert C. Martin](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Domain-Driven Design by Eric Evans](https://www.domainlanguage.com/ddd/)
- [Hexagonal Architecture by Alistair Cockburn](https://alistair.cockburn.us/hexagonal-architecture/)
- [CQRS Pattern by Martin Fowler](https://martinfowler.com/bliki/CQRS.html)
