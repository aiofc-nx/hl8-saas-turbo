# Soybean Admin NestJS Backend 架构设计文档

## 1. 项目概述

### 1.1 项目简介

本项目是基于 NestJS 框架构建的企业级后端应用系统，采用 Monorepo 架构组织代码，实现了基于 Clean Architecture（整洁架构）、CQRS（命令查询职责分离）、事件驱动架构（EDA）和领域驱动设计（DDD）的混合架构模式。

### 1.2 技术栈

- **框架**: NestJS 11.x + Fastify
- **语言**: TypeScript 5.8
- **数据库**: PostgreSQL (Prisma ORM)
- **缓存**: Redis (ioredis)
- **认证授权**: JWT + Passport + Casbin (RBAC)
- **包管理**: pnpm
- **架构模式**: Clean Architecture + CQRS + EDA + DDD

## 2. 项目结构

### 2.1 Monorepo 组织

项目采用 NestJS Monorepo 结构，通过 `nest-cli.json` 配置管理多个应用和库：

```
backend/
├── apps/                    # 应用层
│   ├── base-system/         # 主应用系统
│   └── base-demo/           # 演示应用
├── libs/                    # 共享库层
│   ├── bootstrap/           # 应用启动引导
│   ├── config/              # 配置管理
│   ├── constants/           # 常量定义
│   ├── global/              # 全局模块（CQRS等）
│   ├── infra/               # 基础设施层
│   │   ├── adapter/         # 适配器（Fastify等）
│   │   ├── casbin/          # 权限控制
│   │   ├── crypto/          # 加密工具
│   │   ├── decorators/      # 装饰器
│   │   ├── filters/         # 异常过滤器
│   │   ├── guard/           # 守卫
│   │   ├── interceptors/     # 拦截器
│   │   ├── rest/             # REST 工具
│   │   └── strategies/      # Passport 策略
│   ├── logger/              # 日志模块
│   ├── shared/              # 共享资源
│   │   ├── errors/          # 错误定义
│   │   ├── ip2region/       # IP 地址解析
│   │   ├── oss/             # 对象存储
│   │   ├── prisma/          # Prisma 工具
│   │   └── redis/           # Redis 工具
│   ├── typings/             # 类型定义
│   └── utils/               # 工具函数
├── prisma/                  # Prisma 数据库模式
└── package.json
```

### 2.2 应用层结构（base-system）

主应用采用分层架构，核心结构如下：

```
apps/base-system/src/
├── main.ts                  # 应用入口
├── app.module.ts            # 根模块
├── api/                     # API 层（REST 控制器）
│   ├── api.module.ts
│   ├── iam/                 # IAM 相关 API
│   ├── access-key/          # 访问密钥 API
│   ├── endpoint/            # 端点 API
│   └── log-audit/           # 日志审计 API
├── lib/                     # 业务逻辑层
│   └── bounded-contexts/    # 限界上下文
│       ├── iam/             # 身份与访问管理
│       ├── access-key/      # 访问密钥
│       ├── api-endpoint/    # API 端点
│       └── log-audit/       # 日志审计
└── infra/                   # 基础设施实现层
    └── bounded-contexts/    # 限界上下文的实现
        ├── iam/
        ├── access-key/
        ├── api-endpoint/
        └── log-audit/
```

## 3. 架构模式

### 3.1 Clean Architecture（整洁架构）

项目严格遵循 Clean Architecture 的分层原则，确保业务逻辑与基础设施解耦：

#### 3.1.1 分层结构

1. **领域层（Domain Layer）**
   - 位置: `lib/bounded-contexts/{context}/domain/`
   - 职责: 包含领域实体、值对象、领域事件、领域服务
   - 特点: 不依赖任何外部框架，纯业务逻辑

2. **应用层（Application Layer）**
   - 位置: `lib/bounded-contexts/{context}/application/`
   - 职责: 包含用例实现、命令处理器、查询处理器、事件处理器、应用服务
   - 特点: 协调领域对象完成业务用例

