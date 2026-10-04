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
