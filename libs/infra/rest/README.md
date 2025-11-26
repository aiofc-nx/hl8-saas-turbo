# @hl8/rest

NestJS REST API 响应工具库，提供标准化的 API 响应格式和分页参数类，用于统一 API 响应结构和分页查询参数处理。

## 📋 项目概述

### 基本信息

- **包名**: `@hl8/rest`
- **版本**: `1.0.0`
- **描述**: REST API response utilities and pagination parameters for NestJS
- **位置**: `libs/infra/rest`

### 提供的功能

1. **`ApiRes<T>`** - 标准化的 API 响应格式类
2. **`PaginationParams`** - 分页查询参数类（支持验证和转换）

## 🚀 快速开始

### 安装

该库是 monorepo 工作空间的一部分，通过 workspace 协议引用：

```json
{
  "dependencies": {
    "@hl8/rest": "workspace:*"
  }
}
```

### 导入

```typescript
import { ApiRes, PaginationParams } from '@hl8/rest';
```

## 📚 API 文档

### ApiRes<T>

标准化的 API 响应格式类，提供统一的响应结构。

#### 响应结构

```typescript
{
  code: number;      // 响应状态码
  message: string;   // 响应消息
  data?: T;          // 响应数据（可选）
}
```

#### 静态方法

##### `ApiRes.success<T>(data: T, message?: string): ApiRes<T>`

创建包含数据的成功响应。

**参数：**

- `data: T` - 响应数据
- `message?: string` - 响应消息（可选，默认为 `"success"`）

**返回：** `ApiRes<T>` - 成功响应对象

**示例：**

```typescript
return ApiRes.success({ id: 1, name: 'John' }, '操作成功');
// 返回: { code: 200, message: '操作成功', data: { id: 1, name: 'John' } }
```

##### `ApiRes.ok(): ApiRes<null>`

创建空成功响应（仅表示操作成功，不包含数据）。

**返回：** `ApiRes<null>` - 空成功响应对象

**示例：**

```typescript
return ApiRes.ok();
// 返回: { code: 200, message: 'success', data: null }
```

##### `ApiRes.error<T = null>(code: number, message: string): ApiRes<T>`

创建错误响应。

**参数：**

- `code: number` - 错误状态码
- `message: string` - 错误消息

**返回：** `ApiRes<T>` - 错误响应对象

**示例：**

```typescript
return ApiRes.error(400, '参数错误');
// 返回: { code: 400, message: '参数错误', data: null }
```

##### `ApiRes.custom<T>(code: number, data: T, message: string): ApiRes<T>`

创建自定义响应（支持任意状态码、数据和消息的组合）。

**参数：**

- `code: number` - 状态码
- `data: T` - 响应数据
- `message: string` - 响应消息

**返回：** `ApiRes<T>` - 自定义响应对象

**示例：**

```typescript
return ApiRes.custom(201, { id: 1 }, '创建成功');
// 返回: { code: 201, message: '创建成功', data: { id: 1 } }
```

### PaginationParams

分页查询参数类，提供自动验证和类型转换功能。

#### 属性

- **`current: number`** - 当前页码（最小值为 1，默认为 1）
- **`size: number`** - 每页数量（最小值为 1，最大值为 100，默认为 10）

#### 特性

- ✅ 自动类型转换（字符串转数字）
- ✅ 自动应用默认值
- ✅ 参数验证（最小值、最大值、整数校验）
- ✅ Swagger 文档支持
- ✅ 与 `class-validator` 和 `class-transformer` 集成

#### 验证规则

- `current`: 必须是整数，最小值 1
- `size`: 必须是整数，最小值 1，最大值 100

## 💡 使用示例

### 在 Controller 中使用 ApiRes

#### 基本用法

