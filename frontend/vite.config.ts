import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(),
    VitePWA({
      injectRegister: 'auto',
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'favicon.ico', 'robots.txt', 'adaptive-icon.png'],
      manifest: {
        name: 'Xugou 监控系统',
        short_name: 'Xugou',
        description: '服务器和网站监控系统',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'android-chrome-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'android-chrome-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'android-chrome-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    }),
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: true,
        // 如果后端 API 不包含 /api 前缀，可以重写路径
        // rewrite: (path) => path.replace(/^\/api/, '')
      },
      // 如果需要代理其他路径，可以添加更多配置
    },
    // 如果需要指定前端开发服务器端口
    port: 5173,
  },
})
