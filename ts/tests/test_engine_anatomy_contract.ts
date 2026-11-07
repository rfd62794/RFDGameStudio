// @vitest-environment node
//
// Engine shared anatomy — contract test at the public entry point (roadmap M7.3)
//
// Pins the module's own contract, not a game's use of it (the MBB body
// part synergy test covers Mutant Battle Ball's consumption). Every
// assertion is behaviour read from
// ts/src/engine/shared/anatomy/anatomyModule.ts.

import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  BODY_SLOTS,
  SLOT_WEIGHTS,
  applyDamageToSlot,
  calculateCompatibility,
  calculatePartEfficiency,
  getGladiatorAnatomySummary,
  rollHitSlot,
  rollMalfunction,
} from '../src/engine/shared/anatomy';
import type { AnatomySubject, BodyPart, BodySlot } from '../src/engine/shared/anatomy';
import { mulberry32 } from '../src/engine/shared/seededRandom';

afterEach(() => {
  vi.restoreAllMocks();
});

// ── Helpers ──────────────────────────────────────────────────────────

function makePart(slot: BodySlot, overrides: Partial<BodyPart> = {}): BodyPart {
  return {
    id: `test-${slot}`,
    name: `Test ${SLOT_WEIGHTS[slot].name}`,
    slot,
    origin: 'organic',
    cyberOrganicLean: 0,
    maxHp: 100,
    currentHp: 100,
    scarHpPenalty: 0,
    power: 10,
    speed: 10,
    armor: 0,
    accuracy: 10,
    critChance: 5,
    rarity: 'common',
    cost: 50,
    description: 'Contract-test part',
    ...overrides,
  };
}

function makeSubject(lean: number | Record<BodySlot, number> = 0): AnatomySubject {
  const parts = {} as Record<BodySlot, BodyPart>;
  for (const slot of BODY_SLOTS) {
    parts[slot] = makePart(slot, {
      cyberOrganicLean: typeof lean === 'number' ? lean : lean[slot],
    });
  }
  return { parts };
}

// ── 1. Slot table ────────────────────────────────────────────────────

describe('engine anatomy contract — slot table', () => {
  it('test_six_unique_slots_each_weighted_and_probabilities_sum_to_one', () => {
    expect(BODY_SLOTS).toHaveLength(6);
    expect(new Set(BODY_SLOTS).size).toBe(6);
    for (const slot of BODY_SLOTS) {
      expect(SLOT_WEIGHTS[slot]).toBeDefined();
    }
    const totalProbability = BODY_SLOTS.reduce(
      (sum, slot) => sum + SLOT_WEIGHTS[slot].hitProbability,
      0,
    );
    expect(Math.abs(totalProbability - 1)).toBeLessThanOrEqual(1e-9);
    const vitalSlots = BODY_SLOTS.filter(slot => SLOT_WEIGHTS[slot].vital);
    expect(vitalSlots.sort()).toEqual(['head', 'torso']);
  });
});

// ── 2. calculatePartEfficiency ───────────────────────────────────────

describe('engine anatomy contract — calculatePartEfficiency', () => {
  it('test_full_hp_is_one_and_zero_hp_is_zero', () => {
    expect(calculatePartEfficiency(makePart('head'))).toBe(1);
    expect(calculatePartEfficiency(makePart('head', { currentHp: 0 }))).toBe(0);
  });

  it('test_scar_penalty_shrinks_the_denominator', () => {
    // efficiency = currentHp / (maxHp - scarHpPenalty): 4 / (10 - 2) = 0.5
    const part = makePart('left_arm', { maxHp: 10, scarHpPenalty: 2, currentHp: 4 });
    expect(calculatePartEfficiency(part)).toBeCloseTo(0.5, 10);
  });

  it('test_result_is_always_within_zero_to_one', () => {
    expect(
      calculatePartEfficiency(makePart('torso', { currentHp: 999, maxHp: 100 })),
    ).toBe(1);
    expect(calculatePartEfficiency(makePart('torso', { currentHp: -50 }))).toBe(0);
    for (const currentHp of [-1000, -1, 0, 37, 90, 100, 101, 5000]) {
      const efficiency = calculatePartEfficiency(
        makePart('right_leg', { currentHp, scarHpPenalty: 10 }),
      );
      expect(efficiency).toBeGreaterThanOrEqual(0);
      expect(efficiency).toBeLessThanOrEqual(1);
    }
  });
});

// ── 3. applyDamageToSlot — severity ladder & armor ───────────────────

