// new: Phase 1 D1.2 -- board rows for registry demos are generated; only the hand-written parts live in the overlay.
import type { GameConfig, GameStatus } from '../engine/types';
import type { ProjectEntry, ProjectStatus } from './types';

/** The hand-written parts of a demo's board row, keyed by gameId in demoOverlay.ts. Anything absent is generated. */
export type DemoOverlay = Partial<Omit<ProjectEntry, 'id'>>;

/** lastUpdated for a generated row that has no overlay. Bump it when the generation rule changes. */
export const GENERATED_ROW_DATE = '2026-10-04';

const STATUS_FROM_CONFIG: Record<GameStatus, ProjectStatus> = {
  stable: 'shipped_mature',
  beta: 'active',
  dev: 'active',
  external: 'active',
  tool: 'active',
  retired: 'retired',
};

/**
 * One board row per registry game that declares a `source` (the AI Studio demos).
 * A config whose status is 'retired' is always a retired row; otherwise the overlay's status wins, then the mapped config status.
 */
export function buildDemoRows(registry: GameConfig[], overlay: Record<string, DemoOverlay>): ProjectEntry[] {
  return registry
    .filter(game => game.source)
    .map(game => {
      const extra = overlay[game.gameId] ?? {};
      const status: ProjectStatus = game.status === 'retired' ? 'retired' : extra.status ?? STATUS_FROM_CONFIG[game.status ?? 'dev'];
      return {
        category: status === 'retired' ? 'retired' : 'ai_studio_track',
        currentState: game.shortDescription ?? game.description ?? game.label,
        lastUpdated: GENERATED_ROW_DATE,
        ...extra,
        id: game.gameId,
        name: extra.name ?? game.label,
        status,
      };
    });
}
