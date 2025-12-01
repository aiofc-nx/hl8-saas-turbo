# 环境变量配置指南

## 1. 快速开始

### 1.1 从模板创建 .env 文件

```bash
# 在 apps/admin-api 目录下
cp .env.example .env
```

### 1.2 根据 Docker Compose 配置

如果使用 `docker-compose.yml` 启动服务，`.env` 文件中的数据库和 Redis 配置已经与 Docker Compose 配置匹配。

## 2. 配置说明

### 2.1 数据库配置（PostgreSQL）

根据 `docker-compose.yml` 中的 `postgres` 服务配置：

```env
DB_HOST=localhost          # 数据库主机（Docker 容器映射到本地）
DB_PORT=5432              # 数据库端口（Docker 端口映射）
DB_USERNAME=aiofix         # 对应 POSTGRES_USER
DB_PASSWORD=aiofix         # 对应 POSTGRES_PASSWORD
DB_NAME=hl8-platform      # 对应 POSTGRES_DB
DB_SSL=false              # 本地开发不需要 SSL
```

**Docker Compose 配置对应关系**：

| Docker Compose 环境变量    | .env 变量              | 说明         |
| -------------------------- | ---------------------- | ------------ |
| `POSTGRES_USER=aiofix`     | `DB_USERNAME=aiofix`   | 数据库用户名 |
| `POSTGRES_PASSWORD=aiofix` | `DB_PASSWORD=aiofix`   | 数据库密码   |
| `POSTGRES_DB=hl8-platform` | `DB_NAME=hl8-platform` | 数据库名称   |
| `ports: '5432:5432'`       | `DB_PORT=5432`         | 端口映射     |

### 2.2 Redis 配置

根据 `docker-compose.yml` 中的 `redis` 服务配置：

```env
REDIS_MODE=standalone     # Redis 模式
REDIS_HOST=localhost      # Redis 主机（Docker 容器映射到本地）
REDIS_PORT=6379          # Redis 端口（Docker 端口映射）
REDIS_PASSWORD=          # Docker Compose 中未设置密码，留空
REDIS_DB=5               # Redis 数据库编号
```

**Docker Compose 配置对应关系**：

| Docker Compose 配置  | .env 变量         | 说明     |
| -------------------- | ----------------- | -------- |
| `ports: '6379:6379'` | `REDIS_PORT=6379` | 端口映射 |
| 无密码配置           | `REDIS_PASSWORD=` | 留空     |

### 2.3 MongoDB 配置（可选）

如果使用 MongoDB，根据 `docker-compose.yml` 中的 `mongodb` 服务配置：

```env
MONGO_HOST=localhost          # MongoDB 主机
MONGO_PORT=27017              # MongoDB 端口
MONGO_USERNAME=aiofix         # 对应 MONGO_INITDB_ROOT_USERNAME
MONGO_PASSWORD=aiofix         # 对应 MONGO_INITDB_ROOT_PASSWORD
MONGO_DATABASE=hl8-platform   # 对应 MONGO_INITDB_DATABASE
```

## 3. 启动 Docker 服务

在创建 `.env` 文件之前，确保 Docker Compose 服务已启动：

```bash
# 在项目根目录下
docker-compose up -d

# 检查服务状态
docker-compose ps

# 查看日志
docker-compose logs -f postgres
docker-compose logs -f redis
```

## 4. 验证配置

### 4.1 验证数据库连接

```bash
# 使用 psql 测试连接
psql -h localhost -p 5432 -U aiofix -d hl8-platform

# 如果连接成功，会提示输入密码：aiofix
```

### 4.2 验证 Redis 连接

```bash
# 使用 redis-cli 测试连接
redis-cli -h localhost -p 6379

# 测试命令
PING
# 应该返回 PONG
```

## 5. 环境变量优先级

根据 `app.module.ts` 中的配置，环境变量文件按以下优先级加载：

```typescript
envFilePath: ['.env.local', `.env.${process.env.NODE_ENV}`, '.env'];
```

