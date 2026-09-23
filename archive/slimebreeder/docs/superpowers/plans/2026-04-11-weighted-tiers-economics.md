# Weighted Tier Generation + Economics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace hardcoded tier-1 slime generation with weighted tier selection (60/30/10%) and update the value formula to produce GDD-range values (10G / 44G / 190G for T1/T1 / T2/T2 / T3/T3).

**Architecture:** Two utility functions change (computeBaseValue formula, generateSlime tier selection). All downstream code (store, UI) is tier-agnostic and requires no changes.

**Tech Stack:** TypeScript, Vitest 4, `vi.spyOn(Math, 'random')`

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `src/config.ts` | Modify | Add `TIER_WEIGHTS` tuning constant |
| `src/utils/economics.ts` | Modify | Replace linear formula with exponential lookup |
| `src/utils/slimeGenerator.ts` | Modify | Add `pickTier()`, replace hardcoded `colorTier = 1, shapeTier = 1` |
| `src/__tests__/economics.test.ts` | Modify | Fix broken T2/T2 assertion, add T3/T3 test |
| `src/__tests__/slimeGenerator.test.ts` | Modify | Replace two broken tests with tier-range and positivity tests |

**Do NOT touch:** `src/gameStore.ts`, `src/components/DisplayRooms.tsx`, or any other file. They consume `slime.actualValue` dynamically and need zero changes.

---

## Task 1: Update Economics Formula

**Files:**
- Modify: `src/__tests__/economics.test.ts`
- Modify: `src/utils/economics.ts`

The current formula `colorTier * 5 + shapeTier * 5` is linear. We replace it with a `TIER_VALUE` lookup so T1/T1=10, T2/T2=44, T3/T3=190 at zero variance. `TIER_VALUE` is private to `economics.ts` — it is a formula constant, not a designer tuning knob.

The existing test `"scales with higher tiers"` asserts `computeBaseValue(2, 2, 0) === 20`. With the new formula it will be 44. That test must be updated and a T3/T3 test added. The three variance tests and the min-1 test remain unchanged and must continue to pass.

- [ ] **Step 1.1: Update the failing test and add T3/T3 test**

Replace the entire contents of `src/__tests__/economics.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { computeBaseValue } from '../utils/economics'

describe('computeBaseValue', () => {
  it('returns 10 for two tier-1 traits with 0 variance', () => {
    expect(computeBaseValue(1, 1, 0)).toBe(10)
  })

  it('applies positive variance', () => {
    expect(computeBaseValue(1, 1, 0.1)).toBe(11)
  })

  it('applies negative variance', () => {
    expect(computeBaseValue(1, 1, -0.1)).toBe(9)
  })

  it('scales with higher tiers: T2/T2 = 44', () => {
    expect(computeBaseValue(2, 2, 0)).toBe(44)
  })

  it('scales with higher tiers: T3/T3 = 190', () => {
    expect(computeBaseValue(3, 3, 0)).toBe(190)
  })

  it('never returns less than 1', () => {
    expect(computeBaseValue(1, 1, -0.99)).toBeGreaterThanOrEqual(1)
  })
})
```

- [ ] **Step 1.2: Run the tests to confirm the two new/changed assertions fail**

Run: `npm test`

Expected: `"scales with higher tiers: T2/T2 = 44"` fails (received 20), `"scales with higher tiers: T3/T3 = 190"` fails (received 30). All other tests pass.

- [ ] **Step 1.3: Implement the new formula**

Replace the entire contents of `src/utils/economics.ts`:

```ts
/**
 * Private lookup: Gold contribution per trait tier.
 * T1+T1 = 10G, T2+T2 = 44G, T3+T3 = 190G (at 0 variance).
 * Lives here rather than config.ts because this is a formula constant,
 * not a designer tuning knob.
 */
const TIER_VALUE: Record<number, number> = { 1: 5, 2: 22, 3: 95 }

/**
 * Compute the actual Gold value of a slime.
 * @param colorTier - Tier rank of the color trait (1-3)
 * @param shapeTier - Tier rank of the shape trait (1-3)
 * @param variance  - Random variance in [-0.1, 0.1] applied as a multiplier
 */
export function computeBaseValue(
  colorTier: number,
  shapeTier: number,
  variance: number,
): number {
  const base = TIER_VALUE[colorTier] + TIER_VALUE[shapeTier]
  return Math.max(1, Math.round(base * (1 + variance)))
}
```

- [ ] **Step 1.4: Run the tests to confirm all pass**

