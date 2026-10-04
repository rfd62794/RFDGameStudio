# One build command for every demo: `build:demo` plus an install-free `--check` (Phase 1, D1.4)

**Depends on:** D1.1 (`Studio_Registry_Glob_D1_1_Directive.md`) merged: the new tests and the CLI read `GAME_REGISTRY`, which D1.1 turns into the glob registry (they also work on the old registry, but this run's baseline is the D1.1 state).
**Queue-neutral:** this file carries no Queue block; the controller queues it.

**Read first** (everything this run needs is pasted below; these are the files to open):
`ts/vite.standalone.factory.ts` (whole file), `ts/vite.choke_point.config.ts` and `ts/vite.shoal.config.ts` (the thin and the custom per-game config), `ts/package.json` (lines 6-26),
`docs/superpowers/specs/2026-10-04-studio-redesign.md` (section c2), `docs/superpowers/specs/2026-10-03-demo-polish-standard.md` (lines 18-22 and 87).

## 1. Why this exists

Building a demo today means knowing which of three recipes applies, and 404 embeds nobody can see. Measured 2026-10-04 on origin/main `bb048831` plus D1.1, by classifying the 36 registry games against the files that exist:

- 14 games have a TS-native standalone entry (`ts/src/standalone/<id>/index.html`). 13 of them have a `ts/vite.<id>.config.ts` and 12 a `build:<id>` script; `technique_showcase` has an entry but neither a config nor a script (so it cannot be built with npm today),
  and `character_viewer` has a custom 22-line config but no script.
- 13 games are example embeds: `source: { kind: 'example', slug }` with `examples/<slug>/package.json` (the AI Studio exports; each has its own vite config with a hard-coded `base` where the config has an `embedUrl`).
- 9 games build nothing: `voiddrift`, `horse_racing`, `slither_rogue`, `wire_rust`, `role_symbol_viewer` (arcade-internal or external), and four whose config says `embedUrl: '/arcade/<id>/'` while no standalone entry or example folder exists:
  `filipino_bpo_simulator`, `factory_idle`, `dissonance_prototype`, `slimebreeder` (a sibling-repo source). Those four URLs can only 404; this matches the 2026-10-03 audit.
- The deploy tool (`studio_mcp/tools.py`, `studio_deploy_arcade`) already auto-discovers every `ts/dist-<gameId>/index.html` and copies it to `/arcade/<gameId>/`, so one convention covers both kinds: build into `ts/dist-<gameId>`.

Two facts measured while proving the recipe, which the code below already handles (do not "simplify" them away):

1. An embed's own `vite.config.ts` hard-codes `base: '/arcade/<id>/'` (it equals the config's `embedUrl`; real example `examples/ledger/vite.config.ts`: `base: '/arcade/ledger/',`). The build must keep that base. Passing `--base ./` would break the embed.
2. `vite-node` runs with `NODE_ENV=development` (real probe output: `NODE_ENV= development`). A child `vite build` that inherits it bundles React's development build: `examples/ledger` came out at 542.58 kB instead of 280.15 kB. The CLI therefore sets `NODE_ENV: 'production'` for every child process.

Verified end to end on 2026-10-04 in a scratch worktree (laptop, network available): `npm run build:demo -- ledger` copied `examples/ledger` to a temp folder, ran `npm install --no-audit --no-fund` and `npx vite build --outDir <abs ts/dist-ledger> --emptyOutDir`,
producing `ts/dist-ledger/assets/index-BUXKcin9.js 280.15 kB`, byte-identical to a manual build; `npm run build:demo -- choke_point` produced `index-DBvUsqPG.js 481.56 kB`, identical to `npm run build:choke_point`;
`npm run build:demo -- technique_showcase` built with the generic config (`built in 1.53s`). Embed builds need npm and network, so they are the controller's job on the laptop; this sandboxed run verifies embeds with `--check` only.

## 2. Scope

