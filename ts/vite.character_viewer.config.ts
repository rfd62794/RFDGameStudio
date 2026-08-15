import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  root: 'src/standalone/character_viewer',
  plugins: [react() as any],
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
