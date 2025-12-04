#!/bin/bash

# 加载nvm
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# 检查并安装Node 18（如果还没有）
if ! nvm list | grep -q "v18"; then
    echo "正在安装Node.js 18..."
    nvm install 18
fi

# 使用Node 18
nvm use 18

# 检查Node版本
echo "当前Node版本: $(node -v)"
echo ""

# 启动后端服务器（后台）
echo "正在启动后端服务器..."
cd server
node index.js &
BACKEND_PID=$!
cd ..

# 等待后端启动
sleep 2

# 启动前端服务器
echo "正在启动前端服务器..."
cd client
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "=========================================="
echo "✅ 服务器已启动！"
echo "=========================================="
echo "后端: http://localhost:3001"
echo "前端: http://localhost:3000"
echo ""
echo "按 Ctrl+C 停止服务器"
echo "=========================================="

# 等待用户中断
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM
wait