1. New modules `<!-- new: ts/tools/buildDemo/plan.ts -->`, `<!-- new: ts/tools/buildDemo/embedCheck.ts -->`, `<!-- new: ts/tools/buildDemo/repoFiles.ts -->`.
2. New CLI `<!-- new: ts/tools/build-demo.ts -->` and generic config `<!-- new: ts/vite.demo.config.ts -->`.
3. `ts/package.json`: one new script `build:demo`. The existing `build:<id>` scripts stay as aliases, untouched.
4. New test `<!-- new: ts/tests/test_build_demo.ts -->`.
5. `docs/superpowers/specs/2026-10-03-demo-polish-standard.md`: reword A7 and the verification line (two lines).

## 3. The work

Files in this repo use CRLF line endings; new files use CRLF too (write them with the Write tool; do not run a converter). Do not add or remove comments in existing code.

**Step 1: `ts/tools/buildDemo/plan.ts`.** Exactly this content (verified):

```ts
// new: Phase 1 D1.4 -- one build plan per registry game.
import type { GameConfig } from '../../src/engine/types';

export interface RepoProbe {
  /** True when the repo-relative path exists (file or folder). */
  exists(repoPath: string): boolean;
}

export type DemoBuildPlan =
  | { kind: 'standalone'; gameId: string; viteConfig: string; outDir: string }
  | { kind: 'embed'; gameId: string; slug: string; sourceDir: string; outDir: string }
  | { kind: 'none'; gameId: string; reason: string };

/**
 * How a game is built, decided from its config and the files that exist:
 * a TS-native standalone entry (ts/src/standalone/<id>/index.html) wins, then an example embed
 * (source.kind 'example' with examples/<slug>/package.json), else nothing to build.
 * Standalone builds use the game's own ts/vite.<id>.config.ts when it has one (some carry extra plugins),
 * else the generic ts/vite.demo.config.ts.
 */
export function planDemoBuild(game: GameConfig, probe: RepoProbe): DemoBuildPlan {
  const id = game.gameId;
  const outDir = `ts/dist-${id}`;
  if (probe.exists(`ts/src/standalone/${id}/index.html`)) {
    const own = `ts/vite.${id}.config.ts`;
    return { kind: 'standalone', gameId: id, viteConfig: probe.exists(own) ? own : 'ts/vite.demo.config.ts', outDir };
  }
  const source = game.source;
  if (source?.kind === 'example' && probe.exists(`examples/${source.slug}/package.json`)) {
    return { kind: 'embed', gameId: id, slug: source.slug, sourceDir: `examples/${source.slug}`, outDir };
  }
  return { kind: 'none', gameId: id, reason: source ? `source ${JSON.stringify(source)} has no examples/<slug>/package.json` : 'no standalone entry and no example source' };
}

/** A game whose config points the arcade at /arcade/<id>/ but whose plan builds nothing: that URL would 404. */
export function unbuiltEmbedProblem(game: GameConfig, plan: DemoBuildPlan): string | null {
  if (plan.kind !== 'none' || !game.embedUrl?.startsWith('/arcade/')) return null;
  return `config has embedUrl ${game.embedUrl} but nothing builds it: ${plan.reason}`;
}
```

**Step 2: `ts/tools/buildDemo/embedCheck.ts`.** Exactly this content (verified):

