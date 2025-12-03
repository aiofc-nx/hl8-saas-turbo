# Casbin 权限管理功能测试指南

## 测试环境准备

### 1. 数据库迁移状态

✅ 数据库迁移已成功执行

- `casbin_model_config` 表已创建
- 索引已创建（status, version）

### 2. 编译状态

✅ 后端编译成功（337 个文件，0 个错误）
✅ 前端编译成功（无 TypeScript 错误）

### 3. 服务启动

#### 启动后端服务

```bash
cd apps/admin-api
pnpm dev
```

服务启动后，可以通过以下地址访问：

- API 服务：`http://localhost:3000/v1`
- Swagger 文档：`http://localhost:3000/api-docs`

#### 启动前端服务

```bash
cd apps/hl8-admin
pnpm dev
```

前端服务启动后，可以通过以下地址访问：

- 前端应用：`http://localhost:5173`

## API 接口测试

### 一、策略规则管理 API (`/v1/casbin/policies`)

#### 1. 分页查询策略规则

```http
GET /v1/casbin/policies?current=1&size=10&ptype=p&subject=admin&object=/api/users&action=GET&domain=default
```

**权限要求**：`casbin:policy:read`

**查询参数**：

- `current`: 页码（默认：1）
- `size`: 每页数量（默认：10）
- `ptype`: 策略类型（可选：'p' 或 'g'）
- `subject`: 主体（可选）
- `object`: 资源（可选）
- `action`: 操作（可选）
- `domain`: 域（可选）

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

**权限要求**：`casbin:policy:create`

#### 3. 删除策略规则

```http
DELETE /v1/casbin/policies/:id
```

**权限要求**：`casbin:policy:delete`

#### 4. 批量操作策略规则

```http
POST /v1/casbin/policies/batch
Content-Type: application/json

{
  "operation": "delete",
  "ids": [1, 2, 3]
}
```

**权限要求**：`casbin:policy:manage`

**操作类型**：

- `delete`: 批量删除
- `enable`: 批量启用（如果支持）
- `disable`: 批量禁用（如果支持）

### 二、角色关系管理 API (`/v1/casbin/relations`)

#### 1. 分页查询角色关系

```http
GET /v1/casbin/relations?current=1&size=10&childSubject=user1&parentRole=admin&domain=default
```

**权限要求**：`casbin:relation:read`

**查询参数**：

- `current`: 页码（默认：1）
- `size`: 每页数量（默认：10）
- `childSubject`: 子主体（可选）
- `parentRole`: 父角色（可选）
- `domain`: 域（可选）

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

**权限要求**：`casbin:relation:create`

#### 3. 删除角色关系

```http
DELETE /v1/casbin/relations/:id
```

**权限要求**：`casbin:relation:delete`

### 三、模型配置管理 API (`/v1/casbin/model`)

#### 1. 分页查询模型版本

```http
GET /v1/casbin/model/versions?current=1&size=10&status=active
```

**权限要求**：`casbin:model:read`

**查询参数**：

- `current`: 页码（默认：1）
- `size`: 每页数量（默认：10）
- `status`: 状态筛选（可选：'draft', 'active', 'archived'）

#### 2. 获取当前激活的模型配置

```http
GET /v1/casbin/model/active
```

**权限要求**：`casbin:model:read`

#### 3. 获取模型版本详情

```http
GET /v1/casbin/model/versions/:id
```

**权限要求**：`casbin:model:read`

#### 4. 获取模型版本差异

```http
GET /v1/casbin/model/versions/:id1/diff/:id2
```

**权限要求**：`casbin:model:read`

#### 5. 创建模型草稿

```http
POST /v1/casbin/model/drafts
Content-Type: application/json

{
  "content": "[request_definition]\nr = sub, obj, act\n\n[policy_definition]\np = sub, obj, act\n\n[role_definition]\ng = _, _, _\n\n[policy_effect]\ne = some(where (p.eft == allow))\n\n[matchers]\nm = g(r.sub, p.sub, r.obj) && r.act == p.act",
  "remark": "初始模型配置"
}
```

**权限要求**：`casbin:model:edit`

#### 6. 更新模型草稿

```http
PUT /v1/casbin/model/drafts/:id
Content-Type: application/json

{
  "content": "...",
  "remark": "更新后的模型配置"
}
```

**权限要求**：`casbin:model:edit`

#### 7. 发布模型版本

```http
POST /v1/casbin/model/versions/:id/publish
```

**权限要求**：`casbin:model:approve`

