# @hl8/guard

NestJS 认证守卫库，提供 JWT 认证守卫和 API Key 认证守卫，支持简单 API Key 和签名请求两种认证策略。

## 📋 项目概述

### 基本信息

- **包名**: `@hl8/guard`
- **版本**: `1.0.0`
- **描述**: Guard module for NestJS applications
- **位置**: `libs/infra/guard`

### 提供的功能

1. **`JwtAuthGuard`** - JWT 认证守卫，支持公开路由标记
2. **`ApiKeyGuard`** - API Key 认证守卫，支持简单和签名请求两种策略
3. **`SimpleApiKeyService`** - 简单 API Key 验证服务
4. **`ComplexApiKeyService`** - 复杂签名请求验证服务（支持多种签名算法）

## 🚀 快速开始

### 安装

该库是 monorepo 工作空间的一部分，通过 workspace 协议引用：

```json
{
  "dependencies": {
    "@hl8/guard": "workspace:*"
  }
}
```

### 导入

```typescript
import { JwtAuthGuard, ApiKeyModule } from '@hl8/guard';
```

## 📚 API 文档

### JwtAuthGuard

JWT 认证守卫，基于 Passport JWT 策略，支持通过 `@Public()` 装饰器标记公开路由。

#### 使用示例

##### 全局注册

```typescript
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from '@hl8/guard';

@Module({
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
```

##### 路由级别使用

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@hl8/guard';
import { Public } from '@hl8/decorators';

@Controller('api')
export class ApiController {
  // 需要认证的路由
  @UseGuards(JwtAuthGuard)
  @Get('protected')
  getProtected() {
    return { message: 'This route requires authentication' };
  }

  // 公开路由
  @Public()
  @Get('public')
  getPublic() {
    return { message: 'This route is public' };
  }
}
```

#### 功能特性

- ✅ 支持全局和路由级别的守卫注册
- ✅ 支持通过 `@Public()` 装饰器跳过认证
- ✅ 自动处理认证失败，抛出 `UnauthorizedException`
- ✅ 与 Passport JWT 策略集成

### ApiKeyGuard

API Key 认证守卫，支持两种认证策略：

1. **简单 API Key** - 基于 Redis 存储的简单 Key 验证
2. **签名请求** - 基于时间戳、Nonce 和签名的复杂验证

#### 使用示例

##### 1. 模块导入

```typescript
import { Module } from '@nestjs/common';
import { ApiKeyModule } from '@hl8/guard';

@Module({
  imports: [ApiKeyModule],
  // ...
})
export class AppModule {}
```

##### 2. 简单 API Key 认证

```typescript
import { Controller, Get } from '@nestjs/common';
import { ApiKeyAuth } from '@hl8/decorators';
import { ApiKeyAuthStrategy, ApiKeyAuthSource } from '@hl8/constants';

@Controller('api')
export class ApiController {
  // 从 Header 获取 API Key
  @ApiKeyAuth({
    strategy: ApiKeyAuthStrategy.ApiKey,
    keyName: 'x-api-key',
    source: ApiKeyAuthSource.Header,
  })
  @Get('simple')
  getSimple() {
    return { message: 'Simple API Key authentication' };
  }

  // 从 Query 参数获取 API Key
  @ApiKeyAuth({
    strategy: ApiKeyAuthStrategy.ApiKey,
    keyName: 'apiKey',
    source: ApiKeyAuthSource.Query,
  })
  @Get('simple-query')
  getSimpleQuery() {
    return { message: 'Simple API Key from query' };
  }
}
```

##### 3. 签名请求认证

```typescript
import { Controller, Get } from '@nestjs/common';
import { ApiKeyAuth } from '@hl8/decorators';
import { ApiKeyAuthStrategy } from '@hl8/constants';

