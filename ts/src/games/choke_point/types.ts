export type TowerType = 'blocker' | 'turret';
export type EnemyType = 'crawler' | 'blaster';

export interface Enemy {
  id: string;
  type: EnemyType;
  x: number;
  y: number;
  hp: number;
  max_hp: number;
  preview_x: number;
  preview_y: number;
  preview_attack_target?: 'core' | { x: number; y: number } | null;
}

export interface Tower {
  type: TowerType;
  name: string;
  x: number;
  y: number;
  hp: number;
  max_hp: number;
  damage: number;
}

export interface ChokePointGameState {
  wave: number;
  round: number;
  energy: number;
  core_hp: number;
  towers: Tower[];
  enemies: Enemy[];
  history: string[];
}
