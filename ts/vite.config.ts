import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  plugins: [react() as any],
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['tests/**/*.{ts,tsx}', 'tests/**/*.{test,spec}.{ts,tsx}'],
  },
  assetsInclude: ['**/*.lua'],
  optimizeDeps: {
    include: ['fengari-web'],
    esbuildOptions: {
      define: { global: 'globalThis' },
    },
  },
});
