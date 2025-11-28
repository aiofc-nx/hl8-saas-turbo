# API Key 认证模块

## 📋 目录

- [概述](#概述)
- [核心功能](#核心功能)
- [架构设计](#架构设计)
- [使用指南](#使用指南)
- [配置说明](#配置说明)
- [安全特性](#安全特性)
- [最佳实践](#最佳实践)
- [常见问题](#常见问题)

## 概述

API Key 认证模块提供了两种 API 认证策略，用于保护需要认证的 API 端点：

1. **简单 API Key 认证** (`ApiKeyAuthStrategy.ApiKey`)：适用于内部服务调用或对安全性要求不高的场景
2. **签名请求认证** (`ApiKeyAuthStrategy.SignedRequest`)：适用于对外提供 API 服务，需要更高安全性的场景

### 主要特性

- ✅ **双策略支持**：简单 API Key 和签名请求两种认证方式
- ✅ **灵活配置**：支持从 Header 或 Query 参数中提取 API Key
- ✅ **高性能**：基于 Redis 持久化 + 内存缓存的双层存储架构
- ✅ **安全机制**：时间戳验证、Nonce 防重放、参数签名验证
- ✅ **多种算法**：支持 MD5、SHA1、SHA256、HMAC_SHA256 签名算法
- ✅ **事件驱动**：验证结果通过事件发射器通知，便于审计和监控
- ✅ **分布式支持**：基于 Redis 存储，支持多实例部署

## 核心功能

### 1. 简单 API Key 认证

简单 API Key 认证是最基础的认证方式，只需验证 API Key 是否存在且有效。

**适用场景：**

- 内部服务之间的调用
- 对安全性要求不高的场景
- 需要快速验证的场景

**特点：**

- 验证速度快，只需检查 Key 是否存在
- 内存缓存，减少 Redis 查询
- 不支持密钥更新操作
- 无时间戳、Nonce 等安全机制

**存储方式：**

- Redis Set 数据结构，键为 `cache:simple-api-keys`
- 内存 Set 缓存，启动时从 Redis 加载

### 2. 签名请求认证

签名请求认证提供了更高级的安全特性，通过签名算法验证请求的完整性和真实性。

**适用场景：**

- 对外提供 API 服务
- 需要防止请求被篡改的场景
- 需要防止重放攻击的场景

**安全特性：**

- ✅ **时间戳验证**：防止重放攻击，可配置时间窗口（默认 5 分钟）
- ✅ **Nonce 机制**：防止重复请求，每个 Nonce 只能使用一次
- ✅ **参数签名验证**：验证请求参数的完整性
- ✅ **多种签名算法**：MD5、SHA1、SHA256、HMAC_SHA256
- ✅ **密钥轮换**：支持更新密钥

**存储方式：**

- Redis Hash 数据结构，键为 `cache:complex-api-secrets`
- 内存 Map 缓存，启动时从 Redis 加载

**签名计算流程：**

1. 排除 `signature` 参数
2. 按字母顺序排序所有参数键（不区分大小写）
3. 对参数值进行 URL 编码
4. 构建签名字符串：`key1=encoded_value1&key2=encoded_value2`
5. 根据算法计算签名：
   - **MD5/SHA1/SHA256**：将密钥追加到签名字符串后计算（`data + &key=secret`）
   - **HMAC_SHA256**：使用密钥进行 HMAC 计算

## 架构设计

### 模块结构

```
api-key/
├── api-key.guard.ts          # API Key 认证守卫
├── api-key.module.ts         # API Key 模块定义
├── api-key.constants.ts      # 常量定义（服务注入令牌）
├── api-key.signature.algorithm.ts  # 签名算法枚举
├── events/
│   └── api-key-validation.event.ts  # 验证事件定义
└── services/
    ├── api-key.interface.ts   # 服务接口定义
    ├── simple-api-key.service.ts    # 简单 API Key 服务
    └── complex-api-key.service.ts   # 复杂签名请求服务
```

### 核心组件

#### 1. ApiKeyGuard（认证守卫）

负责从请求中提取 API Key，根据策略选择相应的验证服务进行验证。

**职责：**

- 从路由元数据获取 `@ApiKeyAuth()` 装饰器配置
- 从 Header 或 Query 参数中提取 API Key
- 根据策略选择简单或复杂验证服务
- 提取验证所需参数（算法、时间戳、nonce、签名等）
- 调用验证服务进行验证
- 通过事件发射器发送验证结果事件

#### 2. SimpleApiKeyService（简单 API Key 服务）

实现简单 API Key 验证逻辑，基于 Redis Set 存储。

**接口方法：**

- `loadKeys()`: 从 Redis 加载所有 API Key 到内存缓存
- `validateKey(apiKey)`: 验证 API Key 是否存在
- `addKey(apiKey)`: 添加新的 API Key
- `removeKey(apiKey)`: 删除 API Key
- `updateKey()`: 不支持（抛出错误）

#### 3. ComplexApiKeyService（复杂签名请求服务）

实现基于签名算法的复杂 API Key 验证逻辑。

**接口方法：**

- `loadKeys()`: 从 Redis 加载所有 API Key 和密钥到内存缓存
- `validateKey(apiKey, options)`: 验证签名请求（包括算法、时间戳、Nonce、签名）
- `addKey(apiKey, secret)`: 添加新的 API Key 和密钥
- `removeKey(apiKey)`: 删除 API Key 和密钥
- `updateKey(apiKey, newSecret)`: 更新 API Key 的密钥

**验证步骤：**

1. 算法验证：检查算法是否提供且受支持
2. 参数验证：检查时间戳、nonce 和签名是否提供
3. 时间戳验证：检查时间戳是否在允许的时间窗口内
4. Nonce 验证：检查 Nonce 是否已被使用或过期
5. 密钥获取：从内存缓存获取对应的密钥
6. 签名计算：根据算法和参数计算签名
7. 签名验证：比较计算的签名和提供的签名

#### 4. ApiKeyValidationEvent（验证事件）

当 API Key 验证完成时触发的事件对象，包含验证的 API Key、验证选项和验证结果。

**用途：**

- 审计日志记录
- 使用统计
- 异常监控

## 使用指南

### 1. 模块导入

在应用根模块或特性模块中导入 `ApiKeyModule`：

```typescript
import { Module } from '@nestjs/common';
import { ApiKeyModule } from '@hl8/guard';

@Module({
  imports: [ApiKeyModule],
})
export class AppModule {}
```

### 2. 简单 API Key 认证

#### 2.1 在控制器中使用

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiKeyAuth, Public } from '@hl8/decorators';
import { ApiKeyAuthStrategy, ApiKeyAuthSource } from '@hl8/constants';
import { ApiKeyGuard } from '@hl8/guard';

@Controller('api')
export class ApiController {
  /**
   * 简单 API Key 认证（从 Header 获取）
   *
   * 客户端需要在请求头中提供 'x-api-key' 字段
   */
  @Get('simple')
  @Public() // 跳过 JWT 认证
  @ApiKeyAuth({
    strategy: ApiKeyAuthStrategy.ApiKey,
    keyName: 'x-api-key',
    source: ApiKeyAuthSource.Header,
  })
  @UseGuards(ApiKeyGuard)
  async simpleRoute() {
    return { message: 'API Key authenticated' };
  }

  /**
   * 简单 API Key 认证（从 Query 参数获取）
   *
   * 客户端需要在查询参数中提供 'apiKey' 字段
   * 例如：GET /api/simple-query?apiKey=your-api-key
   */
  @Get('simple-query')
  @Public()
  @ApiKeyAuth({
    strategy: ApiKeyAuthStrategy.ApiKey,
    keyName: 'apiKey',
    source: ApiKeyAuthSource.Query,
  })
  @UseGuards(ApiKeyGuard)
  async simpleQueryRoute() {
    return { message: 'API Key authenticated from query' };
  }
}
```

#### 2.2 管理 API Key

```typescript
import { Injectable, Inject } from '@nestjs/common';
import { SimpleApiKeyServiceToken } from '@hl8/guard';
import type { IApiKeyService } from '@hl8/guard';

@Injectable()
export class ApiKeyManagementService {
  constructor(
    @Inject(SimpleApiKeyServiceToken)
    private readonly apiKeyService: IApiKeyService,
  ) {}

  /**
   * 添加 API Key
   */
  async addApiKey(apiKey: string): Promise<void> {
    await this.apiKeyService.addKey(apiKey);
  }

  /**
   * 删除 API Key
   */
  async removeApiKey(apiKey: string): Promise<void> {
    await this.apiKeyService.removeKey(apiKey);
  }

  /**
   * 验证 API Key
   */
  async validateApiKey(apiKey: string): Promise<boolean> {
    return await this.apiKeyService.validateKey(apiKey);
  }
}
```

### 3. 签名请求认证

#### 3.1 在控制器中使用

```typescript
import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiKeyAuth, Public } from '@hl8/decorators';
import { ApiKeyAuthStrategy } from '@hl8/constants';
import { ApiKeyGuard } from '@hl8/guard';

@Controller('api')
export class ApiController {
  /**
   * 签名请求认证
   *
   * 客户端需要提供以下参数：
   * - AccessKeyId: API Key（从 Query 或 Header 获取）
   * - Algorithm: 签名算法（MD5/SHA1/SHA256/HMAC_SHA256）
   * - AlgorithmVersion: 算法版本（可选，默认 'v1'）
   * - ApiVersion: API 版本（可选，默认 'v1'）
   * - timestamp: 请求时间戳（毫秒）
   * - nonce: 防重放的随机数
   * - signature: 请求签名
   */
  @Get('signed')
  @Public()
  @ApiKeyAuth({
    strategy: ApiKeyAuthStrategy.SignedRequest,
    keyName: 'AccessKeyId',
    source: ApiKeyAuthSource.Query, // 默认从 Query 获取
  })
  @UseGuards(ApiKeyGuard)
  async signedRoute() {
    return { message: 'Signed request authenticated' };
  }
}
```

#### 3.2 客户端签名计算示例

```typescript
import CryptoJS from 'crypto-js';

/**
 * 计算请求签名
 *
 * @param params - 请求参数（包括 Algorithm、timestamp、nonce 等）
 * @param secret - API Key 对应的密钥
 * @param algorithm - 签名算法
 * @returns 签名字符串
 */
function calculateSignature(
  params: Record<string, any>,
  secret: string,
  algorithm: 'MD5' | 'SHA1' | 'SHA256' | 'HMAC_SHA256',
): string {
  // 1. 排除 signature 参数
  const { signature, ...paramsToSign } = params;

  // 2. 按键名排序（不区分大小写）
  const sortedKeys = Object.keys(paramsToSign).sort((a, b) =>
    a.localeCompare(b, 'en', { sensitivity: 'base' }),
  );

  // 3. 构建签名字符串
  const signingString = sortedKeys
    .map((key) => {
      const value = paramsToSign[key];
      if (value === null || value === undefined) {
        return null;
      }
      const stringValue = String(value);
      const encodedValue = encodeURIComponent(stringValue);
      return `${key}=${encodedValue}`;
    })
    .filter((item) => item !== null)
    .join('&');

  // 4. 根据算法计算签名
  switch (algorithm) {
    case 'MD5':
      return CryptoJS.MD5(signingString + `&key=${secret}`).toString();
    case 'SHA1':
      return CryptoJS.SHA1(signingString + `&key=${secret}`).toString();
    case 'SHA256':
      return CryptoJS.SHA256(signingString + `&key=${secret}`).toString();
    case 'HMAC_SHA256':
      return CryptoJS.HmacSHA256(signingString, secret).toString();
    default:
      throw new Error(`Unsupported algorithm: ${algorithm}`);
  }
}

/**
 * 发送签名请求示例
 */
async function sendSignedRequest() {
  const apiKey = 'your-api-key';
  const secret = 'your-api-secret';
  const algorithm = 'HMAC_SHA256';
  const timestamp = String(Date.now());
  const nonce = Math.random().toString(36).substring(2, 15);

  // 构建请求参数
  const params = {
    AccessKeyId: apiKey,
    Algorithm: algorithm,
    AlgorithmVersion: 'v1',
    ApiVersion: 'v1',
    timestamp,
    nonce,
    // 其他业务参数
    param1: 'value1',
    param2: 'value2',
  };

  // 计算签名
  const signature = calculateSignature(params, secret, algorithm);
  params.signature = signature;

  // 发送请求
  const queryString = new URLSearchParams(params).toString();
  const response = await fetch(`/api/signed?${queryString}`);
  return response.json();
}
```

#### 3.3 管理 API Key 和密钥

```typescript
import { Injectable, Inject } from '@nestjs/common';
import { ComplexApiKeyServiceToken } from '@hl8/guard';
import type { IApiKeyService } from '@hl8/guard';

@Injectable()
export class SignedApiKeyManagementService {
  constructor(
    @Inject(ComplexApiKeyServiceToken)
    private readonly apiKeyService: IApiKeyService,
  ) {}

  /**
   * 注册客户端（添加 API Key 和密钥）
   */
  async registerClient(apiKey: string, secret: string): Promise<void> {
    await this.apiKeyService.addKey(apiKey, secret);
  }

  /**
   * 删除客户端
   */
  async removeClient(apiKey: string): Promise<void> {
    await this.apiKeyService.removeKey(apiKey);
  }

  /**
   * 更新密钥（密钥轮换）
   */
  async rotateSecret(apiKey: string, newSecret: string): Promise<void> {
    await this.apiKeyService.updateKey(apiKey, newSecret);
  }
}
```

### 4. 订阅验证事件

```typescript
import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EVENT_API_KEY_VALIDATED } from '@hl8/constants';
import { ApiKeyValidationEvent } from '@hl8/guard';

@Injectable()
export class ApiKeyAuditService {
  /**
   * 监听 API Key 验证事件
   *
   * 用于记录审计日志、使用统计或异常监控
   */
  @OnEvent(EVENT_API_KEY_VALIDATED)
  handleValidation(event: ApiKeyValidationEvent) {
    const { apiKey, validateOptions, isValid } = event;

    // 记录审计日志
    console.log(
      `API Key ${apiKey?.substring(0, 8)}*** validation: ${isValid ? 'SUCCESS' : 'FAILED'}`,
    );

    // 记录验证详情
    if (!isValid) {
      console.warn('Validation failed:', {
        apiKey: apiKey?.substring(0, 8) + '***',
        algorithm: validateOptions.algorithm,
        timestamp: validateOptions.timestamp,
        nonce: validateOptions.nonce,
      });
    }

    // 可以在这里实现：
    // - 记录到数据库
    // - 发送到监控系统
    // - 触发告警
  }
}
```

## 配置说明

### 环境变量配置

签名请求认证需要配置以下环境变量（在 `@hl8/config` 的 `SecurityConfig` 中）：

```bash
# 签名请求时间戳允许偏差（毫秒），默认 300000（5 分钟）
SIGN_REQ_TIMESTAMP_DISPARITY=300000

# 签名请求随机数生存时间（秒），默认 300（5 分钟）
SIGN_REQ_NONCE_TTL=300
```

### Redis 配置

API Key 模块依赖 Redis 进行持久化存储，需要确保 Redis 连接正常。

**存储键：**

- 简单 API Key：`cache:simple-api-keys` (Set)
- 复杂签名请求：`cache:complex-api-secrets` (Hash)
- Nonce 缓存：`cache:sign::nonce:{nonce}` (String, 带 TTL)

## 安全特性

### 1. 时间戳验证

签名请求认证通过时间戳验证防止重放攻击。请求时间戳与服务器当前时间的差值必须在配置的时间窗口内（默认 5 分钟）。

**工作原理：**

- 客户端在请求中包含当前时间戳（毫秒）
- 服务器验证时间戳是否在允许的时间窗口内
- 超出时间窗口的请求将被拒绝

### 2. Nonce 防重放

Nonce（Number Used Once）机制确保每个请求只能使用一次，防止重复请求攻击。

**工作原理：**

- 客户端在请求中包含唯一的随机数（nonce）
- 服务器检查 nonce 是否已被使用
- 如果已被使用，请求将被拒绝
- 使用后的 nonce 会被缓存，在 TTL 过期前不能再次使用

### 3. 参数签名验证

通过签名算法验证请求参数的完整性，确保请求在传输过程中未被篡改。

**签名计算规则：**

1. 排除 `signature` 参数
2. 按键名字母顺序排序（不区分大小写）
3. 对参数值进行 URL 编码
4. 构建签名字符串：`key1=value1&key2=value2`
5. 根据算法计算签名（MD5/SHA1/SHA256 追加密钥，HMAC_SHA256 使用密钥）

### 4. 签名算法选择

| 算法        | 安全性  | 性能  | 推荐场景             |
| ----------- | ------- | ----- | -------------------- |
| MD5         | ⚠️ 低   | ⚡ 高 | 不推荐用于生产环境   |
| SHA1        | ⚠️ 中   | ⚡ 中 | 不推荐用于新项目     |
| SHA256      | ✅ 高   | ⚡ 中 | 推荐使用             |
| HMAC_SHA256 | ✅ 最高 | ⚡ 中 | 强烈推荐用于生产环境 |

## 最佳实践

### 1. API Key 管理

- ✅ **定期轮换密钥**：对于签名请求认证，定期更新密钥以提高安全性
- ✅ **最小权限原则**：为不同的客户端分配不同的 API Key，并限制其权限范围
- ✅ **监控使用情况**：通过订阅验证事件监控 API Key 的使用情况，及时发现异常
- ✅ **及时撤销**：发现泄露或不再使用的 API Key 应立即删除

### 2. 安全建议

- ✅ **使用 HTTPS**：确保 API Key 在传输过程中加密
- ✅ **选择强算法**：优先使用 HMAC_SHA256 或 SHA256 算法
- ✅ **合理设置时间窗口**：根据业务需求设置合理的时间戳偏差，平衡安全性和可用性
- ✅ **Nonce 唯一性**：确保客户端生成的 nonce 具有足够的随机性和唯一性

### 3. 性能优化

- ✅ **内存缓存**：服务启动时从 Redis 加载所有 Key 到内存，减少查询延迟
- ✅ **批量操作**：需要管理多个 API Key 时，考虑批量操作以提高效率
- ✅ **监控 Redis**：监控 Redis 连接和性能，确保存储层稳定

### 4. 错误处理

- ✅ **统一错误响应**：验证失败时返回统一的错误格式，避免泄露敏感信息
- ✅ **记录详细日志**：在开发环境记录详细的验证日志，便于调试
- ✅ **异常监控**：通过事件订阅监控验证异常，及时发现问题

## 常见问题

### Q1: 简单 API Key 和签名请求认证有什么区别？

**A:** 简单 API Key 认证只需验证 Key 是否存在，适用于内部服务调用；签名请求认证通过签名算法验证请求完整性，适用于对外提供 API 服务，安全性更高。

### Q2: 如何选择认证策略？

**A:**

- 内部服务调用 → 使用简单 API Key 认证
- 对外提供 API → 使用签名请求认证
- 需要防止请求篡改 → 使用签名请求认证
- 需要防止重放攻击 → 使用签名请求认证

### Q3: 签名计算失败怎么办？

**A:** 检查以下几点：

1. 参数是否按字母顺序排序
2. 参数值是否正确进行 URL 编码
3. 是否排除了 `signature` 参数
4. 算法选择是否正确
5. 密钥是否正确

### Q4: 时间戳验证失败怎么办？

**A:**

1. 检查客户端和服务器时间是否同步
2. 检查时间戳格式是否正确（毫秒）
3. 检查时间窗口配置是否合理
4. 考虑使用 NTP 同步服务器时间

### Q5: Nonce 验证失败怎么办？

**A:**

1. 确保 nonce 具有足够的随机性
2. 检查 nonce 是否已被使用
3. 检查 nonce TTL 配置是否合理
4. 确保客户端不会重复使用相同的 nonce

### Q6: 如何实现密钥轮换？

**A:** 使用 `ComplexApiKeyService.updateKey()` 方法更新密钥。建议在密钥轮换期间同时支持新旧密钥，逐步迁移客户端。

### Q7: 如何监控 API Key 使用情况？

**A:** 订阅 `EVENT_API_KEY_VALIDATED` 事件，记录验证结果、时间戳、API Key（脱敏）等信息，用于审计和监控。

## 相关文档

- [Guard 模块总览](../../README.md)
- [装饰器使用指南](../../../../decorators/README.md)
- [配置模块文档](../../../../config/README.md)
