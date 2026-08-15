import { defineConfig } from 'vite';

export default defineConfig({
  root: 'src/standalone/technique_comparison',
  server: {
    port: 5200,
    open: true,
  },
});