3. **接口适配层（Interface Adapters）**
   - 位置: `api/` 和 `lib/bounded-contexts/{context}/ports/`
   - 职责: REST 控制器、DTO、端口接口定义
   - 特点: 适配外部接口到应用层

4. **基础设施层（Infrastructure Layer）**
   - 位置: `infra/` 和 `libs/infra/`
   - 职责: 数据库实现、外部服务集成、框架配置
   - 特点: 实现端口接口，提供技术实现

#### 3.1.2 依赖方向

```
API 层 → 应用层 → 领域层
  ↓        ↓        ↑
基础设施层 → 端口接口 ←
```

依赖方向始终向内，领域层不依赖任何外部层。

### 3.2 CQRS（命令查询职责分离）

项目采用 CQRS 模式，将命令（写操作）和查询（读操作）完全分离：

#### 3.2.1 命令端（Command Side）

- **命令（Command）**: `lib/bounded-contexts/{context}/commands/`
- **命令处理器（Command Handler）**: `lib/bounded-contexts/{context}/application/command-handlers/`
- **写仓储（Write Repository）**: `ports/{entity}.write.repo-port.ts`
- **写模型（Write Model）**: `domain/{entity}.ts` (AggregateRoot)

示例：
```typescript
// 命令定义
export class UserCreateCommand implements ICommand {
  // ...
}

// 命令处理器
@CommandHandler(UserCreateCommand)
export class UserCreateCommandHandler 
  implements ICommandHandler<UserCreateCommand, void> {
  // ...
}
```

#### 3.2.2 查询端（Query Side）

- **查询（Query）**: `lib/bounded-contexts/{context}/queries/`
- **查询处理器（Query Handler）**: `lib/bounded-contexts/{context}/application/query-handlers/`
- **读仓储（Read Repository）**: `ports/{entity}.read.repo-port.ts`
- **读模型（Read Model）**: `domain/{entity}.read.model.ts`

示例：
```typescript
// 查询定义
export class PageUsersQuery extends PaginationParams implements IQuery {
  // ...
}

// 查询处理器
@QueryHandler(PageUsersQuery)
export class PageUsersQueryHandler 
  implements IQueryHandler<PageUsersQuery, PaginationResult<UserProperties>> {
  // ...
}
```

#### 3.2.3 读写分离的优势

1. **性能优化**: 读模型可以针对查询场景优化，使用不同的数据库或缓存策略
2. **扩展性**: 读写可以独立扩展
3. **清晰性**: 明确区分写操作和读操作，代码职责更清晰

### 3.3 事件驱动架构（EDA）

项目使用 NestJS EventEmitter 实现事件驱动架构：

#### 3.3.1 领域事件（Domain Events）

- **事件定义**: `domain/events/`
- **事件发布**: 通过 AggregateRoot 的 `apply()` 方法
- **事件处理**: `application/event-handlers/`

示例：
```typescript
// 领域事件
export class UserCreatedEvent {
  constructor(
    public readonly userId: string,
    public readonly username: string,
    public readonly domain: string,
  ) {}
}

// 聚合根发布事件
async created() {
  this.apply(new UserCreatedEvent(this.id, this.username, this.domain));
}

// 事件处理器
@OnEvent(EVENT_USER_CREATED)
async handle(payload: UserCreatedEvent) {
  // 处理用户创建后的逻辑
}
```

#### 3.3.2 事件处理场景

1. **跨限界上下文通信**: 不同 bounded context 之间通过事件解耦
2. **副作用处理**: 如日志记录、通知发送等
3. **数据同步**: 读模型的更新、缓存的刷新

### 3.4 领域驱动设计（DDD）

项目采用 DDD 的限界上下文（Bounded Context）模式组织业务逻辑：

