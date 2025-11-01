import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// Opcional: plugin de visualização de bundle (ativo quando ANALYZE=true)
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig(({ command, mode }) => ({
  plugins: [
    react(),
    // Ativa o visualizer apenas quando variável de ambiente ANALYZE for 'true'
    ...(process.env.ANALYZE === 'true' ? [visualizer({ filename: 'dist/bundle-visualizer.html', template: 'treemap' })] : [])
  ],
  resolve: { 
    alias: { 
      '@': path.resolve(__dirname, './src') 
    } 
  },
  base: '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    // Manual chunking to keep large 3rd-party libraries out of the initial bundle
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules')) {
            if (id.includes('recharts')) return 'vendor-recharts'
            if (id.includes('@supabase')) return 'vendor-supabase'
            if (id.includes('redux') || id.includes('reselect') || id.includes('redux-thunk')) return 'vendor-redux'
            if (id.includes('victory') || id.includes('d3')) return 'vendor-charts'
            // fallback vendors chunk
            return 'vendor'
          }
        }
      }
    },
  },
  server: {
    port: 5173,
    host: true
  }
}))
