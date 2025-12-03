#!/bin/bash

# Casbin API 功能测试脚本
# 用于测试 Casbin 权限管理相关的 API 接口

# 不设置 set -e，允许脚本继续执行即使某些命令失败

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置
API_BASE_URL="${API_BASE_URL:-http://localhost:9528/v1}"
SWAGGER_URL="${SWAGGER_URL:-http://localhost:9528/api-docs}"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Casbin API 功能测试${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# 检查服务是否运行
echo -e "${YELLOW}[1/8] 检查服务状态...${NC}"
if timeout 2 curl -s -f "${API_BASE_URL}/health" > /dev/null 2>&1 || timeout 2 curl -s -f "${SWAGGER_URL}" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ 服务正在运行${NC}"
else
    echo -e "${YELLOW}⚠ 服务未运行或无法访问${NC}"
    echo -e "${BLUE}请先启动服务：${NC}"
    echo -e "  ${YELLOW}pnpm --filter admin-api dev${NC}"
    echo -e "${BLUE}或者如果服务在其他端口运行，请设置环境变量：${NC}"
    echo -e "  ${YELLOW}export API_BASE_URL=http://localhost:YOUR_PORT/v1${NC}"
    echo -e "${BLUE}脚本将继续执行其他检查...${NC}"
fi
echo ""

# 检查 Swagger 文档
echo -e "${YELLOW}[2/8] 检查 Swagger 文档...${NC}"
if timeout 2 curl -s -f "${SWAGGER_URL}" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Swagger 文档可访问: ${SWAGGER_URL}${NC}"
else
    echo -e "${YELLOW}⚠ Swagger 文档不可访问（服务可能未启动）${NC}"
fi
echo ""

# 测试策略规则查询接口（需要认证，这里只检查路由是否存在）
echo -e "${YELLOW}[3/8] 检查 API 路由...${NC}"
ENDPOINTS=(
    "casbin/policies"
    "casbin/relations"
    "casbin/model/versions"
    "casbin/model/active"
)

for endpoint in "${ENDPOINTS[@]}"; do
    status=$(timeout 2 curl -s -o /dev/null -w "%{http_code}" "${API_BASE_URL}/${endpoint}" 2>/dev/null || echo "000")
    if [ "$status" = "401" ] || [ "$status" = "403" ]; then
        echo -e "${GREEN}✓ ${endpoint} - 路由存在（需要认证）${NC}"
    elif [ "$status" = "404" ]; then
        echo -e "${RED}✗ ${endpoint} - 路由不存在${NC}"
    elif [ "$status" = "000" ]; then
        echo -e "${YELLOW}? ${endpoint} - 无法连接（服务可能未启动）${NC}"
    else
        echo -e "${YELLOW}? ${endpoint} - 状态码: ${status}${NC}"
    fi
done
echo ""

# 检查数据库表
echo -e "${YELLOW}[4/8] 检查数据库表...${NC}"
echo -e "${BLUE}请手动检查以下表是否存在：${NC}"
echo "  - casbin_rule (策略规则表)"
echo "  - casbin_model_config (模型配置表)"
echo ""

# 显示测试建议
echo -e "${YELLOW}[5/8] API 测试建议${NC}"
echo -e "${BLUE}由于需要认证，建议使用以下方式测试：${NC}"
echo ""
echo "1. 使用 Swagger UI 测试："
echo -e "   ${GREEN}打开浏览器访问: ${SWAGGER_URL}${NC}"
echo "   - 在 Swagger UI 中点击 'Authorize' 按钮"
echo "   - 输入 JWT Token"
echo "   - 测试各个接口"
echo ""

echo "2. 使用 curl 测试（需要先获取 Token）："
echo -e "   ${GREEN}# 获取 Token${NC}"
echo "   TOKEN=\$(curl -X POST \"${API_BASE_URL}/auth/sign-in\" \\"
echo "     -H \"Content-Type: application/json\" \\"
echo "     -d '{\"username\":\"admin\",\"password\":\"password\"}' | jq -r '.data.accessToken')"
echo ""
echo -e "   ${GREEN}# 测试查询策略规则${NC}"
echo "   curl -X GET \"${API_BASE_URL}/casbin/policies?current=1&size=10\" \\"
echo "     -H \"Authorization: Bearer \$TOKEN\""
echo ""

echo "3. 使用 Postman 或 Insomnia："
echo "   - 导入 Swagger 文档"
echo "   - 配置认证"
echo "   - 测试各个接口"
echo ""

# 显示前端测试建议
echo -e "${YELLOW}[6/8] 前端测试建议${NC}"
echo -e "${BLUE}启动前端服务：${NC}"
echo -e "  ${GREEN}pnpm --filter hl8-admin dev${NC}"
echo ""
echo "访问以下页面："
echo "  - 权限规则管理: http://localhost:5173/_authenticated/casbin-policies/"
echo "  - 角色关系管理: http://localhost:5173/_authenticated/casbin-relations/"
echo "  - 模型配置管理: http://localhost:5173/_authenticated/casbin-model/"
echo ""

# 显示关键功能测试点
echo -e "${YELLOW}[7/8] 关键功能测试点${NC}"
echo -e "${BLUE}策略规则管理：${NC}"
echo "  ✓ 创建策略规则"
echo "  ✓ 查询策略规则列表（分页、筛选）"
echo "  ✓ 删除策略规则"
echo "  ✓ 批量操作策略规则"
echo ""

echo -e "${BLUE}角色关系管理：${NC}"
echo "  ✓ 创建角色关系"
echo "  ✓ 查询角色关系列表（分页、筛选）"
echo "  ✓ 删除角色关系"
echo ""

echo -e "${BLUE}模型配置管理：${NC}"
echo "  ✓ 创建模型草稿"
echo "  ✓ 查询模型版本列表"
echo "  ✓ 发布模型版本"
echo "  ✓ 回滚模型版本"
echo "  ✓ 查看版本差异"
echo ""

# 显示权限测试
echo -e "${YELLOW}[8/8] 权限测试${NC}"
echo -e "${BLUE}测试权限控制：${NC}"
echo "  1. 使用无权限用户访问接口，应返回 403"
echo "  2. 使用有权限用户访问接口，应返回 200"
echo "  3. 测试以下权限："
echo "     - casbin:policy:read"
echo "     - casbin:policy:create"
echo "     - casbin:policy:delete"
echo "     - casbin:relation:read"
echo "     - casbin:relation:create"
echo "     - casbin:model:read"
echo "     - casbin:model:edit"
echo "     - casbin:model:approve"
echo ""

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  测试脚本执行完成${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}详细测试指南请参考: CASBIN_TEST_GUIDE.md${NC}"

