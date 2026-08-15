import { defineConfig } from 'vite';

export default defineConfig({
  root: 'src/standalone/technique_showcase',
  server: {
    port: 5173,
    open: true,
  },
});
