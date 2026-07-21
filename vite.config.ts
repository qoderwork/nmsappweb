import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  // 后端地址：优先读 .env.development 中的 VITE_API_BASE_URL，默认 http://localhost:8080
  const apiBaseUrl = env.VITE_API_BASE_URL || 'http://localhost:8080'
  const wsBaseUrl = apiBaseUrl.replace(/^http/, 'ws')

  return {
    build: {
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              // echarts（最大，优先拆出）
              if (id.includes('echarts') || id.includes('zrender')) {
                return 'echarts';
              }
              // element-plus
              if (id.includes('element-plus') || id.includes('@element-plus/icons-vue')) {
                return 'element-plus';
              }
              // vue 生态（排除已在 element-plus 内部的 @vueuse）
              if (id.includes('/vue/') || id.includes('vue-router') || id.includes('pinia')) {
                return 'vue-vendor';
              }
              // 其他第三方库
              return 'vendor';
            }
          },
        },
      },
    },
    plugins: [
      vue(),
      AutoImport({
        imports: ['vue', 'vue-router', 'pinia'],
        resolvers: [ElementPlusResolver()],
        dts: 'src/auto-imports.d.ts',
        eslintrc: { enabled: true },
      }),
      Components({
        resolvers: [ElementPlusResolver()],
        dts: 'src/components.d.ts',
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 5173,
      host: '0.0.0.0',
      proxy: {
        '/api': {
          target: apiBaseUrl,
          changeOrigin: true,
          secure: false,
        },
        '/ws': {
          target: wsBaseUrl,
          ws: true,
          changeOrigin: true,
        },
        '/webssh': {
          target: wsBaseUrl,
          ws: true,
          changeOrigin: true,
        },
        '/acs-file-server': {
          target: apiBaseUrl,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  }
})
