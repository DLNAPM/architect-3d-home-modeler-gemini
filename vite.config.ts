import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Vite automatically loads VITE_* variables from .env files into import.meta.env
  // No need for manual define or process polyfills for this standard usage.
})