```ts
// new: Phase 1 D1.4 -- the install-free check for an example embed.
import type { GameConfig } from '../../src/engine/types';

export interface EmbedFiles {
  exists(repoPath: string): boolean;
  readText(repoPath: string): string;
  /** Repo-relative paths of every file under the folder, skipping node_modules and dist. */
  listFiles(repoDir: string): string[];
}

export interface EmbedCheckResult {
  problems: string[];
  warnings: string[];
}

const SECRET_PATTERNS: Array<[string, RegExp]> = [
  ['Google API key', /AIza[0-9A-Za-z_-]{35}/],
  ['OpenAI-style key', /\bsk-[A-Za-z0-9]{20,}/],
  ['GitHub token', /\bgh[pousr]_[A-Za-z0-9]{30,}/],
  ['private key', /-----BEGIN [A-Z ]*PRIVATE KEY-----/],
];
const TEXT_FILE = /\.(html?|[cm]?[jt]sx?|json|css|md|txt|ya?ml|env[^/]*)$/i;
const MAX_SCAN_BYTES = 1_000_000;

/**
 * Checks an example embed without installing anything: package.json has a vite build script, index.html
 * and its module entry exist, the vite base matches the config's embedUrl, and no file holds a secret.
 */
export function checkEmbed(game: GameConfig, sourceDir: string, files: EmbedFiles): EmbedCheckResult {
  const problems: string[] = [];
  const warnings: string[] = [];
  const pkgPath = `${sourceDir}/package.json`;
  try {
    const pkg = JSON.parse(files.readText(pkgPath)) as { scripts?: Record<string, string> };
    if (!/vite/.test(pkg.scripts?.build ?? '')) problems.push(`${pkgPath}: scripts.build is not a vite build`);
  } catch {
    problems.push(`${pkgPath}: missing or not valid JSON`);
  }

  const htmlPath = `${sourceDir}/index.html`;
  if (!files.exists(htmlPath)) {
    problems.push(`${htmlPath}: missing`);
  } else {
    const entry = /<script[^>]*type="module"[^>]*src="([^"]+)"/.exec(files.readText(htmlPath))?.[1];
    if (!entry) problems.push(`${htmlPath}: no <script type="module" src=...> entry`);
    else if (!files.exists(`${sourceDir}/${entry.replace(/^\.?\//, '')}`)) problems.push(`${htmlPath}: entry ${entry} not found in ${sourceDir}`);
  }

  const configPath = ['vite.config.ts', 'vite.config.js', 'vite.config.mjs'].map(n => `${sourceDir}/${n}`).find(p => files.exists(p));
  const base = configPath ? /\bbase:\s*['"]([^'"]+)['"]/.exec(files.readText(configPath))?.[1] : undefined;
  if (game.embedUrl) {
    if (!configPath) problems.push(`${sourceDir}: no vite.config.* but the config has embedUrl ${game.embedUrl}`);
    else if (!base) problems.push(`${configPath}: no literal base but the config has embedUrl ${game.embedUrl}`);
    else if (base !== game.embedUrl) problems.push(`${configPath}: base ${base} does not match embedUrl ${game.embedUrl}`);
  } else {
    warnings.push('config has no embedUrl (the embed is not served at /arcade/<id>/)');
  }

  for (const path of files.listFiles(sourceDir)) {
    if (!TEXT_FILE.test(path)) continue;
    const text = files.readText(path);
    if (text.length > MAX_SCAN_BYTES) continue;
    for (const [name, pattern] of SECRET_PATTERNS) {
      if (pattern.test(text)) problems.push(`${path}: looks like a ${name}`);
    }
  }
  return { problems, warnings };
}
```

**Step 3: `ts/tools/buildDemo/repoFiles.ts`.** Exactly this content:

```ts
// new: Phase 1 D1.4 -- the real-filesystem implementation of the probes, shared by the CLI and its tests.
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import type { EmbedFiles } from './embedCheck';
import type { RepoProbe } from './plan';

const SKIP_DIRS = new Set(['node_modules', 'dist']);

export function makeRepoFiles(repoRoot: string): RepoProbe & EmbedFiles {
  const abs = (repoPath: string) => resolve(repoRoot, repoPath);
  return {
    exists: p => existsSync(abs(p)),
    readText: p => readFileSync(abs(p), 'utf-8'),
    listFiles: dir => {
      const out: string[] = [];
      const walk = (d: string) => {
        for (const name of readdirSync(abs(d))) {
          if (SKIP_DIRS.has(name)) continue;
          const rel = `${d}/${name}`;
          if (statSync(abs(rel)).isDirectory()) walk(rel);
          else out.push(rel);
        }
      };
      walk(dir);
      return out;
    },
  };
}

export { SKIP_DIRS };
```

**Step 4: `ts/vite.demo.config.ts`.** Exactly:

```ts
// new: Phase 1 D1.4 -- generic standalone config; tools/build-demo.ts sets DEMO_ID.
import { makeStandaloneConfig } from './vite.standalone.factory';

