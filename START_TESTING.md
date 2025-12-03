# 开始功能测试 - 快速启动指南

## ✅ 当前状态

- ✅ 数据库迁移：已完成
- ✅ 后端编译：成功
- ✅ 前端编译：成功
- ✅ 测试脚本：可正常运行
- ⚠️ 服务状态：未启动（需要启动）

## 🚀 启动服务进行测试

### 方式一：分别启动（推荐用于开发）

#### 1. 启动后端服务

```bash
# 在项目根目录
pnpm --filter admin-api dev
```

或者：

```bash
cd apps/admin-api
pnpm dev
```

**服务启动后：**

- API 地址：`http://localhost:9528/v1`
- Swagger 文档：`http://localhost:9528/api-docs`

#### 2. 启动前端服务（新终端窗口）

```bash
# 在项目根目录
pnpm --filter hl8-admin dev
```

或者：

```bash
cd apps/hl8-admin
pnpm dev
```

**前端地址：** `http://localhost:5173`

### 方式二：使用 Turbo 同时启动（如果配置了）

```bash
# 在项目根目录
pnpm start
```

## 📝 测试步骤

### 第一步：验证服务启动

1. **检查后端服务**

   ```bash
   curl http://localhost:9528/api-docs
   ```

   应该返回 Swagger HTML 页面

2. **检查前端服务**
   打开浏览器访问：`http://localhost:5173`
   应该看到登录页面或主页面

### 第二步：使用 Swagger UI 测试 API

1. **打开 Swagger 文档**
   - 浏览器访问：`http://localhost:9528/api-docs`
   - 找到 "Casbin" 相关的 API 分组

2. **配置认证**
   - 点击右上角的 "Authorize" 按钮
   - 输入 JWT Token（需要先登录获取）
   - 或者使用现有的 Token

3. **测试接口**
   - 展开 "Casbin - Policy" 分组
   - 点击 "GET /v1/casbin/policies"
   - 点击 "Try it out"
   - 填写参数（可选）
   - 点击 "Execute"
   - 查看响应结果

### 第三步：测试前端页面

1. **访问权限规则管理页面**

   ```
   http://localhost:5173/_authenticated/casbin-policies/
   ```

2. **访问角色关系管理页面**

   ```
   http://localhost:5173/_authenticated/casbin-relations/
   ```

3. **测试功能**
   - 查看列表
   - 创建新记录
   - 删除记录
   - 测试筛选和分页

## 🔍 快速测试清单

### API 接口测试

- [ ] `GET /v1/casbin/policies` - 查询策略规则列表
- [ ] `POST /v1/casbin/policies` - 创建策略规则
- [ ] `DELETE /v1/casbin/policies/:id` - 删除策略规则
- [ ] `GET /v1/casbin/relations` - 查询角色关系列表
- [ ] `POST /v1/casbin/relations` - 创建角色关系
- [ ] `GET /v1/casbin/model/versions` - 查询模型版本列表
- [ ] `GET /v1/casbin/model/active` - 获取当前激活的模型
- [ ] `POST /v1/casbin/model/drafts` - 创建模型草稿
- [ ] `POST /v1/casbin/model/versions/:id/publish` - 发布模型版本

### 前端页面测试

- [ ] 权限规则管理页面正常加载
- [ ] 可以创建策略规则
- [ ] 可以删除策略规则
- [ ] 分页功能正常
- [ ] 筛选功能正常
- [ ] 角色关系管理页面正常加载
- [ ] 可以创建角色关系
- [ ] 可以删除角色关系

## 🐛 常见问题

### 问题：后端服务启动失败

**可能原因：**

1. 端口被占用
2. 数据库连接失败
3. Redis 连接失败
4. 环境变量未配置

**解决方法：**

```bash
# 检查端口占用
lsof -i :9528

# 检查数据库连接
psql -h localhost -U your_user -d your_db

# 检查 Redis 连接
redis-cli ping
```

### 问题：前端页面无法访问

**可能原因：**

1. 前端服务未启动
2. 路由配置错误
3. 需要登录认证

**解决方法：**

- 确认前端服务已启动
- 检查浏览器控制台错误
- 确认已登录

### 问题：API 返回 401/403

**解决方法：**

- 检查 JWT Token 是否有效
- 确认用户有相应权限
- 在 Swagger UI 中重新配置认证

## 📚 参考文档

- **详细测试指南**：`CASBIN_TEST_GUIDE.md`
- **快速测试清单**：`CASBIN_QUICK_TEST.md`
- **测试脚本**：`./test-casbin-api.sh`

## 🎯 测试目标

完成以下核心功能的验证：

1. ✅ 策略规则 CRUD 操作
2. ✅ 角色关系 CRUD 操作
3. ✅ 模型配置版本管理
4. ✅ 权限控制生效
5. ✅ Enforcer 重新加载
6. ✅ 前端页面交互

---

**准备好开始测试了吗？** 🚀

运行以下命令启动后端服务：

```bash
pnpm --filter admin-api dev
```
