import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    allowedHosts: [
      '.augmentusercontent.com',
      'localhost',
      '127.0.0.1',
    ],
    proxy: {
      '/api/v1/auth': { target: 'http://127.0.0.1:3001', changeOrigin: true },
      '/api/v1/patients': { target: 'http://127.0.0.1:3010', changeOrigin: true },
    },
  },
  preview: {
    host: true,
    proxy: {
      '/api/v1/auth': { target: 'http://127.0.0.1:3001', changeOrigin: true },
      '/api/v1/patients': { target: 'http://127.0.0.1:3010', changeOrigin: true },
    },
  },
})
