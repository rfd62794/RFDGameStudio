import { SportEngineConfig, PlayerStats, PlayerRole } from './types';

export const MBB_ARENA_CONFIG: SportEngineConfig = {
  sportName: 'Mutant Battle Ball (MBB)',
  court: {
    name: 'Mutant Cyber Colosseum',
    width: 80,
    height: 48,
    goalWidth: 10,
    goalDepth: 4,
    centerCircleRadius: 7,
    pickupRadius: 2.2,
    wallBounceFriction: 0.75,
    groundFriction: 0.92,
  },
  disposal: {
    allowedMethods: {
      kick: true,
      handball: true,
      touchBounce: true,
    },
    maxCarryDistanceWithoutTouch: 15.0, // AFL 15m anti-camping rule
    carryPenaltyType: 'turnover_loose_ball',
    minKickDistanceForMark: 12.0,
    markProtectionDurationTicks: 30, // 1.5 seconds at 20 ticks/sec
    maxTackleHoldTicks: 24,          // 1.2 seconds before holding ball call
  },
  combat: {
    violenceAllowed: true,
    canTargetNonCarriers: true,      // "Play the man" full strategic parity
    armorMitigatesSeverity: true,
    failedAttackPenalty: {
      causesTurnover: true,          // Blood Bowl rule: blunder costs turnover
      attackerStunChance: 0.35,
      attackerInjuryRoll: true,
    },
    severityTable: {
      stunnedChance: 0.35,
      downChance: 0.30,
      casualtyChance: 0.25,          // Removed from match
      fatalChance: 0.10,             // Permanent narrative kill
    },
    foulDownedPlayers: true,
  },
  goal: {
    primaryGoalPoints: 6,
    minorBehindPoints: 1,
    resetAfterScore: 'center_bounce',
  },
  ticksPerSecond: 20,
  matchDurationTicks: 2400, // 2 minutes (120s @ 20tps)
};

export const AFL_CYBER_DEATHBALL_CONFIG: SportEngineConfig = {
  ...MBB_ARENA_CONFIG,
  sportName: 'AFL Cyber Deathball',
  court: {
    name: 'Melbourne Steel Oval',
    width: 110,
    height: 70,
    goalWidth: 14,
    goalDepth: 5,
    centerCircleRadius: 9,
    pickupRadius: 2.0,
    wallBounceFriction: 0.8,
    groundFriction: 0.94,
  },
  disposal: {
    allowedMethods: {
      kick: true,
      handball: true,
      touchBounce: true,
    },
    maxCarryDistanceWithoutTouch: 15.0,
    carryPenaltyType: 'turnover_loose_ball',
    minKickDistanceForMark: 15.0,
    markProtectionDurationTicks: 36,
    maxTackleHoldTicks: 20,
  },
  combat: {
    violenceAllowed: true,
    canTargetNonCarriers: true,
    armorMitigatesSeverity: true,
    failedAttackPenalty: {
      causesTurnover: true,
      attackerStunChance: 0.40,
      attackerInjuryRoll: false,
    },
    severityTable: {
      stunnedChance: 0.45,
      downChance: 0.35,
      casualtyChance: 0.15,
      fatalChance: 0.05,
    },
    foulDownedPlayers: false,
  },
};

export const BLOOD_BOWL_GRID_CONFIG: SportEngineConfig = {
  ...MBB_ARENA_CONFIG,
  sportName: 'Blood Bowl Blitz Grid',
  court: {
    name: 'Altdorf Blood Field',
    width: 70,
    height: 40,
    goalWidth: 20,
    goalDepth: 3,
    centerCircleRadius: 5,
    pickupRadius: 1.8,
    wallBounceFriction: 0.6,
    groundFriction: 0.88,
  },
  disposal: {
    allowedMethods: {
      kick: true,
      handball: true,
      touchBounce: false, // Gridiron style carry
    },
    maxCarryDistanceWithoutTouch: 999.0, // No bounce rule in pure gridiron
    carryPenaltyType: 'turnover_loose_ball',
    minKickDistanceForMark: 10.0,
    markProtectionDurationTicks: 20,
    maxTackleHoldTicks: 15,
  },
  combat: {
    violenceAllowed: true,
    canTargetNonCarriers: true,
    armorMitigatesSeverity: true,
    failedAttackPenalty: {
      causesTurnover: true, // Blood Bowl core rule: any turnover ends phase
      attackerStunChance: 0.50,
      attackerInjuryRoll: true,
    },
    severityTable: {
      stunnedChance: 0.25,
      downChance: 0.30,
      casualtyChance: 0.30,
      fatalChance: 0.15,
    },
    foulDownedPlayers: true,
  },
};

export const PRESET_CONFIGS: Record<string, SportEngineConfig> = {
  mbb: MBB_ARENA_CONFIG,
  afl_deathball: AFL_CYBER_DEATHBALL_CONFIG,
  blood_bowl: BLOOD_BOWL_GRID_CONFIG,
};

export const DEFAULT_PLAYER_ARCHETYPES: Record<PlayerRole, PlayerStats> = {
  carrier: {
    speed: 8.5,
    strength: 55,
    toughness: 60,
    cyberArmor: 45,
    organicRatio: 0.7,
    kickSkill: 80,
    handballSkill: 88,
    markingSkill: 85,
    jumpReach: 70,
    aggression: 35,
  },
  chaser: {
    speed: 9.2,
    strength: 50,
    toughness: 55,
    cyberArmor: 40,
    organicRatio: 0.8,
    kickSkill: 75,
    handballSkill: 80,
    markingSkill: 78,
    jumpReach: 75,
    aggression: 45,
  },
  enforcer: {
    speed: 6.8,
    strength: 95,
    toughness: 90,
    cyberArmor: 85,
    organicRatio: 0.3, // Heavy cybernetics / plating
    kickSkill: 45,
    handballSkill: 60,
    markingSkill: 50,
    jumpReach: 55,
    aggression: 92, // Prioritizes playing the man!
  },
  receiver: {
    speed: 8.8,
    strength: 62,
    toughness: 65,
    cyberArmor: 50,
    organicRatio: 0.6,
    kickSkill: 78,
    handballSkill: 82,
    markingSkill: 94, // High clean mark reward
    jumpReach: 90,
    aggression: 40,
  },
  ruckman: {
    speed: 7.5,
    strength: 82,
    toughness: 80,
    cyberArmor: 70,
    organicRatio: 0.5,
    kickSkill: 70,
    handballSkill: 75,
    markingSkill: 88,
    jumpReach: 95, // Max vertical reach for aerial contests
    aggression: 70,
  },
  sweeper: {
    speed: 8.0,
    strength: 70,
    toughness: 75,
    cyberArmor: 65,
    organicRatio: 0.5,
    kickSkill: 85,
    handballSkill: 78,
    markingSkill: 82,
    jumpReach: 80,
    aggression: 60,
  },
};
