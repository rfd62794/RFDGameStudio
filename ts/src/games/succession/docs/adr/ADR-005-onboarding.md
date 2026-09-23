# ADR-005: Contextual First-Use Onboarding

**Date:** August 22, 2026
**Status:** Accepted — presentation-only, zero mechanical change, with
one real infrastructure gap discovered and closed (Discredit had no UI
at all) and one real scope-table inaccuracy corrected (Evidence Scout
fires from `ChamberStage.tsx`, not `EvidencePanel.tsx`).

## Context

Confirmed by direct inspection: `App.tsx`'s `View` type
(`'title' | 'playing' | 'verdict'`) had no onboarding state at all. A
new player went directly from origin selection into a live game with
every panel active simultaneously, zero explanation of Favor, Whisper
vs. Appeal, contradiction risk, Discredit, or what a verdict requires.

Two real lessons from Time Served's Phase 11 popup system, both
directly addressed here:
1. **Kept:** dismiss-only, no auto-fade (`components/OnboardingTip.tsx`).
2. **Guarded against:** both real Phase 11 bugs (a tip that never
   checked its real gating condition; a tip that re-fired on every
   revisit because its trigger `useEffect` never checked real prior
   state) — see Testing below for how this was specifically targeted.

## Two real findings from direct inspection, before writing anything

**Finding 1 — Discredit had zero UI wiring.** `discreditFigure`
(`utils/gameOrchestration.ts:397-439`) is a real, tested engine function
— but a repo-wide search confirmed it was never called from any
component, never had a button, and `moveType: 'discredit'` never
appeared anywhere in `components/`. The directive's scope table says
"wherever Discredit lives" as if UI wiring already existed — it does
not. A trigger test for "first Discredit use" is impossible to write
honestly against a mechanic the player can never invoke, so this
directive necessarily added a minimal Discredit action section to
`AudienceStage.tsx` (rival target selection + button, styled to match
the existing Appeal/Evidence sections) that calls the existing,
already-tested `discreditFigure` — this exposes an existing mechanic to
the player for the first time; it does not add or change any economics,
formulas, or engine logic. Flagged here as a real, load-bearing finding
this directive had to resolve to be honest about its own trigger tests.

**Finding 2 — "First Evidence scout" does not belong to
`EvidencePanel.tsx`.** The directive's scope table lists
`EvidencePanel.tsx` for wiring the Evidence tip. Direct inspection shows
`EvidencePanel.tsx` only *presents* already-scouted evidence
(`onPresentEvidence`); the actual Scout action
(`chamber-scout-button` → `onScout` → `scoutForEvidence`) lives in
`ChamberStage.tsx`, a file the scope table doesn't mention at all. The
tip is titled "First Evidence **scout**," not "first evidence
presentation" — wired to the real Scout dispatch in `App.tsx`'s
`handleScout`, not to `EvidencePanel.tsx`, per the sourcing rule to
verify before assuming.

## Decision

### Content — sourced directly from the real mechanic, with citations

All five tips (`content/onboardingTips.ts`) cite the real file/function
each explanation is drawn from, and each was checked against that
function before being written:

| Tip | Trigger | Real source cited |
|---|---|---|
| Whisper | first real `'whisper'` in ticker | `engine/favor.ts` `applyWhisper` (contradiction check zeroes gain + disqualifies) + `engine/gossip.ts` `checkContradictionAgainstKnown` (checked against ALL prior claims, any figure) + `WHISPER_FAVOR_GAIN=20` |
| Appeal | first real `'appeal'` in ticker | `utils/gameOrchestration.ts` `appealTo` — verified it never touches `mostRecentClaim`/`allClaims`/`exposedAgainst` at all, so it genuinely cannot expose you (not just "safer," actually risk-free) |
| Evidence Scout | first real `'scout'` in ticker | `utils/gameOrchestration.ts` `scoutForEvidence` (fixed rotation via `scoutedCount`, not player choice) + `presentEvidenceTo` (no-op on figure mismatch) + `EVIDENCE_FAVOR_GAIN=30`, the largest guaranteed gain |
| Discredit | first real `'discredit'` in ticker | `utils/gameOrchestration.ts` `discreditFigure` — reduces target rival's favor by `RIVAL_SLANDER_PENALTY`, floored at 0; grants the player no favor of their own |
| Verdict Approach | `segment === TOTAL_SEGMENTS` | `engine/verdict.ts` `resolveVerdict` — per-figure winner excludes anyone in `exposedAgainst`; majority = 2+ figures; fallback = fewest total contradictions; full tie = `overallWinner: null` |

Per the explicit rule, no tip was oversimplified into something wrong —
the verdict-approach tip is deliberately the longest of the five because
`resolveVerdict`'s real tie-break logic can't honestly be said in one
line.

### Trigger architecture — real state, not a separate "seen" flag

