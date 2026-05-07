import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react()],
  root: __dirname,
  css: {
    postcss: resolve(__dirname, 'postcss.config.js'),
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
})
