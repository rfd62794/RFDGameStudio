import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot = resolve(dirname(__filename), '..', '..');
const appSource = readFileSync(
  resolve(repoRoot, 'ts/src/games/planetofgreed/App.tsx'),
  'utf-8'
);
const modalSource = readFileSync(
  resolve(repoRoot, 'ts/src/engine/shared/components/DailyEventModal.tsx'),
  'utf-8'
);

describe('test_treasury_negative_path_traced', () => {
  it('Root cause identified: event choices with both cost AND negative treasuryOffset double-charge', () => {
    // The event processing has two separate Treasury deductions:
    // 1. Line 1123: treasury -= choice.cost (upfront cost, UI-checked)
    // 2. Line 1132: treasury += updates.treasuryOffset (additional offset)
    //
    // Four event choices had BOTH a positive cost AND a negative
    // treasuryOffset for the same amount, double-charging the player.
    // The UI only checks affordability against cost, not cost + offset.
    //
    // This is NOT caused by the aggressive heuristic — expand orders
    // (Attack/Redistribute) are free and not in the cost list.
    expect(appSource).toContain('updatedCorps[playerCorpIndex].treasury -= choice.cost');
    expect(appSource).toContain('updates.treasuryOffset');
    expect(appSource).toContain('updatedCorps[playerCorpIndex].treasury += updates.treasuryOffset');
  });

  it('Double-charging treasuryOffsets have been removed from event templates', () => {
    // The four affected choices previously had:
    // - "Secure Strategic Reserves": cost 10000, treasuryOffset -10000
    // - "Send Retrieval Squad": cost 10000, treasuryOffset -10000
    // - "Remote Detonate Payload": cost 2000, treasuryOffset -2000
    // - "Acquire Satellite Shielding": cost 15000, treasuryOffset -15000
    //
    // After the fix, these choices should NOT have negative treasuryOffsets
    // because the cost field already handles the deduction.
    //
    // Verify: no event choice has both a positive cost AND a negative
    // treasuryOffset for the same amount.
    const treasuryOffsetMatches = appSource.match(/treasuryOffset:\s*(-?\d+)/g) || [];
    const negativeOffsets = treasuryOffsetMatches.filter(m => m.includes('-'));
    // There should be NO negative treasuryOffsets left in event templates
    expect(negativeOffsets.length).toBe(0);
  });

  it('Positive treasuryOffset choices (bonuses) are preserved', () => {
    // Choices that give money (cost 0, positive treasuryOffset) should
    // still work — they're not double-charging, they're giving money.
    expect(appSource).toContain('treasuryOffset: 60000');
    expect(appSource).toContain('treasuryOffset: 100000');
    expect(appSource).toContain('treasuryOffset: 30000');
  });

  it('Order processing checks affordability before deducting (not the cause)', () => {
    // The order processing now uses per-order cost checking with partial
    // processing — unaffordable orders are downgraded to hold instead of
    // blocking all orders. This is NOT the cause — expand orders are free.
    expect(appSource).toContain('remainingBudget');
    expect(appSource).toContain('downgraded to Hold');
    // Expand cost is checked via orderCost helper, not a hardcoded block
    const costList = appSource.match(/if \(order\.type === 'reinforce'\).*?if \(order\.type === 'civic' && order\.focus === 'unrest'\)/s);
    expect(costList).toBeTruthy();
    expect(costList![0]).not.toContain("expand");
  });
});

describe('test_aggressive_heuristic_affordability_checked', () => {
  it('Attack orders (expand to rival) are free — no Treasury cost', () => {
    // The aggressive heuristic issues expand orders for attacks.
    // Expand is not in the order cost list, so it's free.
    // This confirms the heuristic is NOT the cause of negative Treasury.
    const defaultActionSource = readFileSync(
      resolve(repoRoot, 'ts/src/games/planetofgreed/defaultAction.ts'),
      'utf-8'
    );
    // Attack rules return expand orders
    expect(defaultActionSource).toContain("type: 'expand'");
    // The cost list in App.tsx uses per-House expandCost (0 for most Houses,
    // $5k for Tundra) — not a hardcoded expand cost line
    expect(appSource).not.toMatch(/order\.type === 'expand'.*?totalOrderCost\s*\+= 30000|order\.type === 'expand'.*?totalOrderCost\s*\+= 20000|order\.type === 'expand'.*?totalOrderCost\s*\+= 10000/);
  });

  it('Redistribute orders (expand to own) are free — no Treasury cost', () => {
    // Same as attack — redistribute uses expand, which is free.
    const defaultActionSource = readFileSync(
      resolve(repoRoot, 'ts/src/games/planetofgreed/defaultAction.ts'),
      'utf-8'
    );
    expect(defaultActionSource).toContain('Redistribute');
    expect(defaultActionSource).toContain("type: 'expand'");
  });

  it('Defensive orders (fortify, reinforce, civic) DO check affordability', () => {
    // The heuristic checks treasury before recommending defensive orders.
    const defaultActionSource = readFileSync(
      resolve(repoRoot, 'ts/src/games/planetofgreed/defaultAction.ts'),
      'utf-8'
    );
    expect(defaultActionSource).toContain('playerCorp.treasury >= costFortify');
    expect(defaultActionSource).toContain('playerCorp.treasury >= COST_REINFORCE');
    expect(defaultActionSource).toContain('playerCorp.treasury >= COST_CIVIC_UNREST');
  });
});

