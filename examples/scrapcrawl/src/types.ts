export type GearSlot = "weapon" | "shield" | "armor";
export type InteractionType = "fight" | "craft" | "rest" | "home" | "recruit" | "breed";
export type CatalogId = "beatStick" | "shield" | "bodyArmor" | "tool";

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
  name?: string;
  interactionTypes: InteractionType[];
  connections: string[];       // room IDs reachable from here
  difficulty?: number;         // required if "fight" is in interactionTypes
}

export interface Combatant {
  atk: number;              // flat attack contribution to combat score
  proficiencyXp: number;    // drives this combatant's own growthFactor
  label: "player" | "companion";
}

export interface Slime {
  id: string;
  name: string;
  vit: number;
  pwr: number;
  agi: number;
  xp: number;
  generation: number;              // 0 for recruited, parent-max+1 for bred
  parentIds?: [string, string];    // undefined for generation 0
}

export interface SculptedContent {
  flavorText: string;
  difficultyModifier: number;   // clamped [-3, 3]
  rewardModifier: number;       // clamped [-2, 2]
  source: "llm" | "fallback";
}

export interface PlayerState {
  currentRoomId: string;
  scrap: number;
  tier2Unlocked: boolean;
  equipped: Partial<Record<GearSlot, Equipment>>;
  proficiencyXp: Record<GearSlot, number>;
  roster: Slime[];
  activeCompanionId?: string;   // must reference an id in roster, or be undefined
  sculptedCache: Record<string, SculptedContent>;
}
