# Succession: continue the persuasion-sim build

## 1. Why this exists

Succession is Active and mid-development — a persuasion-sim redesign with a
local TitleScreen already implemented. Unusually, the game carries its own
design corpus in-tree: `ts/src/games/succession/docs/` has six ADRs and
`Succession_Design_and_Identity.md`, plus `PATCH_NOTES_v0.2.0.md`. Those
documents are the spec of record — this directive funds the next increment,
it does not re-plan it.

## 2. Scope

`ts/src/games/succession/` only.

## 3. The work

1. Read `docs/Succession_Design_and_Identity.md`, the ADRs (001–006:
   rival-contradiction risk, diminishing returns, value-aware rival
   switching, origin rebalance, onboarding, GameShell adoption), and the
   patch notes. Report which design items are done, stubbed, or absent.
2. Ship one coherent increment of the documented design — chosen by what
   the docs imply is next, not by convenience.
3. Chrome: board shows Tutorial=N, Sound=N — first-run tutorial via
   `OnboardingGate` (the game already adopted GameShell per ADR-006) and
   sound via `engine/shared/sfx/` if present.
4. **Shared-component duty (ADR-014):** persuasion/rival-AI mechanics and
   progressive-disclosure UI are strong shared candidates; extract what has
   a real second consumer and name it in the report.

## 4. What NOT to do

- Do not contradict the game's own ADRs — they are settled decisions. If one
  looks wrong, report it; do not silently work around it.
- No scope creep into other games.
- No external assets or services.

## 5. Verification

- `cd ts && npm test` green (`test_succession_*` included).
- `cd ts && npm run build` clean.
- Report: design-state map found, increment shipped, extractions made.

<!-- queue:start -->
## Queue

| Field | Value |
|---|---|
| Status | Review |
| Assigned to | devin |
| Branch | directive/rfdgamestudio-revamp-succession-continue-directive |
| Base branch | - |
| Base commit | 8e781ae68a10c223a6f38e4db593aeb60bbf6124 |
| Head commit | cd37e66a66ce0c08bc6bd36387435a558ed21b80 |

**Status log**
- 2026-09-28 21:57 · devin-overseer (delegated) · Queued → Approved
- 2026-09-29 19:12 · dispatcher · Approved → In progress — dispatched devin on personal-laptop in C:\GitHub\.worktrees\RFDGameStudio--rfdgamestudio-revamp-succession-continue-directive; copied ts/src/games/game-metadata.json; lane=default; model=swe-2-high; persona=steady-builder
- 2026-09-29 19:51 · devin-overseer (delegated) · In progress → Review — ADR-007 figure-locked persuasion methods (Chancellor=evidence 2x, Archbishop=whisper 2x, Commander=appeal 2x; non-locked 0.25x floored at 1) + first-run CourtPrimer via shared OnboardingGate. Harness: 7 strategies x 3 origins, LockedLanes wins >=1 per origin (no hopeless lane). tsc clean, vitest 2006 pass, production build green, pushed. [origin] spent: devin 0 min est. n/a
<!-- queue:end -->
