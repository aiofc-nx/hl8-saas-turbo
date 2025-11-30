# 故障排查指南（Troubleshooting Guide）

## 1. 数据库连接问题

### 1.1 PostgreSQL 密码认证失败

#### 错误信息

```
error: password authentication failed for user "postgres"
```

#### 问题原因

PostgreSQL 数据库密码认证失败，可能的原因：

1. **环境变量未配置**：`.env` 文件中缺少数据库配置
2. **密码不正确**：数据库密码与配置不匹配
3. **用户不存在**：数据库用户不存在或权限不足
4. **数据库未启动**：PostgreSQL 服务未运行

#### 解决方案

##### 步骤 1：检查环境变量配置

确保在 `apps/admin-api` 目录下存在 `.env` 文件，并包含以下配置：

```env
# 数据库配置（PostgreSQL）
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your-password-here
DB_NAME=hl8-platform
DB_SSL=false
```

**注意**：

- 如果使用 `.env.local` 文件，优先级更高
- 如果使用 `.env.development` 文件，需要设置 `NODE_ENV=development`

##### 步骤 2：验证数据库连接

使用 `psql` 命令行工具测试数据库连接：

```bash
# 测试连接
psql -h localhost -p 5432 -U postgres -d hl8-platform

# 如果连接成功，会提示输入密码
# 如果连接失败，检查数据库服务是否运行
```

##### 步骤 3：检查数据库服务状态

**Linux/macOS**：

```bash
# 检查 PostgreSQL 服务状态
sudo systemctl status postgresql

# 或者
sudo service postgresql status

# 启动服务（如果未运行）
sudo systemctl start postgresql
# 或
sudo service postgresql start
```

**Windows**：

```powershell
# 检查服务状态
Get-Service -Name postgresql*

# 启动服务（如果未运行）
Start-Service -Name postgresql-x64-XX  # XX 是版本号
```

**Docker**：

```bash
# 检查容器状态
docker ps | grep postgres

# 启动容器（如果未运行）
docker start <container-name>
```

##### 步骤 4：重置数据库密码

如果忘记数据库密码，可以重置：

**方法 1：使用 psql（如果已有其他用户权限）**

```bash
# 连接到 PostgreSQL
psql -U postgres

# 修改密码
ALTER USER postgres WITH PASSWORD 'new-password';

# 更新 .env 文件中的密码
```

**方法 2：修改 PostgreSQL 配置文件（需要管理员权限）**

1. 编辑 `pg_hba.conf` 文件（通常在 `/etc/postgresql/{version}/main/pg_hba.conf`）
2. 临时修改认证方式为 `trust`：
   ```
   local   all             all                                     trust
   host    all             all             127.0.0.1/32            trust
   ```
3. 重启 PostgreSQL 服务
4. 使用 `psql` 连接并修改密码
5. 恢复 `pg_hba.conf` 配置
6. 重启 PostgreSQL 服务

##### 步骤 5：创建数据库和用户

如果数据库或用户不存在，需要创建：

```bash
# 连接到 PostgreSQL（使用 postgres 超级用户）
psql -U postgres

# 创建数据库
CREATE DATABASE "hl8-platform";

# 创建用户（如果需要）
CREATE USER your_username WITH PASSWORD 'your_password';

# 授予权限
GRANT ALL PRIVILEGES ON DATABASE "hl8-platform" TO your_username;

# 退出
\q
```

##### 步骤 6：验证环境变量加载

在应用启动时，检查环境变量是否正确加载：

```typescript
// 临时在 app.module.ts 中添加日志
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_PORT:', process.env.DB_PORT);
console.log('DB_USERNAME:', process.env.DB_USERNAME);
console.log('DB_NAME:', process.env.DB_NAME);
// 注意：不要打印密码
```

#### 常见问题

**Q: 为什么使用 `postgres` 用户连接失败？**

A: 可能的原因：

1. PostgreSQL 默认可能不允许密码认证
2. 需要检查 `pg_hba.conf` 配置
3. 可能需要使用其他用户

**Q: 如何查看 PostgreSQL 日志？**

A: 日志位置取决于安装方式：

- **Linux**: `/var/log/postgresql/postgresql-{version}-main.log`
- **macOS (Homebrew)**: `/usr/local/var/log/postgres.log`
- **Windows**: PostgreSQL 安装目录下的 `log` 文件夹
- **Docker**: `docker logs <container-name>`

**Q: 环境变量文件优先级是什么？**

A: 根据 `app.module.ts` 中的配置：

```typescript
envFilePath: ['.env.local', `.env.${process.env.NODE_ENV}`, '.env'];
```

优先级从高到低：

1. `.env.local`（最高优先级）
2. `.env.{NODE_ENV}`（如 `.env.development`）
3. `.env`（最低优先级）

### 1.2 数据库连接超时

#### 错误信息

```
timeout: connect timed out
```

#### 解决方案

1. **检查数据库服务是否运行**
2. **检查防火墙设置**：确保端口 5432 未被阻止
3. **检查网络连接**：如果使用远程数据库，确保网络可达
4. **增加超时时间**：在数据库配置中增加连接超时时间

### 1.3 数据库不存在

#### 错误信息

```
database "hl8-platform" does not exist
```

#### 解决方案

创建数据库：

```bash
# 连接到 PostgreSQL
psql -U postgres

# 创建数据库
CREATE DATABASE "hl8-platform";

# 退出
\q
```

