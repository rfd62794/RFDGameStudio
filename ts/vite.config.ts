import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  base: '/arcade/rfdgamestudio/',
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  plugins: [react() as any, tailwindcss() as any],
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['tests/**/*.{ts,tsx}', 'tests/**/*.{test,spec}.{ts,tsx}'],
  },
  optimizeDeps: {
    include: ['fengari-web'],
    esbuildOptions: {
      define: { global: 'globalThis' },
    },
  },
  server: {
    fs: {
      // Allow serving files from repo root (engine/, games/ directories)
      allow: ['..'],
    },
  },
});