`utils/onboardingTriggers.ts` exports `determineTip(gameState, moveType,
tipId)`, the single function `App.tsx`'s move handlers
(`handleWhisper`, `handleAppeal`, `handleScout`, `handleDiscredit`) all
call before dispatching the real move. "Already seen" is never a
separate boolean that could desync from reality:
- The four moveType tips check `gameState.ticker.some(t =>
  t.claimantId === 'player' && t.moveType === X)` — real ticker history,
  not a flag.
- The verdict-approach tip checks `gameState.segment === TOTAL_SEGMENTS`
  directly — since segment monotonically advances 1→8 then the phase
  flips to `'verdict'` (`advanceSegment`), this condition is true for
  exactly one real move per game, with no separate state needed.
- The verdict-approach tip takes priority if both conditions coincide
  on the same action (tested explicitly, see Testing).

This is called only from inside the four real button-click handlers —
never from a `useEffect` on mount or a render-time check — which is the
direct architectural fix for Phase 11 bug #2 (re-firing on every
revisit): there is no code path that can invoke `determineTip` without
a genuine player action having just been dispatched.

## Testing

`tests/test_succession_onboarding.ts` — **15 tests, 3 per tip**,
matching the directive's required shape exactly. Every test builds
`GameState` via the real `gameOrchestration.ts` functions (`whisperTo`,
`appealTo`, `scoutForEvidence`, `discreditFigure`, `createInitialGameState`)
— never a hand-typed mock ticker — and calls the exact same
`determineTip` function `App.tsx` calls, not a reimplementation that
could silently diverge from production wiring.

Per tip:
- **Test A** (fires on genuine first occurrence) — directly proves the
  tip's real gating condition is checked at all (guards Phase 11 bug
  class #1: "fired on every screen load regardless of actual game
  state — never checked the real condition").
- **Test B** (does not fire on a second real occurrence of the same
  action) — directly proves prior real state suppresses the tip
  (guards Phase 11 bug class #2: "fired repeatedly on every revisit
  because the trigger never checked real prior state").
- **Test C** (does not fire due to unrelated real activity) — proves
  the trigger discriminates on the *specific* real condition rather
  than firing whenever the ticker is merely non-empty or the game has
  merely progressed — the mirror-image proof for bug class #1.

One deliberate extra case beyond the minimum 15: the Evidence Scout
Test C uses `bastard_scion` specifically, since that origin starts with
1 pre-scouted item (`startingEvidenceIndices: [0]`) **without ever
calling `scoutForEvidence`** — this proves the trigger checks the real
ticker for a genuine `'scout'` moveType, not `scoutedCount` or
`playerEvidence.length`, either of which would have misfired here.

Net new tests: **+15**. `npx tsc --noEmit` clean. **127/127** tests pass
(112 + 15 new).

### Manual verification

Screenshots were not captured directly — no vision/screenshot tool is
available in this environment. A live dev server + browser preview was
handed to the user with explicit steps to trigger the Appeal and
Whisper tips manually, per the directive's own "Manual" labeling of
this criterion.

## Consequences

### What Changed

- `components/OnboardingTip.tsx` — new, dismiss-only overlay, no
  auto-fade
- `content/onboardingTips.ts` — new, 5 tips with real-source citations
- `utils/onboardingTriggers.ts` — new, `determineTip` — the real,
  tested trigger logic, imported by both `App.tsx` and the test file
- `App.tsx` — `activeTip` state; `maybeTriggerTip` calls into each
  move handler; overlay rendered as a sibling to `<main>` during
  `'playing'`; `handleDiscredit` added
- `components/AudienceStage.tsx` — new "Approach 4: Discredit a Rival"
  section (rival target picker + button), wiring the pre-existing,
  already-tested `discreditFigure` into the UI for the first time
- `tests/test_succession_onboarding.ts` — new, 15 tests

### What Did NOT Change

- `rivalAI.ts`, `favor.ts`, `verdict.ts`, `origins.ts` — untouched,
  read-only per scope
- `discreditFigure`'s own logic (`utils/gameOrchestration.ts`) —
  untouched; only its UI exposure is new
- `WhisperPanel.tsx`, `EvidencePanel.tsx`, `IndictmentPanel.tsx` — no
  changes needed. Their tips are triggered from `App.tsx`'s handlers
  (which already own the real move dispatch and ticker), not from
  inside the panels themselves — this avoids duplicating trigger logic
  across multiple components, one of which (`IndictmentPanel.tsx`)
  isn't associated with any of the 5 tips at all
- No new npm dependencies added. `@testing-library/react` was
  considered for true DOM-level trigger tests but rejected — jsdom is
  present but RTL is not, and adding a new test dependency is outside
  this directive's stated scope. Instead, the real trigger function
  itself was extracted (`onboardingTriggers.ts`) so tests exercise the
  identical code path used in production, built from real orchestration
  state transitions rather than a mocked ticker — the strongest
  available guarantee without a new dependency.
