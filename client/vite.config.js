import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 部署时的 base path
// - Vercel: 使用 '/'（自定义域名或 vercel.app 域名）
// - GitHub Pages（自定义域名）: 使用 '/'
// - GitHub Pages（默认域名）: 使用 '/仓库名/'
// 可以通过环境变量 VITE_BASE_PATH 覆盖
const base = process.env.VITE_BASE_PATH || 
  (process.env.VERCEL 
    ? '/' // Vercel 部署时使用根路径
    : process.env.GITHUB_REPOSITORY 
      ? `/${process.env.GITHUB_REPOSITORY.split('/')[1]}/` 
      : '/');

export default defineConfig({
  base: base,
  plugins: [react()],
  server: {
    port: 5173, // 使用 Vite 默认端口，避免与3000端口冲突
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  }
})

