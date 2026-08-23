import { defineConfig, type Plugin } from 'vite';
import { makeStandaloneConfig } from './vite.standalone.factory';

/**
 * Vite plugin that preserves the Y8 SDK external script tag through the
 * build. Vite strips non-module external scripts during HTML processing;
 * this plugin re-injects the tag into the built index.html so it survives
 * in dist-shoal/index.html.
 *
 * The tag is also present in the source template (src/standalone/shoal/
 * index.html) — this plugin ensures it reaches the built output too.
 */
function preserveY8ScriptTag(): Plugin {
  const y8ScriptTag = '<script src="https://cdn.y8.com/minimal-sdk/2-0/y8.min.js" async></script>';
  return {
    name: 'preserve-y8-script',
    transformIndexHtml: {
      order: 'post',
      handler(html: string): string {
        if (html.includes('cdn.y8.com')) return html;
        // Inject into <head>, before the first bundled script tag.
        return html.replace(
          /(<head>[\s\S]*?)(<script type="module")/,
          `$1${y8ScriptTag}\n    $2`,
        );
      },
    },
  };
}

const baseConfig = makeStandaloneConfig('shoal');

export default defineConfig({
  ...baseConfig,
  plugins: [...(baseConfig.plugins ?? []), preserveY8ScriptTag()],
});
