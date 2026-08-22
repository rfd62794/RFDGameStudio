# ADR-003: Value-Aware Rival Theme Selection

**Date:** August 22, 2026
**Status:** Accepted — implementation is real, correct, and tested, but
it produced **zero behavioral change** across all 18 harness runs. Read
the Consequences section in full before assuming this closed the gap.

## Context

ADR-002 gave repeating real economic cost (diminishing returns) but
`chooseRivalWhisperTheme` never consulted that cost — it repeated
unconditionally whenever a prior claim existed, at any decay level.
Rival exposures stayed at exactly 0/18 after that fix landed.

This directive's job: make `chooseRivalWhisperTheme` actually weigh the
decayed value of repeating against the full-value, contradiction-checked
payoff of switching, and — if exposures still didn't move — investigate
whether ADR-001's named shared-`mostRecentClaim` limitation was the real
blocker, rather than assuming it on paper.

## Decision

`chooseRivalWhisperTheme` now takes `(figure, claimantId, baseGain,
themes)` instead of `(figureId, priorClaim, themes)`, giving it access to
the claimant's own `repeatTracker` entry and the figure's actual current
`mostRecentClaim`:

```typescript
export function chooseRivalWhisperTheme(
  figure: FigureState,
  claimantId: ClaimantId,
  baseGain: number,
  themes: ClaimTheme[]
): string {
  const figureThemes = themes.filter((t) => t.figureId === figure.id);
  const ownRepeat = figure.repeatTracker?.[claimantId];

  if (!ownRepeat) {
    return figureThemes[0].id; // no prior claim — nothing to compare
  }

  const currentTheme = ownRepeat.themeId;
  const currentThemeDef = figureThemes.find((t) => t.id === currentTheme);
  const switchTheme =
    currentThemeDef?.opposesThemeId ??
    figureThemes.find((t) => t.id !== currentTheme)?.id ??
    currentTheme;

  const repeatExposed = checkContradiction(figure.mostRecentClaim, currentTheme, themes);
  const switchExposed = checkContradiction(figure.mostRecentClaim, switchTheme, themes);

  const repeatValue = repeatExposed ? 0 : applyRepeatDecay(baseGain, ownRepeat.count);
  const switchValue = switchExposed ? 0 : baseGain;

  return switchValue > repeatValue ? switchTheme : currentTheme;
}
```

**This is not a probabilistic risk model.** The game has perfect
information at decision time — `checkContradiction` against the figure's
actual current `mostRecentClaim` tells you *exactly*, not approximately,
whether repeating or switching would be caught right now. Both branches
(repeat and switch) are checked this way, not just switch — this
correctly handles the case where *repeating* has itself become the risky
option (see the shared-`mostRecentClaim` investigation below), not only
the naively-assumed case where switching is the risky one.

`gameOrchestration.ts`'s `resolveRivalMoves` was reordered so `rivalGain`
(including any origin-modifier bonus) is computed *before* calling
`chooseRivalWhisperTheme`, so the decision uses the same base value that
will actually be applied — not a stale constant.

## Testing

`tests/test_succession_rivalAI.ts`:
- Removed: the old two-argument-shape test for the pre-ADR-003
  `chooseRivalWhisperTheme(figureId, priorClaim, themes)` signature
  (superseded, signature changed).
- Kept, updated to new signature: `chooseRivalWhisperTheme_picks_fresh_theme_when_no_prior_claim`.
- New: `chooseRivalWhisperTheme_prefers_repeating_when_decay_has_not_eroded_enough_to_justify_switching` —
  isolated case, only this rival has claimed at the figure, proves
  repeating (even decayed) beats switching (guaranteed exposure, value 0).
- New: `chooseRivalWhisperTheme_prefers_switching_when_repeating_would_itself_be_exposed` —
  constructed interference case where another claimant's more recent
  claim at the same figure makes *repeating* the caught move, and
  switching the safe, full-value one. Proves the decision logic is a
  real two-sided comparison, not "always assume switch is risky."

