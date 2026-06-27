import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { copyFileSync, mkdirSync, existsSync } from 'fs';
import path from 'path';

export default defineConfig({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  plugins: [
    react() as any,
    {
      name: 'copy-lua-files',
      writeBundle() {
        const outDir = path.resolve(__dirname, 'dist');
        const srcDir = path.resolve(__dirname, 'src');

        // Copy engine primitives
        const enginePrimitivesDir = path.join(srcDir, 'engine', 'primitives');
        const outEnginePrimitivesDir = path.join(outDir, 'engine', 'primitives');
        if (existsSync(enginePrimitivesDir)) {
          mkdirSync(outEnginePrimitivesDir, { recursive: true });
          const files = ['action.lua', 'entity.lua', 'resolution.lua', 'consequence.lua', 'movement.lua', 'physics.lua', 'lifecycle.lua'];
          files.forEach(file => {
            const src = path.join(enginePrimitivesDir, file);
            const dest = path.join(outEnginePrimitivesDir, file);
            if (existsSync(src)) copyFileSync(src, dest);
          });
        }

        // Copy game Lua files
        const gamesDir = path.join(srcDir, 'games');
        const outGamesDir = path.join(outDir, 'games');
        if (existsSync(gamesDir)) {
          const gameIds = ['horse_racing', 'slither_rogue'];
          gameIds.forEach(gameId => {
            const gameSrcDir = path.join(gamesDir, gameId);
            const gameOutDir = path.join(outGamesDir, gameId);
            if (existsSync(gameSrcDir)) {
              mkdirSync(gameOutDir, { recursive: true });
              const luaFiles = ['logic.lua', 'data.yaml', 'ui.yaml', 'systems.yaml', 'utils.lua', 'state.lua', 'physics.lua', 'collision.lua', 'render.lua'];
              luaFiles.forEach(file => {
                const src = path.join(gameSrcDir, file);
                const dest = path.join(gameOutDir, file);
                if (existsSync(src)) copyFileSync(src, dest);
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