```typescript
import { Controller, Get, Post, Body } from '@nestjs/common';
import { ApiRes } from '@hl8/rest';

@Controller('users')
export class UserController {
  @Get(':id')
  async getUser(@Param('id') id: string): Promise<ApiRes<User>> {
    const user = await this.userService.findById(id);
    return ApiRes.success(user, '获取用户成功');
  }

  @Post()
  async createUser(
    @Body() createUserDto: CreateUserDto,
  ): Promise<ApiRes<User>> {
    const user = await this.userService.create(createUserDto);
    return ApiRes.custom(201, user, '用户创建成功');
  }

  @Delete(':id')
  async deleteUser(@Param('id') id: string): Promise<ApiRes<null>> {
    await this.userService.delete(id);
    return ApiRes.ok();
  }

  @Get('error-example')
  async errorExample(): Promise<ApiRes<null>> {
    return ApiRes.error(404, '资源未找到');
  }
}
```

#### 与 Swagger 集成

```typescript
import { Controller, Get } from '@nestjs/common';
import { ApiResponseDoc } from '@hl8/decorators';
import { ApiRes } from '@hl8/rest';

interface User {
  id: number;
  name: string;
}

@Controller('users')
export class UserController {
  @Get()
  @ApiResponseDoc({ type: User, isArray: true })
  async getUsers(): Promise<ApiRes<User[]>> {
    const users = await this.userService.findAll();
    return ApiRes.success(users);
  }
}
```

### 在 Controller 中使用 PaginationParams

#### 基本用法

```typescript
import { Controller, Get, Query } from '@nestjs/common';
import { ApiRes, PaginationParams } from '@hl8/rest';

@Controller('users')
export class UserController {
  @Get()
  async getUsers(
    @Query() pagination: PaginationParams,
  ): Promise<ApiRes<{ users: User[]; total: number }>> {
    const { current, size } = pagination;
    const skip = (current - 1) * size;

    const [users, total] = await this.userService.findAndCount({
      skip,
      take: size,
    });

    return ApiRes.success({
      users,
      total,
      current,
      size,
    });
  }
}
```

#### 查询参数示例

客户端请求：

```
GET /users?current=2&size=20
```

自动转换和验证：

- `current: "2"` → `current: 2` (字符串转数字)
- `size: "20"` → `size: 20` (字符串转数字)
- 如果 `current` 或 `size` 未提供，自动使用默认值（1 和 10）
- 如果 `size > 100`，验证会失败

#### 验证失败处理

```typescript
import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { PaginationParams } from '@hl8/rest';

@Controller('users')
export class UserController {
  @Get()
  async getUsers(@Query() query: any): Promise<ApiRes<User[]>> {
    const pagination = plainToInstance(PaginationParams, query);
    const errors = await validate(pagination);

    if (errors.length > 0) {
      throw new BadRequestException('分页参数验证失败');
    }

    // 使用验证后的 pagination
    const { current, size } = pagination;
    // ...
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

当前测试覆盖率：

- **语句覆盖率**: 100%
- **分支覆盖率**: 83.33%
- **函数覆盖率**: 100%
- **行覆盖率**: 100%

符合项目规范要求（核心业务逻辑测试覆盖率 ≥ 80%）。

### 测试文件

- `src/lib/res.response.spec.ts` - ApiRes 类测试（30 个测试用例）
- `src/lib/pagination-params.spec.ts` - PaginationParams 类测试（19 个测试用例）

## 🔧 技术规范

### 模块系统

- **编译输出**: CommonJS（符合 NestJS 运行时要求）
- **类型检查**: NodeNext 模块系统
- **导出格式**: 同时支持 ESM 和 CommonJS（通过 `exports` 字段）

### 依赖

**运行时依赖：**

- `@nestjs/common` - NestJS 核心功能
- `@nestjs/swagger` - Swagger 文档支持
- `class-transformer` - 对象转换
- `class-validator` - 参数验证
- `@hl8/constants` - 常量定义

**开发依赖：**

- `jest` - 测试框架
- `ts-jest` - TypeScript Jest 预设
- `@jest/globals` - Jest 全局类型

### 构建配置

```json
{
  "engines": {
    "node": ">=20"
  },
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "require": "./dist/index.js",
      "import": "./dist/index.js"
    }
  }
}
```

## 📝 代码示例

### 完整的 Controller 示例

```typescript
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ApiResponseDoc } from '@hl8/decorators';
import { ApiRes, PaginationParams } from '@hl8/rest';

