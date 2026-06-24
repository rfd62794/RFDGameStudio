import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
  },
  assetsInclude: ['**/*.lua'],
  optimizeDeps: {
    exclude: ['fengari-web'],
  },
});