@Controller('api')
export class ApiController {
  @ApiKeyAuth({
    strategy: ApiKeyAuthStrategy.SignedRequest,
    keyName: 'api-key',
  })
  @Get('signed')
  getSigned() {
    return { message: 'Signed request authentication' };
  }
}
```

#### 签名请求参数要求

签名请求需要在查询参数中包含以下字段：

- `api-key` - API Key（可通过 Header 或 Query 传递）
- `Algorithm` - 签名算法（MD5、SHA1、SHA256、HMAC_SHA256）
- `AlgorithmVersion` - 算法版本（可选，默认 'v1'）
- `ApiVersion` - API 版本（可选，默认 'v1'）
- `timestamp` - 时间戳（毫秒）
- `nonce` - 随机数（防重放）
- `signature` - 计算得到的签名

#### 支持的签名算法

- `MD5` - MD5 哈希算法
- `SHA1` - SHA-1 哈希算法
- `SHA256` - SHA-256 哈希算法
- `HMAC_SHA256` - HMAC-SHA256 算法

### SimpleApiKeyService

简单 API Key 验证服务，提供基础的 Key 验证功能。

#### 服务接口

```typescript
interface IApiKeyService {
  loadKeys(): Promise<void>;
  validateKey(apiKey: string, options?: ValidateKeyOptions): Promise<boolean>;
  addKey(apiKey: string, secret?: string): Promise<void>;
  removeKey(apiKey: string): Promise<void>;
  updateKey(apiKey: string, newSecret: string): Promise<void>;
}
```

#### 使用示例

```typescript
import { Injectable } from '@nestjs/common';
import { SimpleApiKeyServiceToken, SimpleApiKeyService } from '@hl8/guard';

@Injectable()
export class ApiKeyManagementService {
  constructor(
    @Inject(SimpleApiKeyServiceToken)
    private readonly apiKeyService: IApiKeyService,
  ) {}

  async addNewKey(apiKey: string) {
    await this.apiKeyService.addKey(apiKey);
  }

  async revokeKey(apiKey: string) {
    await this.apiKeyService.removeKey(apiKey);
  }
}
```

### ComplexApiKeyService

复杂签名请求验证服务，支持多种签名算法和安全特性。

#### 安全特性

- ✅ 时间戳验证（防止重放攻击）
- ✅ Nonce 机制（防止重复请求）
- ✅ 多种签名算法支持
- ✅ 参数签名验证

#### 使用示例

```typescript
import { Injectable } from '@nestjs/common';
import { ComplexApiKeyServiceToken } from '@hl8/guard';

@Injectable()
export class SignedRequestService {
  constructor(
    @Inject(ComplexApiKeyServiceToken)
    private readonly signedService: IApiKeyService,
  ) {}

  async registerApiKey(apiKey: string, secret: string) {
    await this.signedService.addKey(apiKey, secret);
  }

  async rotateSecret(apiKey: string, newSecret: string) {
    await this.signedService.updateKey(apiKey, newSecret);
  }
}
```

## 💡 使用示例

### 完整应用配置示例

```typescript
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { JwtAuthGuard, ApiKeyModule } from '@hl8/guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // ...
    }),
    ApiKeyModule, // API Key 模块是全局的
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard, // 全局 JWT 守卫
    },
  ],
})
export class AppModule {}
```

### 混合使用 JWT 和 API Key

```typescript
import { Controller, Get } from '@nestjs/common';
import { Public } from '@hl8/decorators';
import { ApiKeyAuth } from '@hl8/decorators';
import { ApiKeyAuthStrategy } from '@hl8/constants';

@Controller('api')
export class HybridController {
  // JWT 认证（全局守卫）
  @Get('jwt')
  getJwt() {
    return { message: 'JWT authenticated' };
  }

  // 公开路由
  @Public()
  @Get('public')
  getPublic() {
    return { message: 'Public route' };
  }

  // API Key 认证（覆盖全局守卫）
  @ApiKeyAuth({
    strategy: ApiKeyAuthStrategy.ApiKey,
    keyName: 'x-api-key',
  })
  @Get('api-key')
  getApiKey() {
    return { message: 'API Key authenticated' };
  }
}
```

### API Key 管理示例

```typescript
import { Injectable } from '@nestjs/common';
import {
  SimpleApiKeyServiceToken,
  ComplexApiKeyServiceToken,
} from '@hl8/guard';
import type { IApiKeyService } from '@hl8/guard';

@Injectable()
export class ApiKeyManagerService {
  constructor(
    @Inject(SimpleApiKeyServiceToken)
    private readonly simpleService: IApiKeyService,
    @Inject(ComplexApiKeyServiceToken)
    private readonly complexService: IApiKeyService,
  ) {}

  // 创建简单 API Key
  async createSimpleKey(apiKey: string) {
    await this.simpleService.addKey(apiKey);
    return { apiKey, type: 'simple' };
  }

  // 创建签名请求 API Key
  async createSignedKey(apiKey: string, secret: string) {
    await this.complexService.addKey(apiKey, secret);
    return { apiKey, type: 'signed', secret };
  }

