import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('face-api.js')) {
              return 'vendor-face-api'
            }
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
              return 'vendor-react'
            }
            return 'vendor-core'
          }
        }
      }
    },
    chunkSizeWarningLimit: 1000
  },
  server: {
    port: 5173,
  }
})
