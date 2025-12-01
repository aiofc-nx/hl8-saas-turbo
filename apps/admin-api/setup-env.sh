#!/bin/bash

# 环境变量设置脚本
# 从 .env.example 创建 .env 文件

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_EXAMPLE="$SCRIPT_DIR/.env.example"
ENV_FILE="$SCRIPT_DIR/.env"

echo "=========================================="
echo "环境变量配置设置"
echo "=========================================="
echo ""

# 检查 .env.example 是否存在
if [ ! -f "$ENV_EXAMPLE" ]; then
    echo "❌ 错误: .env.example 文件不存在"
    exit 1
fi

# 检查 .env 是否已存在
if [ -f "$ENV_FILE" ]; then
    echo "⚠️  警告: .env 文件已存在"
    read -p "是否要覆盖现有文件? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "已取消操作"
        exit 0
    fi
    echo "备份现有 .env 文件..."
    cp "$ENV_FILE" "$ENV_FILE.backup.$(date +%Y%m%d_%H%M%S)"
fi

# 复制 .env.example 到 .env
echo "正在从 .env.example 创建 .env 文件..."
cp "$ENV_EXAMPLE" "$ENV_FILE"

echo "✅ .env 文件已创建"
echo ""
echo "=========================================="
echo "下一步操作"
echo "=========================================="
echo ""
echo "1. 检查并修改 .env 文件中的配置"
echo "2. 确保 Docker Compose 服务已启动:"
echo "   docker-compose up -d"
echo "3. 验证数据库连接:"
echo "   psql -h localhost -p 5432 -U aiofix -d hl8-platform"
echo "4. 验证 Redis 连接:"
echo "   redis-cli -h localhost -p 6379 PING"
echo ""
echo "详细配置说明请参考: docs/ENV-SETUP.md"
echo ""
