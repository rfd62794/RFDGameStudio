import { defineConfig } from 'vite';

export default defineConfig({
  root: 'src/standalone/bezier_poc',
  server: {
    port: 5199,
    open: true,
  },
});
