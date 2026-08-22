# Succession — CHANGELOG

## 2026-08-20 — Balance Simulation Harness

Added `ts/tools/succession-balance-sim.ts` — a standalone diagnostic
script that runs 5 named strategies × 3 origins (15 runs) through the
real deterministic game orchestration code. No randomness; the variable
explored is player strategy, not seed space.

### Raw Findings

**Per-run results:**

| Strategy | Origin | Winner | Type | Margin | Exp | Chancellor | Archbishop | Commander |
|---|---|---|---|---|---|---|---|---|
| RushOneFigure | bastard_scion | aldric | Majority | -3 | 0 | P:43 A:45 V:45 | P:42 A:30 V:45 | P:22 A:45 V:0 |
| RushOneFigure | disgraced_knight | aldric | Majority | -3 | 0 | P:22 A:30 V:0 | P:40 A:45 V:45 | P:12 A:45 V:0 |
| RushOneFigure | merchant_banker | DRAW | Deadlock | -1 | 0 | P:43 A:45 V:50 | P:37 A:35 V:0 | P:27 A:45 V:0 |
| SpreadEvenly | bastard_scion | aldric | Majority | -3 | 0 | P:33 A:30 V:45 | P:42 A:45 V:45 | P:32 A:45 V:0 |
| SpreadEvenly | disgraced_knight | aldric | Majority | -1 | 0 | P:32 A:30 V:0 | P:40 A:45 V:45 | P:22 A:45 V:30 |
| SpreadEvenly | merchant_banker | aldric | Majority | -3 | 0 | P:43 A:30 V:50 | P:32 A:50 V:0 | P:32 A:45 V:0 |
| SafeAppealsOnly | bastard_scion | aldric | Majority | -3 | 0 | P:19 A:30 V:60 | P:24 A:45 V:30 | P:16 A:45 V:30 |
| SafeAppealsOnly | disgraced_knight | aldric | Majority | -3 | 0 | P:24 A:30 V:60 | P:24 A:45 V:30 | P:24 A:45 V:30 |
| SafeAppealsOnly | merchant_banker | aldric | Majority | -3 | 0 | P:24 A:30 V:65 | P:24 A:50 V:30 | P:16 A:45 V:30 |
| ScoutThenEvidence | bastard_scion | aldric | Majority | -3 | 0 | P:27 A:60 V:30 | P:26 A:45 V:45 | P:10 A:15 V:0 |
| ScoutThenEvidence | disgraced_knight | DRAW | Deadlock | -1 | 0 | P:14 A:0 V:75 | P:14 A:60 V:15 | P:30 A:30 V:0 |
| ScoutThenEvidence | merchant_banker | DRAW | Deadlock | -1 | 0 | P:24 A:0 V:65 | P:14 A:65 V:0 | P:30 A:30 V:0 |
| WhisperHeavy | bastard_scion | aldric | Majority | -3 | 0 | P:43 A:45 V:45 | P:42 A:30 V:45 | P:22 A:45 V:0 |
| WhisperHeavy | disgraced_knight | aldric | Majority | -1 | 0 | P:16 A:30 V:0 | P:16 A:60 V:30 | P:32 A:30 V:0 |
| WhisperHeavy | merchant_banker | DRAW | Deadlock | -1 | 0 | P:43 A:45 V:50 | P:37 A:35 V:0 | P:27 A:45 V:0 |

**Per-figure winners:**

| Strategy | Origin | Chancellor | Archbishop | Commander |
|---|---|---|---|---|
| RushOneFigure | bastard_scion | aldric | vivienne | aldric |
| RushOneFigure | disgraced_knight | aldric | aldric | aldric |
| RushOneFigure | merchant_banker | vivienne | player | aldric |
| SpreadEvenly | bastard_scion | vivienne | aldric | aldric |
| SpreadEvenly | disgraced_knight | player | aldric | aldric |
| SpreadEvenly | merchant_banker | vivienne | aldric | aldric |
| SafeAppealsOnly | bastard_scion | vivienne | aldric | aldric |
| SafeAppealsOnly | disgraced_knight | vivienne | aldric | aldric |
| SafeAppealsOnly | merchant_banker | vivienne | aldric | aldric |
| ScoutThenEvidence | bastard_scion | aldric | aldric | aldric |
| ScoutThenEvidence | disgraced_knight | vivienne | aldric | player |
| ScoutThenEvidence | merchant_banker | vivienne | aldric | player |
| WhisperHeavy | bastard_scion | aldric | vivienne | aldric |
| WhisperHeavy | disgraced_knight | aldric | aldric | player |
| WhisperHeavy | merchant_banker | vivienne | player | aldric |

