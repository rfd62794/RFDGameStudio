// Dissonance Depths — TS-side state shapes.
// These mirror the shapes returned by games/dissonance/logic/*.lua exactly
// (camelCase field names pass through the Lua bridge unchanged). No game
// logic is computed here — this file is types only.

export interface DeckCard {
  id: string;
  cardId: string;
  name: string;
  el1: string;
  el2: string | null;
  component: string;
  relationType: 'single' | 'same' | 'adjacent' | 'opposed';
}

export interface DeckState {
  drawPile: DeckCard[];
  hand: DeckCard[];
  discard: DeckCard[];
}

export interface CombatIntent {
  type: 'attack' | 'heavy_attack' | 'shield' | 'dot_attack';
  value: number;
  duration?: number;
  description: string;
}

export interface EnemyState {
  name: string;
  hp: number;
  maxHp: number;
  dot: { duration: number; damage: number } | null;
  intent: CombatIntent;
  tier?: 'basic' | 'advanced' | 'elite' | 'master';
  secondaryType?: string | null;
  vulnerable?: string | null;
  resistant?: string | null;
  behaviorPattern?: string;
  behaviorTypeIds?: string[];
}

export interface RunNode {
  id: string;
  type: 'fight' | 'restCraft' | 'treasure' | 'store' | 'boss' | 'anomaly';
  enemyName?: string;
  enemyHp?: number;
  enemyTier?: 'basic' | 'advanced' | 'elite' | 'master';
  rung?: 'early' | 'mid' | 'final';
  connectsTo?: string[];
  lane?: number;
  x?: number;
  y?: number;
}

export interface TypedBoon {
  id: string;
  tier: 'basic' | 'advanced' | 'elite' | 'master';
  targetType: 'element' | 'action' | 'combination';
  targetId: string;
  modifier?: number;
  qualitativeEffect?: string;
  essenceCost: number;
  requiresBoonId?: string;
}

export interface MapBalance {
  netDamage: number;
  inBand: boolean;
  band: [number, number];
  attempts: number;
}

export type RunStatus =
  | 'not_started'
  | 'combat'
  | 'rest_craft'
  | 'reward'
  | 'treasure'
  | 'store'
  | 'anomaly'
  | 'victory'
  | 'game_over';

export interface RunState {
  currentNodeId: string;
  currentFloor: number;
  playerHp: number;
  playerMaxHp: number;
  playerShield: number;
  essence: number;
  status: RunStatus;
  enemy: EnemyState | null;
  turnCount: number;
  logs: string[];
  combinationCounts: Record<string, number>;
  stabilizedCores: string[];
  seed: number;
  deckState: DeckState;
  deckCardIds: string[];
  culture: string;
  nodes: RunNode[];
  boons: TypedBoon[];
  relics: string[];
  usedRelicIds: string[];
  visitedNodeIds: string[];
  startingBankedBonus: number;
  giftSkippedCount: number;
  activeBuild?: { buildId: string | null; mechanicState: Record<string, unknown> };
  lastMapBalance?: MapBalance;
  restCraftResolvedNodeId?: string;
  lastAttachmentOutcome?: 'peek' | 'gift' | 'treasure';
}

export interface RewardSlot {
  kind: 'heal' | 'card' | 'benefit' | 'relic';
  amount?: number;
  cardId?: string;
  boonId?: string;
  relicId?: string;
}

export interface OpeningPackItem {
  action: string;
  element: string;
  cardId: string;
  name: string;
}

export type AppPhase = 'title' | 'opening' | 'floorChoice' | 'deckBuild' | 'run';

export interface CombatTurnResult {
  nextState: RunState;
  fightWon: boolean | null;
  isBoss: boolean;
}