Net test count change: -1 (removed) +2 (added) = **+1**. Full count:
**111/111** (110 existing + 1 net). `npx tsc --noEmit` clean.

## Consequences

### The decision logic is real and correctly implemented — proven in isolation

Both constructed test scenarios behave exactly as the value comparison
predicts. This is not a smoke test; the two scenarios are each other's
mirror image (repeat-favored vs. switch-favored) and both pass.

### It produced ZERO behavioral change in the actual 18-run harness

Direct instrumentation (temporary, added and removed for this
investigation — see Investigation Method below) traced **every single
real decision point** — 56 of them, across all 18 runs — and found:

```
repeatExposed=false  — in ALL 56 decision points, no exception
switchExposed=true   — in ALL 56 decision points, no exception
choice=repeat        — in ALL 56 decision points, no exception
```

Not "mostly" — **all of them, without exception**. The harness's
aggregate output (win-rate table, exposure counts) is therefore
byte-identical to the pre-ADR-003 baseline. This was verified by direct
comparison, not assumed from the absence of a diff tool.

### Why — the real, precisely-investigated root cause

This directive asked to check whether ADR-001's shared-`mostRecentClaim`
limitation was the blocker, "not which one seemed more likely on paper."
The investigation's actual finding is more specific than that:

**The shared-`mostRecentClaim` field is real and still present, but it
is not what's blocking this fix.** The actual blocker is that **no
claimant in the current game — player or rival — ever picks a theme
that diverges from what every other claimant would independently pick
for the same figure.** Specifically:

- A rival with no prior claim at a figure always defaults to
  `figureThemes[0]` (`engine/rivalAI.ts`, unchanged fallback branch).
- The player's own strategies (`tools/succession-balance-sim.ts`) pick
  the first theme not contradicting `state.allClaims` — and
  `state.allClaims` (`utils/gameOrchestration.ts:50,175`) **only ever
  records the player's own claims**, never rival claims (confirmed by
  direct read — rival claims in `resolveRivalMoves` are pushed to
  `entries`/ticker but never appended to `allClaims`). Since the player
  has no prior opposing claim of their own recorded, they too default to
  `figureThemes[0]` on effectively every first visit to a figure.

Both defaults land on the exact same theme index, every time, for every
claimant. The diagnostic trace confirms this directly: in every decision
point, `mostRecentClaim`'s theme always equals whichever theme the
deciding rival itself is tracking as "current" — even in the 15+ cases
where the *claimant* of that most recent claim was someone else (player,
or the other rival). Nobody ever actually states the figure's *other*
theme, so `figure.mostRecentClaim` never diverges from what any given
claimant considers their own established position. Switching is
therefore not "usually" a bad idea in this data — it is a **mathematical
constant loss** (value 0, guaranteed exposure) as long as this
convergence holds, which it does, unconditionally, in every one of the
18 runs.

This is a narrower and more precise finding than "the shared field is
broken" — the field's sharing has zero observable effect here because
nothing ever writes a genuinely different claim to it. The shared-field
limitation ADR-001 named is a real latent risk (it would matter the
moment two claimants actually diverge in theme choice — precisely the
scenario the interference unit test constructs), but it is inert in the
current game as actually played by these 6 strategies, for reasons
independent of the field-sharing itself.

### Investigation Method

Direct temporary instrumentation was added to the real
`chooseRivalWhisperTheme` (a `console.error` gated by
`process.env.DIAG_RIVAL_AI`, logging every decision's inputs and
outcome), the harness was run once with it active, and the instrumentation
was removed immediately after collecting evidence. `tsc` and the full
test suite were re-verified clean after removal. This was necessary
because an initial attempt to intercept the call via ES module
namespace monkey-patching failed silently — Node ESM import bindings are
live but `gameOrchestration.ts` holds a direct destructured reference to
the original function, so patching the `rivalAI` namespace object after
import does not redirect calls made through that binding. That dead end
is recorded here so it isn't repeated.

