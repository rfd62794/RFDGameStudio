# ADR-002: Diminishing Returns on Repeated Claims

**Date:** August 22, 2026
**Status:** Accepted — implementation shipped, but the named success
metric (rival exposures moving off zero) did **not** move. Read the
Consequences section before assuming this closed the gap ADR-001 named.

## Context

ADR-001 shipped rival contradiction risk and named an explicit risk:
`CLAIM_THEMES` gives every figure exactly two flat, mutually-opposing
themes of equal value. Since `chooseRivalWhisperTheme` prefers repeating
a rival's own prior claim whenever one exists, and repeating a theme can
never contradict itself, "always repeat" is strictly dominant and
risk-free. ADR-001 predicted this could make the whole contradiction-risk
mechanism mechanically inert in practice, and asked the balance harness
to confirm or deny it.

It confirmed it. After ADR-001 landed, the balance harness reported
**rival exposures at exactly 0 across all 18 runs** (6 strategies × 3
origins). The mechanism was real and unit-tested in isolation, but never
fired in actual play.

## Decision

Implement the smaller of ADR-001's two named follow-up candidates:
diminishing returns on consecutive same-theme repeats. The larger
candidate — per-claimant claim memory (each claimant tracking only their
own prior claims, rather than the single shared `figure.mostRecentClaim`)
— remains explicitly deferred, per this directive's scope.

### Mechanic

`applyRepeatDecay(baseGain, consecutiveRepeats)` in `engine/favor.ts`:

```typescript
const REPEAT_DECAY_FLOOR_RATIO = 0.25;

export function applyRepeatDecay(baseGain: number, consecutiveRepeats: number): number {
  const ratio = Math.max(REPEAT_DECAY_FLOOR_RATIO, Math.pow(0.5, consecutiveRepeats));
  return Math.round(baseGain * ratio);
}
```

- `consecutiveRepeats = 0` (first claim of a theme, or first claim after
  switching away from it): full value.
- Each additional consecutive repeat of the *same* theme by the *same*
  claimant at the *same* figure halves the gain: 100% → 50% → 25% → 25%
  (floor holds indefinitely; repeating is never worthless, just
  increasingly inferior to switching).
- Switching themes resets to full value immediately.

**Curve choice:** halving with a 25% floor was picked as a real,
principled curve — not tuned to produce a specific harness result. It
was implemented and measured once, per this directive's explicit
instruction not to adjust the curve until the number "looks right."

### Where the state lives

`FigureState` gains an optional `repeatTracker?: Partial<Record<ClaimantId, RepeatState>>`
field (`engine/types.ts`), where `RepeatState = { themeId: string; count: number }`.
Optional, not required — `applyWhisper` treats a missing tracker as "this
claimant has never claimed at this figure," so the ~75 existing
`FigureState` object literals across the test suite did not need to be
touched. This deliberately trades interface purity for not making a
75-site mechanical edit for a decay-tracking concern those tests aren't
exercising.

`repeatTracker` is independent of `mostRecentClaim` — `mostRecentClaim`
still drives `checkContradiction` exactly as before; `repeatTracker`
only drives decay. This separation is what makes the mechanic auditable
in isolation (see Testing).

### Symmetry

`applyWhisper(figure, claimantId, newClaim, favorGain, themes)` applies
`applyRepeatDecay` identically regardless of `claimantId`. There is no
player/rival branch anywhere in the decay logic. `chooseRivalWhisperTheme`
in `engine/rivalAI.ts` was **not modified** — its preference logic still
unconditionally prefers repeating when a prior claim exists, exactly as
this directive scoped it. This is directly relevant to the finding
below.

## Testing

Five new tests in `tests/test_succession_favor.ts`:

- `applyRepeatDecay_returns_full_value_at_zero_repeats`
- `applyRepeatDecay_halves_on_each_consecutive_repeat_down_to_floor`
- `applyWhisper_decays_favor_on_consecutive_same_theme_repeat`
- `applyWhisper_restores_full_value_immediately_on_theme_switch` —
  because `CLAIM_THEMES` gives every figure exactly two
  *mutually-opposing* themes, a real in-game switch always triggers
  contradiction exposure first (there is no non-contradicting second
  theme at the same figure). To isolate the decay-reset logic from the
  contradiction engine, this test sets `mostRecentClaim: null` (so no
  contradiction fires) while priming `repeatTracker` as if two prior
  repeats already happened, then switches themes and confirms full
  value. This is a deliberate, documented test-isolation choice, not an
  oversight.
- `applyWhisper_repeat_decay_applies_identically_to_player_and_rival` —
  direct regression proving no player/rival asymmetry was reintroduced.

All 105 pre-existing tests pass unmodified — the decay only fires on the
2nd+ consecutive same-theme whisper by the same claimant at the same
figure, a case none of the pre-existing single-whisper assertions
exercise. `npx tsc --noEmit` is clean. Full count: **110/110** (105 + 5
new).

