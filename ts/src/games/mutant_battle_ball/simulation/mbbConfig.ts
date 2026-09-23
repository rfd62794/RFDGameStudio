// MBB Config — match, disposal, and steering configuration.
// Extracted from mbbSimulation.ts as part of module decomposition.
//
// All values are byte-identical to the original monolith.

import type { PartSlot } from '../../../engine/shared/partSlots';
import type { Ball, PlayerStats, DisposalRules, CombatRules } from '../../../engine/shared/sportsSim';

export const PART_SLOTS: PartSlot[] = ['head', 'chest', 'left_arm', 'right_arm', 'left_leg', 'right_leg'];

export const CONFIG = {
  match: {
    court_width: 100,
    court_height: 60,
    duration: 180,
    timeouts: 3,
    tackle_range: 6.0,
    block_range: 7.0,
    carrier_speed_mult: 0.85,
    tackle_stun_time: 1.2,
    end_zone_depth: 10,
    point_cap: 3,
    team_size: 2 as 2 | 6, // Configurable roster size: 2v2 (default) or 6v6
  },
  // Disposal config — wired to sportsSim's DisposalSystem.
  // MBB-specific tuning: larger carry limit than AFL's 15m because
  // MBB's court is 100x60 (smaller than a real AFL ground but the
  // carrier needs ~60 units to reach the end zone — 15m would force
  // 4+ touch-bounces, killing all momentum).
  disposal: {
    allowedMethods: { kick: true, handball: true, touchBounce: true },
    maxCarryDistanceWithoutTouch: Infinity, // MBB: no anti-camping limit (AFL rule doesn't fit MBB's small court)
    carryPenaltyType: 'turnover_loose_ball' as const,
    minKickDistanceForMark: 10.0,       // 10m minimum for a protected mark
    markProtectionDurationTicks: 20,    // 1.0s protected disposal window
    maxTackleHoldTicks: 20,             // 1.0s to dispose under tackle pressure
  } as DisposalRules,
  // Steering tuning — MBB-specific, not Shoal's reef-sim numbers.
  // maxSpeed derives from each agent's speed stat (speed * 0.5, matching
  // the Lua base_spd formula). maxForce controls turn agility; set to
  // 2x maxSpeed so agents can redirect within ~0.5s without snapping.
  steering: {
    max_force_ratio: 2.0,       // maxForce = maxSpeed * ratio
    carrier_flee_radius: 20,    // flee tacklers within this range
    carrier_flee_weight: 1.2,   // evasion slightly outweighs pure seek
    carrier_seek_weight: 1.0,
    tackler_pursue_weight: 1.0,
    escort_interpose_weight: 1.0,
    escort_arrive_radius: 8,    // slow down near the blocking position
    drag: 0.92,                 // per-tick velocity retention (dt-scaled)
  },
  // Combat config — wired to sportsSim's CombatSystem.
  // MBB-specific severity table: Blood Bowl-inspired four-tier ladder.
  // Stunned is most common (brief recovery), down is significant (out of
  // the drive), casualty removes the mutant for the match, fatal is rare
  // but permanent. Failed-violence consequences are real: a badly missed
  // tackle stuns the attacker and causes a turnover.
  combat: {
    violenceAllowed: true,
    canTargetNonCarriers: true,
    armorMitigatesSeverity: true,
    failedAttackPenalty: {
      causesTurnover: true,       // Blood Bowl rule: failed violence = turnover
      attackerStunChance: 1.0,    // Always stunned on blunder
      attackerInjuryRoll: false,
    },
    severityTable: {
      stunnedChance: 0.45,        // 45% — brief, recoverable (2.5s)
      downChance: 0.30,           // 30% — out of the play (6s or sub)
      casualtyChance: 0.18,       // 18% — removed for remainder of match
      fatalChance: 0.07,          //  7% — permanent kill
    },
    foulDownedPlayers: false,     // Can't attack players already on ground
  } as CombatRules,
  // Combat cooldown — after any combat attempt (hit, armor, blunder),
  // the attacker must wait this many ticks before attempting again.
  // Without this, tacklers attack every tick, causing the carrier to
  // be stunned/downed almost instantly. The old Lua system had an
  // implicit cooldown via the 50% fail rate (tackler stunned on fail).
  combatCooldownTicks: 60, // 3 seconds at 20 tps — prevents per-tick spam
};

export interface Agent {
  id: string;
  name: string;
  team: 'player' | 'opponent';
  color: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  speed: number;
  power: number;
  accuracy: number;
  endurance: number;
  health: number;
  maxHealth: number;
  role: 'carrier' | 'escort' | 'tackler' | 'inactive';
  status: 'active' | 'stunned' | 'down' | 'subbed';
  stunTimer: number;
  mutantId: string;
  // sportsSim integration fields — used by DisposalSystem and future
  // decision-system/combat-system integrations
  playerStats: PlayerStats;              // Mapped from MBB's 4 stats + cyber-organic lean
  distanceCarriedWithoutTouch: number;   // AFL 15m anti-camping tracker
  tackledTicks: number;                  // Ticks under active tackle pressure
  tackledByPlayerId: string | null;      // Who is tackling this agent
  markProtectionTicks: number;           // Protected window after a clean mark
  disposalCooldownTicks: number;         // Cooldown after disposing (prevents spam)
  combatCooldownTicks: number;           // Cooldown after combat attempt (prevents per-tick spam)
  statsMatch: {                          // Per-match disposal/combat tracking
    kicks: number;
    handballs: number;
    marks: number;
    tackles: number;
    hitsInflicted: number;
    injuriesInflicted: number;
    casualtiesCaused: number;
    turnoversConceded: number;
    goals: number;
    distanceRun: number;
  };
}

export interface MatchConfig {
  match: typeof CONFIG.match;
}

export interface MbbState {
  agents: Agent[];
  ball: Ball;
  possession: 'player' | 'opponent';
  scorePlayer: number;
  scoreOpponent: number;
  timeRemaining: number;
  timeoutsLeft: number;
  state: 'playing' | 'paused_sub' | 'timeout' | 'scored' | 'ended';
  events: Array<Record<string, unknown>>;
  config: MatchConfig;
  prng: () => number;
  tickCount: number; // For DisposalSystem event IDs
}
