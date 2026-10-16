import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // CAISO's CSVs don't allow cross-origin browser requests, so we proxy them.
    // netlify.toml does the same in production.
    proxy: {
      '/caiso': {
        target: 'https://www.caiso.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/caiso/, '/outlook/current'),
      },
    },
  },
})
