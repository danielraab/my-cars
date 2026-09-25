import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import viteReact from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

const config = defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    // Emit to out/ rather than Vite's default dist/: the Dockerfile copies
    // frontend/out/ into the backend's static/out/, which the server embeds.
    build: { outDir: 'out' },
    resolve: { tsconfigPaths: true },
    server: {
      proxy: {
        '/api': env.VITE_BACKEND_ORIGIN || 'http://localhost:8080',
      },
    },
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
    },
    plugins: [
      tailwindcss(),
      tanstackRouter({ target: 'react', autoCodeSplitting: true }),
      viteReact(),
    ],
  }
})

export default config