**Aggregate statistics:**

Win rate per strategy (W/L/D, blowout vs contested, avg margin):
- RushOneFigure: W:0 L:2 D:1 | Blowout:2 Contested:1 | AvgMargin:-2.33
- SpreadEvenly: W:0 L:3 D:0 | Blowout:2 Contested:1 | AvgMargin:-2.33
- SafeAppealsOnly: W:0 L:3 D:0 | Blowout:3 Contested:0 | AvgMargin:-3.00
- ScoutThenEvidence: W:0 L:1 D:2 | Blowout:1 Contested:2 | AvgMargin:-1.67
- WhisperHeavy: W:0 L:2 D:1 | Blowout:1 Contested:2 | AvgMargin:-1.67

Win rate per origin:
- bastard_scion: W:0 L:5 D:0
- disgraced_knight: W:0 L:4 D:1
- merchant_banker: W:0 L:2 D:3

Exposure statistics:
- Total exposures across all runs: 0
- Runs with at least 1 exposure: 0/15

Strategy dominance: No player wins across any strategy. Best win count: 0/3.

### Key observations (raw, not tuning recommendations)

- Player wins 0/15 runs. Rivals (aldric/vivienne) win 10/15. 5/15 end in deadlock.
- SafeAppealsOnly is the worst performer: 0 wins, 3 blowout losses, avg margin -3.0.
- ScoutThenEvidence and WhisperHeavy tie for best (least bad): avg margin -1.67, 2 contested each.
- merchant_banker is the best origin for survival (3 draws, only 2 losses).
- bastard_scion is the worst origin (5 losses, 0 draws).
- Zero exposures occurred in any run — no strategy triggered a contradiction.
- No single strategy dominates; all lose. The question of whether any
  strategy can win at all with current constants is open.

## 2026-08-20 — Fix 1: Rival Alternation (Action Economy)

Changed `resolveRivalMoves` in `gameOrchestration.ts` to alternate
rivals by segment parity: Aldric acts on odd segments, Vivienne on even.
Previously both rivals acted every player turn (8 player moves vs 16
rival moves). Now it's 8 vs 8.

### Harness Re-Run After Fix 1 (5 strategies × 3 origins = 15 runs)

**Aggregate win rates per strategy:**
- RushOneFigure: W:3 L:0 D:0 | Blowout:2 Contested:1 | AvgMargin:+2.33
- SpreadEvenly: W:3 L:0 D:0 | Blowout:1 Contested:2 | AvgMargin:+1.67
- SafeAppealsOnly: W:0 L:1 D:2 | Blowout:1 Contested:2 | AvgMargin:-1.67
- ScoutThenEvidence: W:2 L:0 D:1 | Blowout:0 Contested:3 | AvgMargin:+0.33
- WhisperHeavy: W:3 L:0 D:0 | Blowout:1 Contested:2 | AvgMargin:+1.67

**Win rates per origin:**
- bastard_scion: W:3 L:0 D:2
- disgraced_knight: W:4 L:0 D:1
- merchant_banker: W:4 L:1 D:0

**Key observations:** Player went from 0/15 to 11/15 wins. Three
strategies now sweep all 3 origins. Pendulum swung hard — may need
tightening from Fix 2 or Fix 3 rather than further loosening.

## 2026-08-20 — Fix 2: Discredit — Player Counter-Move

Added `discreditFigure` to `gameOrchestration.ts` — a new player move
that mirrors rival Slander: spends a turn to reduce a specific rival's
favor at a specific figure by `RIVAL_SLANDER_PENALTY` (10). Uses the
same constant, not a new one — genuine symmetry. Added `'discredit'` to
both `MoveType` and `PlayerMoveType` enumerations.

### Harness Re-Run After Fix 2 (6 strategies × 3 origins = 18 runs)

Added a 6th strategy, `DiscreditHeavy`, which alternates between
building own favor (whisper/appeal) and discrediting the rival with the
highest favor at the figure where they lead most.

**Per-run results (DiscreditHeavy only):**

| Strategy | Origin | Winner | Type | Margin | Exp | Chancellor | Archbishop | Commander |
|---|---|---|---|---|---|---|---|---|
| DiscreditHeavy | bastard_scion | DRAW | Deadlock | -1 | 0 | P:31 A:0 V:40 | P:16 A:25 V:0 | P:16 A:15 V:0 |
| DiscreditHeavy | disgraced_knight | DRAW | Deadlock | -1 | 0 | P:26 A:5 V:30 | P:28 A:5 V:15 | P:0 A:10 V:0 |
| DiscreditHeavy | merchant_banker | player | Majority | +1 | 0 | P:26 A:0 V:40 | P:16 A:15 V:0 | P:20 A:5 V:0 |

