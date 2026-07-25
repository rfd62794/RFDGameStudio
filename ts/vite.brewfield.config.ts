import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  base: './',
  root: path.resolve(__dirname, 'src/standalone/brewfield'),
  plugins: [react() as any, tailwindcss() as any],
  define: {
    'import.meta.env.VITE_STANDALONE': JSON.stringify('true'),
    'import.meta.env.VITE_ARCADE_BASE_URL': JSON.stringify('https://rfditservices.com/games/rfdgamestudio/'),
  },
  build: {
    outDir: path.resolve(__dirname, 'dist-brewfield'),
    emptyOutDir: true,
  },
  optimizeDeps: {
    include: ['fengari-web'],
    esbuildOptions: {
      define: { global: 'globalThis' },
    },
  },
  server: {
    fs: {
      allow: [path.resolve(__dirname, '..')],
    },
  },
});