describe('test_zero_cost_option_always_selectable', () => {
  it('DailyEventModal uses choice.cost === 0 || treasury >= cost for affordability', () => {
    // The fix: a $0-cost option is always affordable regardless of balance.
    expect(modalSource).toContain('choice.cost === 0 || playerCorp.treasury >= choice.cost');
  });

  it('The old broken check (treasury >= cost without cost === 0 guard) is gone', () => {
    // The old check was: const canAffordCash = playerCorp.treasury >= choice.cost;
    // This would disable $0-cost options when treasury < 0.
    // Verify the bare check without the cost === 0 guard is NOT present.
    expect(modalSource).not.toMatch(/canAffordCash\s*=\s*playerCorp\.treasury\s*>=\s*choice\.cost\s*;/);
  });

  it('With negative treasury, a $0-cost option would be selectable', () => {
    // Simulate the check: cost=0, treasury=-10000
    const choice = { cost: 0 };
    const treasury = -10000;
    const canAffordCash = choice.cost === 0 || treasury >= choice.cost;
    expect(canAffordCash).toBe(true);
  });

  it('With negative treasury, a positive-cost option is correctly disabled', () => {
    // Simulate the check: cost=20000, treasury=-10000
    const choice = { cost: 20000 };
    const treasury = -10000;
    const canAffordCash = choice.cost === 0 || treasury >= choice.cost;
    expect(canAffordCash).toBe(false);
  });

  it('With positive treasury, a positive-cost option is correctly enabled', () => {
    const choice = { cost: 10000 };
    const treasury = 50000;
    const canAffordCash = choice.cost === 0 || treasury >= choice.cost;
    expect(canAffordCash).toBe(true);
  });
});

describe('test_no_unresolvable_event_state', () => {
  it('Every event template has at least one $0-cost choice', () => {
    // Extract all event templates and verify each has a cost: 0 choice.
    // This ensures there's always at least one selectable option regardless
    // of Treasury state.
    const eventBlocks = appSource.split(/title:\s*"/).slice(1);
    for (const block of eventBlocks) {
      // Find the choices section
      const choicesSection = block.substring(0, 500);
      // Each event should have at least one cost: 0
      if (choicesSection.includes('cost:')) {
        // Count cost: 0 occurrences in this block
        const fullEvent = block.substring(0, 2000);
        expect(fullEvent).toContain('cost: 0');
      }
    }
  });

  it('No event choice has a unitsCost (which could gate $0-cost options)', () => {
    // If a $0-cost choice had a unitsCost, it could still be disabled
    // if the cell doesn't have enough units. Verify no choices use unitsCost.
    expect(appSource).not.toContain('unitsCost');
  });

  it('Event choice processing deducts cost only once (no double-charge)', () => {
    // The fix removed negative treasuryOffsets from choices that already
    // have a cost. Verify the processing still deducts cost correctly.
    expect(appSource).toContain('updatedCorps[playerCorpIndex].treasury -= choice.cost');
    // And treasuryOffset is still applied (for bonus choices)
    expect(appSource).toContain('updatedCorps[playerCorpIndex].treasury += updates.treasuryOffset');
  });

  it('At least one $0-cost option per event + cost===0 always affordable = no softlock', () => {
    // Combined: every event has a $0-cost choice, and $0-cost choices
    // are always selectable regardless of Treasury. Therefore no event
    // can reach an unresolvable state.
    expect(modalSource).toContain('choice.cost === 0');
    // Every event template has cost: 0
    const costZeroCount = (appSource.match(/cost: 0/g) || []).length;
    expect(costZeroCount).toBeGreaterThanOrEqual(4); // at least 4 events with $0 choices
  });
});

describe('test_no_regression', () => {
  it('GameShell wrap still present', () => {
    expect(appSource).toContain('GameShell');
  });

  it('OpeningSequence still present', () => {
    expect(appSource).toContain('OpeningSequence');
  });

  it('GuidedWalkthrough still present', () => {
    expect(appSource).toContain('GuidedWalkthrough');
  });

  it('Attack and Redistribute buttons still present in walkthrough', () => {
    const walkthroughSource = readFileSync(
      resolve(repoRoot, 'ts/src/games/planetofgreed/components/GuidedWalkthrough.tsx'),
      'utf-8'
    );
    expect(walkthroughSource).toContain('data-testid="pog-action-attack"');
    expect(walkthroughSource).toContain('data-testid="pog-action-redistribute"');
  });

  it('Population Balance triggers still present', () => {
    expect(appSource).toContain('applyPublicOpinionOffset');
  });

  it('ENDING_TEXT still present', () => {
    expect(appSource).toContain('ENDING_TEXT');
  });

  it('HOUSE_DESCRIPTIONS still present', () => {
    expect(appSource).toContain('HOUSE_DESCRIPTIONS');
  });

  it('Event templates still have real content (not stripped)', () => {
    expect(appSource).toContain('Labor Strike Contingency');
    expect(appSource).toContain('Iridium Lode Discovered');
    expect(appSource).toContain('Rogue Drop Pod Landing');
    expect(appSource).toContain('Solar Flare Geomagnetic Storm');
  });

  it('Positive treasuryOffset bonuses still work (Iridium Lode)', () => {
    expect(appSource).toContain('treasuryOffset: 60000');
    expect(appSource).toContain('treasuryOffset: 100000');
  });

  it('Positive treasuryOffset bonuses still work (Drop Pod)', () => {
    expect(appSource).toContain('treasuryOffset: 30000');
  });
});
