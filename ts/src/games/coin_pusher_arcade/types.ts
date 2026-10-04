/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface CoinType {
  id: string;
  name: string;
  color: string;
  borderColor: string;
  textColor: string;
  radius: number;
  mass: number;
  value: number;
  description: string;
  unlockRequirement: string;
  unlockedAtPushed: number;
  glow?: boolean;
}

export interface WheelReward {
  id: string;
  name: string;
  description: string;
  color: string;
  textColor: string;
  unlockedAtRounds: number;
  unlockRequirement: string;
}

export interface PocketCoinType {
  id: string;
  name: string;
  description: string;
  color: string;
  borderColor: string;
  textColor: string;
  unlockedAtPushed: number;
  unlockRequirement: string;
}

export interface PocketCoinInstance {
  id: string; // unique instance id
  typeId: string;
  isUsed: boolean;
}

export type BoardObjectType = 'peg' | 'bumper' | 'multiplier' | 'tower' | 'shield';

export interface BoardObject {
  id: string;
  type: BoardObjectType;
  x: number;
  y: number;
  radius: number;
  color: string;
  pulseTimer?: number;
  // Special properties
  health?: number; // for tower: drops coins on push contact, collapses when health reaches 0
  maxHealth?: number;
  multiplier?: number; // for multiplier peg
  duration?: number; // for temporary objects like shields
}

export interface ActiveCoin {
  id: string;
  typeId: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  borderColor: string;
  textColor: string;
  mass: number;
  value: number;
  isPocket?: boolean;
  pocketTypeId?: string;
  isSpawning?: boolean; // animation state
  scale?: number; // visual scale
  alpha?: number; // opacity
  glow?: boolean;
}

export interface LevelSettings {
  level: number;
  name: string;
  pushTarget: number;
  boardWidth: number;
  startingCoinsCount: number;
  comboWindowMs: number;
  gutterWidth: number; // width of side gutters where coins are lost
  pusherSpeed: number;
}

export interface GameStats {
  totalCoinsPushed: number;
  totalRoundsCleared: number;
  highScores: Record<number, number>; // level -> high score
}

export interface BoardTheme {
  id: string;
  name: string;
  bgColor: string;
  boardColor: string;
  pusherColor: string;
  wallColor: string;
  accentColor: string;
  unlockedAtCoins: number;
  description: string;
}