## Consequences

### Real balance impact: the win-rate landscape shifted substantially

Re-running the harness (6 strategies × 3 origins, 18 runs) after this
landed produced a **materially different aggregate table** from the
ADR-001 baseline:

| Strategy | Before (ADR-001) | After (ADR-002) |
|---|---|---|
| RushOneFigure | W:3 L:0 D:0, AvgMargin:+2.33 | W:1 L:2 D:0, AvgMargin:-1.00 |
| SpreadEvenly | W:3 L:0 D:0, AvgMargin:+1.67 | W:2 L:1 D:0, AvgMargin:+0.33 |
| SafeAppealsOnly | W:0 L:1 D:2, AvgMargin:-1.67 | W:1 L:1 D:1, AvgMargin:-0.33 |
| ScoutThenEvidence | W:2 L:0 D:1, AvgMargin:+0.33 | W:2 L:0 D:1, AvgMargin:+1.67 |
| WhisperHeavy | W:3 L:0 D:0, AvgMargin:+1.67 | **W:0 L:2 D:1, AvgMargin:-1.00** |
| DiscreditHeavy | W:1 L:0 D:2, AvgMargin:-0.33 | W:2 L:0 D:1, AvgMargin:+0.33 |

**WhisperHeavy went from tied-best strategy to worst**, and
**RushOneFigure fell from best to second-worst**. Both strategies
whisper the *same* figure repeatedly across many segments without
rotating targets — exactly the pattern the decay curve punishes hardest,
since consecutive same-theme repeats at one figure hit the 25% floor
fast. Strategies that naturally rotate targets (`SpreadEvenly`,
`ScoutThenEvidence`, `DiscreditHeavy`) held steady or improved, because
rotating resets decay more often. This is real, substantial, measured
evidence that the mechanic changes economic behavior — repeating the
same theme at the same figure is now a genuinely worse choice than it
was.

### The named success metric did NOT move: rival exposures are still 0/18

This is the actual test this directive specified, and it failed to
move:

```
Player exposures: 0 (runs with exposure: 0/18)
Rival exposures: 0 (runs with exposure: 0/18)
```

Identical to the ADR-001 baseline. **Diminishing returns alone is
confirmed insufficient to make rival contradiction risk fire in
practice.**

### Why, mechanically — this is the real finding

`chooseRivalWhisperTheme` was intentionally left unmodified by this
directive's scope: "unchanged in its *preference* logic (still prefers
repeating)." Its logic is unconditional — it repeats whenever a prior
claim exists at the target figure, full stop. It does not compare the
(now-decayed) value of repeating against the value of switching. A
repeat that yields 25%-floor value is *still zero-risk* from the rival
AI's point of view, because the AI's decision process never looks at
value at all — it only checks "is there a prior claim here?" Diminishing
returns changes what repeating is *worth*; it does not change *how the
rival AI decides* whether to repeat. Those are two different things, and
this directive fixed only the first one.

The player-side strategies in the harness are similarly scripted
(fixed move sequences per `succession-balance-sim.ts`), not adaptive —
none of them are written to detect decayed value and switch themes
either, which is a separate, secondary reason player exposures also
remain at 0. This was already true before this fix and is unaffected by
it; it is not part of this ADR's scope to address scripted-strategy
adaptivity.

### This is the finding to report, not a signal to keep tuning

Per this directive's explicit instruction: the decay curve was
implemented once (halving, 25% floor), measured once, and is being
reported honestly rather than adjusted until rival exposures move.
**The smaller fix does not close the gap ADR-001 named.** The larger,
previously-deferred fix — per-claimant claim memory *combined with*
making `chooseRivalWhisperTheme` actually reason about decayed value
(e.g., switch when the expected value of a decayed repeat falls below
the expected value of a fresh claim, discounted by contradiction risk)
— is now supported by direct harness evidence as the fix actually
required to move rival exposures off zero. That is a bigger change than
this directive's size warranted, exactly as ADR-001 flagged, and is not
undertaken here.

### What Changed

- `engine/types.ts`: `FigureState` gains optional `repeatTracker` field; new `RepeatState` interface
- `engine/favor.ts`: new `applyRepeatDecay` function; `applyWhisper` now tracks and applies per-claimant consecutive-repeat decay
- `tests/test_succession_favor.ts`: 5 new tests

### What Did NOT Change

- `engine/rivalAI.ts` `chooseRivalWhisperTheme` — preference logic untouched, per scope (this is exactly why exposures didn't move — see above)
- `engine/verdict.ts`, `engine/contradiction.ts`, `engine/gossip.ts` — read-only, no changes needed
- `ts/tools/succession-balance-sim.ts` — not modified; existing rival-exposure tracking (added for ADR-001) was sufficient to measure this fix
- All 105 pre-existing test assertions — unmodified, still pass
