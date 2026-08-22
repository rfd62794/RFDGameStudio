# ADR-004: Origin Rebalance

**Date:** August 22, 2026
**Status:** Accepted — real, measured improvement on the stated goal, with
one real new side effect surfaced and explicitly not fixed here (out of
this directive's scope). Read Consequences before assuming this is a
final answer on balance.

## Context

Three directives in a row (rival AI value-aware switching twice, then
this one) found the actual imbalance sits at origin selection, not
rival contradiction risk. Confirmed baseline (independently reproduced
before any change here):

| Origin | W | L | D |
|---|---|---|---|
| bastard_scion | 0 | 3 | 3 |
| disgraced_knight | 5 | 0 | 1 |
| merchant_banker | 3 | 3 | 0 |

`disgraced_knight` never lost across all 6 strategies; `bastard_scion`
never won. This directive's job: rebalance `data/origins.ts`, testing a
specific hypothesis about *why* — that `disgraced_knight` pairs a
compounding (per-appeal, unlimited-use) advantage with a near-irrelevant
one-time friction gate, while `bastard_scion` pairs a one-time advantage
with a real, persistent-feeling deficit.

## Decision — three separate, individually-tested changes

Per the explicit rule against batching untested changes, each change
below was made alone and the harness was re-run before the next one.

### Change A — `disgraced_knight`: add recurring Archbishop friction

**Reasoning:** direct inspection of `utils/gameOrchestration.ts` confirmed
the compounding-vs-one-time asymmetry was real and mechanical, not just
narrative: `appealFavorGainOverride.commander` (`appealTo`,
`gameOrchestration.ts:227-228`) applies on *every* Commander appeal,
uncapped, for the whole game. `appealRequiredBeforeWhisper` (`whisperTo`,
`gameOrchestration.ts:139-140`) is checked once and, once satisfied
(`hasAppealedFigure`), never blocks again — it costs zero net favor and
never touches Commander or Chancellor progress at all. The advantage
was compounding; the friction was inert after turn 1.

**Change:** added `KNIGHT_ARCHBISHOP_APPEAL_FAVOR_GAIN = 4` (-50%,
mirroring the Commander bonus's +50% at introduction) and wired it into
`appealFavorGainOverride: { commander: ..., archbishop: ... }` —
reusing the existing modifier field's `Partial<Record<FigureId, number>>`
shape, no new mechanic. This gives the origin a real, per-turn
recurring cost with the same shape as its recurring benefit, instead of
a one-time gate that does no real balancing work.

**Result:** `disgraced_knight` 5W-0L-1D → **3W-0L-3D**. Real movement
(fewer wins, more draws), but zero losses remained — the compounding
advantage alone, even discounted by a matching recurring friction on a
*different* figure, was still enough to prevent the origin from ever
actually losing.

### Change B — `disgraced_knight`: reduce the Commander bonus itself

**Reasoning:** Change A proved friction alone (on a separate figure)
wasn't sufficient — the origin still never lost. Per the directive's
first-listed option, tested next: reduce the advantage's own magnitude
directly, since matching-shape friction on the *other* figure clearly
wasn't enough to introduce genuine downside risk on the figure the
advantage actually targets.

**Change:** `KNIGHT_COMMANDER_APPEAL_FAVOR_GAIN` `12 → 10` (+50% → +25%).

**Result:** `disgraced_knight` 3W-0L-3D → **3W-1L-2D** — first real loss
recorded for this origin across all three directives of measurement.

### Change C — `bastard_scion`: soften the persistent starting deficit

**Reasoning:** tested the simpler of the two directive-suggested options
first, per minimal-change discipline: does the -5 one-time-but-permanent
deficit explain the floor by itself, without needing to restructure the
advantage into something more recurring? `startingFavor` is applied once
at `createInitialGameState` (`gameOrchestration.ts:29`) and never
decays or self-corrects — it's a flat, permanent handicap the player
must actively claw back, structurally different from `disgraced_knight`'s
one-time *appeal-gate* friction (which cost nothing net). This is a real
asymmetry worth testing on its own before assuming the advantage's shape
needed to change too.

**Change:** `BASTARD_CHANCELLOR_STARTING_FAVOR` `-5 → -2`.

**Result:** `bastard_scion` 0W-3L-3D → **1W-3L-2D** — first win recorded
for this origin across all three directives of measurement, from
softening the friction alone. **The advantage's one-time shape was not
touched and did not need to be** — this is a direct, partial disproof of
the second half of the hypothesis for this origin specifically (see
Consequences).

No further origin-value changes were made after Change C — see
Consequences for why iteration stopped here.

## Testing

`tests/test_succession_origins.ts`:
- Updated existing assertions/titles for `KNIGHT_COMMANDER_APPEAL_FAVOR_GAIN`
  (12→10), `BASTARD_CHANCELLOR_STARTING_FAVOR` (-5→-2), and the
  Archbishop appeal-gate test (now expects `KNIGHT_ARCHBISHOP_APPEAL_FAVOR_GAIN`
  instead of standard `APPEAL_FAVOR_GAIN`).
- Renamed `Chancellor or Archbishop Appeals grant standard +8 favor gain`
  to `Chancellor Appeals grant standard +8 favor gain` — Archbishop no
  longer gets the standard rate for this origin, so the old title was no
  longer accurate.
- Added: `Archbishop Appeals grant -50% favor gain (4 instead of 8) —
  ADR-004 recurring friction`, a new dedicated test for Change A,
  independent of the appeal-gate test.

Net test count change: **+1**. `npx tsc --noEmit` clean. **112/112**
tests pass (111 + 1 new).

## Consequences

### Real verdict against the actual design goal

Final harness re-run (6 strategies × 3 origins, 18 runs):

**By origin (the primary target of this directive):**

| Origin | W | L | D |
|---|---|---|---|
| bastard_scion | 1 | 3 | 2 |
| disgraced_knight | 3 | 1 | 2 |
| merchant_banker | 3 | 3 | 0 |

**Every origin now has both at least one win and at least one loss.**
This is real, substantial movement from the starting point where two of
three origins had zero wins or zero losses outright. By the letter of
the stated bar — "no origin should sit at or near a guaranteed win or an
unwinnable floor" — this reads as genuine, if imperfect, contested
balance for the first time across all three directives that have
measured it. `bastard_scion` remains the weakest (1 win) and
`disgraced_knight`/`merchant_banker` are roughly matched (3 wins each,
different loss/draw splits) — real differentiation between origins, which
the directive explicitly said was fine, not a violation of the bar.

**By strategy (the pre-existing bar from ADR-002/003, still unchanged):**

| Strategy | W | L | D | AvgMargin |
|---|---|---|---|---|
| RushOneFigure | 1 | 2 | 0 | -1.00 |
| SpreadEvenly | 1 | 1 | 1 | -0.33 |
| SafeAppealsOnly | 0 | 2 | 1 | -2.33 |
| ScoutThenEvidence | 2 | 0 | 1 | +1.67 |
| WhisperHeavy | 0 | 2 | 1 | -1.00 |
| DiscreditHeavy | 3 | 0 | 0 | +1.00 |

### A real new finding: `DiscreditHeavy` moved from 2/3 to a 3/3 sweep

This is a genuine, measured side effect of the origin rebalance, not
something to paper over. Before this directive: `DiscreditHeavy` was
2W-0L-1D. After: **3W-0L-0D** — a clean sweep across all three origins.
Direct inspection of the per-run data shows all three wins are narrow
(`+1` margin each, all flagged "Contested" by the harness's own
`BLOWOUT_THRESHOLD`, none a blowout) — this is not a runaway dominant
strategy in the blowout sense, but a 3/3 win rate with zero losses is
still a real floor by the stated bar ("no *origin* should be at or near
guaranteed win" — the same logic applies to strategy). `SafeAppealsOnly`
moved the opposite direction, from 1W-1L-1D to **0W-2L-1D**.

**This is explicitly not fixed in this directive.** `DiscreditHeavy`'s
mechanic (`discreditFigure`) lives in code this directive's scope marks
**read-only** (`rivalAI.ts`, and the discredit/favor interaction is
adjacent to `favor.ts`, also read-only). Chasing this by further tuning
origin values would mean adjusting numbers to suppress a downstream
strategy-level side effect with no principled origin-shape reasoning
behind it — exactly what the anti-hand-tuning rule prohibits. This is
named here as a real, measured finding for a follow-up directive scoped
to the discredit mechanic specifically, not absorbed into this one.

### The compounding-vs-one-time hypothesis: partially held, more nuanced than stated

- **For `disgraced_knight`: held, but only worked when both halves were
  applied.** Adding matching recurring friction alone (Change A) was a
  real, measured improvement but insufficient by itself (origin still
  never lost). It took *combining* recurring friction **and** reducing
  the compounding advantage's own magnitude (Change B) to produce a
  real loss. The hypothesis's core claim — that a compounding advantage
  paired with inert friction is the dominant-origin shape — is
  supported, but the fix required correcting the imbalance on both
  sides of that pairing, not just adding an equal-and-opposite
  recurring cost elsewhere.
- **For `bastard_scion`: the friction-magnitude explanation was
  sufficient on its own; the "advantage needs to become more recurring"
  half of the hypothesis was not needed and was not tested further once
  Change C worked.** This is a real, partial disproof of that half of
  the stated hypothesis for this specific origin — the one-time
  advantage's shape was never the problem; the friction's *magnitude*
  (-5, a large fraction of a single Whisper's value) was. This matters
  for future balancing: not every one-time-advantage/persistent-friction
  pairing needs a shape change — sometimes the friction is just
  oversized relative to the advantage it's supposed to offset, and
  reducing it directly is the minimal, correct fix.

### Why iteration stopped after three changes

All three origins now have genuine wins and losses — the stated bar is
met by direct measurement, not qualitative impression. Continuing to
chase perfect symmetry (e.g., matching `bastard_scion`'s 1-3-2 more
closely to the other two) risks exactly the failure mode the explicit
rule warns against: adjusting numbers with no new principled reasoning,
purely because a further adjustment is possible. Each of the three
changes made here has a stated, falsifiable reason tied to the
compounding-vs-one-time shape analysis (or a direct measured disproof of
part of it); a fourth change with no comparable reasoning was not made.

### What Changed

- `data/gameConstants.ts`: `KNIGHT_COMMANDER_APPEAL_FAVOR_GAIN` 12→10;
  new `KNIGHT_ARCHBISHOP_APPEAL_FAVOR_GAIN = 4`; `BASTARD_CHANCELLOR_STARTING_FAVOR` -5→-2
- `data/origins.ts`: `disgraced_knight`'s `appealFavorGainOverride` now
  includes `archbishop: KNIGHT_ARCHBISHOP_APPEAL_FAVOR_GAIN`; flavor
  text updated for both changed origins
- `tests/test_succession_origins.ts`: assertions/titles updated to match
  real changes; 1 new test added for the recurring Archbishop friction

### What Did NOT Change

- `rivalAI.ts`, `favor.ts`, `verdict.ts` — untouched, read-only per
  scope. `DiscreditHeavy`'s new 3/3 sweep is a real finding surfaced
  here but requires touching this read-only code to fix — explicitly
  deferred, not undertaken.
- `merchant_banker`'s modifiers — untouched. Its 3-3-0 split was already
  the "real middle case" per the directive's own framing and needed no
  intervention.
- `PlayerOriginModifiers` interface (`data/origins.ts`) — no new
  modifier fields added. Both origin fixes reused the existing
  `appealFavorGainOverride: Partial<Record<FigureId, number>>` and
  `startingFavor` shapes.
- Player onboarding — still queued for after balance is confirmed
  genuine, per explicit scope. Given the `DiscreditHeavy` finding above,
  "genuine" balance likely needs one more directive (scoped to the
  discredit mechanic) before onboarding work should start.
