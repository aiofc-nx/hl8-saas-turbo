# Casbin 功能快速测试指南

## 快速开始

### 1. 启动后端服务

```bash
cd apps/admin-api
pnpm dev
```

服务启动后：

- API 地址：`http://localhost:9528/v1`
- Swagger 文档：`http://localhost:9528/api-docs`

### 2. 启动前端服务（可选）

```bash
cd apps/hl8-admin
pnpm dev
```

前端地址：`http://localhost:5173`

## 功能测试清单

### ✅ 基础检查

- [ ] 后端服务启动成功
- [ ] Swagger 文档可访问
- [ ] 数据库表已创建（`casbin_rule`, `casbin_model_config`）

### 📋 策略规则管理测试

#### 1. 查询策略规则列表

```http
GET /v1/casbin/policies?current=1&size=10
```

**预期结果**：返回分页的策略规则列表

#### 2. 创建策略规则

```http
POST /v1/casbin/policies
Content-Type: application/json

{
  "ptype": "p",
  "subject": "admin",
  "object": "/api/users",
  "action": "GET",
  "domain": "default"
}
```

**预期结果**：成功创建策略规则，返回策略 ID

#### 3. 查询特定策略规则

```http
GET /v1/casbin/policies?ptype=p&subject=admin
```

**预期结果**：返回匹配的策略规则

#### 4. 删除策略规则

```http
DELETE /v1/casbin/policies/:id
```

**预期结果**：成功删除策略规则

### 🔗 角色关系管理测试

#### 1. 查询角色关系列表

```http
GET /v1/casbin/relations?current=1&size=10
```

**预期结果**：返回分页的角色关系列表

#### 2. 创建角色关系

```http
POST /v1/casbin/relations
Content-Type: application/json

{
  "childSubject": "user1",
  "parentRole": "admin",
  "domain": "default"
}
```

**预期结果**：成功创建角色关系

#### 3. 删除角色关系

```http
DELETE /v1/casbin/relations/:id
```

**预期结果**：成功删除角色关系

### ⚙️ 模型配置管理测试

#### 1. 查询模型版本列表

```http
GET /v1/casbin/model/versions?current=1&size=10
```

**预期结果**：返回模型版本列表（可能为空）

#### 2. 获取当前激活的模型

```http
GET /v1/casbin/model/active
```

**预期结果**：返回当前激活的模型配置，或 null（如果数据库中没有）

#### 3. 创建模型草稿

```http
POST /v1/casbin/model/drafts
Content-Type: application/json

{
  "content": "[request_definition]\nr = sub, obj, act\n\n[policy_definition]\np = sub, obj, act\n\n[role_definition]\ng = _, _, _\n\n[policy_effect]\ne = some(where (p.eft == allow))\n\n[matchers]\nm = g(r.sub, p.sub, r.obj) && r.act == p.act",
  "remark": "测试模型配置"
}
```

**预期结果**：成功创建模型草稿，返回版本号

#### 4. 发布模型版本

```http
POST /v1/casbin/model/versions/:id/publish
```

**预期结果**：

- 草稿状态变为 active
- 如果有旧的 active 版本，变为 archived
- Enforcer 重新加载

#### 5. 查看版本差异

```http
GET /v1/casbin/model/versions/:id1/diff/:id2
```

**预期结果**：返回两个版本的差异信息

#### 6. 回滚模型版本

```http
POST /v1/casbin/model/versions/:id/rollback
```

**预期结果**：

- 指定版本变为 active
- 当前 active 版本变为 archived
- Enforcer 重新加载

## 使用 Swagger UI 测试

1. 打开浏览器访问：`http://localhost:9528/api-docs`

2. 找到 "Casbin" 相关的 API 分组：
   - Casbin - Policy（策略规则）
   - Casbin - Relation（角色关系）
   - Casbin - Model（模型配置）

3. 点击 "Authorize" 按钮，输入 JWT Token

4. 逐个测试各个接口：
   - 点击接口展开
   - 点击 "Try it out"
   - 填写参数
   - 点击 "Execute"
   - 查看响应结果

## 权限测试

### 测试无权限访问

使用没有相应权限的用户访问接口，应返回：

```json
{
  "statusCode": 403,
  "message": "Forbidden resource"
}
```

### 测试有权限访问

使用有相应权限的用户访问接口，应返回正常数据。

### 需要的权限

- `casbin:policy:read` - 读取策略规则
- `casbin:policy:create` - 创建策略规则
- `casbin:policy:delete` - 删除策略规则
- `casbin:relation:read` - 读取角色关系
- `casbin:relation:create` - 创建角色关系
- `casbin:model:read` - 读取模型配置
- `casbin:model:edit` - 编辑模型配置
- `casbin:model:approve` - 审批模型配置（发布/回滚）

## 前端页面测试

### 1. 权限规则管理页面

访问：`http://localhost:5173/_authenticated/casbin-policies/`

测试：

- [ ] 页面正常加载
- [ ] 显示策略规则列表
- [ ] 可以创建新策略规则
- [ ] 可以删除策略规则
- [ ] 分页功能正常
- [ ] 筛选功能正常

### 2. 角色关系管理页面

访问：`http://localhost:5173/_authenticated/casbin-relations/`

测试：

- [ ] 页面正常加载
- [ ] 显示角色关系列表
- [ ] 可以创建新角色关系
- [ ] 可以删除角色关系
- [ ] 分页功能正常
- [ ] 筛选功能正常

## 常见问题排查

### 问题：服务启动失败

**检查**：

1. 数据库连接是否正常
2. Redis 连接是否正常
3. 环境变量是否配置正确
4. 端口是否被占用

### 问题：API 返回 401 Unauthorized

**解决**：需要在请求头中添加 JWT Token

```http
Authorization: Bearer <your-token>
```

### 问题：API 返回 403 Forbidden

**解决**：检查用户是否有相应的权限

### 问题：模型配置发布失败

**检查**：

1. 模型内容格式是否正确
2. 是否有审批权限（`casbin:model:approve`）

### 问题：前端页面无法访问

**检查**：

1. 前端服务是否启动
2. 路由是否正确配置
3. 是否需要登录认证

## 测试数据建议

### 策略规则测试数据

```json
[
  {
    "ptype": "p",
    "subject": "admin",
    "object": "/api/users",
    "action": "GET",
    "domain": "default"
  },
  {
    "ptype": "p",
    "subject": "admin",
    "object": "/api/users",
    "action": "POST",
    "domain": "default"
  },
  {
    "ptype": "p",
    "subject": "user",
    "object": "/api/profile",
    "action": "GET",
    "domain": "default"
  }
]
```

### 角色关系测试数据

```json
[
  {
    "childSubject": "user1",
    "parentRole": "admin",
    "domain": "default"
  },
  {
    "childSubject": "user2",
    "parentRole": "editor",
    "domain": "default"
  }
]
```

## 下一步

完成基础功能测试后，可以：

1. 测试 Enforcer 重新加载功能
2. 测试模型版本回滚功能
3. 测试权限控制功能
4. 完善前端 UI 组件
5. 添加操作日志记录
