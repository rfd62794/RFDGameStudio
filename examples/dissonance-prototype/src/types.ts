export type Culture = 'ember' | 'gale' | 'marsh' | 'crystal' | 'tundra' | 'tide';
export type SecondaryType = 'burst' | 'hybrid' | 'volatile' | null;

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
  secondaryType?: SecondaryType;
  vulnerable?: SecondaryType;
  resistant?: SecondaryType;
  behaviorPattern?: string;
  behaviorTypeIds?: [string] | [string, string];
}

export interface NamedCard {
  id: string;
  name: string;
  el1: string;
  el2: string | null;
  relationType: 'single' | 'adjacent' | 'same' | 'opposed';
  description: string;
  cost: number;
  culture: Culture;
}

export interface Card {
  id: string;              // matches EMBER_CARD_NAMES key, e.g. 'ember_ember_sever'
  name: string;             // from EMBER_CARD_NAMES
  el1: string;
  el2: string | null;
  component: string;
  relationType: 'single' | 'same' | 'adjacent' | 'opposed';
}

export interface DeckCard {
  id: string; // unique instance ID for drawing/tracking (e.g. "card_1")
  cardId: string; // matches Card.id
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

export interface TypedBoon {
  id: string;
  tier: 'basic' | 'advanced' | 'elite' | 'master';
  targetType: 'element' | 'action' | 'combination';
  targetId: string;
  effectShape: 'flat' | 'qualitative';
  modifier?: number;          // for 'flat' tier boons
  qualitativeEffect?: string; // for 'master' tier — a rule change, not a number
  essenceCost: number;
  requiresBoonId?: string;    // for Elite/Duo — the prerequisite Boon's id
}

export interface Relic {
  id: string;
  name: string;
  category: 'info' | 'economy' | 'safety-net' | 'utility' | 'risk';
  description: string;
  master?: boolean;
}

export interface BankedEssence {
  amount: number;
  available: boolean; // true until spent or one fresh run completes, then false
}

export const REST_OR_WEIGHTS: Record<number, {
  peek: number; gift: number; treasure: number;
}> = {
  1: { peek: 0.7, gift: 0.15, treasure: 0.15 },
  2: { peek: 0.2, gift: 0.7, treasure: 0.1 },
  3: { peek: 0.2, gift: 0.1, treasure: 0.7 },
  4: { peek: 0.7, gift: 0.15, treasure: 0.15 },
  5: { peek: 0.34, gift: 0.33, treasure: 0.33 },
};

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

export interface FloorConfig {
  numLayers: number;
  gateType: 'minRoster' | 'maxDeckSize';
  gateValue: number;
}

export const FLOOR_CONFIG: Record<number, FloorConfig> = {
  1: { numLayers: 7, gateType: 'minRoster', gateValue: 0 },   // was 5
  2: { numLayers: 6, gateType: 'minRoster', gateValue: 10 },  // judgment call, tune in playtesting
  3: { numLayers: 7, gateType: 'minRoster', gateValue: 18 },  // judgment call, tune in playtesting
  4: { numLayers: 8, gateType: 'maxDeckSize', gateValue: 6 }, // flip point — deck cap shrinks from 8
  5: { numLayers: 9, gateType: 'maxDeckSize', gateValue: 5 }, // judgment call, tune in playtesting
};

export const FLOOR_FLAVOR: Record<number, { name: string; description: string }> = {
  1: { name: 'Denial', description: "The floor waits, quiet. Nothing here seems to know what's coming." },
  2: { name: 'Anger', description: 'Everything here is faster, sharper, less patient.' },
  3: { name: 'Bargaining', description: 'Something here is always negotiating — for time, for pieces, for you.' },
  4: { name: 'Depression', description: "The weight is real here. So is what you'll find carrying it." },
  5: { name: 'Acceptance', description: 'Whatever this becomes, it becomes it here.' },
};

export type AnomalyEvent =
  | 'echos_fragment'    // risk/reward: minor HP damage for a forced discovery-adjacent effect
  | 'unstable_residue'  // risk/reward: HP cost for real Essence gain
  | 'corrupted_cache'   // optional combat: weakened Basic enemy, guaranteed Card
  | 'the_bargain'       // economy: Floor 3 (Bargaining) specific — discounted next Boon purchase
  | 'silent_choir';     // free: small permanent-this-run Max HP bump, no cost

export type BuildId = 'burster' | 'gambler' | 'steward' | 'weaver' | 'vault';

export interface ActiveBuild {
  buildId: BuildId | null;
  mechanicState: Record<string, any>;
}

export interface RunState {
  currentNodeId: string;
  currentFloor: number;
  playerHp: number;
  playerMaxHp: number;
  playerShield: number;
  essence: number; // single currency for the run, resets to 0 on run loss
  status: 'not_started' | 'combat' | 'rest_craft' | 'reward' | 'treasure' | 'store' | 'anomaly' | 'victory' | 'game_over';
  enemy: EnemyState | null;
  turnCount: number;
  logs: string[];
  combinationCounts: Record<string, number>; // key: "el1_el2_comp", value: count of times resolved
  stabilizedCores: string[]; // array of "el1_el2_comp" that are stabilized for this run
  seed: number;
  deckState: DeckState;
  deckCardIds?: string[];
  culture: Culture;
  nodes: RunNode[]; // generated procedurally
  boons: TypedBoon[]; // run-scoped temporary boons
  relics: string[]; // run-scoped relics held
  usedRelicIds?: string[]; // track once-per-run consumed relics
  visitedNodeIds?: string[];
  startingBankedBonus?: number;
  giftSkippedCount?: number;
  activeBuild?: ActiveBuild;
  lastMapBalance?: {
    netDamage: number;
    inBand: boolean;
    band: [number, number];
    attempts: number;
  };
}

export interface CombinationResult {
  baseValue: number;
  modifiedValue: number;
  relationType: 'same' | 'adjacent' | 'opposed' | 'single';
  multiplier: number;
  bonusText?: string;
  bonusEffect?: {
    type: 'damage' | 'shield' | 'heal' | 'dot';
    value: number;
  };
  opposedSuccess?: boolean;
  message: string;
  dotDuration?: number;
  dotDamage?: number;
}

export type DiscoveryState = 'notDiscovered' | 'discovered';

export interface NodeDefinition {
  id: number;
  type: 'fight' | 'rest_craft';
  enemyName?: string;
  enemyHp?: number;
  rewardTier?: 'same' | 'adjacent' | 'opposed';
}

