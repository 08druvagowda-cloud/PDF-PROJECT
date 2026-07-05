import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // During local development: forward all /api/* requests to the
      // Spring Boot backend. In production, React is served by Spring Boot
      // itself on the same origin, so relative /api paths work directly.
      '/api': {
        target: 'http://localhost:8081',
        changeOrigin: true,
      },
    },
  },
})
