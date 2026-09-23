import { defineConfig } from 'vitest/config';
import type { Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ARCADE_PREVIEW_DIR = fileURLToPath(new URL('../local-arcade-preview/arcade', import.meta.url));

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.wasm': 'application/wasm',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
  '.wav': 'audio/wav',
  '.txt': 'text/plain; charset=utf-8',
  '.lua': 'text/plain; charset=utf-8',
  '.yaml': 'text/yaml; charset=utf-8',
};

/**
 * Serve built embed games from local-arcade-preview/arcade/{gameId}/ at
 * /arcade/{gameId}/, so the whole arcade runs on this one dev server (5173).
 * /arcade/rfdgamestudio/ is left to Vite as the live arcade app.
 */
function arcadeLocalPreview(): Plugin {
  return {
    name: 'arcade-local-preview',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const path = decodeURIComponent((req.url ?? '').split('?')[0]);
        const match = /^\/arcade\/([^/]+)(\/.*)?$/.exec(path);
        if (!match || match[1] === 'rfdgamestudio') return next();

        const gameDir = join(ARCADE_PREVIEW_DIR, match[1]);
        let filePath = normalize(join(gameDir, match[2] ?? '/'));
        if (filePath !== gameDir && !filePath.startsWith(gameDir + sep)) {
          res.statusCode = 403;
          return res.end();
        }
        if (existsSync(filePath) && statSync(filePath).isDirectory()) {
          filePath = join(filePath, 'index.html');
        }
        if (!existsSync(filePath)) {
          // Client-side routes inside an embedded game fall back to its index.html.
          const fallback = join(gameDir, 'index.html');
          if (extname(filePath) || !existsSync(fallback)) return next();
          filePath = fallback;
        }
        res.setHeader('Content-Type', MIME[extname(filePath).toLowerCase()] ?? 'application/octet-stream');
        res.setHeader('X-Arcade-Source', 'local-arcade-preview');
        createReadStream(filePath).pipe(res);
      });
    },
  };
}

export default defineConfig({
  base: '/arcade/rfdgamestudio/',
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  plugins: [react() as any, tailwindcss() as any, arcadeLocalPreview()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['tests/_setup/path2dPolyfill.ts'],
    include: ['tests/**/*.{ts,tsx}', 'tests/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['tests/_shared/**', 'tests/_setup/**'],
  },
  optimizeDeps: {
    include: ['fengari-web'],
    esbuildOptions: {
      define: { global: 'globalThis' },
    },
  },
  server: {
    fs: {
      // Allow serving files from repo root (engine/, games/ directories)
      allow: ['..'],
    },
  },
});
