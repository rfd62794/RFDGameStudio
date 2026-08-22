# Succession — CHANGELOG

## 2026-08-22 — ADR-006: GameShell Adoption and Audience Progressive Disclosure

Two independent, real presentation fixes, verified against real
precedent (`chimera_wilds/App.tsx`, `planetofgreed/App.tsx`) rather than
invented from scratch.

**Fix 1 — GameShell adoption.** `App.tsx` had never adopted the shared
`GameShell` component (`ts/src/components/GameShell.tsx`) — it rendered
its own root and a hand-rolled sticky header (`components/SegmentHeader.tsx`)
with a duplicate "SUCCESSION" title and no back button. Worse, without
`GameShell`'s `mainClassName="game-shell-main--scrollable"` modifier,
`.game-shell-main`'s default `overflow: hidden` (combined with the
arcade shell's own `overflow: hidden` on `.arcade-game-content`) meant
any view taller than the viewport was silently clipped with no scroll
path — confirmed as the real cause, not assumed. All three real view
branches (title, playing, verdict) now render through `<GameShell
gameLabel="Succession" gameId="succession" mainClassName="game-shell-main--scrollable" ...>`.
`SegmentHeader.tsx` was rewritten to render only real status content
(segment dots, time badge, final-segment warning) as a `statusArea`
fragment, dropping its own header wrapper and the now-duplicate title.
`AudienceStage.tsx`'s own "Step Back to Grand Chamber" button was
deliberately left untouched — confirmed to be real in-game
`PlayStage` navigation, not arcade-level shell chrome.

**Fix 2 — Audience progressive disclosure.** `AudienceStage.tsx`
previously rendered all five approaches (Whisper, Appeal, Evidence,
Indictment, Discredit) fully expanded simultaneously, all the time. New
`utils/approachDisclosure.ts` exports `nextExpandedApproach`, a pure
state-transition function ensuring exactly one approach is ever
expanded at a time (collapsed by default). `WhisperPanel.tsx`,
`EvidencePanel.tsx`, `IndictmentPanel.tsx`, and the inline Appeal/
Discredit cards all gained `isExpanded`/`onToggle`-style wiring — their
real cost/risk badges stay visible in the always-shown header row even
while collapsed; only the action body (option grids, execute buttons)
is hidden. Fixed a genuine pre-existing bug found while doing this:
`IndictmentPanel.tsx` and Discredit were both labeled "Approach 4" —
Discredit is now "Approach 5."

ADR written: `docs/adr/ADR-006-gameshell-adoption-and-progressive-disclosure.md`.

### Tests

`tests/test_succession_gameshell_and_disclosure.ts`: 7 new tests.
GameShell adoption group (4): structural checks against the real
`App.tsx` source proving `GameShell` import, all 3 view branches
wrapped, `mainClassName="game-shell-main--scrollable"` present on every
usage, and the old arcade-level back button text is gone while
`AudienceStage`'s real in-game back navigation remains wired.
Progressive disclosure group (3): exercises the exact
`nextExpandedApproach` function `AudienceStage.tsx` calls — starts
collapsed, selecting a second approach replaces (never adds to) the
first, and the "exactly one expanded" invariant holds across a full
5-approach selection sequence. `npx tsc --noEmit` clean. **1451/1451**
tests pass across the full monorepo suite; all 127 pre-existing
Succession tests unmodified and passing.

### Manual Verification

No screenshot/vision tool is available in this environment. A live dev
server + browser preview was handed to the user to confirm visually
that the header no longer clips and only one Audience approach expands
at a time.

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

## 2026-08-22 — ADR-003: Value-Aware Rival Theme Selection