Run: `npm test`

Expected: 6 tests in `economics.test.ts` pass. All other existing tests continue to pass.

- [ ] **Step 1.5: Commit**

```bash
git add src/__tests__/economics.test.ts src/utils/economics.ts
git commit -m "feat: replace linear economics formula with exponential tier-value lookup"
```

---

## Task 2: Add TIER_WEIGHTS to Config

**Files:**
- Modify: `src/config.ts`

`TIER_WEIGHTS` belongs in `src/config.ts` because it is a designer tuning knob. The shape is an array of `{ tier, weight }` objects so the weights are self-documenting and the total can be any value (the picker normalises at runtime).

No tests are needed for this step — it is a pure constant addition verified indirectly by the generator tests in Task 3.

- [ ] **Step 2.1: Add TIER_WEIGHTS to config**

Replace the entire contents of `src/config.ts`:

```ts
export const HATCH_DURATION_MS = 30_000
export const PEN_UPGRADE_COST = 20
export const DISPLAY_SLOT_COUNT = 2
export const DISPLAY_BASE_RATE = 0.5 // gold per second per colorTier x shapeTier

/**
 * Weighted rarity table for tier selection.
 * Weights are relative (they need not sum to 100).
 * Designer knob: adjust weights here to change drop rates.
 * Current targets: T1=60%, T2=30%, T3=10%
 */
export const TIER_WEIGHTS: { tier: number; weight: number }[] = [
  { tier: 1, weight: 60 },
  { tier: 2, weight: 30 },
  { tier: 3, weight: 10 },
]
```

- [ ] **Step 2.2: Run the tests to confirm nothing broke**

Run: `npm test`

Expected: all tests pass (same count as after Task 1).

- [ ] **Step 2.3: Commit**

```bash
git add src/config.ts
git commit -m "feat: add TIER_WEIGHTS rarity table to config"
```

---

## Task 3: Weighted Tier Selection in slimeGenerator

**Files:**
- Modify: `src/__tests__/slimeGenerator.test.ts`
- Modify: `src/utils/slimeGenerator.ts`

Two existing tests will break once `generateSlime` can produce tiers 2 and 3:

- `"has tier 1 color and shape in MVP"` — hard-asserts tier === 1, replaced with a range check
- `"actualValue is between 9 and 11"` — hard-asserts T1/T1 value range, replaced with a positivity check

The tier-picking logic is tested by mocking `Math.random` to known boundary values. Do NOT use statistical sampling — flaky (50 real samples could all be tier 1 even with correct code). Instead, verify the three boundary points of the weighted-pick algorithm directly.

**How the weighted pick works (for test design):**

```
TIER_WEIGHTS total = 100
r = Math.random() * 100

Math.random()=0.00  =>  r=0.0   =>  loop: 0.0-60=-60.0 <= 0              =>  tier 1
Math.random()=0.65  =>  r=65.0  =>  loop: 65.0-60=5.0 > 0, 5.0-30=-25 <= 0  =>  tier 2
Math.random()=0.95  =>  r=95.0  =>  loop: 95.0-60=35 > 0, 35-30=5 > 0, 5-10=-5 <= 0  =>  tier 3
```

Note: `Math.random` is called multiple times per `generateSlime()` — once for color index, once for shape index, once for colorTier, once for shapeTier, once for variance. When mocking to a constant value, all calls return the same value. Color/shape index picks are also affected, but since we only assert on `colorTier` and `shapeTier`, this is fine.

- [ ] **Step 3.1: Update the two broken tests and add tier-boundary tests**

Replace the entire contents of `src/__tests__/slimeGenerator.test.ts`:

