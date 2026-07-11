export interface GameFiles {
  gameId: string;
  data: Record<string, unknown>;
  ui: Record<string, unknown>;
  logic: string;
  engineSource: string;
}

export interface Horse {
  id: string;
  name: string;
  gender: 'Stallion' | 'Mare';
  generation: number;
  speed: number;
  stamina: number;
  acceleration: number;
  temperament: number;
  color_body: string;
  color_mane: string;
  color_socks: string;
  color_silk: string;
  runs: number;
  wins: number;
  places: number;
  thirds: number;
  earnings: number;
  cooldown_until: number;
  player_owned: boolean;
  price: number;
  parents?: {
    sire_id?: string;
    sire_name?: string;
    dam_id?: string;
    dam_name?: string;
  } | null;
}

export interface RaceParticipant {
  horse: Horse;
  gate: number;
  odds: number;
  progress: number;
  current_distance: number;
  current_speed: number;
  energy: number;
  is_finished: boolean;
  finish_time?: number;
  final_rank?: number;
}

export interface Bet {
  horse_id: string;
  horse_name: string;
  amount: number;
  type: 'Win' | 'Place' | 'Show';
  payout_odds: number;
}

export interface RaceResult {
  rank: number;
  horse_id: string;
  horse_name: string;
  player_owned: boolean;
  payout: number;
}

export interface GameState {
  funds: number;
  horses: Horse[];
  current_race: CurrentRace | null;
  race_history: RaceHistoryEntry[];
  emergency_grant_shown: boolean;
}

export interface CurrentRace {
  id: string;
  name: string;
  description: string;
  distance: number;
  race_class: string;
  prize_pool: number;
  prize_split: number[];
  participants: RaceParticipant[];
  status: 'scheduled' | 'running' | 'completed';
  results?: RaceResult[];
  ai_only?: boolean;
}

export interface RaceHistoryEntry {
  race_name: string;
  distance: number;
  prize_pool: number;
  results: RaceResult[];
  timestamp: number;
}

export interface LuaExecutor {
  call(fnName: string, ...args: unknown[]): unknown;
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
}

export type GameStatus = 'stable' | 'beta' | 'dev' | 'external';

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