### Real verdict against the actual design goal — win-rate spread, not just exposure count

Per this directive's explicit framing, exposure count moving is
"necessary but not sufficient" — the real bar is contested balance
across all 6 strategies × 3 origins. Full re-run results (identical to
ADR-002's, since no decision differed):

**By strategy:**

| Strategy | W | L | D | AvgMargin |
|---|---|---|---|---|
| RushOneFigure | 1 | 2 | 0 | -1.00 |
| SpreadEvenly | 2 | 1 | 0 | +0.33 |
| SafeAppealsOnly | 1 | 1 | 1 | -0.33 |
| ScoutThenEvidence | 2 | 0 | 1 | +1.67 |
| WhisperHeavy | 0 | 2 | 1 | -1.00 |
| DiscreditHeavy | 2 | 0 | 1 | +0.33 |

**By origin:**

| Origin | W | L | D |
|---|---|---|---|
| bastard_scion | 0 | 3 | 3 |
| disgraced_knight | 5 | 0 | 1 |
| merchant_banker | 3 | 3 | 0 |

**Exposures:** Player 0/18, Rival 0/18 — unchanged.

**Honest verdict: the result does NOT read as genuine contested
balance, and the real problem is not where this directive was looking.**

- No strategy sits at a guaranteed 3/3 win — that part of the bar is
  technically met. But `WhisperHeavy` at 0/3 (zero wins, ever, across
  all three origins) is a real case of "structurally hopeless," which
  the design goal explicitly says should not exist.
- **The origin table is far more skewed than the strategy table, and
  this is the dominant imbalance, not a secondary one.**
  `disgraced_knight` wins or draws in 6 of 6 strategy pairings (5W 0L
  1D) — the player *never loses* under this origin regardless of what
  strategy they run. `bastard_scion` is the mirror image: 0 wins across
  all 6 strategies (0W 3L 3D) — the player *never wins* under this
  origin regardless of strategy. This is close to origin choice alone
  determining the outcome, which is a starker failure of the stated
  design goal than anything strategy selection produces.
- This origin skew is not new — it is present, unchanged, in the
  ADR-002 baseline this directive started from. It was simply not
  named as the primary issue until measured against this directive's
  explicit "actual design goal" framing.

### What this means for scope

This directive's fix (value-aware rival theme selection) is real,
correct, and tested — but it addresses a mechanism that never actually
activates given how player strategies and rival fallbacks currently
select themes. It did not move the needle on the actual design goal
because **the imbalance is concentrated in per-origin favor economics,
not in rival contradiction risk at all.** Per the explicit rule not to
escalate scope or hand-tune toward a target number, no origin-balance
change is made here. The real next-step candidate this investigation
surfaces — rebalancing origin modifiers (`data/origins.ts`), which is
outside this directive's named scope entirely — is named here as a
finding, not undertaken.

### What Changed

- `engine/rivalAI.ts`: `chooseRivalWhisperTheme` signature and logic replaced with value-aware comparison
- `utils/gameOrchestration.ts`: `resolveRivalMoves` reordered so `rivalGain` is computed before theme selection
- `tests/test_succession_rivalAI.ts`: 1 test removed (obsolete signature), 2 new tests added

### What Did NOT Change

- `verdict.ts` — untouched, read-only per scope
- `favor.ts`'s `applyRepeatDecay` — called, not modified, per scope
- `engine/contradiction.ts`, `engine/gossip.ts` — untouched
- `types.ts` — **not modified**. The shared-`mostRecentClaim`
  investigation concluded a per-claimant field is not the actual
  blocker here, so per this directive's explicit instruction, no
  restructuring was undertaken speculatively.
- `tools/succession-balance-sim.ts` — not modified; existing tracking sufficient to measure this fix (found no change to measure)
