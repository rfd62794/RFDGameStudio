import { describe, it, expect } from 'vitest';
import { mapToPlayerStats, averageCyberOrganicLean } from '../src/games/mutant_battle_ball/statsMapper';
import type { MbbStats } from '../src/games/mutant_battle_ball/statsMapper';

// ─────────────────────────────────────────────────────────────────────
// mapToPlayerStats: MBB 4-stat model → sportsSim 10-stat PlayerStats
// Combat stats are normalized by PART_SLOTS.length (6); disposal and
// athleticism stats are left un-normalized (DisposalSystem calibration).
// ─────────────────────────────────────────────────────────────────────

const baseStats: MbbStats = {
  speed: 50,
  power: 120,
  accuracy: 60,
  endurance: 90,
  maxHealth: 200,
};

describe('test_mapToPlayerStats', () => {
  it('maps direct stats: speed→speed, power→strength/6, endurance→toughness/6', () => {
    const ps = mapToPlayerStats(baseStats, 50);
    expect(ps.speed).toBe(50);
    expect(ps.strength).toBe(20); // 120 / 6
    expect(ps.toughness).toBe(15); // 90 / 6
  });

  it('derives disposal skills from accuracy, un-normalized', () => {
    const ps = mapToPlayerStats(baseStats, 50);
    expect(ps.kickSkill).toBe(60); // accuracy direct
    expect(ps.handballSkill).toBeCloseTo(66); // accuracy * 1.1
    expect(ps.markingSkill).toBeCloseTo(54); // accuracy * 0.9
  });

  it('derives jumpReach from speed and power, un-normalized', () => {
    const ps = mapToPlayerStats(baseStats, 50);
    // 50 * 0.5 + 120 * 0.3 = 25 + 36 = 61
    expect(ps.jumpReach).toBe(61);
  });

  it('derives aggression from power, normalized for CombatSystem', () => {
    const ps = mapToPlayerStats(baseStats, 50);
    // (120 * 0.6 + 30) / 6 = (72 + 30) / 6 = 17
    expect(ps.aggression).toBe(17);
  });

  it('undefined cyberOrganicLean defaults to 50 (neutral → organicRatio 0.5)', () => {
    const ps = mapToPlayerStats(baseStats, undefined);
    expect(ps.organicRatio).toBe(0.5);
    // cyberArmor = (50/100 * 90) / 6 = 45 / 6 = 7.5
    expect(ps.cyberArmor).toBe(7.5);
  });

  it('lean 0 (fully organic) → organicRatio 1.0 and zero cyberArmor', () => {
    const ps = mapToPlayerStats(baseStats, 0);
    expect(ps.organicRatio).toBe(1);
    expect(ps.cyberArmor).toBe(0);
  });

  it('lean 100 (fully cyber) → organicRatio 0.0 and cyberArmor = toughness', () => {
    const ps = mapToPlayerStats(baseStats, 100);
    expect(ps.organicRatio).toBe(0);
    // cyberArmor = (100/100 * 90) / 6 = 15 — same as toughness at full cyber
    expect(ps.cyberArmor).toBe(15);
  });

  it('more cyber lean → more cyberArmor for the same endurance', () => {
    const organic = mapToPlayerStats(baseStats, 10);
    const cyber = mapToPlayerStats(baseStats, 90);
    expect(cyber.cyberArmor).toBeGreaterThan(organic.cyberArmor);
    expect(organic.organicRatio).toBeGreaterThan(cyber.organicRatio);
  });

  it('maxHealth is not part of PlayerStats (10-stat output shape)', () => {
    const ps = mapToPlayerStats(baseStats, 50);
    expect(Object.keys(ps).sort()).toEqual([
      'aggression',
      'cyberArmor',
      'handballSkill',
      'jumpReach',
      'kickSkill',
      'markingSkill',
      'organicRatio',
      'speed',
      'strength',
      'toughness',
    ]);
  });
});

// ─────────────────────────────────────────────────────────────────────
// averageCyberOrganicLean: averages lean across parts that define it;
// returns undefined when there is nothing to average.
// ─────────────────────────────────────────────────────────────────────

describe('test_averageCyberOrganicLean', () => {
  it('undefined parts → undefined', () => {
    expect(averageCyberOrganicLean(undefined)).toBeUndefined();
  });

  it('empty parts record → undefined', () => {
    expect(averageCyberOrganicLean({})).toBeUndefined();
  });

  it('all null parts → undefined', () => {
    expect(averageCyberOrganicLean({ head: null, chest: null })).toBeUndefined();
  });

  it('parts without cyberOrganicLean → undefined', () => {
    expect(
      averageCyberOrganicLean({ head: {}, chest: {} }),
    ).toBeUndefined();
  });

  it('averages lean across all parts that define it', () => {
    const parts = {
      head: { cyberOrganicLean: 60 },
      chest: { cyberOrganicLean: 30 },
      left_arm: { cyberOrganicLean: 90 },
    };
    // (60 + 30 + 90) / 3 = 60
    expect(averageCyberOrganicLean(parts)).toBe(60);
  });

  it('skips null parts and parts missing the lean field', () => {
    const parts = {
      head: { cyberOrganicLean: 80 },
      chest: null,
      left_arm: {},
      right_arm: { cyberOrganicLean: 40 },
    };
    // Only head (80) and right_arm (40) count → 60
    expect(averageCyberOrganicLean(parts)).toBe(60);
  });

  it('single part → that part\'s lean', () => {
    expect(averageCyberOrganicLean({ head: { cyberOrganicLean: 25 } })).toBe(25);
  });
});