**Aggregate win rates per strategy (all 6):**
- RushOneFigure: W:3 L:0 D:0 | Blowout:2 Contested:1 | AvgMargin:+2.33
- SpreadEvenly: W:3 L:0 D:0 | Blowout:1 Contested:2 | AvgMargin:+1.67
- SafeAppealsOnly: W:0 L:1 D:2 | Blowout:1 Contested:2 | AvgMargin:-1.67
- ScoutThenEvidence: W:2 L:0 D:1 | Blowout:0 Contested:3 | AvgMargin:+0.33
- WhisperHeavy: W:3 L:0 D:0 | Blowout:1 Contested:2 | AvgMargin:+1.67
- DiscreditHeavy: W:1 L:0 D:2 | Blowout:0 Contested:3 | AvgMargin:-0.33

**Win rates per origin:**
- bastard_scion: W:3 L:0 D:3
- disgraced_knight: W:4 L:0 D:2
- merchant_banker: W:5 L:1 D:0

**Exposure statistics:** 0 exposures across all 18 runs.

**Strategy dominance:** Three strategies tie at 3/3 (RushOneFigure,
SpreadEvenly, WhisperHeavy). DiscreditHeavy wins 1/3 — it never loses
but draws 2/3, suggesting spending half the turns on defense costs too
much offense. SafeAppealsOnly remains the only strategy that can't win.

**Key observations:**
- DiscreditHeavy is the only strategy with zero losses across all runs
  (W:1 D:2). Discredit provides defensive value — the player never gets
  swept when using it.
- However, DiscreditHeavy has the lowest win count among non-SafeAppeals
  strategies. Spending turns on defense means fewer turns building favor.
- The existing 5 strategies' results are unchanged from Fix 1 — Discredit
  is a new option that doesn't affect the old strategies' outcomes.
- Fix 2 adds a real tactical choice (defense vs offense) but doesn't
  shift the overall balance landscape dramatically on its own.

## 2026-08-20 — Fix 3: Rival Contradiction Risk

Rival Whisper moves now route through the same contradiction-checking
path as player Whispers. `applyPlayerWhisper` generalized to
`applyWhisper(figure, claimantId, ...)`. New `chooseRivalWhisperTheme`
function: rivals repeat their prior claim at a figure when possible
(never self-contradicting), fall back to a fresh theme when no prior
claim exists. `Claim` interface gained required `claimantId` field.
`verdict.ts` unchanged — already claimant-agnostic, proven by test.

ADR written: `docs/adr/ADR-001-rival-contradiction-risk.md` — first
on-repo ADR for Succession, naming the shared `mostRecentClaim`
limitation and the "always repeat may be mechanically inert" risk
honestly.

### Harness Re-Run After Fix 3 (6 strategies × 3 origins = 18 runs)

Results are identical to Fix 2 — the aggregate table is unchanged:

**Aggregate win rates per strategy:**
- RushOneFigure: W:3 L:0 D:0 | Blowout:2 Contested:1 | AvgMargin:+2.33
- SpreadEvenly: W:3 L:0 D:0 | Blowout:1 Contested:2 | AvgMargin:+1.67
- SafeAppealsOnly: W:0 L:1 D:2 | Blowout:1 Contested:2 | AvgMargin:-1.67
- ScoutThenEvidence: W:2 L:0 D:1 | Blowout:0 Contested:3 | AvgMargin:+0.33
- WhisperHeavy: W:3 L:0 D:0 | Blowout:1 Contested:2 | AvgMargin:+1.67
- DiscreditHeavy: W:1 L:0 D:2 | Blowout:0 Contested:3 | AvgMargin:-0.33

**Win rates per origin:**
- bastard_scion: W:3 L:0 D:3
- disgraced_knight: W:4 L:0 D:2
- merchant_banker: W:5 L:1 D:0

**Exposure statistics:**
- Player exposures: 0 (runs with exposure: 0/18)
- Rival exposures: 0 (runs with exposure: 0/18)

**Key observation — the dead-mechanic risk is live:**

Rival exposures came back at exactly 0 across all 18 runs. This
confirms the risk named in ADR-001: with `CLAIM_THEMES` giving each
figure exactly two flat-value themes, `chooseRivalWhisperTheme`'s
"repeat when possible" strategy means rivals never contradict. The
mechanism is structurally present and tested, but the current theme
design makes it mechanically inert in practice. This is a real
follow-up candidate (e.g., diminishing returns on repeating the same
theme, or per-claimant claim memory) — not something to guess-fix now.

The aggregate table being identical to Fix 2 confirms Fix 3 had zero
behavioral impact on the current harness — the symmetry is real in
code but not exercised in practice.

