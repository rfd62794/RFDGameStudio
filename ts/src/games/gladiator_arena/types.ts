/**
 * Gladiator Arena — Core Type Definitions
 * Inspired by RimWorld (Continuous Anatomy), Blood Bowl (Consequence & Recoil),
 * How Many Dudes (Roster & Tag-Team State), and Swords & Sandals (Champion Ladder & Arena Showman)
 *
 * Anatomy types (BodySlot, BodyPart, CompatibilityReport, SeverityLevel, PartOrigin,
 * PartRarity) are imported from the shared anatomy module — they are genuinely
 * game-agnostic infrastructure, not Gladiator-Arena-local code. The shared
 * module lives at ts/src/engine/shared/anatomy/.
 */

export type {
  BodySlot,
  BodyPart,
  CompatibilityReport,
  SeverityLevel,
  PartOrigin,
  PartRarity,
  AnatomySubject,
} from '../../engine/shared/anatomy/types';

import type { BodySlot, BodyPart } from '../../engine/shared/anatomy/types';

export type ActionType = 'quick_attack' | 'power_attack' | 'charge' | 'defend' | 'taunt' | 'tag_out';

export interface ActionScore {
  action: ActionType;
  score: number;
  reason: string;
}

export interface CombatLogEntry {
  id: string;
  round: number;
  turnNumber: number;
  actorId: string;
  actorName: string;
  actorIsPlayer: boolean;
  action: ActionType;
  targetId?: string;
  targetName?: string;
  targetSlot?: BodySlot;
  hit: boolean;
  crit: boolean;
  damageDealt: number;
  recoilDamageDealt?: number; // Blood Bowl failed violence recoil
  malfunctionTriggered?: boolean;
  malfunctionEffect?: string;
  severity?: import('../../engine/shared/anatomy/types').SeverityLevel;
  tagTeammateId?: string;
  tagTeammateName?: string;
  crowdFavorDelta?: number;
  message: string;
}

export interface Gladiator {
  id: string;
  name: string;
  title: string;
  personality: 'berserker' | 'tactician' | 'showman' | 'brawler' | 'survivor';
  frameId: string;
  parts: Record<BodySlot, BodyPart>;
  wins: number;
  losses: number;
  kills: number;
  totalDamageDealt: number;
}

export interface ArenaOpponent {
  id: string;
  name: string;
  title: string;
  avatarSeed: string;
  difficulty: 'novice' | 'veteran' | 'champion' | 'boss';
  gladiators: Gladiator[]; // Solo (1) or Team (2-3)
  arenaTier: number;
  purseReward: number;
  description: string;
  hazard?: ArenaHazard;
  specialLootPart?: BodyPart;
}

export interface ArenaHazard {
  id: string;
  name: string;
  iconName: string;
  description: string;
  effect: (round: number) => { description: string; effectType: string };
  cyberModifier?: number;  // modifier for cybernetic parts
  organicModifier?: number; // modifier for organic parts
}

export interface ArenaTier {
  id: number;
  name: string;
  location: string;
  description: string;
  minWinsToUnlock: number;
  opponents: ArenaOpponent[];
  champion: ArenaOpponent;
}

export interface BoutState {
  id: string;
  opponent: ArenaOpponent;
  isTeamBout: boolean;
  playerRoster: Gladiator[];
  enemyRoster: Gladiator[];
  activePlayerIndex: number;
  activeEnemyIndex: number;
  round: number;
  crowdFavor: number; // -100 (Hostile) to +100 (Adoring)
  isFinished: boolean;
  winner: 'player' | 'enemy' | null;
  logs: CombatLogEntry[];
  currentTurnActor: 'player' | 'enemy';
  playerDefenseActive: boolean;
  enemyDefenseActive: boolean;
  playerVulnerable: boolean; // From failed Power Attack recoil
  enemyVulnerable: boolean;
  playerStunned: boolean;
  enemyStunned: boolean;
  playerAdrenalineNextCrit: boolean; // From Taunt
  enemyAdrenalineNextCrit: boolean;
}

export interface SurgeonTreatment {
  type: 'patch_wounds' | 'scar_regeneration' | 'prosthetic_graft';
  slot: BodySlot;
  cost: number;
  hpRestored: number;
  scarRemoved: number;
}
