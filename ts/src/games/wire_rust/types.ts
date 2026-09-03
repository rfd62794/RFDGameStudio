export type CardId = 'copper_rod' | 'zinc_plate' | 'iron_block' | 'lead_solder';
export type InteractionType = 'salvage' | 'craft' | 'fight' | 'rest';

export interface Room {
  id: string;
  name: string;
  interaction_types: InteractionType[];
  connections: string[];
  difficulty?: number;
}

export interface Card {
  id: CardId;
  name: string;
  element: string;
  combat_mod: number;
  scrap_value: number;
}

export interface InventoryItem {
  id: string;
  quantity?: number;
}

export interface Inventory {
  items: InventoryItem[];
}

export interface PlayerState {
  hp: number;
  scrap: number;
  current_room_id: string;
  hand: CardId[];
  deck: InventoryItem[];
  inventory: Inventory;
}

export interface EncounterResult {
  won: boolean;
  total_score: number;
  difficulty: number;
  roll: number;
  synergies: string[];
  bonus: number;
  player: PlayerState;
}

export interface WireRustGameState {
  player: PlayerState;
  currentRoom: Room;
  combatHistory: string[];
  message: string;
}
