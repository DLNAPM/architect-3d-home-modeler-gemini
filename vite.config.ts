import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // The third parameter '' ensures we load ALL env vars, including those set in Render.com
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    define: {
      // Expose env variables to the client-side code via process.env
      // This allows accessing process.env.VITE_FIREBASE_API_KEY in the browser
      'process.env': env
    }
  }
})