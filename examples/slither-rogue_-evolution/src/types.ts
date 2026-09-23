export interface Point {
  x: number;
  y: number;
}

export interface Segment {
  x: number;
  y: number;
  angle: number; // visual direction pointing to the next segment
}

export interface Snake {
  id: string;
  name: string;
  color: string;
  headColor: string;
  isNPC: boolean;
  segments: Segment[]; // index 0 is head
  angle: number; // current heading in radians
  targetAngle: number; // desired heading in radians
  speed: number; // speed in px/s
  radius: number; // visual & physical thickness radius
  shieldCharges: number; // Node Armor charges remaining
  magnetismRadius: number; // distance within which fruits are attracted
  fruitSenseRange: number; // distance within which off-screen fruits show navigation arrows
  ghostTailCount: number; // last N segments that cannot be stolen
  tailGrowthTimer: number; // accumulator for tail growth
  lastDecisionTime: number; // for NPC action updates
  isSlowing?: boolean; // if hit by slow venom
  slowTimer?: number;
  score: number; // tracks fruits eaten
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
  iconName: string; // lucide icon identifier
  rarity: 'common' | 'rare' | 'epic';
}

export interface HighScore {
  name: string;
  fruitsEaten: number;
  peakLength: number;
  evolutionsCollected: number;
  date: string;
}