interface User {
  id: number;
  name: string;
  email: string;
}

@ApiTags('用户管理')
@Controller('users')
export class UserController {
  // 获取用户列表（带分页）
  @Get()
  @ApiOperation({ summary: '获取用户列表' })
  @ApiResponseDoc({ type: User, isPaged: true })
  async getUsers(
    @Query() pagination: PaginationParams,
  ): Promise<ApiRes<{ users: User[]; total: number }>> {
    const { current, size } = pagination;
    const skip = (current - 1) * size;

    const [users, total] = await this.userService.findAndCount({
      skip,
      take: size,
    });

    return ApiRes.success({
      users,
      total,
      current,
      size,
    });
  }

  // 获取单个用户
  @Get(':id')
  @ApiOperation({ summary: '获取用户详情' })
  @ApiResponseDoc({ type: User })
  async getUser(@Param('id') id: string): Promise<ApiRes<User>> {
    const user = await this.userService.findById(id);
    if (!user) {
      return ApiRes.error(404, '用户不存在');
    }
    return ApiRes.success(user, '获取用户成功');
  }

  // 创建用户
  @Post()
  @ApiOperation({ summary: '创建用户' })
  @ApiResponseDoc({ type: User, status: 201 })
  async createUser(
    @Body() createUserDto: CreateUserDto,
  ): Promise<ApiRes<User>> {
    const user = await this.userService.create(createUserDto);
    return ApiRes.custom(201, user, '用户创建成功');
  }

  // 更新用户
  @Put(':id')
  @ApiOperation({ summary: '更新用户' })
  @ApiResponseDoc({ type: User })
  async updateUser(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<ApiRes<User>> {
    const user = await this.userService.update(id, updateUserDto);
    return ApiRes.success(user, '用户更新成功');
  }

  // 删除用户
  @Delete(':id')
  @ApiOperation({ summary: '删除用户' })
  async deleteUser(@Param('id') id: string): Promise<ApiRes<null>> {
    await this.userService.delete(id);
    return ApiRes.ok();
  }
}
```

## 🎯 最佳实践

### 1. 统一响应格式

始终使用 `ApiRes` 作为 Controller 方法的返回类型，确保所有 API 响应格式一致：

```typescript
// ✅ 推荐
async getUser(): Promise<ApiRes<User>> {
  return ApiRes.success(user);
}

// ❌ 不推荐
async getUser(): Promise<User> {
  return user;
}
```

### 2. 使用类型推断

利用 TypeScript 泛型提供类型安全：

```typescript
// ✅ 推荐 - 类型安全
return ApiRes.success<User>(user);

// ✅ 也可以 - TypeScript 自动推断
return ApiRes.success(user);
```

### 3. 分页参数验证

在 Controller 中处理验证错误：

```typescript
@Get()
async getUsers(@Query() query: any): Promise<ApiRes<User[]>> {
  const pagination = plainToInstance(PaginationParams, query);
  const errors = await validate(pagination);

  if (errors.length > 0) {
    const errorMessages = errors
      .map(e => Object.values(e.constraints || {}).join(', '))
      .join('; ');
    return ApiRes.error(400, `参数验证失败: ${errorMessages}`);
  }

  // 使用验证后的参数
  const { current, size } = pagination;
  // ...
}
```

### 4. 错误处理

使用合适的 HTTP 状态码：

```typescript
// 客户端错误 (4xx)
return ApiRes.error(400, '参数错误');
return ApiRes.error(401, '未授权');
return ApiRes.error(403, '禁止访问');
return ApiRes.error(404, '资源未找到');

// 服务器错误 (5xx)
return ApiRes.error(500, '服务器内部错误');
```

## 🔗 相关链接

- [NestJS 文档](https://docs.nestjs.com/)
- [class-validator 文档](https://github.com/typestack/class-validator)
- [class-transformer 文档](https://github.com/typestack/class-transformer)
- [Swagger 文档](https://swagger.io/docs/)

## 📄 许可证

本项目遵循项目根目录的许可证。
