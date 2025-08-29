import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  // FIX: Replaced process.cwd() with '.' to resolve a TypeScript typing issue where 'cwd' is not found on the 'Process' type. Vite resolves '.' relative to the config file, which is the project root, achieving the same result.
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react()],
    resolve: {
      alias: {
        // Fix: __dirname is not available in ES modules by default.
        // path.resolve will use the current working directory, which is the project root.
        '@': path.resolve('./src'),
      },
    },
    define: {
      'process.env.API_KEY': JSON.stringify(env.API_KEY)
    }
  }
})