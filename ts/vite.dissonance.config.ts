import path from 'path';
import fs from 'fs';
import type { Plugin } from 'vite';
import { makeStandaloneConfig } from './vite.standalone.factory';

function copyDissonanceAssetsPlugin(): Plugin {
  return {
    name: 'copy-dissonance-assets',
    writeBundle: {
      sequential: true,
      order: 'post',
      async handler() {
        const src = path.resolve(__dirname, 'public', 'assets', 'dissonance');
        const dest = path.resolve(__dirname, 'dist-dissonance', 'assets', 'dissonance');
        if (!fs.existsSync(src)) return;
        fs.mkdirSync(dest, { recursive: true });
        fs.cpSync(src, dest, { recursive: true, force: true, dereference: true });
        console.log(`[copy-dissonance-assets] copied ${src} -> ${dest}`);
      },
    },
  };
}

const config = makeStandaloneConfig('dissonance');

export default {
  ...config,
  plugins: [...(config.plugins ?? []), copyDissonanceAssetsPlugin()],
};
