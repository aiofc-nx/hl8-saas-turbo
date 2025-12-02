# CORS 配置检查报告

**检查日期**: 2025-11-30  
**后端服务**: `apps/admin-api`  
**前端应用**: `apps/hl8-admin`

---

## 检查结果

### ✅ CORS 配置正确

**后端 CORS 配置** (`apps/admin-api/.env`):

```env
CORS_ENABLED=true
CORS_ORIGIN=http://localhost:3000,http://localhost:5173,http://localhost:5174
CORS_METHODS=GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS
CORS_CREDENTIALS=true
CORS_MAX_AGE=3600
```

### ✅ 测试结果

**测试 1: localhost:5173 (Vite 默认端口)**

```bash
curl -I -H "Origin: http://localhost:5173" \
     -H "Access-Control-Request-Method: POST" \
     -X OPTIONS http://localhost:9528/v1/auth/login
```

**结果**: ✅ 成功

```
HTTP/1.1 204 No Content
access-control-allow-origin: http://localhost:5173
access-control-allow-credentials: true
access-control-allow-methods: GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS
access-control-max-age: 3600
```

**测试 2: localhost:3000**

```bash
curl -I -H "Origin: http://localhost:3000" \
     -H "Access-Control-Request-Method: POST" \
     -X OPTIONS http://localhost:9528/v1/auth/login
```

**结果**: ✅ 成功

```
access-control-allow-origin: http://localhost:3000
access-control-allow-credentials: true
access-control-allow-methods: GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS
```

---

## 配置说明

### CORS 配置解析

后端使用 `getEnvArray('CORS_ORIGIN')` 解析环境变量，该函数会：

1. 读取 `CORS_ORIGIN` 环境变量
2. 按逗号分割为数组
3. 返回字符串数组

**当前配置解析结果**:

```typescript
origin: [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5174',
]
```

### 支持的端口

后端 CORS 配置支持以下前端运行地址：

- ✅ `http://localhost:3000` - 常见的前端开发端口
- ✅ `http://localhost:5173` - Vite 默认端口
- ✅ `http://localhost:5174` - Vite 备用端口（当 5173 被占用时）

---

## 前端端口检查

### Vite 默认端口

Vite 开发服务器的默认端口是 **5173**，如果该端口被占用，会自动使用下一个可用端口（5174, 5175...）。

### 如何确认前端运行端口

1. **查看终端输出**:

   ```
   VITE v7.2.4  ready in 500 ms

   ➜  Local:   http://localhost:5173/
   ➜  Network: use --host to expose
   ```

2. **查看浏览器地址栏**:
   - 前端应用的 URL 会显示实际使用的端口

3. **检查环境变量**:
   ```bash
   # 如果设置了 VITE_PORT，会使用该端口
   cat apps/hl8-admin/.env.local | grep VITE_PORT
   ```

---

## 如果前端运行在其他端口

如果前端运行在其他端口（如 5175, 5176 等），需要更新后端 CORS 配置：

### 方法 1: 添加新端口到 CORS_ORIGIN

编辑 `apps/admin-api/.env`:

```env
CORS_ORIGIN=http://localhost:3000,http://localhost:5173,http://localhost:5174,http://localhost:5175
```

然后重启后端服务。

### 方法 2: 使用通配符（仅开发环境）

如果需要支持所有 localhost 端口，可以修改 CORS 配置逻辑（不推荐用于生产环境）。

---

## 验证 CORS 配置

### 在浏览器中验证

1. 打开前端应用
2. 打开浏览器开发者工具 (F12)
3. 查看 **Console** 标签
4. 查看 **Network** 标签
5. 尝试登录或发送 API 请求
6. 检查是否有 CORS 错误

### 预期结果

- ✅ 没有 CORS 错误
- ✅ 请求成功发送
- ✅ 响应头包含 `access-control-allow-origin`

### 如果出现 CORS 错误

**错误示例**:

```
Access to XMLHttpRequest at 'http://localhost:9528/v1/auth/login'
from origin 'http://localhost:5173' has been blocked by CORS policy
```

**解决方案**:

1. 确认前端实际运行端口
2. 检查后端 `.env` 中的 `CORS_ORIGIN` 是否包含该端口
3. 重启后端服务
4. 清除浏览器缓存并刷新

---

## 当前配置状态

| 配置项           | 值                                                                | 状态      |
| ---------------- | ----------------------------------------------------------------- | --------- |
| CORS_ENABLED     | true                                                              | ✅ 已启用 |
| CORS_ORIGIN      | http://localhost:3000,http://localhost:5173,http://localhost:5174 | ✅ 已配置 |
| CORS_CREDENTIALS | true                                                              | ✅ 已启用 |
| CORS_METHODS     | GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS                            | ✅ 已配置 |
| CORS_MAX_AGE     | 3600                                                              | ✅ 已配置 |

---

## 总结

✅ **CORS 配置正确**，已包含常见的前端开发端口：

- `http://localhost:3000`
- `http://localhost:5173` (Vite 默认)
- `http://localhost:5174` (Vite 备用)

✅ **测试通过**，CORS 预检请求返回正确的响应头。

✅ **配置生效**，后端服务已正确应用 CORS 配置。

---

**检查人**: AI Assistant  
**最后更新**: 2025-11-30
