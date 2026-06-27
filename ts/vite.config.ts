import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { copyFileSync, mkdirSync, existsSync, readdirSync } from 'fs';
import path from 'path';

export default defineConfig({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  plugins: [
    react() as any,
    {
      name: 'copy-lua-files',
      writeBundle() {
        const outDir = path.resolve(__dirname, 'dist');
        const repoRoot = path.resolve(__dirname, '..');

        // Copy engine primitives
        const enginePrimitivesDir = path.join(repoRoot, 'engine', 'primitives');
        const outEnginePrimitivesDir = path.join(outDir, 'engine', 'primitives');
        if (existsSync(enginePrimitivesDir)) {
          mkdirSync(outEnginePrimitivesDir, { recursive: true });
          const files = readdirSync(enginePrimitivesDir);
          files.forEach(file => {
            if (file.endsWith('.lua')) {
              copyFileSync(path.join(enginePrimitivesDir, file), path.join(outEnginePrimitivesDir, file));
            }
          });
        }

        // Copy game Lua/YAML files
        const gamesDir = path.join(repoRoot, 'games');
        const outGamesDir = path.join(outDir, 'games');
        if (existsSync(gamesDir)) {
          const gameIds = ['horse_racing', 'slither_rogue'];
          gameIds.forEach(gameId => {
            const gameSrcDir = path.join(gamesDir, gameId);
            const gameOutDir = path.join(outGamesDir, gameId);
            if (existsSync(gameSrcDir)) {
              mkdirSync(gameOutDir, { recursive: true });
              const files = readdirSync(gameSrcDir);
              files.forEach(file => {
                if (file.endsWith('.lua') || file.endsWith('.yaml')) {
                  copyFileSync(path.join(gameSrcDir, file), path.join(gameOutDir, file));
                }
              });
            }
          });
        }
      },
    },
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['tests/**/*.{ts,tsx}', 'tests/**/*.{test,spec}.{ts,tsx}'],
  },
  assetsInclude: ['**/*.lua', '**/*.yaml'],
  optimizeDeps: {
    include: ['fengari-web'],
    esbuildOptions: {
      define: { global: 'globalThis' },
    },
  },
});
