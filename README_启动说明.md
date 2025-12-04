# 项目启动说明

## 🚀 快速启动（纯前端模式 - 推荐）

### 方法一：使用启动脚本

```bash
cd 项目目录
./start-frontend.sh
```

### 方法二：手动启动

1. **安装依赖**（如果还没安装）：
```bash
cd client
npm install
```

2. **创建环境变量文件**：
```bash
# 在 client 目录下创建 .env.local
echo "VITE_USE_LOCAL_STORAGE=true" > .env.local
```

3. **启动开发服务器**：
```bash
npm run dev
```

4. **访问应用**：
- 打开浏览器访问：http://localhost:5173

## 🔧 使用后端模式（可选）

如果需要使用后端：

1. **启动后端**（新终端窗口）：
```bash
cd server
npm install
node index.js
```

2. **配置前端**：
- 删除或注释掉 `client/.env.local` 中的 `VITE_USE_LOCAL_STORAGE=true`

3. **启动前端**（另一个新终端窗口）：
```bash
cd client
npm run dev
```

4. **访问应用**：
- 前端：http://localhost:5173
- 后端API：http://localhost:3001

## 📝 重要说明

- ✅ **纯前端模式**：数据存储在浏览器 localStorage 中，不需要后端
- ✅ **默认密码**：所有用户的默认密码是 `1234567`
- ✅ **自动注册**：使用默认密码登录不存在的用户会自动创建账号
- ✅ **英雄账号**：使用英雄名称登录（如"阿狸"）会自动创建/登录该英雄账号
- ✅ **数据持久化**：localStorage 数据会持久保存，除非清除浏览器数据

## 🎯 快速测试

1. 访问 http://localhost:5173
2. 点击"注册"或"登录"
3. 输入任意用户名和密码 `1234567`
4. 如果用户不存在，会自动创建账号
5. 开始使用！

## 🆘 常见问题

### Q: 页面空白？
A: 检查浏览器控制台是否有错误，清除缓存后重新加载。

### Q: API 请求失败？
A: 确认 `client/.env.local` 存在且包含 `VITE_USE_LOCAL_STORAGE=true`，然后重启开发服务器。

### Q: 数据丢失？
A: 检查是否使用了无痕模式，或清除了浏览器数据。
