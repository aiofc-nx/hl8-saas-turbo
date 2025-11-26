# @hl8/adapter

NestJS Fastify 适配器库，提供预配置的 Fastify 应用适配器和安全中间件，用于快速搭建 NestJS + Fastify 应用。

## 📋 项目概述

### 基本信息

- **包名**: `@hl8/adapter`
- **版本**: `1.0.0`
- **描述**: Adapter module for NestJS applications
- **位置**: `libs/infra/adapter`

### 提供的功能

1. **`fastifyApp`** - 预配置的 Fastify 应用适配器（包含文件上传和错误处理）
2. **`registerHelmet`** - Helmet 安全中间件注册函数（提供 CSP、HSTS、XSS 防护等）

## 🚀 快速开始

### 安装

该库是 monorepo 工作空间的一部分，通过 workspace 协议引用：

```json
{
  "dependencies": {
    "@hl8/adapter": "workspace:*"
  }
}
```

### 导入

```typescript
import { fastifyApp, registerHelmet } from '@hl8/adapter';
```

## 📚 API 文档

### fastifyApp

预配置的 Fastify 应用适配器实例，已包含以下配置：

- ✅ 文件上传中间件（multipart）
- ✅ 错误处理钩子（onError）
- ✅ 日志配置（禁用默认日志）

#### 使用示例

```typescript
import { NestFactory } from '@nestjs/core';
import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { fastifyApp } from '@hl8/adapter';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    fastifyApp,
    { abortOnError: true },
  );

  await app.listen(3000);
}
bootstrap();
```

#### 配置说明

**文件上传限制：**

- 最大非文件字段数：10
- 最大文件大小：6MB
- 最大文件字段数：5

**错误处理：**

- 自动记录错误信息（IP、方法、User-Agent、URL、错误消息）
- 根据错误类型返回适当的状态码
- 防止重复发送响应

### registerHelmet

注册 Helmet 安全中间件，提供多种安全防护功能。

#### 函数签名

```typescript
function registerHelmet(
  app: FastifyInstance,
  config?: HelmetConfig,
): Promise<void>;
```

#### 参数

- `app: FastifyInstance` - Fastify 应用实例
- `config?: HelmetConfig` - 可选的 Helmet 配置（不提供时使用默认配置）

#### 默认配置

- **Content Security Policy (CSP)**: 默认源为 `'self'`，允许内联样式和脚本
- **XSS Filter**: 启用
- **No Sniff**: 启用（禁止 MIME 类型嗅探）
- **HSTS**: 启用（maxAge: 31536000，包含子域名，启用预加载）
- **Referrer Policy**: `'strict-origin-when-cross-origin'`
- **Hide Powered-By**: 启用（隐藏 X-Powered-By 头）
- **X-Frame-Options**: `'sameorigin'`

#### 使用示例

##### 使用默认配置

```typescript
import { registerHelmet } from '@hl8/adapter';
import { NestFactory } from '@nestjs/core';
import { NestFastifyApplication } from '@nestjs/platform-fastify';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(AppModule);
  const fastifyInstance = app.getHttpAdapter().getInstance();

  await registerHelmet(fastifyInstance);

  await app.listen(3000);
}
bootstrap();
```

##### 自定义配置

```typescript
import { registerHelmet } from '@hl8/adapter';

await registerHelmet(fastifyInstance, {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'", 'https://example.com'],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
    },
  },
  xssFilter: true,
  noSniff: true,
  strictTransportSecurity: {
    maxAge: 63072000, // 2 年
    includeSubDomains: true,
    preload: true,
  },
  referrerPolicy: {
    policy: 'no-referrer',
  },
  hidePoweredBy: true,
});
```

#### 配置选项

##### HelmetConfig

```typescript
type HelmetConfig = Partial<{
  /**
   * CSP 配置
   * @default defaultCSPDirectives
   */
  contentSecurityPolicy: HelmetOptions['contentSecurityPolicy'];

  /**
   * 是否启用 XSS 过滤
   * @default true
   */
  xssFilter: boolean;

  /**
   * 是否禁止 MIME 类型嗅探
   * @default true
   */
  noSniff: boolean;

  /**
   * HSTS 配置
   * @default defaultHSTSConfig
   */
  strictTransportSecurity: {
    maxAge: number;
    includeSubDomains: boolean;
    preload: boolean;
  };

  /**
   * 引用策略
   * @default 'strict-origin-when-cross-origin'
   */
  referrerPolicy: {
    policy: ReferrerPolicy;
  };

  /**
   * 是否隐藏 X-Powered-By
   * @default true
   */
  hidePoweredBy: boolean;
}>;
```

##### ReferrerPolicy 类型

