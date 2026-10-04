/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum PartType {
  Head = "Head",
  Chest = "Chest",
  Arm = "Arm",
  Leg = "Leg"
}

export enum PartVariant {
  Biological = "Biological",
  Mechanical = "Mechanical"
}

export enum PartRarity {
  Common = "Common",
  Rare = "Rare",
  Epic = "Epic"
}

export interface Part {
  id: string;
  name: string;
  type: PartType;
  variant: PartVariant;
  // Stats ranges (1-10 scale)
  accuracy: number;  // Head focus: throw precision, tackle decision
  endurance: number; // Chest focus: HP/durability under contact
  power: number;     // Arm focus: throw power, tackle strength
  speed: number;     // Leg focus: movement speed
  price: number;     // Iron cost in Shop
  description: string;
  rarity?: PartRarity; // Common, Rare, Epic
  isNamed?: boolean;   // True if unique Named Part
  backstory?: string;  // small lore backstory
  bonusStat?: {        // slight bonus to specific stats
    accuracy?: number;
    endurance?: number;
    power?: number;
    speed?: number;
  };
  visualFlair?: string; // visual style/glowing details
}

export interface Equipment {
  id: string;
  name: string;
  description: string;
  price: number;
  statModifier: {
    accuracy?: number;
    endurance?: number;
    power?: number;
    speed?: number;
  };
  gatedBy?: {
    variant?: PartVariant;
    type?: PartType;
  };
}

export enum MutantRole {
  Carrier = "Carrier",       // Holds the ball, slowed by weight, advances
  Escort = "Escort",         // Protects carrier, blocks Blocker/Interceptor
  Interceptor = "Interceptor", // Targets carrier, tackles
  Blocker = "Blocker"        // Blocks Escort, clears Interceptor's path
}

export interface Mutant {
  id: string;
  name: string;
  parts: {
    [PartType.Head]: Part | null;
    [PartType.Chest]: Part | null;
    [PartType.Arm]: Part | null;
    [PartType.Leg]: Part | null;
  };
  equipment: Equipment | null;
  role: MutantRole;
  currentEndurance: number; // Current health in match / active recovery
  maxEndurance: number;     // Calculated from Chest part and items
  accuracy: number;         // Calculated from Head part and items
  power: number;            // Calculated from Arm part and items
  speed: number;            // Calculated from Leg part and items
  status: "Healthy" | "Injured" | "Dead";
  matchesPlayed: number;
  kills: number;            // Number of knockouts caused
  scores: number;           // Number of times scored
}

export interface SimAgent {
  id: string;
  name: string;
  role: MutantRole;
  team: "player" | "opponent";
  x: number;               // Position 0 to 100 on court
  y: number;               // Position 0 to 100 on court
  vx: number;
  vy: number;
  currentEndurance: number;
  maxEndurance: number;
  accuracy: number;
  power: number;
  speed: number;
  state: "active" | "knocked-out" | "pulled";
  recoveryTime: number;    // Knockout recover animation timer
  isPlayerMutant: boolean; // Link back to player's mutant if team is player
  mutantId?: string;       // Original mutant ID
}

export interface MatchSimulation {
  scorePlayer: number;
  scoreOpponent: number;
  ballX: number;
  ballY: number;
  ballVx: number;
  ballVy: number;
  ballCarrierId: string | null; // Agent ID of carrier
  scorchMarks: Array<{ x: number; y: number; opacity: number }>;
  agents: SimAgent[];
  state: "prematch" | "playing" | "paused" | "scored" | "ended";
  statusText: string;
  timeRemaining: number;
}

export interface InfirmaryBed {
  id: string;
  mutantId: string | null;
  matchesRemaining: number; // Matches to play before fully healed
}

export interface GameState {
  iron: number;
  partsInventory: Part[];
  mutants: Mutant[];
  infirmary: InfirmaryBed[];
  activeMatch: MatchSimulation | null;
  opponentTeam: {
    name: string;
    mutants: Array<{
      name: string;
      role: MutantRole;
      accuracy: number;
      endurance: number;
      power: number;
      speed: number;
    }>;
  };
  matchHistory: {
    result: "won" | "lost";
    scorePlayer: number;
    scoreOpponent: number;
    ironEarned: number;
    mutantInjuries: string[];
    mutantDeaths: string[];
  } | null;
}
