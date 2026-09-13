import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  root: 'src/standalone/character_viewer',
  plugins: [react() as any],
  // Same output location as every other standalone game (ts/dist-{gameId});
  // without this Vite wrote to src/standalone/character_viewer/dist.
  build: {
    outDir: '../../../dist-character_viewer',
    emptyOutDir: true,
  },
  server: {
    port: 5210,
    open: true,
  },
  resolve: {
    alias: {
      '@engine': '/src/engine',
    },
  },
});
