/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ElementType = 'fire' | 'water' | 'earth' | 'air';

export type ComponentType = 'strike' | 'ward' | 'mend' | 'blight';

export type CombinationType = 'same' | 'adjacent' | 'opposed' | 'single';

export type ResidueTag = 'burning' | 'soaked' | 'fortified' | 'windswept';

export interface ResidueStatus {
  tag: ResidueTag;
  level: number; // 1 to 3
}

export type NodeType = 'fight' | 'forage' | 'rest';

export interface RunNode {
  id: number;
  type: NodeType;
  name: string;
  description: string;
  enemyArchetype?: 'ashling' | 'bulwark' | 'molten_ashling' | 'rootbound';
  completed: boolean;
}

export interface EnemyIntent {
  action: 'attack' | 'defend' | 'heal' | 'debuff' | 'special';
  value: number;
  description: string;
}

export interface EnemyState {
  id: string;
  name: string;
  archetype: 'ashling' | 'bulwark' | 'molten_ashling' | 'rootbound';
  hp: number;
  maxHp: number;
  shield: number;
  intent: EnemyIntent;
}

export interface PlayerState {
  hp: number;
  maxHp: number;
  shield: number;
  dodgeCharges: number;      // Air Ward: chance to dodge next attack
  retaliateCharges: number;  // Fire Ward: reflects damage back
  decayingShield: number;    // Earth Ward: portion of shield that carries over
  burnDebuff: number;        // Stacks of burn on player (if any)
}

export interface BrewResult {
  name: string;
  combination: CombinationType;
  primaryElement: ElementType;
  secondaryElement: ElementType | null;
  component: ComponentType;
  
  // Numerical Outputs
  damage: number;
  shield: number;
  heal: number;
  dotDamage: number;
  dotDuration: number;
  
  // Special status outputs
  slowStrength: number; // reductions to enemy intent
  dodgeGranted: number;
  retaliateDamage: number;
  decayingShield: number;
  slowTurns: number;
  cauterize: boolean; // cleanses 1 debuff
  detonateNextTurn: boolean; // Fire Blight: deals massive damage next turn
  stripBuffs: boolean; // Water Blight
  weaknessStacks: number; // Earth Blight: reduces enemy intents
  ticksActiveDoTs: boolean; // Air Blight
  
  // Text summary
  description: string;
  color: string;
}

export interface GameLog {
  id: string;
  turn: number;
  sender: 'player' | 'enemy' | 'field' | 'system';
  message: string;
}

export interface RunStats {
  enemiesDefeated: number;
  totalDamageDealt: number;
  totalShieldGained: number;
  totalHealed: number;
  brewsCreated: number;
  volatileFails: number;
  volatileSuccesses: number;
}
