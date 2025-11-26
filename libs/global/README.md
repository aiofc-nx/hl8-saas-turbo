# @hl8/global

NestJS 全局模块库，提供应用所需的基础功能模块，包括配置、HTTP、调度、事件、缓存等核心功能。

## 📋 项目概述

### 基本信息

- **包名**: `@hl8/global`
- **版本**: `1.0.0`
- **描述**: Global module for NestJS applications
- **位置**: `libs/global`

### 提供的功能

1. **`SharedModule`** - 共享模块，提供全局的基础功能（配置、HTTP、调度、事件、缓存等）
2. **`GlobalCqrsModule`** - 全局 CQRS 模块，提供命令查询职责分离功能
3. **`CacheManagerModule`** - 缓存管理器模块，提供基于 Redis 的缓存功能

## 🚀 快速开始

### 安装

该库是 monorepo 工作空间的一部分，通过 workspace 协议引用：

```json
{
  "dependencies": {
    "@hl8/global": "workspace:*"
  }
}
```

### 导入

```typescript
import {
  SharedModule,
  GlobalCqrsModule,
  CacheManagerModule,
} from '@hl8/global';
```

## 📚 API 文档

### SharedModule

全局共享模块，提供应用所需的基础功能模块。

#### 功能

- **配置管理**: 通过 `ConfigModule` 加载 YAML 配置文件（OSS、IP2Region 等）
- **HTTP 客户端**: 提供 `HttpModule` 用于 HTTP 请求
- **任务调度**: 通过 `ScheduleModule` 支持定时任务
- **事件系统**: 通过 `EventEmitterModule` 支持事件发布订阅
- **缓存功能**: 集成 `CacheManagerModule` 提供 Redis 缓存

#### 使用示例

```typescript
import { Module } from '@nestjs/common';
import { SharedModule } from '@hl8/global';

@Module({
  imports: [SharedModule],
  // ... 其他配置
})
export class AppModule {}
```

#### 配置

SharedModule 会自动加载以下 YAML 配置文件：

- `oss.config.yaml` - OSS 对象存储配置
- `ip2region.config.yaml` - IP2Region 地理位置配置

EventEmitter 配置可通过环境变量设置：

```bash
EVENT_EMITTER_WILDCARD=true                    # 启用通配符
EVENT_EMITTER_DELIMITER=.                      # 分隔符
EVENT_EMITTER_NEW_LISTENER=true                # 启用新监听器事件
EVENT_EMITTER_REMOVE_LISTENER=true             # 启用移除监听器事件
EVENT_EMITTER_MAX_LISTENERS=20                 # 最大监听器数量
EVENT_EMITTER_IGNORE_ERRORS=true               # 忽略错误
```

### GlobalCqrsModule

全局 CQRS 模块，提供命令查询职责分离功能。

#### 功能

- 导入并导出 `CqrsModule`
- 提供全局的 CQRS 功能支持

#### 使用示例

```typescript
import { Module } from '@nestjs/common';
import { GlobalCqrsModule } from '@hl8/global';
import { CommandHandler, QueryHandler } from '@nestjs/cqrs';

// 定义命令处理器
@CommandHandler(CreateUserCommand)
export class CreateUserHandler implements ICommandHandler<CreateUserCommand> {
  async execute(command: CreateUserCommand) {
    // 处理命令逻辑
  }
}

// 定义查询处理器
@QueryHandler(GetUserQuery)
export class GetUserHandler implements IQueryHandler<GetUserQuery> {
  async execute(query: GetUserQuery) {
    // 处理查询逻辑
  }
}

@Module({
  imports: [GlobalCqrsModule],
  providers: [CreateUserHandler, GetUserHandler],
})
export class UserModule {}
```

### CacheManagerModule

缓存管理器模块，提供基于 Redis 的缓存功能。

#### 功能

- 支持 Redis 单机模式
- 支持 Redis 集群模式
- 默认 TTL 为 24 小时
- 自动从配置服务读取 Redis 配置

#### 使用示例

```typescript
import { Module } from '@nestjs/common';
import { CacheManagerModule } from '@hl8/global';
import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class UserService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async getUser(id: string) {
    // 从缓存获取
    const cached = await this.cacheManager.get<string>(`user:${id}`);
    if (cached) {
      return JSON.parse(cached);
    }

    // 从数据库获取
    const user = await this.userRepository.findOne(id);

    // 存入缓存（TTL 使用默认值或自定义）
    await this.cacheManager.set(`user:${id}`, JSON.stringify(user), 3600000); // 1小时

    return user;
  }
}

@Module({
  imports: [CacheManagerModule],
  providers: [UserService],
})
export class UserModule {}
```

#### Redis 配置

CacheManagerModule 从 `@hl8/config` 读取 Redis 配置。支持以下配置：

**单机模式**:

```typescript
{
  mode: 'standalone',
  standalone: {
    host: 'localhost',
    port: 6379,
    password: 'your-password',
    db: 0
  }
}
```

**集群模式**:

```typescript
{
  mode: 'cluster',
  cluster: [
    { host: 'redis1.example.com', port: 6379, password: 'cluster-pwd' },
    { host: 'redis2.example.com', port: 6380, password: 'cluster-pwd' }
  ]
}
```

#### Redis URL 构建

- **单机模式**: `redis://:password@host:port/db`
- **集群模式**: `redis://:%password@node1:port1,node2:port2`

密码会自动进行 URL 编码处理。

## 🔧 依赖说明

### 核心依赖

- `@nestjs/common` - NestJS 核心模块
- `@nestjs/config` - 配置管理
- `@nestjs/axios` - HTTP 客户端
- `@nestjs/schedule` - 任务调度
- `@nestjs/event-emitter` - 事件系统
- `@nestjs/cqrs` - CQRS 支持
- `@nestjs/cache-manager` - 缓存管理
- `@keyv/redis` - Redis 缓存存储

### 内部依赖

- `@hl8/config` - 配置模块
- `@hl8/ip2region` - IP2Region 模块
- `@hl8/oss` - OSS 模块
- `@hl8/utils` - 工具函数

## 📝 注意事项

1. **全局模块**: `SharedModule` 和 `GlobalCqrsModule` 都使用了 `@Global()` 装饰器，导入后在整个应用中可用。

2. **配置加载**: SharedModule 会在启动时同步加载 YAML 配置文件，确保配置文件存在且格式正确。

3. **缓存 TTL**: CacheManagerModule 默认 TTL 为 24 小时（86400000 毫秒），可在使用 `cacheManager.set()` 时自定义。

4. **Redis 密码编码**: 密码会自动进行 URL 编码，特殊字符（如 `@`、`#`）会被正确处理。

5. **集群模式**: 集群模式下，密码从第一个节点获取，所有节点使用相同密码。

## 🧪 测试

运行测试：

```bash
pnpm test
```

运行测试并生成覆盖率报告：

```bash
pnpm test:cov
```

## 📄 许可证

MIT
