#!/bin/bash

# Casbin API 功能测试脚本（需要认证）
# 用于实际测试 Casbin 权限管理相关的 API 接口功能

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置
API_BASE_URL="${API_BASE_URL:-http://localhost:9528/v1}"
LOGIN_USERNAME="${LOGIN_USERNAME:-admin}"
LOGIN_PASSWORD="${LOGIN_PASSWORD:-admin123}"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Casbin API 功能测试（需要认证）${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# 检查服务是否运行
echo -e "${YELLOW}[1/6] 检查服务状态...${NC}"
if ! timeout 2 curl -s -f "${API_BASE_URL}/../api-docs" > /dev/null 2>&1; then
    echo -e "${RED}✗ 服务未运行，请先启动服务：${NC}"
    echo -e "  ${YELLOW}pnpm --filter admin-api dev${NC}"
    exit 1
fi
echo -e "${GREEN}✓ 服务正在运行${NC}"
echo ""

# 尝试登录获取 Token
echo -e "${YELLOW}[2/6] 尝试登录获取 Token...${NC}"
LOGIN_RESPONSE=$(timeout 5 curl -s -X POST "${API_BASE_URL}/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"${LOGIN_USERNAME}\",\"password\":\"${LOGIN_PASSWORD}\"}" 2>/dev/null)

if [ -z "$LOGIN_RESPONSE" ]; then
    echo -e "${YELLOW}⚠ 无法连接到登录接口，可能需要配置正确的用户名和密码${NC}"
    echo -e "${BLUE}提示：可以通过环境变量设置：${NC}"
    echo -e "  ${YELLOW}export LOGIN_USERNAME=your_username${NC}"
    echo -e "  ${YELLOW}export LOGIN_PASSWORD=your_password${NC}"
    echo ""
    echo -e "${BLUE}或者直接在 Swagger UI 中测试：${NC}"
    echo -e "  ${GREEN}http://localhost:9528/api-docs${NC}"
    exit 0
fi

# 尝试提取 Token（需要 jq）
if command -v jq &> /dev/null; then
    TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.data.accessToken // .accessToken // empty' 2>/dev/null)
    if [ -n "$TOKEN" ] && [ "$TOKEN" != "null" ]; then
        echo -e "${GREEN}✓ 成功获取 Token${NC}"
        echo ""
    else
        echo -e "${YELLOW}⚠ 登录失败或 Token 格式不正确${NC}"
        echo -e "${BLUE}响应内容：${NC}"
        echo "$LOGIN_RESPONSE" | head -5
        echo ""
        echo -e "${BLUE}请检查用户名和密码是否正确${NC}"
        exit 0
    fi
else
    echo -e "${YELLOW}⚠ 未安装 jq，无法解析 Token${NC}"
    echo -e "${BLUE}响应内容：${NC}"
    echo "$LOGIN_RESPONSE" | head -5
    echo ""
    echo -e "${BLUE}请安装 jq 或手动从响应中提取 Token：${NC}"
    echo -e "  ${YELLOW}sudo apt install jq${NC}"
    exit 0
fi

# 测试查询策略规则列表
echo -e "${YELLOW}[3/6] 测试查询策略规则列表...${NC}"
POLICIES_RESPONSE=$(timeout 5 curl -s -X GET "${API_BASE_URL}/casbin/policies?current=1&size=10" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" 2>/dev/null)

if echo "$POLICIES_RESPONSE" | grep -q "data\|records"; then
    echo -e "${GREEN}✓ 成功查询策略规则列表${NC}"
    POLICY_COUNT=$(echo "$POLICIES_RESPONSE" | jq -r '.data.total // .data.records | length // 0' 2>/dev/null || echo "0")
    echo -e "${BLUE}  当前策略规则数量: ${POLICY_COUNT}${NC}"
else
    STATUS=$(echo "$POLICIES_RESPONSE" | jq -r '.statusCode // .code // "unknown"' 2>/dev/null || echo "unknown")
    if [ "$STATUS" = "403" ]; then
        echo -e "${YELLOW}⚠ 权限不足（403），需要 casbin:policy:read 权限${NC}"
    else
        echo -e "${YELLOW}⚠ 查询失败，状态: ${STATUS}${NC}"
        echo "$POLICIES_RESPONSE" | head -3
    fi
fi
echo ""

# 测试查询角色关系列表
echo -e "${YELLOW}[4/6] 测试查询角色关系列表...${NC}"
RELATIONS_RESPONSE=$(timeout 5 curl -s -X GET "${API_BASE_URL}/casbin/relations?current=1&size=10" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" 2>/dev/null)

if echo "$RELATIONS_RESPONSE" | grep -q "data\|records"; then
    echo -e "${GREEN}✓ 成功查询角色关系列表${NC}"
    RELATION_COUNT=$(echo "$RELATIONS_RESPONSE" | jq -r '.data.total // .data.records | length // 0' 2>/dev/null || echo "0")
    echo -e "${BLUE}  当前角色关系数量: ${RELATION_COUNT}${NC}"
else
    STATUS=$(echo "$RELATIONS_RESPONSE" | jq -r '.statusCode // .code // "unknown"' 2>/dev/null || echo "unknown")
    if [ "$STATUS" = "403" ]; then
        echo -e "${YELLOW}⚠ 权限不足（403），需要 casbin:relation:read 权限${NC}"
    else
        echo -e "${YELLOW}⚠ 查询失败，状态: ${STATUS}${NC}"
    fi
fi
echo ""

# 测试查询模型版本列表
echo -e "${YELLOW}[5/6] 测试查询模型版本列表...${NC}"
MODEL_VERSIONS_RESPONSE=$(timeout 5 curl -s -X GET "${API_BASE_URL}/casbin/model/versions?current=1&size=10" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" 2>/dev/null)

if echo "$MODEL_VERSIONS_RESPONSE" | grep -q "data\|records"; then
    echo -e "${GREEN}✓ 成功查询模型版本列表${NC}"
    VERSION_COUNT=$(echo "$MODEL_VERSIONS_RESPONSE" | jq -r '.data.total // .data.records | length // 0' 2>/dev/null || echo "0")
    echo -e "${BLUE}  当前模型版本数量: ${VERSION_COUNT}${NC}"
else
    STATUS=$(echo "$MODEL_VERSIONS_RESPONSE" | jq -r '.statusCode // .code // "unknown"' 2>/dev/null || echo "unknown")
    if [ "$STATUS" = "403" ]; then
        echo -e "${YELLOW}⚠ 权限不足（403），需要 casbin:model:read 权限${NC}"
    else
        echo -e "${YELLOW}⚠ 查询失败，状态: ${STATUS}${NC}"
    fi
fi
echo ""

# 测试获取当前激活的模型
echo -e "${YELLOW}[6/6] 测试获取当前激活的模型...${NC}"
ACTIVE_MODEL_RESPONSE=$(timeout 5 curl -s -X GET "${API_BASE_URL}/casbin/model/active" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" 2>/dev/null)

if echo "$ACTIVE_MODEL_RESPONSE" | grep -q "data\|content"; then
    echo -e "${GREEN}✓ 成功获取当前激活的模型${NC}"
    HAS_ACTIVE=$(echo "$ACTIVE_MODEL_RESPONSE" | jq -r '.data != null' 2>/dev/null || echo "false")
    if [ "$HAS_ACTIVE" = "true" ]; then
        VERSION=$(echo "$ACTIVE_MODEL_RESPONSE" | jq -r '.data.version // "N/A"' 2>/dev/null || echo "N/A")
        echo -e "${BLUE}  当前激活版本: ${VERSION}${NC}"
    else
        echo -e "${BLUE}  当前没有激活的模型（将使用文件配置）${NC}"
    fi
else
    STATUS=$(echo "$ACTIVE_MODEL_RESPONSE" | jq -r '.statusCode // .code // "unknown"' 2>/dev/null || echo "unknown")
    if [ "$STATUS" = "403" ]; then
        echo -e "${YELLOW}⚠ 权限不足（403），需要 casbin:model:read 权限${NC}"
    else
        echo -e "${YELLOW}⚠ 查询失败，状态: ${STATUS}${NC}"
    fi
fi
echo ""

# 总结
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  功能测试完成${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}提示：${NC}"
echo "  • 如果看到权限不足（403），需要为用户分配相应权限"
echo "  • 权限标识："
echo "    - casbin:policy:read"
echo "    - casbin:relation:read"
echo "    - casbin:model:read"
echo ""
echo -e "${BLUE}详细测试请使用 Swagger UI：${NC}"
echo -e "  ${GREEN}http://localhost:9528/api-docs${NC}"

