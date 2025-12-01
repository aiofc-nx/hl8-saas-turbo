#!/bin/bash

echo "=== 测试注册接口 ==="
echo ""

echo "1. 测试注册接口（使用 curl）..."
RESPONSE=$(curl -s -X POST http://localhost:9528/v1/auth/register \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:5173" \
  -d '{"email":"test'$(date +%s)'@example.com","password":"test123"}')

echo "响应: $RESPONSE"
echo ""

if echo "$RESPONSE" | grep -q "注册成功"; then
    echo "✅ 注册接口正常工作"
else
    echo "❌ 注册接口可能有问题"
    echo "   响应: $RESPONSE"
fi

echo ""
echo "2. 检查 CORS 配置..."
CORS_HEADERS=$(curl -s -I -X OPTIONS http://localhost:9528/v1/auth/register \
  -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: POST" | grep -i "access-control")

if [ -n "$CORS_HEADERS" ]; then
    echo "✅ CORS 配置正确"
    echo "   $CORS_HEADERS"
else
    echo "⚠️  CORS 配置可能有问题"
fi

echo ""
echo "3. 检查前端环境变量..."
if [ -f "apps/hl8-admin/.env.local" ]; then
    API_URL=$(grep "^VITE_API_BASE_URL" apps/hl8-admin/.env.local | cut -d'=' -f2)
    echo "✅ 前端环境变量文件存在"
    echo "   VITE_API_BASE_URL=$API_URL"
else
    echo "⚠️  前端环境变量文件不存在"
    echo "   请创建 apps/hl8-admin/.env.local"
fi

echo ""
echo "=== 测试完成 ==="
echo ""
echo "如果注册接口正常但前端仍有问题，请："
echo "1. 重启前端开发服务器"
echo "2. 清除浏览器缓存"
echo "3. 检查浏览器控制台的 Network 标签页"

