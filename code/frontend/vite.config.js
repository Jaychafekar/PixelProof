import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const isVercelBuild =
    mode === 'vercel' ||
    process.env.VERCEL === '1' ||
    process.env.VERCEL === 'true'

  return {
    plugins: [
      // The React and Tailwind plugins are both required for Make, even if
      // Tailwind is not being actively used - do not remove them.
      react(),
      tailwindcss(),
    ],
    root: 'public',
    server: {
      host: '127.0.0.1',
      port: 5173,
      proxy: {
        '/analyze': 'http://127.0.0.1:8000',
        '/health': 'http://127.0.0.1:8000',
        '/api': 'http://127.0.0.1:8000',
        '/docs': 'http://127.0.0.1:8000',
        '/openapi.json': 'http://127.0.0.1:8000',
        '/verify-report': 'http://127.0.0.1:8000',
      },
    },
    build: {
      // Vercel needs a frontend-local output directory it can serve directly.
      // The backend/static target is still used for local Docker and backend packaging.
      outDir: isVercelBuild
        ? path.resolve(__dirname, 'dist')
        : path.resolve(__dirname, '../backend/static'),
      emptyOutDir: true,
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './public/src'),
      },
    },

    // File types to support raw imports. Never add .css, .tsx, or .ts files here.
    assetsInclude: ['**/*.svg', '**/*.csv'],
  }
})
