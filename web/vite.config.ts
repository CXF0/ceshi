import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    // 这里的 host 设置为 true 可以方便在局域网内预览
    host: true,
    port: 5173,
    proxy: {
      /**
       * 匹配所有以 /api 开头的请求 (后端接口)
       */
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        // 如果后端配置了 GlobalPrefix('api')，这里保持默认即可
      },
      /**
       * ✨ 新增：匹配所有以 /static 开头的请求 (合同附件/图片)
       * 这样预览 http://localhost:5173/static/... 时会转发到 3000 端口，不再跳转首页
       */
      '/static': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      // 方便你使用 @/components 等路径导入
      '@': '/src',
    },
  },
})