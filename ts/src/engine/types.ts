export interface GameFiles {
  gameId: string;
  data: Record<string, unknown>;
  ui: Record<string, unknown>;
  logic: string;
  engineSource: string;
}

export interface LuaExecutor {
  call(fnName: string, ...args: unknown[]): unknown[];
}

export interface GameSession {
  gameId: string;
  files: GameFiles;
  executor: LuaExecutor;
}

/**
 * Props received by every game renderer component.
 * The router loads the session and passes it here.
 * Games must not call loadGame() internally.
 */
export interface GameRendererProps {
  session: GameSession;
}

/**
 * Registration entry for a game in the studio router.
 * Each game exports one of these from its config.ts.
 */
export interface GameConfig {
  gameId: string;
  label: string;
  description?: string;
  color?: string;           // hex accent color for arcade card
  status?: GameStatus;      // displayed as badge on card
  component?: React.LazyExoticComponent<React.ComponentType<GameRendererProps>>;
  externalUrl?: string;     // fallback: direct link to the game's own itch.io/store page
  embedUrl?: string;        // if set, GameLoader renders this inline instead of redirecting
  embedWidth?: number;      // present + embedHeight → fixed aspect-ratio container (itch.io)
  embedHeight?: number;     // absent → responsive full-bleed container (same-origin demos)

  // Arcade metadata expansion (Aug 23 2026). All optional/additive —
  // existing entries without these fields keep working unmodified.
  shortDescription?: string;  // card-length; falls back to `description` if absent
  longDescription?: string;   // detail-view length; falls back to shortDescription/description if absent
  genre?: PrimaryGenre;       // single, curated primary genre
  tags?: string[];            // looser, optional secondary tags (itch.io Genre+Tags precedent)
  patchNotesPath?: string;    // path relative to ts/src/games/, e.g. 'succession/PATCH_NOTES_v0.2.0.md'

  // Arcade reorganization (Sep 18 2026). All optional/additive.
  supersededBy?: string;      // gameId this game became (Origins section, Lineage row)
  controlsHint?: string;      // Controls card on the game page
  stack?: string[];           // Stack row on the game page
  platforms?: string[];       // Platforms row (site default: ['Browser'])
  devlogTag?: string;         // WordPress tag slug; default = gameId with '_' → '-'
  arcadeSection?: ArcadeSection; // override for the derived arcade section
  itch?: { url: string; gameId?: number }; // itch.io page + numeric id (ownership checks later)
  leaderboards?: LeaderboardDef[];        // player seam: boards declared as data
  saves?: boolean;                        // player seam: game uses protocol saves
  source?: DemoSource;                    // single source of truth for demo lists (studio_mcp.demos)
}

// 'retired' added 2026-09-20: Brewfield was retired in docs/state/StatusBoard.md on
// Aug 15 and stayed 'stable' in config for a month because the type had no way to
// say otherwise. A status vocabulary that cannot express retirement guarantees
// retired games keep advertising themselves as publishable.
export type GameStatus = 'stable' | 'beta' | 'dev' | 'external' | 'tool' | 'retired';

export type ArcadeSection = 'featured' | 'development' | 'prototype' | 'origin';

export interface LeaderboardDef {
  id: string;
  label: string;
  order: 'higher' | 'lower';
}

/** Where a standalone demo's build comes from. Absent = a game built inside the studio app. */
export type DemoSource =
  | { kind: 'example'; slug: string }   // examples/<slug>/ (AI Studio exports)
  | { kind: 'sibling'; repo: string };  // a sibling repository, e.g. SlimeBreeder

// Curated primary genre taxonomy, grounded in the real catalog
// (drafted during arcade-structure research, Aug 2026). One primary
// genre per game; `tags` carries anything looser or secondary.
export type PrimaryGenre =
  | 'creature-collector'
  | 'combat-arena'
  | 'economic-precarity'
  | 'colony-4x'
  | 'idle-incremental'
  | 'roguelike'
  | 'tower-defense'
  | 'racing'
  | 'puzzle-stealth'
  | 'cooperative'
  | 'narrative-persuasion'
  | 'management-sim';

export class RuntimeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RuntimeError';
  }
}

export class LuaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LuaError';
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}
