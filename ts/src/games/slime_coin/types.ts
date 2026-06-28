// types.ts — SlimeCoin TypeScript types

export interface SlimeCoin {
  id: number;
  type_id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  mass: number;
  radius: number;
  value: number;
}

export interface Obstacle {
  id: number;
  type_id: string;
  x: number;
  y: number;
  hits_remaining: number;
}

export interface ChipCard {
  card_id: string;
  name: string;
  rarity: 'common' | 'rare' | 'epic';
  description: string;
}

export interface PocketCoin {
  type_id: string;
  count: number;
}

export interface SlimeCoinGameState {
  phase: 'playing' | 'card_select' | 'run_end';
  round: number;
  total_rounds: number;
  score: number;
  target_score: number;
  score_rate: number;
  hand_in: number;
  max_hand_in: number;
  shooter_aim: number;
  pocket_coin_type: string | null;
  pusher_phase: number;
  pusher_speed: number;
  shelf_coins: SlimeCoin[];
  floor_coins: SlimeCoin[];
  obstacles: Obstacle[];
  owned_chips: string[];
  pocket_coins: Record<string, number>;
  active_modifiers: string[];
  combo_count: number;
  combo_timer: number;
  last_score_time: number;
  offered_cards: ChipCard[];
  selected_card: string | null;
}

export interface SlimeCoinInput {
  aim_x: number;
  fire: boolean;
  pocket_coin_type?: string;
}

export interface SlimeCoinRenderState {
  phase: string;
  round: number;
  score: number;
  target_score: number;
  score_rate: number;
  hand_in: number;
  shooter_aim: number;
  pusher_phase: number;
  shelf_coins: SlimeCoin[];
  floor_coins: SlimeCoin[];
  obstacles: Obstacle[];
  combo_count: number;
}

export interface SlimeType {
  id: string;
  name: string;
  mass: number;
  radius: number;
  value: number;
  color: string;
  description: string;
}

export interface PocketCoinType {
  id: string;
  name: string;
  effect: string;
  description: string;
  color: string;
}

export interface ObstacleType {
  id: string;
  name: string;
  bounce?: number;
  multiplier?: number;
  hits_to_collapse?: number;
  description: string;
  color: string;
}