**优先级从高到低**：

1. `.env.local` - 最高优先级（通常用于本地覆盖，不应提交到 Git）
2. `.env.{NODE_ENV}` - 环境特定配置（如 `.env.development`、`.env.production`）
3. `.env` - 基础配置（可以提交到 Git，但不应包含敏感信息）

**推荐做法**：

- `.env` - 包含默认配置和示例值（可以提交到 Git）
- `.env.example` - 环境变量模板（提交到 Git）
- `.env.local` - 本地覆盖配置（不提交到 Git，包含实际密码和密钥）

## 6. 生产环境配置

### 6.1 必须修改的敏感信息

生产环境必须修改以下配置：

```env
# JWT 密钥（使用强随机密钥，至少 32 字符）
JWT_SECRET=your-strong-random-secret-key-min-32-chars
REFRESH_TOKEN_SECRET=your-strong-random-refresh-secret-key-min-32-chars

# 数据库密码（使用强密码）
DB_PASSWORD=your-strong-database-password

# Redis 密码（如果启用）
REDIS_PASSWORD=your-strong-redis-password

# 加密密钥（使用强随机密钥）
CRYPTO_AES_KEY=your-32-byte-random-aes-key
CRYPTO_AES_IV=your-16-byte-random-iv

# RSA 密钥对（生成新的密钥对）
CRYPTO_RSA_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----
...your-private-key...
-----END PRIVATE KEY-----
CRYPTO_RSA_PUBLIC_KEY=-----BEGIN PUBLIC KEY-----
...your-public-key...
-----END PUBLIC KEY-----
```

### 6.2 生成强随机密钥

```bash
# 生成 32 字符的随机字符串（用于 JWT_SECRET）
openssl rand -base64 32

# 生成 32 字节的十六进制字符串（用于 AES_KEY）
openssl rand -hex 32

# 生成 16 字节的十六进制字符串（用于 AES_IV）
openssl rand -hex 16

# 生成 RSA 密钥对
openssl genrsa -out private.pem 2048
openssl rsa -in private.pem -pubout -out public.pem
```

## 7. 常见问题

### 7.1 数据库连接失败

**问题**：`password authentication failed for user "postgres"`

**解决方案**：

1. 检查 `.env` 文件中的 `DB_USERNAME` 和 `DB_PASSWORD` 是否与 Docker Compose 配置匹配
2. 确保 Docker Compose 服务已启动：`docker-compose up -d`
3. 验证数据库连接：`psql -h localhost -p 5432 -U aiofix -d hl8-platform`

### 7.2 Redis 连接失败

**问题**：`Error: connect ECONNREFUSED 127.0.0.1:6379`

**解决方案**：

1. 检查 `.env` 文件中的 `REDIS_HOST` 和 `REDIS_PORT` 配置
2. 确保 Docker Compose 服务已启动：`docker-compose up -d redis`
3. 验证 Redis 连接：`redis-cli -h localhost -p 6379 PING`

### 7.3 环境变量未生效

**问题**：修改了 `.env` 文件，但配置未生效

**解决方案**：

1. 检查环境变量文件优先级，确保没有 `.env.local` 覆盖配置
2. 重启应用（环境变量在启动时加载）
3. 检查 `NODE_ENV` 环境变量，确保使用正确的环境文件

## 8. 配置检查清单

在启动应用前，请确认：

- [ ] `.env` 文件已创建（从 `.env.example` 复制）
- [ ] 数据库配置与 `docker-compose.yml` 匹配
- [ ] Redis 配置与 `docker-compose.yml` 匹配
- [ ] Docker Compose 服务已启动（`docker-compose up -d`）
- [ ] 数据库连接测试通过
- [ ] Redis 连接测试通过
- [ ] JWT 密钥已配置（开发环境可以使用默认值，生产环境必须修改）
- [ ] 生产环境已修改所有敏感信息

---

**文档版本**：v1.0.0  
**最后更新**：2024-01-XX  
**维护者**：开发团队