  // 撤销 API Key
  async revokeKey(apiKey: string, type: 'simple' | 'signed') {
    const service =
      type === 'simple' ? this.simpleService : this.complexService;
    await service.removeKey(apiKey);
  }
}
```

### 签名请求客户端示例

```typescript
import CryptoJS from 'crypto-js';
import { SignatureAlgorithm } from '@hl8/guard';

function generateSignature(
  params: Record<string, string>,
  secret: string,
  algorithm: SignatureAlgorithm,
): string {
  // 排除 signature 参数
  const { signature, ...paramsToSign } = params;

  // 按字母顺序排序
  const sortedKeys = Object.keys(paramsToSign).sort((a, b) =>
    a.localeCompare(b, 'en', { sensitivity: 'base' }),
  );

  // 构建签名字符串
  const signingString = sortedKeys
    .map((key) => {
      const value = encodeURIComponent(paramsToSign[key]);
      return `${key}=${value}`;
    })
    .join('&');

  // 根据算法计算签名
  switch (algorithm) {
    case SignatureAlgorithm.MD5:
      return CryptoJS.MD5(signingString + `&key=${secret}`).toString();
    case SignatureAlgorithm.SHA1:
      return CryptoJS.SHA1(signingString + `&key=${secret}`).toString();
    case SignatureAlgorithm.SHA256:
      return CryptoJS.SHA256(signingString + `&key=${secret}`).toString();
    case SignatureAlgorithm.HMAC_SHA256:
      return CryptoJS.HmacSHA256(signingString, secret).toString();
    default:
      throw new Error(`Unsupported algorithm: ${algorithm}`);
  }
}

// 使用示例
async function makeSignedRequest(
  apiKey: string,
  secret: string,
  endpoint: string,
) {
  const timestamp = Date.now().toString();
  const nonce = Math.random().toString(36).substring(7);
  const algorithm = SignatureAlgorithm.HMAC_SHA256;

  const params = {
    apiKey,
    Algorithm: algorithm,
    AlgorithmVersion: 'v1',
    ApiVersion: 'v1',
    timestamp,
    nonce,
    param1: 'value1',
    param2: 'value2',
  };

  const signature = generateSignature(params, secret, algorithm);
  params.signature = signature;

  // 构建查询字符串
  const queryString = new URLSearchParams(params).toString();
  const url = `${endpoint}?${queryString}`;

  const response = await fetch(url, {
    headers: {
      'api-key': apiKey,
    },
  });

  return response.json();
}
```

## ⚙️ 配置说明

### 安全配置

签名请求相关的配置在 `@hl8/config` 的 `SecurityConfig` 中：

```typescript
// 环境变量
SIGN_REQ_TIMESTAMP_DISPARITY = 300000; // 时间戳允许偏差（毫秒），默认 5 分钟
SIGN_REQ_NONCE_TTL = 300; // Nonce 生存时间（秒），默认 5 分钟
```

### Redis 配置

API Key 存储在 Redis 中：

- **简单 API Key**: 存储在 Set 中，键为 `cache:simple-api-keys`
- **复杂 API Key**: 存储在 Hash 中，键为 `cache:complex-api-secrets`
- **Nonce**: 存储在 String 中，键为 `cache:sign::nonce:{nonce}`

### 环境变量

```env
# JWT 配置
JWT_SECRET=your-jwt-secret
JWT_EXPIRE_IN=7200

# 签名请求配置
SIGN_REQ_TIMESTAMP_DISPARITY=300000
SIGN_REQ_NONCE_TTL=300

# Redis 配置（通过 @hl8/redis 配置）
REDIS_HOST=localhost
REDIS_PORT=6379
```

## 🔒 安全特性

### JWT 认证

- ✅ 基于 Passport JWT 策略
- ✅ 支持公开路由标记
- ✅ 自动处理认证失败

### 简单 API Key

- ✅ Redis 存储，支持分布式环境
- ✅ 内存缓存，提升性能
- ✅ 快速验证，适合高频请求

### 签名请求

- ✅ 时间戳验证（防止重放攻击）
- ✅ Nonce 机制（防止重复请求）
- ✅ 多种签名算法支持
- ✅ 参数签名验证
- ✅ 配置化的时间窗口和 TTL

### 事件通知

所有 API Key 验证都会触发 `EVENT_API_KEY_VALIDATED` 事件，可以用于：

- 审计日志
- 使用统计
- 异常监控

```typescript
import { OnEvent } from '@nestjs/event-emitter';
import { EVENT_API_KEY_VALIDATED } from '@hl8/constants';
import { ApiKeyValidationEvent } from '@hl8/guard';

