// new: Phase 1 D1.4, the build plan and the install-free embed check.
// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { GameConfig } from '../src/engine/types';
import { GAME_REGISTRY } from '../src/games/registry';
import { planDemoBuild, unbuiltEmbedProblem } from '../tools/buildDemo/plan';
import { checkEmbed, type EmbedFiles } from '../tools/buildDemo/embedCheck';
import { makeRepoFiles } from '../tools/buildDemo/repoFiles';

const REPO_ROOT = resolve(import.meta.dirname, '..', '..');
const game = (extra: Partial<GameConfig> = {}): GameConfig => ({ gameId: 'demo_x', label: 'Demo X', ...extra });
const probeOf = (paths: string[]) => ({ exists: (p: string) => paths.includes(p) });

describe('planDemoBuild', () => {
  it('prefers a standalone entry and uses the game\'s own vite config when it has one', () => {
    const plan = planDemoBuild(game(), probeOf(['ts/src/standalone/demo_x/index.html', 'ts/vite.demo_x.config.ts']));
    expect(plan).toEqual({ kind: 'standalone', gameId: 'demo_x', viteConfig: 'ts/vite.demo_x.config.ts', outDir: 'ts/dist-demo_x' });
  });

  it('falls back to the generic vite config for a standalone entry with none of its own', () => {
    const plan = planDemoBuild(game(), probeOf(['ts/src/standalone/demo_x/index.html']));
    expect(plan).toMatchObject({ kind: 'standalone', viteConfig: 'ts/vite.demo.config.ts' });
  });

  it('plans an embed for an example source that has a package.json', () => {
    const plan = planDemoBuild(game({ source: { kind: 'example', slug: 'demo-x' } }), probeOf(['examples/demo-x/package.json']));
    expect(plan).toEqual({ kind: 'embed', gameId: 'demo_x', slug: 'demo-x', sourceDir: 'examples/demo-x', outDir: 'ts/dist-demo_x' });
  });

  it('plans nothing when there is no standalone entry and no example folder', () => {
    expect(planDemoBuild(game(), probeOf([]))).toMatchObject({ kind: 'none' });
    expect(planDemoBuild(game({ source: { kind: 'example', slug: 'demo-x' } }), probeOf([]))).toMatchObject({ kind: 'none' });
  });

  it('flags an /arcade/ embedUrl that nothing builds, and only that', () => {
    const none = planDemoBuild(game({ embedUrl: '/arcade/demo_x/' }), probeOf([]));
    expect(unbuiltEmbedProblem(game({ embedUrl: '/arcade/demo_x/' }), none)).toContain('/arcade/demo_x/');
    expect(unbuiltEmbedProblem(game({ embedUrl: 'https://itch.io/embed-upload/1' }), none)).toBeNull();
    expect(unbuiltEmbedProblem(game(), none)).toBeNull();
  });
});

function embedFiles(files: Record<string, string>): EmbedFiles {
  return {
    exists: p => p in files,
    readText: p => {
      if (!(p in files)) throw new Error(`missing ${p}`);
      return files[p];
    },
    listFiles: dir => Object.keys(files).filter(p => p.startsWith(`${dir}/`)),
  };
}

const GOOD: Record<string, string> = {
  'examples/demo-x/package.json': '{"scripts":{"build":"vite build"}}',
  'examples/demo-x/index.html': '<script type="module" src="/src/main.tsx"></script>',
  'examples/demo-x/src/main.tsx': 'console.log(1);',
  'examples/demo-x/vite.config.ts': "export default { base: '/arcade/demo_x/' };",
};
const EMBED = game({ source: { kind: 'example', slug: 'demo-x' }, embedUrl: '/arcade/demo_x/' });

describe('checkEmbed', () => {
  it('passes a clean embed', () => {
    expect(checkEmbed(EMBED, 'examples/demo-x', embedFiles(GOOD))).toEqual({ problems: [], warnings: [] });
  });

  it('reports a vite base that does not match embedUrl', () => {
    const files = { ...GOOD, 'examples/demo-x/vite.config.ts': "export default { base: '/arcade/other/' };" };
    const { problems } = checkEmbed(EMBED, 'examples/demo-x', embedFiles(files));
    expect(problems).toEqual(['examples/demo-x/vite.config.ts: base /arcade/other/ does not match embedUrl /arcade/demo_x/']);
  });

  it('reports a missing module entry and a non-vite build script', () => {
    const files = { ...GOOD, 'examples/demo-x/package.json': '{"scripts":{"build":"webpack"}}' };
    delete (files as Record<string, string>)['examples/demo-x/src/main.tsx'];
    const { problems } = checkEmbed(EMBED, 'examples/demo-x', embedFiles(files));
    expect(problems).toEqual([
      'examples/demo-x/package.json: scripts.build is not a vite build',
      'examples/demo-x/index.html: entry /src/main.tsx not found in examples/demo-x',
    ]);
  });

  it('reports a secret-looking string', () => {
    const files = { ...GOOD, 'examples/demo-x/src/main.tsx': `const k = "AIza${'a'.repeat(35)}";` };
    const { problems } = checkEmbed(EMBED, 'examples/demo-x', embedFiles(files));
    expect(problems).toEqual(['examples/demo-x/src/main.tsx: looks like a Google API key']);
  });

  it('only warns when the config has no embedUrl', () => {
    const { problems, warnings } = checkEmbed(game({ source: { kind: 'example', slug: 'demo-x' } }), 'examples/demo-x', embedFiles(GOOD));
    expect(problems).toEqual([]);
    expect(warnings).toHaveLength(1);
  });
});

describe('the real registry', () => {
  const files = makeRepoFiles(REPO_ROOT);
  const plans = GAME_REGISTRY.map(g => ({ g, plan: planDemoBuild(g, files) }));

  it('plans every game, and every standalone plan points at a vite config that exists', () => {
    expect(plans).toHaveLength(GAME_REGISTRY.length);
    for (const { plan } of plans) {
      if (plan.kind === 'standalone') expect(files.exists(plan.viteConfig), plan.viteConfig).toBe(true);
    }
  });

  it('keeps every existing build:<id> alias consistent with the plan', () => {
    const scripts = JSON.parse(readFileSync(resolve(REPO_ROOT, 'ts', 'package.json'), 'utf-8')).scripts as Record<string, string>;
    for (const [name, command] of Object.entries(scripts)) {
      const id = /^build:(\w+)$/.exec(name)?.[1];
      if (!id || id === 'demo') continue;
      const plan = plans.find(p => p.g.gameId === id)?.plan;
      expect(plan?.kind, name).toBe('standalone');
      expect(command, name).toContain(`vite.${id}.config.ts`);
    }
  });

  it('finds no problem in any example embed', () => {
    for (const { g, plan } of plans) {
      if (plan.kind === 'embed') expect(checkEmbed(g, plan.sourceDir, files).problems, g.gameId).toEqual([]);
    }
  });
});
