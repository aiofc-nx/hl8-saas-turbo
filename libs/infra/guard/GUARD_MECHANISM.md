# NestJS 守卫机制解析

## 📋 问题

为什么 `libs/infra/guard` 中的守卫没有显式实现 `CanActivate` 接口，却可以启动守卫的能力？

## 🔍 实际情况分析

### 1. ApiKeyGuard - 显式实现接口

```typescript:libs/infra/guard/src/lib/api-key/api-key.guard.ts
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 实现逻辑
  }
}
```

**结论**: `ApiKeyGuard` **确实实现了** `CanActivate` 接口。

### 2. JwtAuthGuard - 继承基类

```typescript:libs/infra/guard/src/lib/jwt/jwt.auth.guard.ts
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    // 重写方法
    return super.canActivate(context);
  }
}
```

**结论**: `JwtAuthGuard` 继承自 `AuthGuard`，而 `AuthGuard` 来自 `@nestjs/passport`。

## 💡 NestJS 守卫识别机制

### 机制 1: 接口实现（TypeScript 编译时检查）

TypeScript 的 `implements` 关键字提供**编译时类型检查**，但不是运行时必需的。

```typescript
// 显式实现接口
class MyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    return true;
  }
}

// 不实现接口，但有相同的方法签名（Duck Typing）
class MyGuard {
  canActivate(context: ExecutionContext): boolean {
    return true;
  }
}
```

**两种方式在运行时都能工作**，因为 NestJS 使用**鸭子类型（Duck Typing）**来识别守卫。

### 机制 2: 鸭子类型（Duck Typing）

NestJS 在运行时检查对象是否有 `canActivate` 方法，而不是检查是否实现了接口。

```typescript
// NestJS 内部逻辑（简化版）
function isGuard(guard: any): guard is CanActivate {
  return typeof guard.canActivate === 'function';
}
```

只要对象有 `canActivate` 方法，NestJS 就会将其识别为守卫。

### 机制 3: 基类实现

`AuthGuard` 来自 `@nestjs/passport`，它已经实现了 `CanActivate` 接口：

```typescript
// @nestjs/passport 中的 AuthGuard（简化版）
export class AuthGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    // 实现逻辑
  }
}
```

因此，继承 `AuthGuard` 的类**自动具有** `CanActivate` 的能力。

## 📊 三种实现方式对比

| 方式             | 示例                                 | 类型检查      | 运行时行为  | 推荐度     |
| ---------------- | ------------------------------------ | ------------- | ----------- | ---------- |
| **显式实现接口** | `class Guard implements CanActivate` | ✅ 编译时检查 | ✅ 正常工作 | ⭐⭐⭐⭐⭐ |
| **继承基类**     | `class Guard extends AuthGuard`      | ✅ 编译时检查 | ✅ 正常工作 | ⭐⭐⭐⭐⭐ |
| **鸭子类型**     | `class Guard { canActivate() {} }`   | ⚠️ 无检查     | ✅ 正常工作 | ⭐⭐⭐     |

## 🔬 验证实验

### 实验 1: 显式实现接口

```typescript
@Injectable()
export class ExplicitGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    return true;
  }
}
```

**结果**: ✅ 正常工作，有类型检查

### 实验 2: 继承基类

```typescript
@Injectable()
export class InheritedGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }
}
```

**结果**: ✅ 正常工作，基类已实现接口

### 实验 3: 鸭子类型（不推荐）

```typescript
@Injectable()
export class DuckTypedGuard {
  canActivate(context: ExecutionContext): boolean {
    return true;
  }
}
```

**结果**: ✅ 运行时正常工作，但**没有类型检查**

## 🎯 为什么推荐显式实现接口？

### 1. 类型安全

```typescript
// ✅ 有类型检查
class Guard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    return true;
  }
  // 如果方法签名错误，TypeScript 会报错
}

// ⚠️ 无类型检查
class Guard {
  canActivate(context: any): any {
    // 类型错误不会被发现
    return true;
  }
}
```

### 2. IDE 支持

显式实现接口后，IDE 可以提供：

- 自动补全
- 类型提示
- 重构支持

### 3. 代码可读性

```typescript
// ✅ 清晰表达意图
export class ApiKeyGuard implements CanActivate {
  // 明确表示这是一个守卫
}

// ⚠️ 不够明确
export class ApiKeyGuard {
  // 需要查看代码才知道是守卫
}
```

## 📝 当前代码库的情况

### ApiKeyGuard

```typescript:libs/infra/guard/src/lib/api-key/api-key.guard.ts
@Injectable()
export class ApiKeyGuard implements CanActivate {
  // ✅ 显式实现接口，类型安全
}
```

**状态**: ✅ **已正确实现** `CanActivate` 接口

### JwtAuthGuard

```typescript:libs/infra/guard/src/lib/jwt/jwt.auth.guard.ts
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  // ✅ 继承自 AuthGuard，基类已实现 CanActivate
}
```

**状态**: ✅ **通过继承获得** `CanActivate` 能力

## 🔍 深入理解：NestJS 如何识别守卫

### 1. 注册守卫

```typescript
// 方式 1: 全局注册
@Module({
  providers: [{ provide: APP_GUARD, useClass: JwtAuthGuard }],
})
export class AppModule {}

// 方式 2: 路由级别
@Controller('api')
export class ApiController {
  @UseGuards(ApiKeyGuard)
  @Get('protected')
  getProtected() {}
}
```

### 2. NestJS 内部处理

```typescript
// NestJS 内部逻辑（简化版）
class GuardsConsumer {
  async tryActivate(
    guards: CanActivate[],
    args: unknown[],
    instance: object,
    callback: Function,
  ): Promise<boolean> {
    for (const guard of guards) {
      // 检查是否有 canActivate 方法
      if (!guard.canActivate) {
        throw new Error('Guard must implement CanActivate');
      }

      // 调用 canActivate 方法
      const result = await guard.canActivate(
        this.createExecutionContext(args, instance, callback),
      );

      if (!result) {
        return false;
      }
    }
    return true;
  }
}
```

### 3. 运行时检查

NestJS 在运行时：

1. 检查对象是否有 `canActivate` 方法
2. 调用该方法
3. 根据返回值决定是否允许访问

**不依赖** TypeScript 的接口实现。

## ✅ 总结

### 为什么守卫可以工作？

1. **ApiKeyGuard**: 显式实现了 `CanActivate` 接口 ✅
2. **JwtAuthGuard**: 继承自 `AuthGuard`，基类已实现 `CanActivate` ✅
3. **NestJS 机制**: 使用鸭子类型，只要有 `canActivate` 方法就能工作 ✅

### 最佳实践

1. ✅ **显式实现接口** - 提供类型安全和代码可读性
2. ✅ **继承基类** - 当使用 Passport 等框架时
3. ⚠️ **避免仅使用鸭子类型** - 缺少类型检查

### 当前代码库状态

- ✅ `ApiKeyGuard` 正确实现了 `CanActivate`
- ✅ `JwtAuthGuard` 通过继承获得 `CanActivate` 能力
- ✅ 所有守卫都能正常工作

## 📚 相关文档

- [NestJS Guards 官方文档](https://docs.nestjs.com/guards)
- [TypeScript Interfaces](https://www.typescriptlang.org/docs/handbook/interfaces.html)
- [Duck Typing](https://en.wikipedia.org/wiki/Duck_typing)

---

**结论**: 当前代码库中的守卫**都正确实现了** `CanActivate` 接口（显式实现或通过继承），因此可以正常工作。如果看到没有 `implements CanActivate` 的守卫，可能是因为它继承自已实现该接口的基类。
