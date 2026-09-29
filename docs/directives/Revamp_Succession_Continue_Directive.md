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
| Status | Queued |
| Assigned to | devin |
| Branch | - |
| Base branch | - |
<!-- queue:end -->
