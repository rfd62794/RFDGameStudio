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
