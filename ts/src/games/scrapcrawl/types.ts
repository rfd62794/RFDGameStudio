export type GearSlot = 'weapon' | 'shield' | 'armor';
export type InteractionType = 'fight' | 'craft' | 'rest' | 'home';
export type CatalogId = 'beatStick' | 'shield' | 'bodyArmor' | 'tool';

export interface Stats {
  hp: number;
  atk: number;
  def: number;
}

export interface Equipment {
  id: string;
  slot: GearSlot;
  catalogId: CatalogId;
  tier: 1 | 2;
  life: number;
  maxLife: number;
}

export interface Room {
  id: string;
  name: string;
  interaction_types: InteractionType[];
  connections: string[];
  difficulty?: number;
}

export interface CatalogEntry {
  id: CatalogId;
  name: string;
  slot?: GearSlot;
  tierCost: Record<1 | 2, number>;
  baseStats: Record<1 | 2, Partial<Stats>>;
  maxLife: Record<1 | 2, number>;
}

export interface ProficiencyXp {
  weapon: number;
  shield: number;
  armor: number;
}

export interface PlayerState {
  currentRoomId: string;
  scrap: number;
  tier2Unlocked: boolean;
  equipped: Partial<Record<GearSlot, Equipment>>;
  proficiencyXp: ProficiencyXp;
  roster: unknown[];
  activeCompanionId?: string;
  sculptedCache: Record<string, unknown>;
}

export interface FightResult {
  won: boolean;
  scrapGained: number;
  roll: number;
  score: number;
  difficulty: number;
  player: PlayerState;
}

export interface ScrapCrawlGameState {
  player: PlayerState;
  currentRoom: Room;
  combatHistory: string[];
  lastResult?: FightResult;
  message: string;
}
