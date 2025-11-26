# @hl8/strategies

NestJS Passport 策略库，提供 JWT 认证策略实现，用于快速集成 JWT Token 认证功能。

## 📋 项目概述

### 基本信息

- **包名**: `@hl8/strategies`
- **版本**: `1.0.0`
- **描述**: Strategies module for NestJS applications
- **位置**: `libs/infra/strategies`

### 提供的功能

1. **`JwtStrategy`** - JWT 认证策略类，实现基于 Passport 的 JWT Token 验证

## 🚀 快速开始

### 安装

该库是 monorepo 工作空间的一部分，通过 workspace 协议引用：

```json
{
  "dependencies": {
    "@hl8/strategies": "workspace:*"
  }
}
```

### 导入

```typescript
import { JwtStrategy } from '@hl8/strategies';
```

## 📚 API 文档

### JwtStrategy

JWT 认证策略类，继承自 `PassportStrategy`，用于验证 JWT Token 并提取用户认证信息。

#### 类签名

```typescript
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    @Inject(SecurityConfig.KEY)
    private readonly securityConfig: ISecurityConfig,
  );

  async validate(payload: unknown): Promise<IAuthentication>;

  async validateAuthenticationPayload(
    payload: unknown,
  ): Promise<IAuthentication>;
}
```

#### 功能特性

- ✅ 从请求头中提取 Bearer Token
- ✅ 使用配置的 JWT 密钥验证 Token
- ✅ 使用 `class-validator` 验证载荷格式
- ✅ 返回符合 `IAuthentication` 接口的认证信息
- ✅ 提供详细的验证错误信息

#### 使用示例

##### 基本使用

在 NestJS 模块中注册策略：

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from '@hl8/strategies';
import { JwtAuthGuard } from '@hl8/guard';
import { APP_GUARD } from '@nestjs/core';
import * as config from '@hl8/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [config.SecurityConfig],
    }),
    PassportModule,
  ],
  providers: [
    JwtStrategy,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
```

##### 与 JwtAuthGuard 配合使用

`JwtStrategy` 通常与 `@hl8/guard` 中的 `JwtAuthGuard` 配合使用：

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@hl8/guard';
import { Public } from '@hl8/decorators';

@Controller('api')
export class ApiController {
  // 需要认证的路由
  @Get('protected')
  @UseGuards(JwtAuthGuard)
  async protectedRoute() {
    return { message: 'This route requires authentication' };
  }

  // 公开路由（跳过认证）
  @Get('public')
  @Public()
  async publicRoute() {
    return { message: 'This route is public' };
  }
}
```

##### 在控制器中访问认证信息

```typescript
import { Controller, Get, Request } from '@nestjs/common';
import { JwtAuthGuard } from '@hl8/guard';
import { IAuthentication } from '@hl8/typings';

@Controller('user')
@UseGuards(JwtAuthGuard)
export class UserController {
  @Get('profile')
  async getProfile(@Request() req: { user: IAuthentication }) {
    return {
      uid: req.user.uid,
      username: req.user.username,
      domain: req.user.domain,
    };
  }
}
```

## ⚙️ 配置要求

### SecurityConfig

`JwtStrategy` 需要注入 `SecurityConfig`，该配置包含 JWT 密钥等信息。

#### 环境变量

```bash
# JWT 密钥（必需）
JWT_SECRET=your-secret-key-here

# JWT 过期时间（秒，可选，默认 7200）
JWT_EXPIRE_IN=7200
```

#### 配置示例

```typescript
import { ConfigModule } from '@nestjs/config';
import * as config from '@hl8/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [config.SecurityConfig],
    }),
  ],
})
export class AppModule {}
```

### JWT 载荷格式

JWT Token 的载荷必须符合 `IAuthentication` 接口：

```typescript
interface IAuthentication {
  /** 用户唯一标识 */
  uid: string;
  /** 用户名 */
  username: string;
  /** 用户所属域 */
  domain: string;
}
```

#### 有效载荷示例

```json
{
  "uid": "user-123",
  "username": "john.doe",
  "domain": "example.com"
}
```

## 🔍 验证机制

`JwtStrategy` 使用 `class-validator` 对 JWT 载荷进行验证：

1. **类型验证**: 确保 `uid`、`username`、`domain` 都是字符串类型
2. **必需字段验证**: 确保所有必需字段都存在
3. **错误处理**: 验证失败时抛出 `UnauthorizedException`，包含详细的错误信息

### 验证错误示例

当载荷格式无效时，会抛出包含详细信息的异常：

```typescript
// 无效载荷：uid 为数字
{
  uid: 123,  // ❌ 应该是字符串
  username: "testuser",
  domain: "test-domain"
}

// 错误消息：
// "JWT 载荷验证失败: UID 必须是字符串类型"
```

## 🎯 最佳实践

### 1. 与 Guard 配合使用

始终将 `JwtStrategy` 与 `JwtAuthGuard` 配合使用，以获得完整的认证流程：

```typescript
@Module({
  providers: [JwtStrategy, { provide: APP_GUARD, useClass: JwtAuthGuard }],
})
export class AuthModule {}
```

### 2. 使用 Public 装饰器标记公开路由

对于不需要认证的路由，使用 `@Public()` 装饰器：

```typescript
import { Public } from '@hl8/decorators';

@Controller('auth')
export class AuthController {
  @Post('login')
  @Public()
  async login() {
    // 登录逻辑
  }
}
```

### 3. 类型安全的请求处理

在控制器中使用类型注解确保类型安全：

```typescript
import { IAuthentication } from '@hl8/typings';

@Get('profile')
async getProfile(@Request() req: { user: IAuthentication }) {
  // TypeScript 会提供完整的类型提示
  return req.user.uid;
}
```

### 4. 错误处理

`JwtStrategy` 会在以下情况抛出 `UnauthorizedException`：

- JWT Token 无效或过期
- 载荷格式不符合 `IAuthentication` 接口
- 必需字段缺失或类型错误

建议在全局异常过滤器中统一处理这些异常。

## 🔗 相关库

- **`@hl8/guard`** - 提供 `JwtAuthGuard`，与 `JwtStrategy` 配合使用
- **`@hl8/config`** - 提供 `SecurityConfig` 配置
- **`@hl8/typings`** - 提供 `IAuthentication` 接口定义
- **`@hl8/decorators`** - 提供 `@Public()` 装饰器

## 📝 技术实现

### 依赖项

- `@nestjs/passport` - Passport 集成
- `passport-jwt` - JWT 策略实现
- `class-validator` - 载荷验证
- `class-transformer` - 对象转换

### 内部实现

1. **Token 提取**: 使用 `ExtractJwt.fromAuthHeaderAsBearerToken()` 从请求头提取 Token
2. **Token 验证**: 使用配置的 `jwtSecret` 验证 Token 签名和过期时间
3. **载荷验证**: 使用 `class-validator` 验证载荷格式
4. **类型转换**: 使用 `plainToInstance` 将普通对象转换为 DTO 实例

## 🧪 测试

运行测试：

```bash
# 运行所有测试
pnpm test

# 运行测试并生成覆盖率报告
pnpm test:cov

# 监视模式运行测试
pnpm test:watch
```

测试覆盖了以下场景：

- ✅ 有效载荷验证
- ✅ 无效字段类型处理
- ✅ 缺失字段处理
- ✅ 多个字段无效时的错误聚合
- ✅ 边界情况（空字符串、特殊字符等）

## 📄 许可证

本项目遵循项目根目录的许可证。
