import { defineConfig } from 'vitest/config';
import path from 'path';

// Vitest floor for PlanetOfGreed Phase 3 (Engine Hardening).
// Mirrors vite.config.ts's `@` alias so source imports resolve the same
// way under test as under the real build.
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    globals: false,
  },
});
