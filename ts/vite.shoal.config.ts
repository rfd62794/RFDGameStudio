import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  base: './',
  plugins: [react() as any, tailwindcss() as any],
  define: {
    'import.meta.env.VITE_STANDALONE': JSON.stringify('true'),
    'import.meta.env.VITE_ARCADE_BASE_URL': JSON.stringify('https://rfditservices.com/games/rfdgamestudio/'),
  },
  build: {
    outDir: 'dist-shoal',
    emptyOutDir: true,
    rollupOptions: {
      input: { index: path.resolve('src/standalone/shoal/index.html') },
    },
  },
  optimizeDeps: {
    include: ['fengari-web'],
    esbuildOptions: {
      define: { global: 'globalThis' },
    },
  },
  server: {
    fs: {
      allow: ['..'],
    },
  },
});