export default makeStandaloneConfig(process.env.DEMO_ID ?? '');
```

**Step 5: `ts/tools/build-demo.ts`.** Exactly this content (verified; the file is run with `vite-node`, like the other tools):

```ts
// new: Phase 1 D1.4 -- one build command for every demo.
/**
 * Usage (from ts/):
 *   npm run build:demo -- <gameId>            build one demo into ts/dist-<gameId>
 *   npm run build:demo -- <gameId> --check    install-free check of one demo (safe in a sandbox)
 *   npm run build:demo -- --all --check       the same check for every registry game
 * Standalone (TS-native) demos build with vite; example embeds are copied to a temp folder, installed
 * and built there, never inside examples/. Real embed builds need npm and network: run them on the laptop.
 */
import { spawnSync } from 'node:child_process';
import { cpSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative, resolve } from 'node:path';
import { GAME_REGISTRY, findGame } from '../src/games/registry';
import { planDemoBuild, unbuiltEmbedProblem, type DemoBuildPlan } from './buildDemo/plan';
import { checkEmbed } from './buildDemo/embedCheck';
import { makeRepoFiles, SKIP_DIRS } from './buildDemo/repoFiles';

const REPO_ROOT = resolve(__dirname, '..', '..');
const abs = (repoPath: string) => resolve(REPO_ROOT, repoPath);
const files = makeRepoFiles(REPO_ROOT);

function run(cmd: string, args: string[], cwd: string, env: NodeJS.ProcessEnv = process.env): number {
  // vite-node sets NODE_ENV=development; a build must not inherit it (it bundles React's development build).
  const result = spawnSync(cmd, args, { cwd, env: { ...env, NODE_ENV: 'production' }, stdio: 'inherit', shell: process.platform === 'win32' });
  return result.status ?? 1;
}

function checkOne(plan: DemoBuildPlan): number {
  const game = findGame(plan.gameId)!;
  const problems: string[] = [];
  const warnings: string[] = [];
  if (plan.kind === 'none') {
    const problem = unbuiltEmbedProblem(game, plan);
    if (problem) problems.push(problem);
    else warnings.push(plan.reason);
  }
  if (plan.kind === 'embed') {
    const result = checkEmbed(game, plan.sourceDir, files);
    problems.push(...result.problems);
    warnings.push(...result.warnings);
  }
  const detail = plan.kind === 'standalone' ? ` (${relative('ts', plan.viteConfig)})` : plan.kind === 'embed' ? ` (${plan.sourceDir})` : '';
  console.log(`${plan.gameId}: ${plan.kind}${detail}: ${problems.length ? 'PROBLEMS' : 'ok'}`);
  for (const p of problems) console.log(`  problem: ${p}`);
  for (const w of warnings) console.log(`  warn: ${w}`);
  return problems.length;
}

function buildOne(plan: DemoBuildPlan): number {
  if (plan.kind === 'none') {
    console.error(`${plan.gameId}: nothing to build (${plan.reason})`);
    return 1;
  }
  if (plan.kind === 'standalone') {
    return run('npx', ['vite', 'build', '--config', relative('ts', plan.viteConfig)], abs('ts'), { ...process.env, DEMO_ID: plan.gameId });
  }
  if (checkOne(plan) > 0) return 1;
  const temp = mkdtempSync(join(tmpdir(), `build-demo-${plan.gameId}-`));
  try {
    cpSync(abs(plan.sourceDir), temp, { recursive: true, filter: src => !SKIP_DIRS.has(src.split(/[\\/]/).pop() ?? '') });
    if (run('npm', ['install', '--no-audit', '--no-fund'], temp) !== 0) return 1;
    return run('npx', ['vite', 'build', '--outDir', abs(plan.outDir), '--emptyOutDir'], temp);
  } finally {
    rmSync(temp, { recursive: true, force: true });
  }
}

function main(argv: string[]): number {
  const check = argv.includes('--check');
  const ids = argv.includes('--all') ? GAME_REGISTRY.map(g => g.gameId) : argv.filter(a => !a.startsWith('--'));
  if (ids.length === 0) {
    console.error('usage: build-demo <gameId> [--check] | --all --check');
    return 2;
  }
  if (!check && ids.length !== 1) {
    console.error('building needs exactly one gameId; --all works only with --check');
    return 2;
  }
  let failures = 0;
  for (const id of ids) {
    const game = findGame(id);
    if (!game) {
      console.error(`${id}: not in GAME_REGISTRY`);
      failures += 1;
      continue;
    }
    const plan = planDemoBuild(game, files);
    failures += check ? checkOne(plan) : buildOne(plan);
  }
  return failures > 0 ? 1 : 0;
}