#### 3.4.1 限界上下文结构

每个限界上下文包含完整的业务能力：

```
bounded-contexts/{context}/
├── domain/                  # 领域层
│   ├── {entity}.ts         # 聚合根/实体
│   ├── {entity}.read.model.ts  # 读模型
│   ├── events/              # 领域事件
│   └── {value-object}.ts   # 值对象
├── application/             # 应用层
│   ├── command-handlers/   # 命令处理器
│   ├── query-handlers/     # 查询处理器
│   ├── event-handlers/     # 事件处理器
│   ├── service/            # 应用服务
│   └── dto/                # 数据传输对象
├── ports/                  # 端口接口
│   ├── {entity}.write.repo-port.ts
│   └── {entity}.read.repo-port.ts
├── commands/               # 命令定义
├── queries/                # 查询定义
├── constants.ts            # 常量
└── {context}.module.ts     # 模块定义
```

#### 3.4.2 当前限界上下文

1. **IAM (Identity and Access Management)**
   - `authentication`: 用户认证
   - `role`: 角色管理
   - `menu`: 菜单管理
   - `domain`: 租户/域管理
   - `tokens`: 令牌管理

2. **Access Key**
   - API 密钥管理

3. **API Endpoint**
   - API 端点管理

4. **Log Audit**
   - `login-log`: 登录日志
   - `operation-log`: 操作日志

### 3.5 端口和适配器模式（Hexagonal Architecture）

项目使用端口和适配器模式实现依赖倒置：

#### 3.5.1 端口（Port）

端口定义在领域层或应用层，是接口定义：

```typescript
// 写端口
export interface UserWriteRepoPort {
  save(user: User): Promise<void>;
  update(user: User): Promise<void>;
  deleteById(id: string): Promise<void>;
}

// 读端口
export interface UserReadRepoPort {
  findUserById(id: string): Promise<UserProperties | null>;
  pageUsers(query: PageUsersQuery): Promise<PaginationResult<UserProperties>>;
}
```

#### 3.5.2 适配器（Adapter）

适配器在基础设施层实现端口接口：

```typescript
@Injectable()
export class UserWriteRepository implements UserWriteRepoPort {
  constructor(private prisma: PrismaService) {}
  
  async save(user: User): Promise<void> {
    await this.prisma.sysUser.create({
      data: { ...user, password: user.password.getValue() },
    });
  }
}
```

## 4. 核心组件

### 4.1 应用启动流程

#### 4.1.1 入口点（main.ts）

1. 初始化 Redis 连接
2. 创建 NestJS 应用实例（使用 Fastify 适配器）
3. 配置全局中间件：
   - CORS
   - 全局前缀（v1）
   - 验证管道（ValidationPipe）
   - Swagger 文档
   - 压缩（gzip/deflate）
   - CSRF 保护
   - Helmet 安全头
4. 启动服务器

#### 4.1.2 根模块（app.module.ts）

根模块配置了全局功能：

- **日志模块**: Winston 日志，支持文件和控制台输出
- **配置模块**: 环境变量和配置文件加载
- **权限模块**: Casbin 权限控制
- **限流模块**: Throttler，基于 Redis 的限流
- **CQRS 模块**: 全局 CQRS 支持
- **API 模块**: REST 控制器
- **共享模块**: 共享服务
- **API Key 模块**: API 密钥验证
- **引导模块**: 应用引导逻辑

全局守卫和过滤器：
- `JwtAuthGuard`: JWT 认证守卫
- `AllExceptionsFilter`: 全局异常过滤器

### 4.2 认证与授权

#### 4.2.1 JWT 认证

- **策略**: `JwtStrategy` (Passport JWT)
- **守卫**: `JwtAuthGuard`
- **令牌管理**: `tokens` bounded context

#### 4.2.2 权限控制

- **框架**: Casbin
- **模型**: RBAC (基于角色的访问控制)
- **适配器**: PrismaAdapter
- **模块**: `AuthZModule`

