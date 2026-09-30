# Mutant Battle Ball: continue the Neo Battlopolis overhaul

## 1. Why this exists

Mutant Battle Ball is mid-flight through its largest change: the Neo
Battlopolis creative overhaul (six-Brand Trinity, Body Part Synergy). The
StatusBoard says "genuinely mid-build, not near done." This directive
continues that build — it does not start a new direction.

## 2. Scope

`ts/src/games/mutant_battle_ball/` plus `ts/src/engine/shared/` modules it
already consumes (anatomy, partSlots, componentTypes, sportsSim). The game's
`CHANGELOG.md` and any in-tree design notes are the spec of record — the
repo's own state files win over this directive where they disagree on detail.

## 3. The work

1. **Read the game's own state first** — `ts/src/games/mutant_battle_ball/
   CHANGELOG.md`, its tests' names, and the StatusBoard row — then state in
   the report which overhaul pieces are done, which are stubs, and which are
   absent. Build only what the documented design calls for.
2. **Advance the overhaul one coherent increment**: pick the next unfinished
   piece the design itself implies (a Brand, a synergy interaction, a wired
   but empty UI surface), implement it end-to-end, and stop. Do not half-do
   three pieces.
3. **Shared-component duty (ADR-014):** the overhaul is exactly where
   reusable things get invented — anatomy/part-synergy mechanics, brand
   theming hooks, roster UI patterns. Anything with a real second use
   (Gladiator Arena's anatomy combat is the obvious candidate) goes to
   `ts/src/engine/shared/` or `ts/src/ui/components/`, named in the report.

## 4. What NOT to do

- Do not redesign the overhaul — Neo Battlopolis / six-Brand Trinity / Body
  Part Synergy is the direction; changing it is Robert's call.
- Do not break the existing match sim — `test_mbb_*` files are the floor.
- Do not remove content that exists to cut scope; leave it wired-but-stubbed
  and say so.
- No art overhaul; mechanics and wiring first.

## 5. Verification

- `cd ts && npm test` green — especially `test_mbb_*`.
- `cd ts && npm run build` clean.
- Report states: design pieces done/stub/absent going in, the increment
  shipped, and any shared extractions made.

<!-- queue:start -->
## Queue

| Field | Value |
|---|---|
| Status | Done |
| Assigned to | devin |
| Branch | directive/rfdgamestudio-revamp-mbb-neobattlopolis-directive |
| Base branch | - |
| Base commit | 422f95da3a255635f5d636b4a762bc6b0ad1a787 |
| Head commit | 42cbc78ef4cb28fb517fbe0cc78c9a4cf9f77466 |

**Status log**
- 2026-09-28 21:56 · devin-overseer (delegated) · Queued → Approved
- 2026-09-29 20:11 · dispatcher · Approved → In progress — dispatched devin on personal-laptop in C:\GitHub\.worktrees\RFDGameStudio--rfdgamestudio-revamp-mbb-neobattlopolis-directive; copied ts/src/games/game-metadata.json; lane=default; model=swe-2-high; persona=steady-builder
- 2026-09-29 20:43 · devin-overseer (delegated) · In progress → Review — [origin] spent: devin 0 min est. n/a
- 2026-09-29 23:27 · devin-overseer (delegated) · Review → Done
<!-- queue:end -->
