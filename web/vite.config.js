import react from '@vitejs/plugin-react';
import {defineConfig, transformWithEsbuild} from 'vite';
import pkg from '@douyinfe/vite-plugin-semi';

const {vitePluginSemi} = pkg;

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    {
      // 强制将 .js 文件当作 .jsx 文件处理
      name: 'treat-js-files-as-jsx',
      async transform(code, id) {
        if (!/src\/.*\.js$/.test(id)) {
          return null;
        }

        // Use the exposed transform from vite, instead of directly
        // transforming with esbuild
        return transformWithEsbuild(code, id, {
          loader: 'jsx',
          jsx: 'automatic',
        });
      },
    },
    // react 插件
    react(),
    // 字节开源 UI 库
    vitePluginSemi({
      // 启用 css @layer 规则
      cssLayer: true
    })
  ],
  // 依赖优化选项
  optimizeDeps: {
    // 设置为 true 可以强制依赖预构建，而忽略之前已经缓存过的、已经优化过的依赖。
    force: true,
    // 在依赖扫描和优化过程中传递给 esbuild 的选项。
    esbuildOptions: {
      loader: {
        '.js': 'jsx',
        '.json': 'json',
      },
    },
  },
  build: {
    // rollup 打包配置
    rollupOptions: {
      output: {
        // 创建自定义的公共 chunk
        manualChunks: {
          // 将 react、react-dom、react-router-dom 合并到 react-core.js
          'react-core': ['react', 'react-dom', 'react-router-dom'],
          'semi-ui': ['@douyinfe/semi-icons', '@douyinfe/semi-ui'],
          visactor: ['@visactor/react-vchart', '@visactor/vchart'],
          tools: ['axios', 'history', 'marked'],
          'react-components': [
            'react-dropzone',
            'react-fireworks',
            'react-telegram-login',
            'react-toastify',
            'react-turnstile',
          ],
          i18n: [
            'i18next',
            'react-i18next',
            'i18next-browser-languagedetector',
          ],
        },
      },
    },
  },
  // 仅针对开发环境
  server: {
    // 监听哪个 IP 地址， 0.0.0.0 监听所有
    // cli 可以通过 --host 0.0.0.0 来设置
    host: '0.0.0.0',
    // 配置自定义代理规则，接收 {key:options} 对象
    // uri 以 key 开头的请求将被代理到对应的 target 字段
    // key 以 ^ 开头表示使用 regexp 匹配
    proxy: {
      // 简单写法
      '/foo': 'http://localhost:4567',
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/mj': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/pg': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      // websocket
      '/socket.io': {
        target: 'ws://localhost:9981',
        ws: true,
        rewriteWsOrigin: true
      }
    },
  },
});
