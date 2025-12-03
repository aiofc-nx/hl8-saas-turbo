# Swagger API 文档导出指南

## 📋 导出方式

### 方式一：使用导出脚本（推荐）

```bash
./export-swagger-json.sh
```

脚本会自动：

- 检查服务是否运行
- 导出 JSON 文档
- 验证 JSON 格式（如果安装了 jq）

**输出文件**: `swagger-api-docs.json`

### 方式二：使用 curl 直接导出

```bash
curl http://localhost:9528/api-docs-json -o swagger-api-docs.json
```

### 方式三：使用浏览器

1. 打开浏览器访问：`http://localhost:9528/api-docs-json`
2. 右键点击页面
3. 选择"另存为"或"Save as"
4. 保存为 `swagger-api-docs.json`

## 📁 文件信息

- **文件路径**: `swagger-api-docs.json`
- **文件格式**: OpenAPI 3.0.0 (JSON)
- **文件大小**: 约 60KB
- **包含内容**: 所有 API 接口的完整定义

## 🎯 使用场景

### 1. 导入到 Postman

1. 打开 Postman
2. 点击左上角 "Import"
3. 选择 "Upload Files"
4. 选择 `swagger-api-docs.json`
5. 点击 "Import"

### 2. 导入到 Insomnia

1. 打开 Insomnia
2. Application > Preferences > Data > Import Data
3. 选择 "OpenAPI 3.0"
4. 选择 `swagger-api-docs.json`
5. 点击 "Import"

### 3. 使用 Swagger Editor

1. 访问：https://editor.swagger.io/
2. 点击 "File" > "Import file"
3. 选择 `swagger-api-docs.json`
4. 查看和编辑 API 文档

### 4. 生成客户端代码

使用 OpenAPI Generator：

```bash
# 安装 openapi-generator
npm install -g @openapi-generator/cli

# 生成 TypeScript 客户端
openapi-generator generate \
  -i swagger-api-docs.json \
  -g typescript-axios \
  -o ./generated-client

# 生成其他语言的客户端
# -g javascript: JavaScript 客户端
# -g python: Python 客户端
# -g java: Java 客户端
# -g go: Go 客户端
```

### 5. API 文档托管

可以将 JSON 文件上传到：

- SwaggerHub
- Postman Public API
- GitHub Pages（配合 Swagger UI）

## 📊 文档内容

导出的 JSON 文件包含：

- **OpenAPI 规范**: 3.0.0
- **API 信息**: 标题、描述、版本、联系信息
- **所有路径**: 包括所有 API 端点
- **请求/响应模型**: 完整的 Schema 定义
- **安全方案**: JWT Bearer 认证
- **标签分组**: 按模块组织的 API

### Casbin 相关接口

文档中包含以下 Casbin 接口：

#### 策略规则管理

- `GET /v1/casbin/policies` - 查询策略规则列表
- `POST /v1/casbin/policies` - 创建策略规则
- `DELETE /v1/casbin/policies/{id}` - 删除策略规则
- `POST /v1/casbin/policies/batch` - 批量操作

#### 角色关系管理

- `GET /v1/casbin/relations` - 查询角色关系列表
- `POST /v1/casbin/relations` - 创建角色关系
- `DELETE /v1/casbin/relations/{id}` - 删除角色关系

#### 模型配置管理

- `GET /v1/casbin/model/versions` - 查询模型版本列表
- `GET /v1/casbin/model/active` - 获取当前激活的模型
- `GET /v1/casbin/model/versions/{id}` - 获取模型版本详情
- `GET /v1/casbin/model/versions/{id1}/diff/{id2}` - 获取版本差异
- `POST /v1/casbin/model/drafts` - 创建模型草稿
- `PUT /v1/casbin/model/drafts/{id}` - 更新模型草稿
- `POST /v1/casbin/model/versions/{id}/publish` - 发布模型版本
- `POST /v1/casbin/model/versions/{id}/rollback` - 回滚模型版本

## 🔧 自定义导出

### 指定输出文件

```bash
export OUTPUT_FILE=my-api-docs.json
./export-swagger-json.sh
```

### 指定 API 地址

```bash
export API_BASE_URL=http://localhost:3000
./export-swagger-json.sh
```

## ✅ 验证导出结果

### 检查文件是否存在

```bash
ls -lh swagger-api-docs.json
```

### 验证 JSON 格式

```bash
# 使用 jq（如果已安装）
jq . swagger-api-docs.json > /dev/null && echo "JSON 格式有效"

# 或使用 Python
python3 -m json.tool swagger-api-docs.json > /dev/null && echo "JSON 格式有效"
```

### 查看 API 数量

```bash
# 使用 jq 统计 API 路径数量
jq -r '.paths | keys | length' swagger-api-docs.json

# 查看所有 Casbin 相关接口
jq -r '.paths | keys[] | select(contains("casbin"))' swagger-api-docs.json
```

## 📝 注意事项

1. **服务必须运行**: 导出前确保后端服务已启动
2. **文件会覆盖**: 如果文件已存在，会被覆盖
3. **JSON 格式**: 导出的文件是标准的 OpenAPI 3.0 JSON 格式
4. **包含所有接口**: 不仅包括 Casbin 接口，还包括所有其他 API

## 🔗 相关资源

- **Swagger UI**: http://localhost:9528/api-docs
- **JSON 端点**: http://localhost:9528/api-docs-json
- **OpenAPI 规范**: https://swagger.io/specification/
- **Swagger Editor**: https://editor.swagger.io/

---

**提示**: 导出的 JSON 文件可以用于 API 文档生成、客户端代码生成、API 测试工具导入等多种用途。