@Injectable()
export class ApiKeyAuditService {
  @OnEvent(EVENT_API_KEY_VALIDATED)
  handleApiKeyValidation(event: ApiKeyValidationEvent) {
    // 记录验证结果
    console.log(`API Key ${event.apiKey} validation: ${event.isValid}`);
  }
}
```

## 🧪 测试

### 运行测试

```bash
# 运行所有测试
pnpm test

# 运行测试并生成覆盖率报告
pnpm test:cov

# 监听模式运行测试
pnpm test:watch
```

### 测试覆盖率

该库包含完整的单元测试，覆盖以下场景：

- ✅ JWT 认证守卫的公开路由和认证流程
- ✅ API Key 守卫的简单和签名请求策略
- ✅ Header 和 Query 两种来源
- ✅ 简单 API Key 服务的 CRUD 操作
- ✅ 复杂 API Key 服务的签名验证
- ✅ 时间戳和 Nonce 验证
- ✅ 多种签名算法
- ✅ 错误处理和事件发射

## 📦 依赖说明

### 核心依赖

- `@nestjs/common` - NestJS 通用工具
- `@nestjs/core` - NestJS 核心功能
- `@nestjs/passport` - Passport 集成
- `@nestjs/event-emitter` - 事件发射器
- `crypto-js` - 加密算法库
- `ioredis` - Redis 客户端

### 内部依赖

- `@hl8/config` - 配置管理（安全配置）
- `@hl8/constants` - 常量定义
- `@hl8/decorators` - 装饰器（@Public, @ApiKeyAuth）
- `@hl8/redis` - Redis 工具类
- `@hl8/typings` - 类型定义（IAuthentication）

## 🔧 开发

### 构建

```bash
pnpm build
```

### 类型检查

```bash
pnpm type-check
```

### 代码格式化

```bash
pnpm format
```

### 代码检查

```bash
pnpm lint
```

## 📝 注意事项

1. **API Key 存储**: API Key 存储在 Redis 中，确保 Redis 服务可用且配置正确。

2. **时间戳验证**: 签名请求的时间戳验证基于服务器时间，确保服务器时间同步。

3. **Nonce 存储**: Nonce 存储在 Redis 中，默认 TTL 为 5 分钟，确保 Redis 内存充足。

4. **签名算法**: 不同的签名算法有不同的安全性，建议使用 HMAC_SHA256 或 SHA256。

5. **密钥管理**: 复杂 API Key 的密钥需要安全存储，不要泄露给客户端。

6. **事件订阅**: API Key 验证事件可以用于监控和审计，建议订阅并记录相关日志。

## ❓ 常见问题

### Q: 如何同时使用 JWT 和 API Key 认证？

A: JWT 守卫可以作为全局守卫，API Key 守卫通过装饰器在路由级别使用。API Key 装饰器会自动覆盖全局守卫。

### Q: 简单 API Key 和签名请求有什么区别？

A: 简单 API Key 只需要验证 Key 是否存在，适合内部服务调用。签名请求需要验证时间戳、Nonce 和签名，适合对外 API。

### Q: 如何管理 API Key？

A: 可以通过注入 `SimpleApiKeyServiceToken` 或 `ComplexApiKeyServiceToken` 来管理 API Key，或者直接操作 Redis。

### Q: 签名请求的签名计算逻辑是什么？

A: 1. 排除 signature 参数 2. 按字母顺序排序所有参数 3. 构建签名字符串（key=value&key=value） 4. 根据算法计算签名（MD5/SHA1/SHA256 需要追加 &key=secret，HMAC_SHA256 使用密钥）

### Q: 如何处理时间同步问题？

A: 可以通过配置 `SIGN_REQ_TIMESTAMP_DISPARITY` 环境变量来调整时间戳允许偏差，默认 5 分钟。

## 📄 许可证

MIT

## 🔗 相关链接

- [NestJS 文档](https://docs.nestjs.com/)
- [Passport 文档](http://www.passportjs.org/)
- [CryptoJS 文档](https://cryptojs.gitbook.io/)
