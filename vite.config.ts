import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import path from 'path'

export default defineConfig(({ command }) => {
  if (command === 'serve') {
    // fix render twice in dev-StrictMode
    process.env.NODE_ENV = 'production'
  }

  return {
    plugins: [
      nodePolyfills({
        globals: {
          Buffer: true,
        },
      }),
      react(),
    ],
    server: {
      port: 3826,
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  }
})
