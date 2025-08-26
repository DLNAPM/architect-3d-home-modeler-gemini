import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Fix: __dirname is not available in ES modules by default.
      // path.resolve will use the current working directory, which is the project root.
      '@': path.resolve('./src'),
    },
  },
})