## 2. Redis 连接问题

### 2.1 Redis 连接失败

#### 错误信息

```
Error: connect ECONNREFUSED 127.0.0.1:6379
```

#### 解决方案

1. **检查 Redis 服务状态**：

   ```bash
   # Linux/macOS
   redis-cli ping
   # 应该返回 PONG

   # 或检查服务状态
   sudo systemctl status redis
   ```

2. **检查环境变量配置**：

   ```env
   REDIS_HOST=localhost
   REDIS_PORT=6379
   REDIS_PASSWORD=  # 如果有密码
   REDIS_DB=0
   ```

3. **启动 Redis 服务**：

   ```bash
   # Linux/macOS
   sudo systemctl start redis

   # Docker
   docker start redis-container
   ```

## 3. 模块初始化问题

### 3.1 模块依赖循环

#### 错误信息

```
Nest can't resolve dependencies of the XModule
```

#### 解决方案

1. **检查模块导入顺序**
2. **使用 `forwardRef()` 解决循环依赖**
3. **重构模块结构，消除循环依赖**

### 3.2 端口冲突

#### 错误信息

```
Error: listen EADDRINUSE: address already in use :::9528
```

#### 解决方案

1. **查找占用端口的进程**：

   ```bash
   # Linux/macOS
   lsof -i :9528

   # Windows
   netstat -ano | findstr :9528
   ```

2. **终止进程**：

   ```bash
   # Linux/macOS
   kill -9 <PID>

   # Windows
   taskkill /PID <PID> /F
   ```

3. **或修改应用端口**：
   ```env
   APP_PORT=9529
   ```

## 4. 权限验证问题

### 4.1 JWT Token 无效

#### 错误信息

```
UnauthorizedException: Invalid token
```

#### 解决方案

1. **检查 JWT 密钥配置**：

   ```env
   ACCESS_TOKEN_SECRET=your-access-token-secret-min-10-chars
   REFRESH_TOKEN_SECRET=your-refresh-token-secret-min-10-chars
   ```

2. **确保密钥长度足够**（至少 10 个字符）

3. **检查 Token 是否过期**

### 4.2 Casbin 权限验证失败

#### 错误信息

```
ForbiddenException: Insufficient permissions
```

#### 解决方案

1. **检查 Casbin 策略配置**
2. **验证用户角色是否正确**
3. **检查域（domain）匹配**

## 5. 迁移问题

### 5.1 迁移失败

#### 错误信息

```
Migration failed: ...
```

#### 解决方案

1. **检查数据库连接**
2. **查看迁移文件中的 SQL 语句**
3. **手动执行迁移 SQL（如果需要）**
4. **回滚迁移**：
   ```bash
   pnpm run migration:down
   ```

### 5.2 迁移冲突

#### 错误信息

```
Migration already executed
```

#### 解决方案

1. **检查迁移历史**：

   ```bash
   pnpm run migration:list
   ```

2. **手动标记迁移为已执行**（谨慎操作）

## 6. 性能问题

### 6.1 启动缓慢

#### 可能原因

1. **数据库连接慢**：检查数据库网络延迟
2. **模块初始化慢**：检查模块依赖关系
3. **大量数据加载**：检查启动时的数据加载逻辑

#### 解决方案

1. **优化数据库连接池配置**
2. **延迟加载非关键模块**
3. **使用缓存减少数据库查询**

### 6.2 内存占用高

#### 解决方案

1. **检查内存泄漏**：使用 Node.js 内存分析工具
2. **优化缓存策略**：减少缓存数据量
3. **限制并发请求**：使用限流机制

## 7. 日志和调试

### 7.1 启用详细日志

在 `.env` 文件中设置：

```env
LOG_LEVEL=debug
```

### 7.2 查看应用日志

应用日志通常输出到控制台，也可以配置输出到文件。

### 7.3 调试模式启动

```bash
# 使用调试模式启动
pnpm run start:debug
```

## 8. 常见错误代码

### 8.1 PostgreSQL 错误代码

| 错误代码 | 说明         | 解决方案           |
| -------- | ------------ | ------------------ |
| `28P01`  | 密码认证失败 | 检查数据库密码配置 |
| `3D000`  | 数据库不存在 | 创建数据库         |
| `42P01`  | 表不存在     | 运行数据库迁移     |
| `23505`  | 唯一约束冲突 | 检查数据唯一性     |
| `23503`  | 外键约束冲突 | 检查关联数据       |

### 8.2 HTTP 状态码

| 状态码 | 说明       | 可能原因             |
| ------ | ---------- | -------------------- |
| `401`  | 未授权     | JWT Token 无效或过期 |
| `403`  | 禁止访问   | 权限不足             |
| `404`  | 未找到     | 路由不存在           |
| `422`  | 验证失败   | 请求参数不符合要求   |
| `500`  | 服务器错误 | 应用内部错误         |

## 9. 获取帮助

如果以上解决方案都无法解决问题，请：

1. **查看完整错误堆栈**：检查控制台输出的完整错误信息
2. **检查日志文件**：查看应用日志和数据库日志
3. **提供错误信息**：包含完整的错误堆栈、环境变量配置（隐藏敏感信息）、数据库版本等

---

**文档版本**：v1.0.0  
**最后更新**：2024-01-XX  
**维护者**：开发团队
