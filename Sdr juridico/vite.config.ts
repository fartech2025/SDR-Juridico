import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [tailwindcss(), react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
    extensions: ['.tsx', '.ts', '.jsx', '.js', '.mjs', '.json'],
    dedupe: ['react', 'react-dom'],
  },
  // ===== BUILD OTIMIZADO PARA PRODUÇÃO =====
  build: {
    target: 'es2020',
    minify: 'esbuild',
    cssMinify: true,
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Separar vendors por pasta
          if (id.includes('node_modules')) {
            if (id.includes('react-dom') || id.includes('react-router')) {
              return 'react-vendor'
            }
            if (id.includes('@supabase')) {
              return 'supabase'
            }
            if (id.includes('recharts') || id.includes('d3')) {
              return 'charts'
            }
            if (id.includes('lucide-react')) {
              return 'icons'
            }
            if (id.includes('date-fns')) {
              return 'utils'
            }
          }
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    chunkSizeWarningLimit: 600,
    reportCompressedSize: true,
  },
  // ===== OTIMIZAÇÕES DE DEPENDÊNCIAS =====
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@supabase/supabase-js',
      'lucide-react',
      'date-fns',
      'recharts',
    ],
    exclude: ['@vite/client'],
  },
  // ===== CONFIGURAÇÃO DO SERVIDOR DE DEV =====
  server: {
    proxy: {
      '/api-datajud': {
        target: 'https://api-publica.datajud.cnj.jus.br',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-datajud/, ''),
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('proxy error', err)
          })
          proxy.on('proxyReq', (_proxyReq, req, _res) => {
            console.log('Sending Request to the Target:', req.method, req.url)
          })
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Received Response from the Target:', proxyRes.statusCode, req.url)
          })
        },
      },
    },
  },
})