**注意**：发布操作会：

- 将当前 active 版本标记为 archived
- 将指定版本标记为 active
- 触发 Enforcer 重新加载

#### 8. 回滚模型版本

```http
POST /v1/casbin/model/versions/:id/rollback
```

**权限要求**：`casbin:model:approve`

**注意**：回滚操作会：

- 将当前 active 版本标记为 archived
- 将指定版本标记为 active
- 触发 Enforcer 重新加载

## 前端页面测试

### 1. 权限规则管理页面

**路径**：`/_authenticated/casbin-policies/`

**功能**：

- 查看策略规则列表（分页、筛选）
- 创建策略规则
- 删除策略规则
- 批量操作策略规则

### 2. 角色关系管理页面

**路径**：`/_authenticated/casbin-relations/`

**功能**：

- 查看角色关系列表（分页、筛选）
- 创建角色关系
- 删除角色关系

### 3. 权限模型配置页面

**路径**：`/_authenticated/casbin-model/`（待实现）

**功能**：

- 查看模型版本列表
- 创建/编辑模型草稿
- 发布模型版本
- 回滚模型版本
- 查看版本差异

## 权限配置

所有 Casbin 管理接口都需要相应的权限：

| 资源     | 操作 | 权限标识                 |
| -------- | ---- | ------------------------ |
| 策略规则 | 读取 | `casbin:policy:read`     |
| 策略规则 | 创建 | `casbin:policy:create`   |
| 策略规则 | 删除 | `casbin:policy:delete`   |
| 策略规则 | 管理 | `casbin:policy:manage`   |
| 角色关系 | 读取 | `casbin:relation:read`   |
| 角色关系 | 创建 | `casbin:relation:create` |
| 角色关系 | 删除 | `casbin:relation:delete` |
| 模型配置 | 读取 | `casbin:model:read`      |
| 模型配置 | 编辑 | `casbin:model:edit`      |
| 模型配置 | 审批 | `casbin:model:approve`   |

## 测试步骤建议

### 阶段一：基础功能测试

1. **测试策略规则管理**
   - 创建几个测试策略规则
   - 查询策略规则列表
   - 测试筛选功能
   - 删除策略规则

2. **测试角色关系管理**
   - 创建几个测试角色关系
   - 查询角色关系列表
   - 测试筛选功能
   - 删除角色关系

### 阶段二：模型配置测试

1. **测试模型版本管理**
   - 创建模型草稿
   - 查看版本列表
   - 发布模型版本
   - 查看版本差异
   - 测试回滚功能

2. **测试 Enforcer 重新加载**
   - 发布新版本后验证权限是否生效
   - 回滚版本后验证权限是否恢复

### 阶段三：集成测试

1. **测试权限控制**
   - 使用不同权限的用户测试接口访问
   - 验证无权限用户无法访问受保护接口

2. **测试前端页面**
   - 访问各个管理页面
   - 测试 CRUD 操作
   - 验证数据展示和交互

## 注意事项

1. **数据库优先策略**：
   - 系统优先从数据库加载 active 版本的模型配置
   - 如果数据库中没有 active 版本，则回退到文件配置（`model.conf.1`）

2. **Enforcer 重新加载**：
   - 策略规则变更后会自动触发 Enforcer 重新加载
   - 模型配置发布/回滚后会自动触发 Enforcer 重新加载

3. **审批流程**：
   - 编辑者可以创建和更新草稿，但不能发布
   - 只有审批者可以发布模型版本
   - 编辑者不能发布自己创建的草稿

4. **版本管理**：
   - 每个模型配置都有版本号，自动递增
   - 同时只能有一个 active 版本
   - 发布新版本时，旧版本会自动标记为 archived

## 故障排查

### 问题：API 返回 403 Forbidden

**原因**：用户没有相应的权限
**解决**：检查用户的角色和权限配置

### 问题：模型配置发布失败

**原因**：模型内容格式不正确
**解决**：检查模型内容是否符合 Casbin 模型格式要求

### 问题：Enforcer 未重新加载

**原因**：事件未正确触发
**解决**：检查 EventEmitter 配置和事件监听

### 问题：前端页面无法访问

**原因**：路由未正确配置
**解决**：检查路由文件和路由类型生成

## 下一步

1. 完善前端页面组件（表格、对话框、代码编辑器等）
2. 添加操作日志记录
3. 添加前端权限控制显示
4. 添加高风险操作确认提示
5. 创建审计日志查看页面