```ts
import { describe, it, expect, vi, afterEach } from 'vitest'
import { generateSlime } from '../utils/slimeGenerator'

const COLORS = ['Red', 'Blue', 'Green']
const SHAPES = ['Blob', 'Spiked', 'Elongated']

afterEach(() => {
  vi.restoreAllMocks()
})

describe('generateSlime', () => {
  it('returns a slime with valid color', () => {
    const slime = generateSlime()
    expect(COLORS).toContain(slime.color)
  })

  it('returns a slime with valid shape', () => {
    const slime = generateSlime()
    expect(SHAPES).toContain(slime.shape)
  })

  it('colorTier and shapeTier are each 1, 2, or 3', () => {
    for (let i = 0; i < 50; i++) {
      const slime = generateSlime()
      expect([1, 2, 3]).toContain(slime.colorTier)
      expect([1, 2, 3]).toContain(slime.shapeTier)
    }
  })

  it('actualValue is positive and scales with tier', () => {
    for (let i = 0; i < 50; i++) {
      const slime = generateSlime()
      expect(slime.actualValue).toBeGreaterThanOrEqual(1)
    }
  })

  it('generates a unique id each call', () => {
    const ids = new Set(Array.from({ length: 50 }, () => generateSlime().id))
    expect(ids.size).toBe(50)
  })
})

describe('pickTier boundary values', () => {
  it('Math.random()=0.0 -> tier 1 (r lands in first bucket)', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.0)
    const slime = generateSlime()
    expect(slime.colorTier).toBe(1)
    expect(slime.shapeTier).toBe(1)
  })

  it('Math.random()=0.65 -> tier 2 (r lands in second bucket)', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.65)
    const slime = generateSlime()
    expect(slime.colorTier).toBe(2)
    expect(slime.shapeTier).toBe(2)
  })

  it('Math.random()=0.95 -> tier 3 (r lands in third bucket)', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.95)
    const slime = generateSlime()
    expect(slime.colorTier).toBe(3)
    expect(slime.shapeTier).toBe(3)
  })
})
```

- [ ] **Step 3.2: Run the tests to confirm the boundary tests fail**

Run: `npm test`

Expected failures: the three `pickTier boundary values` tests fail because `colorTier` is still hardcoded to 1. `"Math.random()=0.65 -> tier 2"` fails with `expected 1 to be 2`. `"Math.random()=0.95 -> tier 3"` fails with `expected 1 to be 3`. The `"Math.random()=0.0 -> tier 1"` test may coincidentally pass. All other tests pass.

- [ ] **Step 3.3: Implement pickTier and update generateSlime**

Replace the entire contents of `src/utils/slimeGenerator.ts`:

```ts
import { TIER_WEIGHTS } from '../config'
import { computeBaseValue } from './economics'
import type { Slime, SlimeColor, SlimeShape } from '../types'

const COLORS: SlimeColor[] = ['Red', 'Blue', 'Green']
const SHAPES: SlimeShape[] = ['Blob', 'Spiked', 'Elongated']

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

/**
 * Weighted random tier selection using TIER_WEIGHTS from config.
 * Weights are relative (need not sum to any specific value).
 */
function pickTier(): number {
  const total = TIER_WEIGHTS.reduce((sum, w) => sum + w.weight, 0)
  let r = Math.random() * total
  for (const { tier, weight } of TIER_WEIGHTS) {
    r -= weight
    if (r <= 0) return tier
  }
  // Fallback: floating-point edge case guard
  return TIER_WEIGHTS[TIER_WEIGHTS.length - 1].tier
}

export function generateSlime(): Slime {
  const color = pick(COLORS)
  const shape = pick(SHAPES)
  const colorTier = pickTier()
  const shapeTier = pickTier()
  // variance in [-0.1, 0.1]
  const variance = parseFloat((Math.random() * 0.2 - 0.1).toFixed(2))
  const actualValue = computeBaseValue(colorTier, shapeTier, variance)

  return {
    id: crypto.randomUUID(),
    color,
    shape,
    colorTier,
    shapeTier,
    variance,
    actualValue,
    createdAt: Date.now(),
  }
}
```

- [ ] **Step 3.4: Run all tests to confirm everything passes**

Run: `npm test`

Expected: all tests pass. Final counts:
- `economics.test.ts`: 6 tests
- `slimeGenerator.test.ts`: 8 tests (5 existing-equivalent + 3 boundary tests)
- Any other test files: unchanged, all passing

- [ ] **Step 3.5: Commit**

```bash
git add src/__tests__/slimeGenerator.test.ts src/utils/slimeGenerator.ts
git commit -m "feat: weighted tier selection in generateSlime using TIER_WEIGHTS"
```

---

## Verification Checklist

After all three tasks are complete, confirm:

- [ ] `npm test` reports zero failures
- [ ] `computeBaseValue(1, 1, 0)` returns `10`
- [ ] `computeBaseValue(2, 2, 0)` returns `44`
- [ ] `computeBaseValue(3, 3, 0)` returns `190`
- [ ] `generateSlime()` never returns `colorTier` or `shapeTier` outside `{1, 2, 3}`
- [ ] `Math.random()=0.65` mock produces tier 2 for both color and shape tiers
- [ ] No changes were made to `src/gameStore.ts`, `src/components/DisplayRooms.tsx`, or `src/types.ts`
