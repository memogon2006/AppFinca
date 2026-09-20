import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/recharts')) {
            return 'vendor-charts';
          }
          if (id.includes('node_modules/dexie')) {
            return 'vendor-db';
          }
          if (id.includes('node_modules/xlsx-js-style')) {
            return 'vendor-export';
          }
          if (id.includes('node_modules/lucide-react')) {
            return 'vendor-icons';
          }
        }
      }
    }
  }
})