Follow-up to ADR-002's precise gap: diminishing returns gave repeating
real economic cost, but `chooseRivalWhisperTheme` never consulted it —
it repeated unconditionally regardless of decay level. This directive
made the decision logic real: `chooseRivalWhisperTheme` now compares
the decayed value of repeating against the contradiction-checked full
value of switching, using exact information (`checkContradiction`
against the figure's actual current state), not a probabilistic risk
estimate. New signature:
`chooseRivalWhisperTheme(figure, claimantId, baseGain, themes)`.

`gameOrchestration.ts`'s `resolveRivalMoves` reordered so `rivalGain`
(including origin-modifier bonuses) is computed before theme selection,
so the decision uses the same value that will actually be applied.

ADR written: `docs/adr/ADR-003-value-aware-rival-switching.md`.

### Tests

`tests/test_succession_rivalAI.ts`: removed 1 obsolete test (old
3-argument signature), added 2 new tests proving the decision logic
works in both directions — prefers repeating when decay hasn't eroded
enough to justify switching, and prefers switching when a constructed
interference scenario makes *repeating* the exposed move. Net: +1 test.
`npx tsc --noEmit` clean. **111/111** tests pass (110 - 1 removed + 2
new).

### Harness Re-Run — Byte-Identical to ADR-002

Full re-run (6 strategies × 3 origins, 18 runs) produced **exactly the
same aggregate output as the ADR-002 baseline** — same win-rate table,
same exposure counts (Player 0/18, Rival 0/18). Verified by direct
comparison, not assumed.

### Investigation: Why Zero Behavioral Change, And What's Actually Blocking It

Per this directive's explicit instruction to investigate rather than
assume, temporary diagnostic instrumentation was added directly to
`chooseRivalWhisperTheme` (a `console.error` gated by an env var), the
harness was run once with it active, and the instrumentation was
removed immediately after. It traced **all 56 real decision points**
across the 18 runs. Finding: `repeatExposed=false` and
`switchExposed=true` in **every single one**, with no exception.
Switching was mathematically guaranteed to lose in every real decision
this directive's logic ever encountered.

**Root cause, precisely identified — narrower than ADR-001's named
shared-`mostRecentClaim` limitation:** no claimant in the current game
— player or rival — ever picks a theme that diverges from what every
other claimant would independently pick for the same figure. A rival
with no prior claim always defaults to `figureThemes[0]`. The player's
own strategies pick the first theme not contradicting `state.allClaims`
— and `state.allClaims` only ever records the *player's own* claims,
never rival claims (confirmed by direct read of `whisperTo` vs.
`resolveRivalMoves` in `gameOrchestration.ts`) — so the player also
defaults to `figureThemes[0]` on effectively every first visit. Both
defaults land on the same theme, every time, for every claimant. The
shared-`mostRecentClaim` field is real and still present, but it has
zero observable effect here because nothing ever writes a genuinely
different claim to it — the field-sharing limitation would matter the
moment two claimants actually diverge in theme choice (proven directly
by the constructed interference unit test), but that scenario never
arises from how the 6 harness strategies and rival fallback logic
actually behave.

### Real Verdict Against the Actual Design Goal

Per this directive's explicit framing — exposure count is "necessary
but not sufficient," the real bar is contested balance:

| Strategy | W | L | D | AvgMargin |
|---|---|---|---|---|
| RushOneFigure | 1 | 2 | 0 | -1.00 |
| SpreadEvenly | 2 | 1 | 0 | +0.33 |
| SafeAppealsOnly | 1 | 1 | 1 | -0.33 |
| ScoutThenEvidence | 2 | 0 | 1 | +1.67 |
| WhisperHeavy | 0 | 2 | 1 | -1.00 |
| DiscreditHeavy | 2 | 0 | 1 | +0.33 |

| Origin | W | L | D |
|---|---|---|---|
| bastard_scion | 0 | 3 | 3 |
| disgraced_knight | 5 | 0 | 1 |
| merchant_banker | 3 | 3 | 0 |

**Honest verdict: this does not read as genuine contested balance, and
the dominant problem isn't where this directive was looking.** No
strategy hits 3/3, but `WhisperHeavy` at 0/3 is a real "structurally
hopeless" case. More importantly, **the origin table is far more
skewed than the strategy table**: `disgraced_knight` never loses across
all 6 strategy pairings (5W 0L 1D); `bastard_scion` never wins across
all 6 (0W 3L 3D). Origin choice alone is close to determining the
outcome — a starker imbalance than anything rival contradiction risk
produces. This skew is not new (it's present unchanged in the ADR-002
baseline) but was not named as the primary issue until measured
directly against this directive's explicit design-goal framing.

This fix is real, correct, and tested, but addresses a mechanism that
never actually activates given current theme-selection defaults. It did
not move the needle on the real design goal because the imbalance is
concentrated in per-origin favor economics (`data/origins.ts`), not in
rival contradiction risk. Per the explicit rule against hand-tuning or
escalating scope to hit a target number, no origin-balance change is
made here — it is named as the real next-step candidate, not
undertaken.

## 2026-08-22 — ADR-004: Origin Rebalance

Follow-up to ADR-003's real finding: three directives of harness
evidence pointed to origin selection, not rival AI, as the actual
imbalance. Confirmed baseline: `disgraced_knight` 5W-0L-1D (never
lost), `bastard_scion` 0W-3L-3D (never won), `merchant_banker` 3W-3L-0D.

Tested hypothesis: `disgraced_knight` pairs a compounding (per-appeal,
unlimited) advantage with an inert one-time friction gate;
`bastard_scion` pairs a one-time advantage with a real persistent
deficit. Three separate, individually-tested changes, per the rule
against batching untested changes:

- **Change A** — added `KNIGHT_ARCHBISHOP_APPEAL_FAVOR_GAIN = 4` (-50%),
  giving `disgraced_knight` real recurring friction matching the shape
  of its recurring Commander bonus (reusing the existing
  `appealFavorGainOverride` field — no new mechanic). Confirmed via
  direct code read that the prior friction (`appealRequiredBeforeWhisper`)
  cost zero net favor once satisfied. Result: 5W-0L-1D → 3W-0L-3D.
  Real movement, but still zero losses.
- **Change B** — reduced `KNIGHT_COMMANDER_APPEAL_FAVOR_GAIN` 12→10
  (+50%→+25%), since Change A alone wasn't sufficient. Result:
  3W-0L-3D → 3W-1L-2D — first real loss recorded for this origin.
- **Change C** — reduced `BASTARD_CHANCELLOR_STARTING_FAVOR` -5→-2,
  testing the simpler friction-magnitude explanation before assuming
  the advantage needed to become more recurring. Result: 0W-3L-3D →
  1W-3L-2D — first real win recorded for this origin, from softening
  friction alone.

ADR written: `docs/adr/ADR-004-origin-rebalance.md`.

### Tests

`tests/test_succession_origins.ts`: updated assertions/titles for all
three changed constants; renamed the now-inaccurate "Chancellor or
Archbishop Appeals grant standard +8" test (Archbishop no longer does);
added 1 new dedicated test for the Change A recurring friction. Net:
+1 test. `npx tsc --noEmit` clean. **112/112** tests pass.

### Real Verdict Against the Actual Design Goal

Final harness re-run, by origin:

| Origin | W | L | D |
|---|---|---|---|
| bastard_scion | 1 | 3 | 2 |
| disgraced_knight | 3 | 1 | 2 |
| merchant_banker | 3 | 3 | 0 |

**Every origin now has both a win and a loss** — real, substantial
movement from two origins sitting at zero wins or zero losses outright.
This reads as genuine contested balance by the stated bar, for the
first time across all three directives that have measured it.

**A real new finding, not fixed here:** by strategy, `DiscreditHeavy`
moved from 2W-0L-1D to a clean **3W-0L-0D** sweep as a side effect of
the origin rebalance (all three wins narrow, +1 margin, "Contested" by
the harness's own blowout threshold — not a runaway blowout strategy,
but still a real 0-loss floor). `SafeAppealsOnly` moved the opposite
direction, 1W-1L-1D → 0W-2L-1D. Fixing this would require touching
`discreditFigure`/`rivalAI.ts`, explicitly read-only in this directive's
scope. Reported honestly as a finding for a follow-up directive, not
absorbed into origin tuning (which would mean adjusting origin numbers
to suppress a downstream strategy effect with no origin-shape reasoning
behind it — the exact hand-tuning pattern the rule prohibits).

### Hypothesis Verdict — Partially Held, More Nuanced

For `disgraced_knight`: held, but adding matching recurring friction
alone (Change A) was insufficient — it took combining that with
reducing the advantage's own magnitude (Change B) to produce a real
loss. For `bastard_scion`: the friction-*magnitude* explanation alone
was sufficient (Change C) — the "advantage needs to become more
recurring" half of the hypothesis was never needed and is a real,
direct partial disproof for this origin. Not every
one-time-advantage/persistent-friction pairing needs a shape change;
sometimes the friction is just oversized relative to what it's supposed
to offset.

Iteration stopped after three changes: all three origins now have
genuine wins and losses, and a fourth change with no comparable
principled reasoning would risk exactly the hand-tuning pattern the
rule prohibits.

## 2026-08-22 — ADR-005: Contextual First-Use Onboarding

Presentation-only, zero mechanical change. Confirmed by direct
inspection: `App.tsx` had no onboarding state at all past origin
selection — a new player went straight into a live game with every
panel active and zero explanation of Favor, Whisper vs. Appeal,
contradiction risk, Discredit, or verdict requirements.

### Two real findings before writing anything

- **Discredit had zero UI wiring.** `discreditFigure`
  (`utils/gameOrchestration.ts`) is a real, tested engine function, but
  a repo-wide search confirmed no component ever called it — no
  button, nothing. A trigger test for "first Discredit use" is
  impossible to write honestly against a mechanic the player can never
  invoke, so this directive added a minimal "Approach 4: Discredit a
  Rival" section to `AudienceStage.tsx` (rival picker + button) that
  calls the existing, already-tested function — exposing an existing
  mechanic for the first time, not adding new economics or logic.
- **"First Evidence scout" doesn't belong in `EvidencePanel.tsx`,**
  contrary to the directive's scope table. `EvidencePanel.tsx` only
  *presents* already-scouted evidence; the real Scout action lives in
  `ChamberStage.tsx`'s `chamber-scout-button` → `App.tsx`'s
  `handleScout`. Wired there instead, per the sourcing rule to verify
  before assuming.

### Content — cited against real mechanics

All 5 tips (`content/onboardingTips.ts`) cite the exact function each
explanation is drawn from: Whisper (`engine/favor.ts` `applyWhisper` +
`engine/gossip.ts` `checkContradictionAgainstKnown` — checked against
ALL prior claims, any figure), Appeal (`gameOrchestration.ts` `appealTo`
— verified it never touches `mostRecentClaim`/`allClaims`/`exposedAgainst`,
so it's genuinely risk-free, not just "safer"), Evidence Scout
(`scoutForEvidence`'s fixed rotation + `presentEvidenceTo`'s figure-match
no-op), Discredit (`discreditFigure` — costs a turn, grants the player
no favor of their own), and Verdict Approach (`engine/verdict.ts`
`resolveVerdict`'s real majority/tiebreak/empty-throne logic — left
deliberately longer than the other four rather than oversimplified).

### Trigger architecture — real state, not a "seen" flag

`utils/onboardingTriggers.ts` exports `determineTip(gameState, moveType,
tipId)` — the exact function `App.tsx`'s move handlers call before
dispatching. MoveType tips check real ticker history
(`gameState.ticker.some(...)`); the verdict-approach tip checks
`gameState.segment === TOTAL_SEGMENTS` directly (true for exactly one
real move per game, since segment never revisits a prior value) and
takes priority if both conditions coincide. Called only from inside the
four real click handlers, never a `useEffect` on mount — the direct
architectural fix for the Phase 11 "re-fires on every revisit" bug
class, since there's no code path that can invoke it without a genuine
player action.

### Tests

`tests/test_succession_onboarding.ts`: 15 tests, 3 per tip, built from
real `gameOrchestration.ts` state transitions (never a hand-typed mock
ticker), calling the same `determineTip` used in production. Per tip:
Test A (fires on genuine first occurrence — guards "never checked its
real condition"), Test B (does not fire on real second occurrence —
guards "re-fires on every revisit"), Test C (does not fire from
unrelated real activity — proves it discriminates on the specific
condition, not just ticker non-emptiness). One extra: the Evidence
Scout Test C uses `bastard_scion`, which starts with 1 pre-scouted item
*without* ever calling `scoutForEvidence` — proving the trigger checks
real `'scout'` ticker entries, not `scoutedCount`, which would have
misfired. `npx tsc --noEmit` clean. **127/127** tests pass (112 + 15).

### Manual Verification

No screenshot/vision tool is available in this environment. A live dev
server + browser preview was handed to the user with explicit steps to
manually trigger the Appeal and Whisper tips, per the directive's own
"Manual" labeling of this criterion.

### What Did NOT Change

`rivalAI.ts`, `favor.ts`, `verdict.ts`, `origins.ts` — untouched,
read-only. `discreditFigure`'s own logic — untouched, only its UI
exposure is new. No new npm dependencies —
`@testing-library/react` was considered for true DOM-level tests but
rejected as outside scope; the real trigger function was extracted
instead so tests exercise the identical production code path built from
real state transitions, the strongest available guarantee without a new
dependency.