describe('engine anatomy contract — applyDamageToSlot severity ladder', () => {
  it('test_severity_ladder_one_case_per_rung', () => {
    // Stubbed above the 0.35 minor-scar roll so the 'stunned' branch is
    // deterministic (no scar chance fires).
    vi.spyOn(Math, 'random').mockReturnValue(0.99);

    // damageRatio < 0.2 → normal
    const normal = applyDamageToSlot(makePart('head'), 10);
    expect(normal.severity).toBe('normal');

    // damageRatio >= 0.2 boundary → bruised
    const bruisedBoundary = applyDamageToSlot(makePart('head'), 20);
    expect(bruisedBoundary.severity).toBe('bruised');

    // 0.2 <= damageRatio < 0.45 → bruised
    const bruised = applyDamageToSlot(makePart('head'), 30);
    expect(bruised.severity).toBe('bruised');

    // damageRatio >= 0.45 boundary, HP left → stunned
    const stunned = applyDamageToSlot(makePart('head'), 45);
    expect(stunned.severity).toBe('stunned');
    expect(stunned.newPartHp).toBeGreaterThan(0);

    // HP reaches 0 with ratio <= 0.7 and no crit → crippled
    const crippled = applyDamageToSlot(
      makePart('head', { currentHp: 60 }),
      60,
    );
    expect(crippled.newPartHp).toBe(0);
    expect(crippled.severity).toBe('crippled');

    // HP reaches 0 with ratio > 0.7 → dismembered
    const dismemberedByRatio = applyDamageToSlot(
      makePart('head', { currentHp: 80 }),
      80,
    );
    expect(dismemberedByRatio.newPartHp).toBe(0);
    expect(dismemberedByRatio.severity).toBe('dismembered');

    // any crit that reaches 0 → dismembered, even at a low ratio
    const dismemberedByCrit = applyDamageToSlot(
      makePart('head', { currentHp: 10 }),
      10,
      true,
    );
    expect(dismemberedByCrit.newPartHp).toBe(0);
    expect(dismemberedByCrit.severity).toBe('dismembered');
  });

  it('test_armor_capped_at_70_percent_and_damage_floor_is_one', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99);

    // Armor far above the damage: mitigation caps at 70% of raw, and the
    // Math.max(1, ...) floor keeps actualDamage at 1.
    const armored = applyDamageToSlot(makePart('torso', { armor: 1000 }), 4);
    expect(armored.actualDamage).toBe(1);
    expect(armored.armorReduced).toBeLessThanOrEqual(Math.round(4 * 0.7));

    // Effective armor can never remove more than 70% of raw damage.
    const heavy = applyDamageToSlot(makePart('torso', { armor: 10000 }), 100);
    expect(heavy.armorReduced).toBeLessThanOrEqual(Math.round(100 * 0.7));
    expect(heavy.actualDamage).toBe(30);
  });
});

// ── 4. applyDamageToSlot — mutation contract ─────────────────────────

describe('engine anatomy contract — applyDamageToSlot mutation', () => {
  it('test_writes_currentHp_and_scarHpPenalty_on_the_input_part', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99);
    // KNOWN: the doc comment above applyDamageToSlot calls it a "Pure
    // damage applicator", but it is not pure — it writes currentHp and
    // scarHpPenalty onto the caller's BodyPart. The contract is the real
    // (mutating) behaviour; the comment is stale.
    const part = makePart('left_leg', { currentHp: 50 });
    const result = applyDamageToSlot(part, 60);
    expect(result.newPartHp).toBe(0);
    expect(part.currentHp).toBe(0);
    expect(part.scarHpPenalty).toBeGreaterThan(0);
  });

  it('test_scarHpPenalty_never_exceeds_maxHp_minus_2_over_repeated_calls', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99);
    const part = makePart('right_arm');
    for (let i = 0; i < 10; i++) {
      applyDamageToSlot(part, 100);
      expect(part.scarHpPenalty).toBeLessThanOrEqual(part.maxHp - 2);
    }
  });
});

// ── 5. rollHitSlot ───────────────────────────────────────────────────

describe('engine anatomy contract — rollHitSlot', () => {
  it('test_weighted_scatter_matches_cumulative_slot_weights', () => {
    // Cumulative hitProbability in BODY_SLOTS order is
    // 0.15, 0.5, 0.625, 0.75, 0.875, 1.0 — first cumulative >= roll wins.
    const spy = vi.spyOn(Math, 'random');
    spy.mockReturnValue(0.99);
    expect(rollHitSlot()).toBe('right_leg');
    spy.mockReturnValue(0.1);
    expect(rollHitSlot()).toBe('head');
    spy.mockReturnValue(0.4);
    expect(rollHitSlot()).toBe('torso');
  });

  it('test_targeted_slot_returned_when_roll_is_below_65_percent', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    expect(rollHitSlot('left_arm')).toBe('left_arm');
  });

  it('test_thousand_seeded_draws_always_land_on_a_body_slot', () => {
    vi.spyOn(Math, 'random').mockImplementation(mulberry32(12345));
    for (let i = 0; i < 1000; i++) {
      expect(BODY_SLOTS).toContain(rollHitSlot());
    }
  });
});