process.exit(main(process.argv.slice(2)));
```

**Step 6: `ts/package.json`.** Directly after the line `    "build": "tsc && vite build",` add the line `    "build:demo": "vite-node tools/build-demo.ts",`. Change nothing else in `scripts`.

**Step 7: `ts/tests/test_build_demo.ts`.** Exactly this content (verified: 13 tests pass):

```ts
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
```

**Step 8: polish standard.** In `docs/superpowers/specs/2026-10-03-demo-polish-standard.md`, replace line 20 (it starts `- A7.` and ends `(only 10 demos have one today).`) with exactly this line:

````text
- A7. `cd ts && npm run build:demo -- <id>` exits 0 (standalone demos build into `ts/dist-<id>`; example embeds are verified in a sandbox with `--check` and built on the laptop). The per-game `build:<id>` scripts still work as aliases.
````

and in line 87 replace the code span `cd ts && npm run build:<id>` with `cd ts && npm run build:demo -- <id>`. Change nothing else in that file.

## 4. What NOT to do

- Do not delete, rename or edit any existing `ts/vite.*.config.ts` or `build:<id>` script: some configs carry extra plugins (`vite.shoal.config.ts` injects the Y8 tag in `--mode y8`; `vite.dissonance.config.ts` copies art), and polish directives cite the aliases.
- Do not pass `--base` to an embed build and do not run the embed build inside `examples/` (installs go in a temp copy only). Do not add `npm install` to anything that runs in a sandbox.
- Do not run a non-`--check` embed build in this run: it needs npm and network, which this sandbox lacks. Standalone builds (no install) are fine.
- Do not commit any `ts/dist-*` folder (gitignored by `dist*/`; leave them where they land).
- Do not change `ts/src/games/registry.ts`, any `config.ts`, `ts/vite.standalone.factory.ts`, the deploy tool, or `docs/children.json`; do not touch protected repos or `archive/`; do not deploy.
- No `STANDALONE_BUILD_GAMES` change (that is D1.2). No pre-commit hook or CI.

## 5. Verification

```
uv run python --version
```
Expected: `Python 3.12.x` (no Python is changed; standing interpreter check). Verified: `Python 3.12.12`.

After editing (verified 2026-10-04 by applying exactly these steps in a scratch worktree on top of D1.1):
```
cd ts && npx vitest run test_build_demo.ts
```
Expected: `Test Files  1 passed (1)` / `Tests  13 passed (13)`.
```
cd ts && npx tsc --noEmit
```
Expected: no output, exit 0 (about 20 s).
```
cd ts && npx vite-node tools/build-demo.ts ledger --check
```
Expected, exit 0: `ledger: embed (examples/ledger): ok`
```
cd ts && npx vite-node tools/build-demo.ts factory_idle --check
```
Expected, exit 1:
```
factory_idle: none: PROBLEMS
  problem: config has embedUrl /arcade/factory_idle/ but nothing builds it: no standalone entry and no example source
