# @hl8/crypto

NestJS 加密模块，提供数据加密和解密功能，支持 AES 和 RSA 加密方法，可自动处理请求解密和响应加密。

## 安装

```bash
pnpm add @hl8/crypto
```

## 功能特性

- ✅ **AES 加密**：支持 CBC、ECB、CTR 模式，PKCS7 填充，支持随机 IV
- ✅ **RSA 加密**：支持 PKCS1 和 PKCS1_OAEP 填充模式
- ✅ **自动序列化**：自动处理字符串和对象的序列化/反序列化
- ✅ **拦截器支持**：自动处理请求解密和响应加密
- ✅ **装饰器支持**：通过装饰器轻松标记需要加密的路由
- ✅ **灵活配置**：支持全局配置和路由级配置
- ✅ **TypeScript 支持**：完整的类型定义和智能提示

## 快速开始

### 1. 配置环境变量

在 `.env` 文件中配置加密密钥：

```env
# AES 配置（32 字节密钥，16 字节 IV）
CRYPTO_AES_KEY=12345678901234567890123456789012
CRYPTO_AES_IV=1234567890123456

# RSA 配置（PEM 格式）
CRYPTO_RSA_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----
...
-----END PRIVATE KEY-----

CRYPTO_RSA_PUBLIC_KEY=-----BEGIN PUBLIC KEY-----
...
-----END PUBLIC KEY-----
```

### 2. 注册模块

在应用模块中注册 `CryptoModule`：

```typescript
import { Module } from '@nestjs/common';
import { AESMode, CryptoMethod, CryptoModule, PaddingMode } from '@hl8/crypto';

@Module({
  imports: [
    CryptoModule.register({
      isGlobal: true,
      defaultMethod: CryptoMethod.AES,
      aes: {
        mode: AESMode.CBC,
        padding: PaddingMode.PKCS7,
        useRandomIV: false,
      },
    }),
  ],
})
export class AppModule {}
```

### 3. 使用装饰器

在控制器中使用加密装饰器：

```typescript
import { Controller, Post, Body } from '@nestjs/common';
import { Crypto, CryptoMethod, CryptoDirection } from '@hl8/crypto';
import { ApiRes } from '@hl8/rest';

@Controller('api')
export class ApiController {
  @Post('encrypted')
  @Crypto(CryptoMethod.AES, CryptoDirection.BOTH)
  async encryptedRoute(@Body() data: any): Promise<ApiRes<any>> {
    // 请求体会自动解密，响应体会自动加密
    return ApiRes.success({ receivedData: data });
  }
}
```

## 使用示例

### 直接使用 CryptoService

```typescript
import { Injectable } from '@nestjs/common';
import { CryptoService } from '@hl8/crypto';
import { CryptoMethod, AESMode, CryptoDirection } from '@hl8/crypto';

@Injectable()
export class MyService {
  constructor(private readonly cryptoService: CryptoService) {}

  async encryptData(data: unknown) {
    // 使用默认配置加密
    const encrypted = this.cryptoService.encrypt(data);
    return encrypted;
  }

  async encryptWithConfig(data: unknown) {
    // 使用自定义配置加密
    const encrypted = this.cryptoService.encrypt(data, {
      method: CryptoMethod.AES,
      aes: {
        mode: AESMode.CBC,
        padding: PaddingMode.PKCS7,
        useRandomIV: true,
      },
    });
    return encrypted;
  }

  async decryptData(encrypted: string) {
    // 解密数据
    const decrypted = this.cryptoService.decrypt(encrypted);
    return decrypted;
  }
}
```

### 使用装饰器

#### 基本用法

