import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Never ship source maps to production (catalog/IP lives in the bundle).
    sourcemap: false,
    minify: true,
    cssMinify: true,
    reportCompressedSize: false,
    chunkSizeWarningLimit: 900,
  },
  server: {
    proxy: {
      // Local PHP API (php -S localhost:8080 -t api api/index.php)
      '/api': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