```
```
cd ts && npx vite-node tools/build-demo.ts --all --check
```
Expected, exit 1: 36 result lines, 14 `: standalone`, 13 `: embed`, 9 `: none`; exactly four `PROBLEMS` (`filipino_bpo_simulator`, `factory_idle`, `dissonance_prototype`, `slimebreeder`, each "config has embedUrl /arcade/<id>/ but nothing builds it"); every embed `ok`. Exit 1 here is the
expected state of the repo, not a failure of this run: those four are the known 404 embeds that D1.5 reports.
```
cd ts && npx vite-node tools/build-demo.ts choke_point
```
Expected: ends `✓ built in ...s` and lists `dist-choke_point/assets/index-DBvUsqPG.js   481.56 kB`. (Standalone builds need no install. If the sandbox refuses this nested build, skip it, say so in the Status row and the report; do not retry another way.)

Source check (Grep tool, one call each): `ts/package.json` contains `"build:demo": "vite-node tools/build-demo.ts"` once and still contains `"build:choke_point"`.

## 6. Rules for this run

- This run is NON-INTERACTIVE. A tool call that needs a confirmation is rejected and the run ends mid-task.
- ONE simple command per tool call. No `;`, `&&`, `||`, `|` chains and no redirects, with the single exception of the sanctioned verification line forms in section 5 (`cd ts && npx vitest run test_build_demo.ts`, `cd ts && npx tsc --noEmit`,
  `cd ts && npx vite-node tools/build-demo.ts ...`). Do not use `ls`, `Get-ChildItem` or `cat`: use Read, Glob and Grep. Use the bare test filename as the filter. No live process probing.
- Do not install, download or fetch anything. Do not read outside this worktree. Do not search or hunt for facts: every path and quoted line you need is above. If a path is missing or a quoted line differs from the file, STOP and write why in the Status row.
- Never commit to main, never push, never deploy. Work stays on your `directive/<slug>` branch; commit there. Only Robert merges.
- Do not create scratch or debug files in the repo (deleting is denied in this sandbox); use `.devin-scratch/` if you need one and leave it. Build output under `ts/dist-*` is gitignored; leave it.
- No absolute paths inside this repo's checkout in any file you write; use repo-relative paths.
- Do not run `agentflow lint` or any agentflow command. Do NOT run `uv run python -m studio.demos index` or `python -c` (the sandbox refuses them). Derived files are regenerated by the controller.
- New logic goes in the small new modules named above (SOLID/SRP/KISS); no file over 600 lines.
- Free models only wherever any model configuration is touched (none is expected).
- Status row meanings: when every Completion criteria box is checked and the verification tails are in the log line, set the row to **Review** (this is "Done" for the run). Never set it to Done: only Robert or Claude marks Done
  after merge. If you stop partway, set it to Blocked and write why.

## 7. Completion criteria

- [ ] The new files in Steps 1-5 and 7 exist with the content given; `ts/package.json` has the `build:demo` script and all old scripts.
- [ ] `cd ts && npx vitest run test_build_demo.ts` shows 13 passed; `cd ts && npx tsc --noEmit` is clean (real tails pasted).
- [ ] The `ledger`, `factory_idle` and `--all --check` lines in section 5 give the stated output and exit codes (real output pasted).
- [ ] A7 and line 87 of the polish standard are reworded; nothing else in that file changed.
- [ ] No file outside Scope changed; no `dist-*` folder is staged.
- [ ] The Status row is set to Review with a one-line log entry.

## Sandbox needs

none

## 8. Report

Findings first: the files created (7 new including the test; 2 edited: `ts/package.json` and the polish standard). Evidence second: the real tails of the section 5 commands, with the full `--all --check` summary counts and the four problem lines. Then say plainly what
this run did not do: no real embed build (the controller runs `cd ts && npm run build:demo -- <id>` on the laptop for each embed; needs npm and network) and no deploy. Recommended action: review and merge; D1.5 then reports which embeds still lack a dist and which
four URLs have no source.

## Forbidden Actions

- Committing to or pushing main; pushing at all; deploying; installing or fetching anything; reading outside the worktree; touching protected repos; editing `archive/`, `docs/children.json`, `tests/fixtures/demo_lists_snapshot.json`, `ts/src/games/registry.ts`,
  any `config.ts`, any existing `ts/vite.*.config.ts`, or the deploy tool; deleting any `build:<id>` script; running a non-`--check` embed build; staging any `ts/dist-*` folder.

## Required from User

none.

<!-- queue:start -->
## Queue

| Field | Value |
|---|---|
| Status | Approved |
| Assigned to | devin |
| Branch | - |
| Base branch | - |

**Status log**
- 2026-10-04 11:20 · agentflow-tick · none → Queued — suggested by heartbeat: Fully specified, verified, sandbox-safe build work; dispatch only after D1.1 (in progress) merges.
- 2026-10-04 11:50 · robert-claude-laptop · Queued → Approved — lint override: stale MCP lint; new-file markers present; author ran baseline and after proofs; D1.1 (dependency) merged 87961f0b
<!-- queue:end -->
