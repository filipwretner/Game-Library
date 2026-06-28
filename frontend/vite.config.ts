import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Proxy target: localhost for native dev, the `backend` service inside Docker.
const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:3001';

// Vite dev server proxies /api to the backend (spec §10), so the frontend only
// ever talks to its own origin.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': { target: BACKEND_URL, changeOrigin: true },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
});