```typescript
type ReferrerPolicy =
  | 'no-referrer'
  | 'no-referrer-when-downgrade'
  | 'origin'
  | 'origin-when-cross-origin'
  | 'same-origin'
  | 'strict-origin'
  | 'strict-origin-when-cross-origin'
  | 'unsafe-url';
```

## 💡 使用示例

### 完整应用启动示例

```typescript
import cluster from 'node:cluster';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestFastifyApplication } from '@nestjs/platform-fastify';

import { fastifyApp, registerHelmet } from '@hl8/adapter';
import { IAppConfig } from '@hl8/config';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    fastifyApp,
    { abortOnError: true },
  );

  const configService = app.get(ConfigService);
  const { port } = configService.get<IAppConfig>('app', { infer: true });

  // 注册安全中间件
  const fastifyInstance = app.getHttpAdapter().getInstance();
  await registerHelmet(fastifyInstance);

  // 其他配置...
  app.setGlobalPrefix('v1');

  await app.listen(port, '0.0.0.0', async () => {
    const url = await app.getUrl();
    const logger = new Logger('NestApplication');
    logger.log(`Server running on ${url}`);
  });
}

bootstrap();
```

### 自定义安全配置示例

```typescript
import { registerHelmet } from '@hl8/adapter';

// 为生产环境配置严格的安全策略
await registerHelmet(fastifyInstance, {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"], // 生产环境移除 'unsafe-inline' 和 'unsafe-eval'
      styleSrc: ["'self'"], // 生产环境移除 'unsafe-inline'
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", 'https://api.example.com'],
      fontSrc: ["'self'", 'data:', 'https:'],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"], // 禁止嵌入 iframe
    },
  },
  strictTransportSecurity: {
    maxAge: 63072000, // 2 年
    includeSubDomains: true,
    preload: true,
  },
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin',
  },
});
```

## 🔒 安全特性

### Content Security Policy (CSP)

默认 CSP 配置提供基本的 XSS 防护：

- `defaultSrc: ["'self'"]` - 默认只允许同源资源
- `styleSrc: ["'self'", "'unsafe-inline'"]` - 允许内联样式（开发环境）
- `scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"]` - 允许内联脚本（开发环境）
- `imgSrc: ["'self'", 'data:', 'https:']` - 允许图片资源
- `connectSrc: ["'self'", 'https:', 'wss:']` - 允许网络连接
- `objectSrc: ["'none'"]` - 禁止插件

**⚠️ 注意**: 生产环境建议移除 `'unsafe-inline'` 和 `'unsafe-eval'`，使用更严格的 CSP 策略。

### HTTP Strict Transport Security (HSTS)

默认配置：

- `maxAge: 31536000` (1 年)
- `includeSubDomains: true`
- `preload: true`

### 其他安全头

- **X-XSS-Protection**: 启用浏览器 XSS 过滤
- **X-Content-Type-Options**: 禁止 MIME 类型嗅探
- **X-Frame-Options**: 设置为 `sameorigin`，防止点击劫持
- **Referrer-Policy**: 控制引用信息泄露
- **X-Powered-By**: 隐藏服务器信息

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

- ✅ Fastify 适配器实例创建和配置
- ✅ Multipart 中间件注册
- ✅ 错误处理钩子
- ✅ Helmet 默认配置
- ✅ Helmet 自定义配置
- ✅ 边界情况和错误处理

## 📦 依赖说明

### 核心依赖

- `@nestjs/platform-fastify` - NestJS Fastify 平台适配器
- `@fastify/multipart` - Fastify 文件上传插件
- `@fastify/helmet` - Fastify 安全中间件
- `fastify` - Fastify Web 框架

### 内部依赖

- `@hl8/constants` - 常量定义（USER_AGENT 等）
- `@nestjs/common` - NestJS 通用工具（Logger 等）

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

1. **文件上传限制**: 默认配置限制文件大小为 6MB，最大 5 个文件。如需调整，请修改 `fastify.adapter.ts` 中的配置。

2. **错误处理**: 错误处理钩子会记录所有错误并返回统一格式的错误响应。如需自定义错误处理逻辑，请修改 `fastify.adapter.ts`。

3. **安全配置**: 默认的 CSP 配置包含 `'unsafe-inline'` 和 `'unsafe-eval'`，适合开发环境。生产环境建议使用更严格的配置。

4. **HSTS 预加载**: 启用 HSTS 预加载需要将域名提交到 [HSTS Preload List](https://hstspreload.org/)。

## 📄 许可证

MIT

## 🔗 相关链接

- [NestJS 文档](https://docs.nestjs.com/)
- [Fastify 文档](https://www.fastify.io/)
- [Helmet 文档](https://helmetjs.github.io/)
- [Fastify Multipart 文档](https://github.com/fastify/fastify-multipart)
