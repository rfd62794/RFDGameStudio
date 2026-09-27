/**
 * Configs-only view of GAME_REGISTRY for Python tooling (studio_mcp.demos).
 * Written by tools/export-registry.ts to ts/src/games/registry-export.json (gitignored).
 */
import type { DemoSource, GameConfig } from '../engine/types';

export interface RegistryExportEntry {
  gameId: string;
  label: string;
  status?: string;
  embedUrl?: string;
  hasComponent: boolean;
  source?: DemoSource;
  supersededBy?: string;
}

export interface RegistryExport {
  generatedAt: string;
  games: RegistryExportEntry[];
}

export function buildRegistryExport(registry: GameConfig[], now: () => string = () => new Date().toISOString()): RegistryExport {
  return {
    generatedAt: now(),
    games: registry.map(g => ({
      gameId: g.gameId,
      label: g.label,
      status: g.status,
      embedUrl: g.embedUrl,
      hasComponent: Boolean(g.component),
      source: g.source,
      supersededBy: g.supersededBy,
    })),
  };
}
