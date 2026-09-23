export interface Point {
  x: number;
  y: number;
}

export interface Segment {
  x: number;
  y: number;
  angle: number;
}

export interface Snake {
  id: string;
  name: string;
  color: string;
  headColor: string;
  isNPC: boolean;
  segments: Segment[];
  angle: number;
  targetAngle: number;
  speed: number;
  radius: number;
  shieldCharges: number;
  magnetismRadius: number;
  fruitSenseRange: number;
  ghostTailCount: number;
  tailGrowthTimer: number;
  lastDecisionTime: number;
  isSlowing?: boolean;
  slowTimer?: number;
  score: number;
}

export interface Fruit {
  id: string;
  x: number;
  y: number;
  color: string;
  points: number;
  isGolden: boolean;
  pulseScale: number;
}

export interface EvolutionCard {
  id: string;
  title: string;
  description: string;
  iconName: string;
  rarity: 'common' | 'rare' | 'epic';
}

export interface HighScore {
  name: string;
  fruitsEaten: number;
  peakLength: number;
  evolutionsCollected: number;
  date: string;
}
