import type { GameConfig } from '../engine/types';

export type ConfigModules = Record<string, { default?: GameConfig }>;

/**
 * Turn the modules found by import.meta.glob('./*\/config.ts') into the registry list.
 * Fails loudly on a config with no default export, a duplicate gameId or a config with no numeric order;
 * sorts by order, then gameId.
 */
export function collectConfigs(modules: ConfigModules): GameConfig[] {
  const seen = new Map<string, string>();
  const configs: GameConfig[] = [];
  for (const [path, mod] of Object.entries(modules)) {
    const config = mod.default;
    if (!config) throw new Error(`${path}: config has no default export`);
    const first = seen.get(config.gameId);
    if (first) throw new Error(`${path}: duplicate gameId '${config.gameId}' (also ${first})`);
    seen.set(config.gameId, path);
    if (typeof config.order !== 'number') throw new Error(`${path}: config '${config.gameId}' has no numeric order`);
    configs.push(config);
  }
  return configs.sort((a, b) => (a.order as number) - (b.order as number) || a.gameId.localeCompare(b.gameId));
}