#### 4.2.3 API Key 认证

- **模块**: `ApiKeyModule`
- **守卫**: API Key 验证守卫
- **用途**: 服务间调用认证

### 4.3 数据访问层

#### 4.3.1 Prisma ORM

- **数据库**: PostgreSQL
- **ORM**: Prisma
- **迁移**: Prisma Migrate
- **客户端**: `PrismaService` (共享服务)

#### 4.3.2 仓储模式

每个聚合根都有对应的写仓储和读仓储：

- **写仓储**: 实现 `{Entity}WriteRepoPort`，处理写操作
- **读仓储**: 实现 `{Entity}ReadRepoPort`，处理查询操作

#### 4.3.3 分页支持

使用 `PaginationResult` 和 `PaginationParams` 提供统一的分页功能。

### 4.4 缓存策略

#### 4.4.1 Redis

- **客户端**: ioredis
- **用途**: 
  - 限流存储（Throttler）
  - 缓存（Cache Manager）
  - 会话存储

#### 4.4.2 缓存工具

- **模块**: `@lib/shared/redis`
- **工具类**: `RedisUtility`

### 4.5 日志系统

#### 4.5.1 Winston 日志

- **模块**: `@lib/logger`
- **输出**: 文件 + 控制台
- **格式**: JSON 格式
- **轮转**: 按日期和大小轮转

#### 4.5.2 日志级别

- **开发环境**: debug
- **生产环境**: info

### 4.6 异常处理

#### 4.6.1 全局异常过滤器

- **过滤器**: `AllExceptionsFilter`
- **功能**: 统一异常格式、错误码映射、日志记录

#### 4.6.2 验证异常

- **管道**: `ValidationPipe`
- **格式**: 统一的验证错误响应格式

### 4.7 API 文档

#### 4.7.1 Swagger

- **框架**: `@nestjs/swagger`
- **初始化**: `initDocSwagger`
- **访问**: `/api-docs`

## 5. 模块组织

### 5.1 共享库（libs/）

#### 5.1.1 bootstrap

应用启动引导模块，包含 Swagger 初始化等。

#### 5.1.2 config

配置管理模块，提供类型安全的配置访问。

#### 5.1.3 global

全局模块，包含 CQRS 模块等全局功能。

#### 5.1.4 infra

基础设施模块集合：
- **adapter**: Fastify 适配器、安全适配器
- **casbin**: Casbin 权限控制集成
- **crypto**: 加密工具
- **decorators**: 自定义装饰器
- **filters**: 异常过滤器
- **guard**: 认证授权守卫
- **interceptors**: 拦截器
- **rest**: REST 工具类
- **strategies**: Passport 认证策略

#### 5.1.5 shared

共享资源模块：
- **errors**: 错误定义
- **ip2region**: IP 地址解析
- **oss**: 对象存储（阿里云 OSS）
- **prisma**: Prisma 工具和分页
- **redis**: Redis 工具

#### 5.1.6 logger

日志模块，基于 Winston。

#### 5.1.7 utils

工具函数集合。

#### 5.1.8 typings

TypeScript 类型定义。

#### 5.1.9 constants

常量定义。

### 5.2 应用模块（apps/base-system）

#### 5.2.1 API 层（api/）

REST 控制器层，负责：
- 接收 HTTP 请求
- 参数验证（DTO）
- 调用 CQRS 命令/查询
- 返回响应

#### 5.2.2 业务逻辑层（lib/bounded-contexts/）

限界上下文，包含完整的业务能力。

#### 5.2.3 基础设施实现层（infra/bounded-contexts/）

实现限界上下文的端口接口：
- 数据库仓储实现
- 外部服务集成
- 模块注册

## 6. 数据流

### 6.1 命令流（写操作）

