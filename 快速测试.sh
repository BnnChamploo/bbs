#!/bin/bash

# 快速测试脚本 - 纯前端模式

echo "🚀 启动本地测试（纯前端模式）"
echo ""

# 检查是否在正确的目录
if [ ! -d "client" ]; then
    echo "❌ 错误：请在项目根目录运行此脚本"
    exit 1
fi

# 创建 .env.local 文件
echo "📝 创建环境变量文件..."
cat > client/.env.local << EOF
VITE_USE_LOCAL_STORAGE=true
EOF

echo "✅ 环境变量已配置"
echo ""
echo "📦 检查依赖..."
cd client

# 检查 node_modules
if [ ! -d "node_modules" ]; then
    echo "📥 安装依赖..."
    npm install
else
    echo "✅ 依赖已安装"
fi

echo ""
echo "🎉 准备就绪！"
echo ""
echo "启动开发服务器..."
echo "访问地址：http://localhost:3000"
echo ""
echo "按 Ctrl+C 停止服务器"
echo ""

npm run dev


