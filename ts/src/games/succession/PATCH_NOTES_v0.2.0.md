# Succession — Patch Notes v0.2.0

**August 23, 2026**

Three independent rounds of work, all verified against the real
deterministic balance harness (6 strategies × 3 origins, 18 runs per
measurement) and the real game source — not assumed from design intent.

## Balance Rework (ADR-002 through ADR-004)

The "two games in one" imbalance from Aug 20 is resolved. Every origin
now has genuine wins and losses — confirmed by direct harness
measurement, not claimed from design intent.

### Diminishing returns on repeated claims (ADR-002)

Repeating the same theme at the same figure now halves the favor gain
on each consecutive repeat, floored at 25% of base value. Full value
restores immediately on a genuine theme switch. Applies identically to
player and rivals — same function, no claimant-specific branching.

Real effect: strategies that hammer one figure without rotating
(RushOneFigure, WhisperHeavy) fell from tied-best to worst. Strategies
that naturally rotate targets held steady or improved.

### Value-aware rival theme selection (ADR-003)

Rivals now compare the decayed value of repeating a prior claim against
the contradiction-checked full value of switching themes, using exact
information — not a probabilistic risk estimate. Previously, rivals
repeated unconditionally whenever a prior claim existed, regardless of
how decayed that repeat's value had become.

### Origin rebalance (ADR-004)

Three separate, individually-tested changes, each measured against the
harness before proceeding to the next:

- **disgraced_knight**: Added recurring Archbishop appeal friction
  (-50% favor gain) to match the shape of its recurring Commander bonus.
  Reduced Commander appeal bonus from +50% to +25%. Result: 5W-0L-1D
  (never lost) → 3W-1L-2D (first real losses recorded).
- **bastard_scion**: Reduced Chancellor starting favor penalty from -5
  to -2. Result: 0W-3L-3D (never won) → 1W-3L-2D (first real win
  recorded).

Final harness results — every origin now has both wins and losses:

| Origin | W | L | D |
|---|---|---|---|
| bastard_scion | 1 | 3 | 2 |
| disgraced_knight | 3 | 1 | 2 |
| merchant_banker | 3 | 3 | 0 |

## Onboarding (ADR-005)

Five contextual, first-use-triggered tips, each citing the exact engine
function it describes. Zero mechanical change — presentation only.

- **Whisper**: explains high reward and real contradiction risk
- **Appeal**: explains guaranteed but smaller gains, no risk
- **Evidence Scout**: explains guaranteed leverage, available later
- **Discredit**: explains spending a turn to sabotage, not build
- **Verdict Approach**: explains majority/tiebreak/empty-throne logic

Tips fire once, on the real condition (first use of each move type,
final segment for verdict), never on mere screen load. This is the
direct architectural fix for the Time Served Phase 11 "re-fires on
every revisit" bug class — triggers are called only from inside the
four real click handlers, never a `useEffect` on mount.

Also exposed the Discredit mechanic in the UI for the first time — the
engine function existed and was tested, but no component ever called
it. A minimal "Discredit a Rival" section was added to the audience
stage.

## GameShell Adoption + Progressive Disclosure (ADR-006)

### GameShell adoption — content no longer clipped at 100% zoom

Succession's `App.tsx` had never adopted the shared `GameShell`
component that every other arcade game uses. It rendered its own root
and a hand-rolled sticky header with a duplicate title and no back
button. Without `GameShell`'s `mainClassName="game-shell-main--scrollable"`
modifier, any view taller than the viewport was silently clipped with
no scroll path — the real cause of content being unreachable at 100%
zoom. All three view branches (title, playing, verdict) now render
through `<GameShell>`.

### Progressive disclosure — one approach expanded at a time

The audience stage previously rendered all five approaches (Whisper,
Appeal, Evidence, Indictment, Discredit) fully expanded simultaneously
— a wall of interactive UI on every visit. Now exactly one approach is
ever expanded at a time (collapsed by default). Cost/risk badges stay
visible in the always-shown header row even while collapsed; only the
action body is hidden. Selecting a new approach replaces the previous
one; re-selecting the currently expanded approach collapses it.

Also fixed a pre-existing labeling bug: Indictment and Discredit were
both labeled "Approach 4" — Discredit is now correctly "Approach 5."