## 2026-08-22 — ADR-002: Diminishing Returns on Repeated Claims

Follow-up to ADR-001's named risk: rival exposures sat at exactly 0/18
after Fix 3 landed, confirming "always repeat" was strictly dominant
and risk-free with `CLAIM_THEMES`'s two flat, equal-value themes per
figure. This fix implements the smaller of ADR-001's two named
follow-ups — diminishing returns on consecutive same-theme repeats —
rather than the larger, deferred one (per-claimant claim memory).

New `applyRepeatDecay(baseGain, consecutiveRepeats)` in `engine/favor.ts`:
halves the gain on each consecutive same-theme repeat by the same
claimant at the same figure, floored at 25% of base value. Full value
restored immediately on a genuine theme switch. `FigureState` gains an
optional `repeatTracker` field (`engine/types.ts`) so the ~75 existing
`FigureState` literals across the test suite didn't need updating.
Applies identically to player and rivals — same function, no
claimant-specific branching. `chooseRivalWhisperTheme` in
`engine/rivalAI.ts` was intentionally left unmodified, per scope.

ADR written: `docs/adr/ADR-002-diminishing-returns-on-repeated-claims.md`.

### Tests

5 new tests in `tests/test_succession_favor.ts`:
- `applyRepeatDecay_returns_full_value_at_zero_repeats`
- `applyRepeatDecay_halves_on_each_consecutive_repeat_down_to_floor`
- `applyWhisper_decays_favor_on_consecutive_same_theme_repeat`
- `applyWhisper_restores_full_value_immediately_on_theme_switch`
- `applyWhisper_repeat_decay_applies_identically_to_player_and_rival`

`npx tsc --noEmit` clean. **110/110** tests pass (105 existing,
unmodified, + 5 new).

### Harness Re-Run After ADR-002 (6 strategies × 3 origins = 18 runs)

**Aggregate win rates per strategy — shifted substantially from the
Fix 3 baseline:**

| Strategy | Before (Fix 3) | After (ADR-002) |
|---|---|---|
| RushOneFigure | W:3 L:0 D:0, AvgMargin:+2.33 | W:1 L:2 D:0, AvgMargin:-1.00 |
| SpreadEvenly | W:3 L:0 D:0, AvgMargin:+1.67 | W:2 L:1 D:0, AvgMargin:+0.33 |
| SafeAppealsOnly | W:0 L:1 D:2, AvgMargin:-1.67 | W:1 L:1 D:1, AvgMargin:-0.33 |
| ScoutThenEvidence | W:2 L:0 D:1, AvgMargin:+0.33 | W:2 L:0 D:1, AvgMargin:+1.67 |
| WhisperHeavy | W:3 L:0 D:0, AvgMargin:+1.67 | W:0 L:2 D:1, AvgMargin:-1.00 |
| DiscreditHeavy | W:1 L:0 D:2, AvgMargin:-0.33 | W:2 L:0 D:1, AvgMargin:+0.33 |

**Win rates per origin:**
- bastard_scion: W:0 L:3 D:3
- disgraced_knight: W:5 L:0 D:1
- merchant_banker: W:3 L:3 D:0

**Exposure statistics — the named success metric:**
- Player exposures: 0 (runs with exposure: 0/18)
- Rival exposures: 0 (runs with exposure: 0/18)

**Real finding: rival exposures did NOT move off zero.**

WhisperHeavy fell from tied-best strategy (W:3) to worst (W:0).
RushOneFigure fell from best (W:3) to second-worst (W:1). Both
strategies repeatedly whisper the same figure without rotating targets
— exactly the pattern the decay curve punishes hardest, since
consecutive repeats at one figure hit the 25% floor fast. Strategies
that naturally rotate targets held steady or improved. This confirms
the mechanic has a real, substantial economic effect on the game.

But the actual test this directive specified — does diminishing
returns cause the rival AI to ever switch themes, reintroducing real
contradiction risk — failed. `chooseRivalWhisperTheme`'s preference
logic (intentionally left unmodified per scope) is unconditional: it
repeats whenever a prior claim exists, regardless of how decayed that
repeat's value has become. Diminishing returns changes what repeating
is *worth*; it doesn't change *how the rival AI decides* whether to
repeat. Those are separate problems, and this fix solved only the
first one. The larger, previously-deferred fix — per-claimant claim
memory combined with making the rival AI actually reason about decayed
value when choosing to repeat vs. switch — is now supported by direct
harness evidence as the fix genuinely required to move rival exposures
off zero. Per this directive's explicit instruction, this is reported
as a real finding rather than escalated into scope here.