```typescript
import { Controller, Post, Body } from '@nestjs/common';
import {
  Crypto,
  AESCrypto,
  RSACrypto,
  CryptoMethod,
  CryptoDirection,
} from '@hl8/crypto';

@Controller('api')
export class ApiController {
  // 只加密响应
  @Post('encrypt-response')
  @Crypto(CryptoMethod.AES, CryptoDirection.ENCRYPT)
  async encryptResponse() {
    return { message: 'This will be encrypted' };
  }

  // 只解密请求
  @Post('decrypt-request')
  @Crypto(CryptoMethod.AES, CryptoDirection.DECRYPT)
  async decryptRequest(@Body() data: any) {
    return { received: data };
  }

  // 双向加密（解密请求，加密响应）
  @Post('both')
  @Crypto(CryptoMethod.AES, CryptoDirection.BOTH)
  async both(@Body() data: any) {
    return { received: data };
  }
}
```

#### AES 快捷装饰器

```typescript
import { AESCrypto, AESMode, CryptoDirection } from '@hl8/crypto';

@Controller('api')
export class ApiController {
  @Post('aes')
  @AESCrypto(
    {
      mode: AESMode.CBC,
      padding: PaddingMode.PKCS7,
      useRandomIV: true,
    },
    CryptoDirection.BOTH,
  )
  async aesEncrypted(@Body() data: any) {
    return { received: data };
  }
}
```

#### RSA 快捷装饰器

```typescript
import { RSACrypto, RSAPaddingMode, CryptoDirection } from '@hl8/crypto';

@Controller('api')
export class ApiController {
  @Post('rsa')
  @RSACrypto(
    {
      padding: RSAPaddingMode.PKCS1_OAEP,
    },
    CryptoDirection.BOTH,
  )
  async rsaEncrypted(@Body() data: any) {
    return { received: data };
  }
}
```

### 通过请求头启用加密

除了使用装饰器，还可以通过请求头 `x-crypto` 启用加密：

```typescript
// 客户端请求
fetch('/api/endpoint', {
  method: 'POST',
  headers: {
    'x-crypto': 'true',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(encryptedData),
});
```

当请求头存在时，会使用默认配置（AES，双向加密）。

## API 文档

### CryptoService

#### `encrypt(data: unknown, config?: Partial<CryptoConfig>): string`

加密数据。

**参数**:

- `data` - 待加密的数据（可以是任意类型，会自动序列化）
- `config` - 加密配置（可选，不提供时使用默认配置）

**返回**: 加密后的 Base64 编码字符串

**示例**:

```typescript
const encrypted = cryptoService.encrypt(
  { name: 'test' },
  {
    method: CryptoMethod.AES,
    aes: { mode: AESMode.CBC },
  },
);
```

#### `decrypt(encryptedData: string, config?: Partial<CryptoConfig>): unknown`

解密数据。

**参数**:

- `encryptedData` - 加密后的 Base64 编码字符串
- `config` - 解密配置（可选，不提供时使用默认配置）

**返回**: 解密后的数据（会自动反序列化为原始类型）

**示例**:

```typescript
const decrypted = cryptoService.decrypt(encryptedString, {
  method: CryptoMethod.AES,
  aes: { mode: AESMode.CBC },
});
```

### 装饰器

#### `@Crypto(method, direction, config?)`

通用加密装饰器。

**参数**:

- `method` - 加密方法（默认 `CryptoMethod.AES`）
- `direction` - 加密方向（默认 `CryptoDirection.ENCRYPT`）
- `config` - 加密配置（可选）

#### `@AESCrypto(config?, direction?)`

AES 加密快捷装饰器。

**参数**:

- `config` - AES 配置（可选，默认使用模块配置）
- `direction` - 加密方向（默认 `CryptoDirection.ENCRYPT`）

#### `@RSACrypto(config?, direction?)`

RSA 加密快捷装饰器。

**参数**:

- `config` - RSA 配置（可选，默认使用模块配置）
- `direction` - 加密方向（默认 `CryptoDirection.ENCRYPT`）

#### `@WithCryptoConfig(config)`

使用完整配置对象的装饰器。

**参数**:

