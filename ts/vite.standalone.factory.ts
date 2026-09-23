import type { UserConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

function getDirname(): string {
  const url = import.meta.url;
  if (url && url.startsWith('file:')) {
    return fileURLToPath(new URL('.', url));
  }
  return process.cwd();
}
const __dirname = getDirname();

function copyGameAssetsPlugin(gameId: string): Plugin {
  return {
    name: 'copy-game-assets',
    writeBundle: {
      sequential: true,
      order: 'post',
      async handler() {
        const repoRoot = path.resolve(__dirname, '..');
        const outDir = path.resolve(__dirname, 'dist-' + gameId);

        function copyDir(src: string, dest: string) {
          if (!fs.existsSync(src)) return;
          fs.mkdirSync(path.dirname(dest), { recursive: true });
          fs.cpSync(src, dest, { recursive: true, force: true, dereference: true });
        }

        copyDir(
          path.join(repoRoot, 'games', gameId),
          path.join(outDir, 'games', gameId)
        );
        copyDir(
          path.join(repoRoot, 'engine', 'primitives'),
          path.join(outDir, 'engine', 'primitives')
        );
        copyDir(
          path.join(repoRoot, 'engine', 'systems'),
          path.join(outDir, 'engine', 'systems')
        );

        console.log(`[copy-game-assets] copied runtime assets for ${gameId} to ${outDir}`);
      },
    },
  };
}

export function makeStandaloneConfig(gameId: string): UserConfig {
  return {
    base: './',
    root: path.resolve(__dirname, 'src', 'standalone', gameId),
    plugins: [react() as any, tailwindcss() as any, copyGameAssetsPlugin(gameId)],
    define: {
      'import.meta.env.VITE_STANDALONE': JSON.stringify('true'),
      'import.meta.env.VITE_ARCADE_BASE_URL': JSON.stringify(
        'https://rfditservices.com/arcade/rfdgamestudio/'
      ),
    },
    build: {
      outDir: path.resolve(__dirname, 'dist-' + gameId),
      emptyOutDir: true,
    },
    optimizeDeps: {
      include: ['fengari-web'],
      esbuildOptions: {
        define: { global: 'globalThis' },
      },
    },
    server: {
      fs: {
        allow: [path.resolve(__dirname, '..')],
      },
    },
  };
}
