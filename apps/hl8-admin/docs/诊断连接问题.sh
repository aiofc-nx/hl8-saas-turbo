#!/bin/bash

echo "=== 前后端连接诊断 ==="
echo ""

echo "1. 检查后端服务状态..."
if ps aux | grep -E "nest.*admin-api" | grep -v grep > /dev/null; then
    echo "✅ 后端服务正在运行"
else
    echo "❌ 后端服务未运行"
    echo "   请运行: cd apps/admin-api && pnpm run dev"
    exit 1
fi

echo ""
echo "2. 检查后端端口..."
if curl -s http://localhost:9528/v1/auth/getUserInfo > /dev/null 2>&1; then
    echo "✅ 后端端口 9528 可达"
else
    echo "❌ 后端端口 9528 不可达"
    exit 1
fi

echo ""
echo "3. 检查前端端口..."
FRONTEND_PORT=$(netstat -tlnp 2>/dev/null | grep -E ":(5173|5174|5175|3000)" | head -1 | grep -oE ":[0-9]+" | tr -d ':')
if [ -n "$FRONTEND_PORT" ]; then
    echo "✅ 前端运行在端口: $FRONTEND_PORT"
else
    echo "⚠️  未检测到前端服务运行"
    echo "   请运行: cd apps/hl8-admin && pnpm run dev"
fi

echo ""
echo "4. 检查 CORS 配置..."
CORS_ORIGIN=$(grep "^CORS_ORIGIN" apps/admin-api/.env 2>/dev/null | cut -d'=' -f2)
if echo "$CORS_ORIGIN" | grep -q "5173"; then
    echo "✅ CORS 配置包含 5173 端口"
else
    echo "⚠️  CORS 配置可能不包含前端端口"
    echo "   当前 CORS_ORIGIN: $CORS_ORIGIN"
fi

echo ""
echo "5. 测试 CORS 预检请求..."
CORS_TEST=$(curl -s -I -H "Origin: http://localhost:5173" \
    -H "Access-Control-Request-Method: POST" \
    -X OPTIONS http://localhost:9528/v1/auth/login 2>&1 | grep -i "access-control-allow-origin")
if [ -n "$CORS_TEST" ]; then
    echo "✅ CORS 预检请求成功"
    echo "   $CORS_TEST"
else
    echo "❌ CORS 预检请求失败"
fi

echo ""
echo "6. 测试实际 API 请求..."
API_TEST=$(curl -s -X POST http://localhost:9528/v1/auth/login \
    -H "Content-Type: application/json" \
    -H "Origin: http://localhost:5173" \
    -d '{"identifier":"test123","password":"test123"}' 2>&1)
if echo "$API_TEST" | grep -q "404\|401\|422"; then
    echo "✅ API 请求可达（返回业务错误，说明服务正常）"
else
    echo "⚠️  API 请求可能有问题"
    echo "   响应: $API_TEST"
fi

echo ""
echo "7. 检查前端环境变量..."
if [ -f "apps/hl8-admin/.env.local" ]; then
    API_URL=$(grep "^VITE_API_BASE_URL" apps/hl8-admin/.env.local | cut -d'=' -f2)
    echo "✅ 前端环境变量文件存在"
    echo "   VITE_API_BASE_URL=$API_URL"
    if echo "$API_URL" | grep -q "9528"; then
        echo "   ✅ 配置了正确的端口 9528"
    else
        echo "   ❌ 端口配置可能不正确"
    fi
else
    echo "⚠️  前端环境变量文件不存在"
    echo "   请创建 apps/hl8-admin/.env.local"
fi

echo ""
echo "=== 诊断完成 ==="
echo ""
echo "如果所有检查都通过，但前端仍然无法连接，请："
echo "1. 重启前端开发服务器（重要！）"
echo "2. 清除浏览器缓存"
echo "3. 检查浏览器控制台的详细错误信息"

