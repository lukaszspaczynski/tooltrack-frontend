import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Everything under /api is forwarded to the Node API, so the browser talks
    // to one origin in development. That is what makes the session cookie work
    // without CORS: a cross-origin cookie needs an allowlisted origin, SameSite
    // handling and credentials on every call, and none of it is worth carrying
    // when a proxy removes the problem. The backend's allowlist still exists
    // for a deployment that really does split the origins.
    proxy: {
      '/api': {
        target: process.env.VITE_API_PROXY_TARGET ?? 'http://localhost:37411',
        changeOrigin: false,
      },
    },
  },
})
