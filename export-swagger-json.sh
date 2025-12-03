#!/bin/bash

# 导出 Swagger API 文档为 JSON 格式

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 配置
API_BASE_URL="${API_BASE_URL:-http://localhost:9528}"
OUTPUT_FILE="${OUTPUT_FILE:-swagger-api-docs.json}"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  导出 Swagger API 文档 (JSON)${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# 检查服务是否运行
echo -e "${YELLOW}[1/3] 检查服务状态...${NC}"
if ! timeout 2 curl -s -f "${API_BASE_URL}/api-docs" > /dev/null 2>&1; then
    echo -e "${RED}✗ 服务未运行，请先启动服务：${NC}"
    echo -e "  ${YELLOW}pnpm --filter admin-api dev${NC}"
    exit 1
fi
echo -e "${GREEN}✓ 服务正在运行${NC}"
echo ""

# 导出 JSON 文档
echo -e "${YELLOW}[2/3] 导出 Swagger JSON 文档...${NC}"
if timeout 10 curl -s "${API_BASE_URL}/api-docs-json" -o "${OUTPUT_FILE}" 2>/dev/null; then
    if [ -f "${OUTPUT_FILE}" ] && [ -s "${OUTPUT_FILE}" ]; then
        FILE_SIZE=$(du -h "${OUTPUT_FILE}" | cut -f1)
        echo -e "${GREEN}✓ 成功导出到: ${OUTPUT_FILE}${NC}"
        echo -e "${BLUE}  文件大小: ${FILE_SIZE}${NC}"
    else
        echo -e "${RED}✗ 导出失败：文件为空或不存在${NC}"
        exit 1
    fi
else
    echo -e "${RED}✗ 导出失败：无法连接到 API${NC}"
    exit 1
fi
echo ""

# 验证 JSON 格式
echo -e "${YELLOW}[3/3] 验证 JSON 格式...${NC}"
if command -v jq &> /dev/null; then
    if jq empty "${OUTPUT_FILE}" 2>/dev/null; then
        echo -e "${GREEN}✓ JSON 格式有效${NC}"
        
        # 显示一些统计信息
        API_COUNT=$(jq -r '.paths | keys | length' "${OUTPUT_FILE}" 2>/dev/null || echo "0")
        echo -e "${BLUE}  API 路径数量: ${API_COUNT}${NC}"
        
        # 检查 Casbin 相关接口
        CASBIN_COUNT=$(jq -r '.paths | keys[] | select(contains("casbin"))' "${OUTPUT_FILE}" 2>/dev/null | wc -l)
        echo -e "${BLUE}  Casbin 接口数量: ${CASBIN_COUNT}${NC}"
    else
        echo -e "${YELLOW}⚠ JSON 格式验证失败（可能不是有效的 JSON）${NC}"
    fi
else
    echo -e "${YELLOW}⚠ 未安装 jq，跳过 JSON 格式验证${NC}"
    echo -e "${BLUE}  提示: 安装 jq 以验证 JSON 格式${NC}"
    echo -e "  ${YELLOW}sudo apt install jq${NC}"
fi
echo ""

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  导出完成${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}文件位置: ${OUTPUT_FILE}${NC}"
echo ""
echo -e "${BLUE}使用方式：${NC}"
echo "  • 导入到 Postman: File > Import > Upload Files"
echo "  • 导入到 Insomnia: Application > Preferences > Data > Import Data"
echo "  • 使用 Swagger Editor: https://editor.swagger.io/"
echo "  • 生成客户端代码: 使用 openapi-generator"