// ── 6. rollMalfunction ───────────────────────────────────────────────

describe('engine anatomy contract — rollMalfunction', () => {
  it('test_zero_risk_returns_untriggered_without_calling_random', () => {
    const spy = vi.spyOn(Math, 'random');
    // Uniform lean → variance 0 → 'pure_synergy' → malfunctionRiskPercent 0.
    const subject = makeSubject(0);
    expect(calculateCompatibility(subject).malfunctionRiskPercent).toBe(0);
    expect(rollMalfunction(subject)).toEqual({ triggered: false, effect: null });
    expect(spy).toHaveBeenCalledTimes(0);
  });

  it('test_positive_risk_with_zero_roll_triggers_effect_on_a_body_slot', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    // Alternating ±1 leans → variance 1 → 'critical_rejection', risk 22.
    const subject = makeSubject({
      head: 1,
      torso: -1,
      left_arm: 1,
      right_arm: -1,
      left_leg: 1,
      right_leg: -1,
    });
    expect(calculateCompatibility(subject).malfunctionRiskPercent).toBeGreaterThan(0);
    const result = rollMalfunction(subject);
    expect(result.triggered).toBe(true);
    expect(typeof result.effect).toBe('string');
    expect(result.effect!.length).toBeGreaterThan(0);
    expect(BODY_SLOTS).toContain(result.slotAffected);
  });
});

// ── 7. getGladiatorAnatomySummary ────────────────────────────────────

describe('engine anatomy contract — getGladiatorAnatomySummary', () => {
  it('test_totals_equal_slot_sums_and_efficiencies_match_per_part_math', () => {
    const subject: AnatomySubject = {
      parts: {
        head: makePart('head', { maxHp: 40, currentHp: 40 }),
        torso: makePart('torso', { maxHp: 120, currentHp: 90, scarHpPenalty: 10 }),
        left_arm: makePart('left_arm', { maxHp: 60, currentHp: 30 }),
        right_arm: makePart('right_arm', { maxHp: 60, currentHp: 0, scarHpPenalty: 20 }),
        left_leg: makePart('left_leg', { maxHp: 80, currentHp: 80 }),
        right_leg: makePart('right_leg', { maxHp: 80, currentHp: 40, scarHpPenalty: 5 }),
      },
    };
    const summary = getGladiatorAnatomySummary(subject);
    const parts = subject.parts;

    // Exact key set returned by the function (lines 80-91 of the module).
    expect(Object.keys(summary).sort()).toEqual([
      'armEfficiency',
      'efficiencies',
      'headEfficiency',
      'isKnockedOut',
      'legEfficiency',
      'overallHpRatio',
      'torsoEfficiency',
      'totalCurrentHp',
      'totalMaxHp',
      'totalScars',
    ]);

    expect(summary.totalCurrentHp).toBe(
      BODY_SLOTS.reduce((sum, slot) => sum + parts[slot].currentHp, 0),
    );
    expect(summary.totalMaxHp).toBe(
      BODY_SLOTS.reduce((sum, slot) => sum + parts[slot].maxHp, 0),
    );
    expect(summary.totalScars).toBe(
      BODY_SLOTS.reduce((sum, slot) => sum + parts[slot].scarHpPenalty, 0),
    );
    expect(summary.overallHpRatio).toBeCloseTo(
      summary.totalCurrentHp / summary.totalMaxHp,
      10,
    );

    for (const slot of BODY_SLOTS) {
      expect(summary.efficiencies[slot]).toBe(calculatePartEfficiency(parts[slot]));
    }
    expect(summary.armEfficiency).toBeCloseTo(
      (summary.efficiencies.left_arm + summary.efficiencies.right_arm) / 2,
      10,
    );
    expect(summary.legEfficiency).toBeCloseTo(
      (summary.efficiencies.left_leg + summary.efficiencies.right_leg) / 2,
      10,
    );
    expect(summary.headEfficiency).toBe(summary.efficiencies.head);
    expect(summary.torsoEfficiency).toBe(summary.efficiencies.torso);
    expect(summary.isKnockedOut).toBe(false);
  });
});
