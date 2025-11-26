# @hl8/filters

NestJS 全局异常过滤器库，用于统一处理应用程序中的所有异常，并返回标准化的错误响应格式。

## 功能特性

- ✅ **统一异常处理**：捕获所有类型的异常并统一处理
- ✅ **标准化响应格式**：返回符合 `ApiResponse` 接口的标准化错误响应
- ✅ **多种异常类型支持**：
  - `UnprocessableEntityException`：验证失败异常
  - `HttpException`：HTTP 标准异常
  - `BizException`：业务异常
  - 其他未知异常：统一处理为内部服务器错误
- ✅ **类型安全**：使用 TypeScript 严格类型定义，无 `any` 类型
- ✅ **日志记录**：自动记录未知异常，便于调试和监控
- ✅ **完整测试覆盖**：包含全面的单元测试

## 安装

```bash
pnpm add @hl8/filters
```

## 使用方法

### 基本使用

在 NestJS 应用的根模块中注册全局异常过滤器：

```typescript
import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { AllExceptionsFilter } from '@hl8/filters';

@Module({
  providers: [
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
})
export class AppModule {}
```

### 异常类型处理

#### 1. 验证失败异常 (UnprocessableEntityException)

当使用 `class-validator` 进行数据验证时，验证失败会抛出 `UnprocessableEntityException`：

```typescript
import { UnprocessableEntityException } from '@nestjs/common';

// 抛出验证失败异常
throw new UnprocessableEntityException({
  message: 'Validation failed',
  errors: {
    email: ['邮箱格式不正确'],
    password: ['密码长度至少8位'],
  },
});
```

**响应格式：**

```json
{
  "code": 422,
  "message": "Validation failed",
  "error": {
    "code": 422,
    "message": "Validation failed",
    "errors": {
      "email": ["邮箱格式不正确"],
      "password": ["密码长度至少8位"]
    }
  }
}
```

#### 2. HTTP 异常 (HttpException)

标准 HTTP 异常处理：

```typescript
import { HttpException, HttpStatus } from '@nestjs/common';

// 抛出 HTTP 异常
throw new HttpException('Resource not found', HttpStatus.NOT_FOUND);
```

**响应格式：**

```json
{
  "code": 404,
  "message": "Resource not found",
  "error": {
    "code": 404,
    "message": "Resource not found"
  }
}
```

#### 3. 业务异常 (BizException)

使用业务异常处理业务逻辑错误：

```typescript
import { BizException, ErrorCode } from '@hl8/errors';

// 抛出业务异常
throw new BizException(ErrorCode.INTERNAL_SERVER_ERROR, '业务处理失败');
```

**响应格式：**

```json
{
  "code": 400,
  "message": "业务处理失败",
  "error": {
    "code": 500,
    "message": "业务处理失败"
  }
}
```

#### 4. 未知异常

其他类型的异常会被统一处理为内部服务器错误，并自动记录日志：

```typescript
// 抛出普通错误
throw new Error('Something went wrong');
```

**响应格式：**

```json
{
  "code": 500,
  "message": "Something went wrong",
  "error": {
    "code": 500,
    "message": "Something went wrong"
  }
}
```

## API 参考

### AllExceptionsFilter

全局异常过滤器类。

#### 方法

##### `catch(exception: unknown, host: ArgumentsHost): void`

捕获并处理异常。

**参数：**

- `exception: unknown` - 异常对象（可以是任何类型）
- `host: ArgumentsHost` - 参数宿主对象，用于获取请求和响应

**支持的异常类型：**

- `UnprocessableEntityException`：验证失败异常
- `HttpException`：HTTP 异常
- `BizException`：业务异常
- 其他异常：统一处理为内部服务器错误

## 响应格式

所有异常响应都遵循 `ApiResponse` 接口格式：

```typescript
interface ApiResponse<T = unknown> {
  /** 响应状态码 */
  code: number;
  /** 响应消息 */
  message: string;
  /** 错误信息 */
  error?: {
    /** 错误码 */
    code: number;
    /** 错误消息 */
    message: string;
    /** 验证错误详情（仅验证失败异常） */
    errors?: Record<string, string[]>;
  };
  /** 响应数据 */
  data?: T;
}
```

## 测试

运行单元测试：

```bash
pnpm test
```

运行测试并生成覆盖率报告：

```bash
pnpm test:cov
```

## 开发

### 构建

```bash
pnpm build
```

### 类型检查

```bash
pnpm type-check
```

### 代码检查

```bash
pnpm lint
```

## 依赖项

### 运行时依赖

- `@nestjs/common` - NestJS 核心模块
- `fastify` - Fastify HTTP 框架
- `@hl8/errors` - 错误定义库
- `@hl8/typings` - 类型定义库

### 开发依赖

- `@jest/globals` - Jest 测试框架
- `@types/jest` - Jest 类型定义
- `typescript` - TypeScript 编译器

## 许可证

本项目采用项目统一的许可证。
