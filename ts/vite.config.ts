import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  plugins: [react() as any],
  resolve: {
    alias: {
      'fengari-web': path.resolve(__dirname, 'src/fengari-shim.js'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['tests/**/*.{ts,tsx}', 'tests/**/*.{test,spec}.{ts,tsx}'],
    alias: {
      'fengari-web': path.resolve(__dirname, 'src/fengari-shim.js'),
    },
  },
  assetsInclude: ['**/*.lua'],
  optimizeDeps: {
    include: ['fengari-web'],
  },
});
