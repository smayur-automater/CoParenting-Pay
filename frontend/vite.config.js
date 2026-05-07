import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: { '/_/backend': { target: 'http://localhost:4000', rewrite: (path) => path.replace(/^\/_\/backend/, '') } },
  },
  build: { outDir: 'dist' },
});
