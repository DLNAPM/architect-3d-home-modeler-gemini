import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  // FIX: Cast `process` to `any` to resolve TypeScript type error for 'cwd'.
  const env = loadEnv(mode, (process as any).cwd(), '');
  return {
    plugins: [react()],
    resolve: {
      alias: {
        // __dirname is not available in ES modules by default.
        // path.resolve will use the current working directory, which is the project root.
        // FIX: Replaced `__dirname` with a relative path to work in ES modules.
        '@': path.resolve('./src'),
      },
    },
    define: {
      'process.env.API_KEY': JSON.stringify(env.API_KEY)
    }
  }
})