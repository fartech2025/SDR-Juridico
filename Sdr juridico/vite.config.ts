import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'node:url'
import { spawn } from 'node:child_process'
import path from 'node:path'

/** Inicia o scraper-server automaticamente junto com o dev server do Vite */
function scraperServerPlugin(): Plugin {
  return {
    name: 'scraper-server-auto',
    apply: 'serve', // apenas em dev, não no build
    configureServer(server) {
      const scraperDir = path.resolve(fileURLToPath(new URL('.', import.meta.url)), '../scraper-server')

      console.log('\x1b[36m[scraper] Iniciando servidor local (porta 3001)...\x1b[0m')

      const scraperProcess = spawn('npm', ['start'], {
        cwd: scraperDir,
        stdio: 'pipe',
        shell: true,
      })

      scraperProcess.stdout?.on('data', (data: Buffer) => {
        process.stdout.write(`\x1b[36m[scraper]\x1b[0m ${data}`)
      })
      scraperProcess.stderr?.on('data', (data: Buffer) => {
        process.stderr.write(`\x1b[33m[scraper]\x1b[0m ${data}`)
      })
      scraperProcess.on('error', (err: Error) => {
        console.error('\x1b[31m[scraper] Erro ao iniciar:\x1b[0m', err.message)
      })
      scraperProcess.on('exit', (code: number | null) => {
        if (code !== 0 && code !== null) {
          console.warn(`\x1b[33m[scraper] Encerrou com código ${code}\x1b[0m`)
        }
      })

      // Encerrar scraper junto com o Vite
      server.httpServer?.on('close', () => scraperProcess.kill())
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [tailwindcss(), react()], // scraperServerPlugin() desativado (scraper-server já rodando na porta 3001)
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
      'recharts',
    ],
    exclude: ['@vite/client'],
  },
  // ===== CONFIGURAÇÃO DO SERVIDOR DE DEV =====
  server: {
    proxy: {
      // Proxy para o scraper local (Node.js server na porta 3001)
      '/scraper-api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/scraper-api/, ''),
      },
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
