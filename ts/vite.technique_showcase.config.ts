import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  root: 'src/standalone/technique_showcase',
  plugins: [react() as any],
  server: {
    port: 5173,
    open: true,
  },
});
