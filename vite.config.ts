/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['vite.svg'],
      manifest: {
        name: 'DocEditor - 在线文档编辑器',
        short_name: 'DocEditor',
        description: '为翻译人员设计的专业文档编辑器',
        theme_color: '#3b82f6',
        icons: [
          {
            src: 'vite.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https?:\/\/localhost:5000\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24,
              },
            },
          },
        ],
      },
    }),
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
    fs: {
      deny: ['github项目/**'],
    },
  },
  optimizeDeps: {
    include: ['pdfjs-dist'],
    exclude: ['github项目'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'tiptap': [
            '@tiptap/core',
            '@tiptap/react',
            '@tiptap/starter-kit',
          ],
          'pdf': [
            'pdfjs-dist',
            'pdf-lib',
            'html2pdf.js',
          ],
          'office': [
            'docx',
            'mammoth',
            'turndown',
            'marked',
          ],
          'vendor': [
            'react',
            'react-dom',
            'idb',
          ],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true,
    include: ['src/**/*.{test,spec}.{js,ts,tsx}'],
    exclude: ['node_modules/', 'dist/', 'tests/', 'github项目/'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'src/test/', 'github项目/'],
    },
  },
})
