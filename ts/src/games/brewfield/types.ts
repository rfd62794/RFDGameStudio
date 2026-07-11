export type ElementType = 'fire' | 'water' | 'earth' | 'air';
export type ComponentType = 'strike' | 'ward' | 'mend' | 'blight';
export type CombinationType = 'same' | 'adjacent' | 'opposed' | 'single';
export type ResidueTag = 'burning' | 'soaked' | 'fortified' | 'windswept';
export type NodeType = 'fight' | 'forage' | 'rest';

export interface ResidueStatus {
  tag: ResidueTag;
  level: number;
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
  dodgeCharges: number;
  retaliateCharges: number;
  decayingShield: number;
  burnDebuff: number;
}

export interface BrewResult {
  name: string;
  combination: CombinationType;
  primaryElement: ElementType;
  secondaryElement: ElementType | null;
  component: ComponentType;
  damage: number;
  shield: number;
  heal: number;
  dotDamage: number;
  dotDuration: number;
  slowStrength: number;
  dodgeGranted: number;
  retaliateDamage: number;
  decayingShield: number;
  slowTurns: number;
  cauterize: boolean;
  detonateNextTurn: boolean;
  stripBuffs: boolean;
  weaknessStacks: number;
  ticksActiveDoTs: boolean;
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

export interface RunNode {
  id: number;
  type: NodeType;
  name: string;
  enemy?: 'ashling' | 'bulwark' | 'molten_ashling' | 'rootbound';
  completed: boolean;
}

export interface BrewfieldGameState {
  player: PlayerState;
  enemy: EnemyState | null;
  currentTurn: number;
  residues: ResidueStatus[];
  drawPile: ElementType[];
  hand: ElementType[];
  discardPile: ElementType[];
  deck: ElementType[];
  nodes: RunNode[];
  currentNodeId: number;
  gameLogs: GameLog[];
  stats: RunStats;
  combatOutcome: 'victory' | 'defeat' | null;
  forageOptions: ElementType[] | null;
  screen: 'intro' | 'run' | 'game_over';
  runWon: boolean;
}