```
HTTP Request
  ↓
REST Controller
  ↓
Command (DTO)
  ↓
Command Handler
  ↓
Domain Service / Aggregate Root
  ↓
Write Repository (Port)
  ↓
Write Repository Implementation (Adapter)
  ↓
Database (Prisma)
  ↓
Domain Event
  ↓
Event Handler
```

### 6.2 查询流（读操作）

```
HTTP Request
  ↓
REST Controller
  ↓
Query (DTO)
  ↓
Query Handler
  ↓
Read Repository (Port)
  ↓
Read Repository Implementation (Adapter)
  ↓
Database (Prisma)
  ↓
Read Model
  ↓
Response
```

### 6.3 事件流

```
Aggregate Root
  ↓
apply(Domain Event)
  ↓
EventEmitter
  ↓
Event Handler
  ↓
Side Effects (Log, Cache, etc.)
```

## 7. 安全特性

### 7.1 认证

- JWT Token 认证
- API Key 认证
- 密码加密（bcrypt）

### 7.2 授权

- Casbin RBAC
- 基于角色的权限控制
- 多租户支持（domain）

### 7.3 安全防护

- Helmet 安全头
- CSRF 保护
- 请求限流（Throttler）
- 输入验证（class-validator）

## 8. 性能优化

### 8.1 数据库

- Prisma 查询优化
- 读写分离（CQRS）
- 连接池管理

### 8.2 缓存

- Redis 缓存
- 查询结果缓存

### 8.3 HTTP

- Fastify 高性能框架
- Gzip 压缩
- 静态资源优化

## 9. 扩展性

### 9.1 水平扩展

- 无状态设计
- Redis 共享状态
- 数据库连接池

### 9.2 垂直扩展

- 模块化设计
- 限界上下文隔离
- 独立部署能力（未来微服务化）

### 9.3 功能扩展

- 新增限界上下文
- 新增命令/查询
- 新增事件处理器

## 10. 开发规范

### 10.1 代码组织

- 按限界上下文组织代码
- 严格的分层架构
- 端口和适配器模式

### 10.2 命名规范

- 命令: `{Action}{Entity}Command`
- 查询: `{Action}{Entity}Query`
- 处理器: `{Command/Query}Handler`
- 仓储: `{Entity}{Read/Write}Repository`

### 10.3 依赖注入

- 使用 NestJS DI 容器
- 接口定义端口
- 实现类注入适配器

## 11. 测试策略

### 11.1 单元测试

- 位置: `*.spec.ts`（与被测文件同目录）
- 覆盖: 领域逻辑、应用服务

### 11.2 集成测试

- 位置: `tests/integration/`
- 覆盖: 仓储实现、外部服务集成

### 11.3 端到端测试

- 位置: `tests/e2e/`
- 覆盖: API 端点、完整业务流程

## 12. 部署

### 12.1 构建

```bash
pnpm run build
```

### 12.2 运行

```bash
# 开发环境
pnpm run start:dev

# 生产环境
pnpm run start:prod

# PM2
pnpm run pm2:start:prod
```

### 12.3 数据库迁移

```bash
pnpm run prisma:migrate
pnpm run prisma:generate
```

## 13. 总结

本项目采用了现代化的企业级架构模式，结合了：

1. **Clean Architecture**: 确保业务逻辑与基础设施解耦
2. **CQRS**: 读写分离，提升性能和扩展性
3. **事件驱动**: 松耦合的跨上下文通信
4. **DDD**: 限界上下文组织业务逻辑
5. **端口和适配器**: 依赖倒置，易于测试和替换

这种架构设计使得系统具有：
- **高可维护性**: 清晰的分层和职责划分
- **高可扩展性**: 模块化设计，易于扩展
- **高可测试性**: 依赖注入和接口抽象
- **高性能**: CQRS 和缓存策略
- **高安全性**: 多层安全防护

项目结构清晰，代码组织规范，是一个优秀的企业级后端架构实践。

