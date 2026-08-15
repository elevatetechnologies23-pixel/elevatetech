import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  define: {
    // In production builds (Vercel), always use the correct backend URL.
    // This overrides any misconfigured Vercel environment variable.
    ...(mode === 'production' && {
      'import.meta.env.VITE_API_URL': JSON.stringify('https://elevate-backend-2vpy.onrender.com/api/v1'),
    }),
  },
}))

