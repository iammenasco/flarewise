import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const repoBase = process.env.VITE_BASE ?? '/'

export default defineConfig({
  base: repoBase,
  define: {
    __APP_BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
  plugins: [react(), tailwindcss()],
})