- `config` - 完整的加密配置对象（必须包含 `method` 字段）

### 枚举和常量

#### `CryptoMethod`

加密方法枚举：

- `AES = 'aes'` - AES 加密
- `RSA = 'rsa'` - RSA 加密

#### `CryptoDirection`

加密方向枚举：

- `ENCRYPT = 'encrypt'` - 只加密响应
- `DECRYPT = 'decrypt'` - 只解密请求
- `BOTH = 'both'` - 双向（解密请求，加密响应）

#### `AESMode`

AES 加密模式枚举：

- `CBC = 'aes-256-cbc'` - CBC 模式
- `ECB = 'aes-256-ecb'` - ECB 模式
- `CTR = 'aes-256-ctr'` - CTR 模式

#### `PaddingMode`

填充模式枚举：

- `PKCS7 = 'pkcs7'` - PKCS7 填充
- `NoPadding = 'nopadding'` - 不填充

#### `RSAPaddingMode`

RSA 填充模式枚举：

- `PKCS1 = 'pkcs1'` - PKCS1 填充
- `PKCS1_OAEP = 'pkcs1_oaep'` - PKCS1_OAEP 填充

## 配置选项

### CryptoModuleOptions

模块配置选项：

```typescript
interface CryptoModuleOptions {
  /** 是否全局启用（默认 true） */
  isGlobal?: boolean;

  /** 默认加密方法（默认 CryptoMethod.AES） */
  defaultMethod?: CryptoMethod;

  /** AES 配置 */
  aes?: {
    /** 加密模式（默认 AESMode.CBC） */
    mode?: AESMode;
    /** 填充模式（默认 PaddingMode.PKCS7） */
    padding?: PaddingMode;
    /** 是否使用随机 IV（默认 false） */
    useRandomIV?: boolean;
  };
}
```

### CryptoConfig

加密配置接口：

```typescript
interface CryptoConfig {
  /** 加密方法 */
  method: CryptoMethod;
  /** 加密方向 */
  direction?: CryptoDirection;
  /** AES 配置 */
  aes?: AESConfig;
  /** RSA 配置 */
  rsa?: RSAConfig;
}
```

## 注意事项

### 安全性

1. **生产环境必须修改默认密钥**：默认的 AES 密钥和 IV 仅用于开发，生产环境必须使用强随机密钥。

2. **密钥管理**：
   - 密钥应通过环境变量配置，不要硬编码在代码中
   - 建议使用密钥管理服务（如 AWS KMS、Azure Key Vault 等）
   - 定期轮换密钥

3. **随机 IV**：
   - 使用随机 IV 可以提高安全性，但会增加密文长度（IV 会拼接在数据前面）
   - 固定 IV 适合相同数据需要相同密文的场景

### 性能

1. **RSA 加密限制**：RSA 加密有数据长度限制（通常为密钥长度 - 填充长度），不适合加密大量数据。建议：
   - 小数据直接使用 RSA
   - 大数据使用 AES 加密，RSA 加密 AES 密钥

2. **加密开销**：加密/解密操作会有性能开销，建议：
   - 只对敏感数据加密
   - 使用缓存减少重复加密

### 数据格式

1. **序列化**：
   - 字符串数据直接加密
   - 对象和数组会自动序列化为 JSON 后加密
   - 解密时会自动反序列化

2. **ApiRes 格式**：
   - 如果响应是 `ApiRes` 格式（包含 `code`、`message`、`data` 字段），只加密 `data` 字段
   - 其他格式会加密整个响应

## 开发

### 构建

```bash
pnpm build
```

### 测试

```bash
# 运行测试
pnpm test

# 运行测试并生成覆盖率报告
pnpm test:cov

# 监听模式运行测试
pnpm test:watch
```

### 代码检查

```bash
# 运行 ESLint
pnpm lint

# 类型检查
pnpm type-check
```

## 许可证

MIT
