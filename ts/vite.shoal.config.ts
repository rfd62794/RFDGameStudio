import { defineConfig, type Plugin } from 'vite';
import { makeStandaloneConfig } from './vite.standalone.factory';

/**
 * Vite plugin that injects the Y8 SDK external script tag into the built
 * index.html — but ONLY when the build mode is 'y8' (build:shoal:y8).
 *
 * This ensures the Y8 SDK script tag reaches the Y8-targeted build
 * while keeping it out of the itch/arcade build (build:shoal), which
 * should not load Y8's third-party SDK.
 *
 * The source template (src/standalone/shoal/index.html) no longer
 * contains the script tag directly — it is injected here, conditionally.
 */
function preserveY8ScriptTag(isY8Build: boolean): Plugin {
  const y8ScriptTag = '<script src="https://cdn.y8.com/minimal-sdk/2-0/y8.min.js" async></script>';
  return {
    name: 'preserve-y8-script',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(html: string): string {
        if (!isY8Build) return html;
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

export default defineConfig(({ mode }) => ({
  ...baseConfig,
  plugins: [...(baseConfig.plugins ?? []), preserveY8ScriptTag(mode === 'y8')],
}));
