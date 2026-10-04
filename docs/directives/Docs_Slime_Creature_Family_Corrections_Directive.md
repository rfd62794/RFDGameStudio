# Docs: correct the stale notes for the slime and creature demos (five small edits)

**Depends on:** none. Docs only; no code, no tests added.

**Read first** (everything this run needs is pasted below; these are the files to open):
`bible/games/slimeworld/gdd.md`, `ROADMAP.md` (lines 246-250), `docs/demos/anycreature/DIRECTION.md`, `docs/demos/anycreature/SCOPE.md`,
`docs/demos/gladiator_arena/SCOPE.md`, `docs/ROADMAP.md` (the step that asks for `docs/CREATURE_SYSTEM.md`, read only).

## 1. Why this exists

Five recorded notes are wrong or missing, found while reading `docs/demos/*/DIRECTION.md` on 2026-10-04. Notes are claims, not facts; each is corrected here with the evidence:

1. `bible/games/slimeworld/gdd.md` describes a Metroidvania ("Defeat the final boss", "Player death", "Metroidvania with slime mechanics"). SlimeWorld is a breeding, dispatch and territory game (`docs/demos/slimeworld/DIRECTION.md`, "What it tried to be").
2. `ROADMAP.md` lines 246-250 say the full `npm run build` "still fails due to pre-existing TypeScript errors in `horse_racing`, `mutant_battle_ball`, and `slither_rogue`". `docs/ROADMAP.md` records those steps as retired 2026-09-24 because those games already compile, and a type check on 2026-10-04 (`cd ts && npx tsc --noEmit` on origin/main `889dd21e`) names none of them: its only 4 errors are `Cannot find module '../games/game-metadata.json'` (a generated file).
3. `docs/CREATURE_SYSTEM.md` does not exist; `docs/ROADMAP.md` asks for it (artGen vs paperDoll vs creatureArt), and `docs/demos/anycreature/DIRECTION.md` says it should state that the creatureArt seam is parked.
4. `docs/demos/anycreature/SCOPE.md` has no line saying it is not a game. Robert's verdict (2026-10-04, approval of all direction recommendations): PARK. Nothing is deleted.
5. `docs/demos/gladiator_arena/SCOPE.md` still lists Tier A as open ("No Restart/New Game on the start screen", "No `build:gladiator_arena` script"). Both landed in commit `75a90e01` (2026-10-04), per `docs/demos/gladiator_arena/DIRECTION.md`.

## 2. Scope

1. `bible/games/slimeworld/gdd.md` (replace the whole file).
2. `ROADMAP.md` (replace one bullet).
3. New file `<!-- new: docs/CREATURE_SYSTEM.md -->`.
4. `docs/demos/anycreature/SCOPE.md` (append a block).
5. `docs/demos/gladiator_arena/SCOPE.md` (append a block).

## 3. The work

**Step 1: SlimeWorld GDD.** Replace the whole file with this content (keep CRLF if the file has it):

```
---
title: "SlimeWorld GDD"
game: "slimeworld"
type: "gdd"
version: "0.2"
status: "draft"
last_updated: "2026-10-04"
core_loop: "Breed slimes -> Dispatch them to planet regions -> Unlock new regions"
win_condition: "None yet: an open-ended campaign. Unlock every region and win each region's lock."
loss_condition: "None: running low on Biomass slows you down but never ends the run."
---

# SlimeWorld Game Design Document

SlimeWorld is a breeding and territory game. The older notes calling it a Metroidvania were wrong; the full design is `docs/gdd/SlimeWorld_Design_Rev3.md`.

## Core Loop
Breed slimes (colour, shape and accent genetics) -> dispatch them to planet regions -> unlock regions by matching each region's lock -> new tabs and goals open up.

## Win and Loss
No final boss and no player death. The campaign is open-ended; progress saves in the browser and can be restarted from the header.

## Mechanics
See `docs/gdd/SlimeWorld_Design_Rev3.md` for Regents, favors, petitions and the economy. This file is the short summary only.

## Theme
A friendly space-lab of slimes: breed them, send them out, and watch the planet open up.
```

**Step 2: ROADMAP.md.** Use Read on `ROADMAP.md` lines 244-252 and replace the whole bullet that starts `- **Full \`npm run build\` (global arcade).** Still fails due to` (it runs from line 246 to the line ending `Migration)`) with:

```
- **Full `npm run build` (global arcade).** The old note about TypeScript
  errors in `horse_racing`, `mutant_battle_ball` and `slither_rogue` is
  retired: those games compile (`docs/ROADMAP.md` retired those steps on
  2026-09-24, and `cd ts && npx tsc --noEmit` on 2026-10-04 names none of
  them). Each game still has its own standalone build path. (From:
  Dissonance BrewField Migration)
```

**Step 3: creature system doc.** Create `<!-- new: docs/CREATURE_SYSTEM.md -->` with this content:

```
# Creature system: who owns what

Three engine modules produce creature art. They are separate on purpose. Facts measured 2026-10-04.

| Module | Path | Owns | Public entry point | Used by |
|---|---|---|---|---|
| artGen | `ts/src/engine/artGen/` | Shape primitives, a seeded random generator, SVG shapes | `index.ts` re-exports `types`, `seededRandom`, `shapes` | Dissonance, Shoal, Planet of Greed, SlimeWorld (`SlimeVisual`) |
| paperDoll | `ts/src/engine/paperDoll/` | Body plans, bone schema, proportion presets, colour resolution, the chimera SVG renderer, animation | `PaperDoll` component (and `composeFigure`, `renderFigureSvg`) from `index.ts` | Chimera Wilds, Mutant Battle Ball |
| creatureArt | `ts/src/engine/creatureArt/` | A thin seam: resolve an entity to a pre-generated PNG path | `resolveCreatureArt(entity, config)` from `index.ts` | Nothing yet; only its own test (`ts/tests/test_creatureArt.ts`) |

## Which one a demo should use

A demo that draws a creature composed from parts, recoloured or scaled per player uses `paperDoll` (vector; this is the studio rule in `docs/ROADMAP.md`). `artGen` is for shapes and generated sprites. `creatureArt` is for finished raster art.

## creatureArt is parked

The seam and its fixture (`fixtures/wolf.png`, 347,341 bytes) stay in place and cost nothing, but nothing is built on it. Reasons: no game consumes it; the one candidate (Chimera Wilds) is a vector Paper Doll showcase; every attempt to run the offline generator died on infrastructure outside a worktree; the cost, quality and licence of the generator were never measured. It is parked, not deleted: it is the only raster path. Revisit only if a creature game is chosen and a real consumer is specified, with a fallback to a generated sprite when the PNG is missing.
```

**Step 4: anycreature SCOPE.** Append this block to the end of `docs/demos/anycreature/SCOPE.md` (after a blank line):
```
## Update 2026-10-04 (Robert approved all direction recommendations)
N/A as a demo: anycreature is a pipeline, not a game, so the polish tiers do not apply. Verdict PARK (see DIRECTION.md). No code or fork is deleted; `docs/CREATURE_SYSTEM.md` records that the creatureArt seam is parked.
```

**Step 5: gladiator SCOPE.** Append this block to the end of `docs/demos/gladiator_arena/SCOPE.md`:
```
## Update 2026-10-04
Stale above: the Tier A items (a New Game control with a 2-click confirm, the phone tab-bar fit, `build:gladiator_arena` and a seeded career-simulation test) landed in commit `75a90e01`. The current plan is `DIRECTION.md`.
```

## 4. What NOT to do

- Do not edit any code, test, YAML or Lua file, and do not edit `docs/ROADMAP.md` (mark nothing Done; the reviewer updates it).
- Do not delete `ts/src/engine/creatureArt/`, `fixtures/wolf.png`, the anyCreature fork, or any demo code.
- Do not edit `docs/children.json`, `tests/fixtures/demo_lists_snapshot.json`, or other demos' notes.
- Do not run any indexer or generator.

## 5. Verification

```
uv run python --version
```
Expected: `Python 3.12.x` (verified: `Python 3.12.12`).

Baseline, before editing (verified 2026-10-04 on origin/main `889dd21e`):
```
cd ts && npx vitest run test_four_doc_architecture.ts
```
Real tail: `Test Files  1 passed (1)` / `Tests  29 passed (29)`. It must be identical after editing.

Source checks (Grep tool, one call each):
- `bible/games/slimeworld/gdd.md` no longer contains `Metroidvania with slime mechanics` and contains `Breed slimes`.
- `ROADMAP.md` no longer contains `Still fails due to` and contains `old note about TypeScript` once.
- `docs/CREATURE_SYSTEM.md` exists and `Grep -n parked docs/CREATURE_SYSTEM.md` matches at least twice.
- `docs/demos/anycreature/SCOPE.md` contains `Verdict PARK`; `docs/demos/gladiator_arena/SCOPE.md` contains `75a90e01`.

## 6. Rules for this run

- This run is NON-INTERACTIVE. A tool call that needs a confirmation is rejected and the run ends mid-task.
- ONE simple command per tool call. No `;`, `&&`, `||`, `|` chains and no redirects, with the single exception of
  the sanctioned verification line form `cd ts && npx vitest run <bare-filename>.ts`. Do not use `ls`, `Get-ChildItem`
  or `cat`: use Read, Glob and Grep. Use the bare test filename as the filter (a path filter finds no tests). No live process probing.
- Allowed commands are only: `uv run pytest ...`, `cd ts && npx vitest run <bare filename>`, `cd ts && npx tsc --noEmit`, `git status`, `git diff`, `git add`, `git commit`.
  Do NOT run `npm run build:*`, `vite-node`, `agentflow lint` or any agentflow command, `git merge`, or `uv run python -m studio.demos index` (the sandbox refuses them).
- Do not install, download or fetch anything. Do not read outside this worktree. Do not search or hunt for facts: every
  path and quoted line you need is above. If a path is missing or a quoted line differs from the file, STOP and write why in the Status row.
- Never commit to main, never push, never deploy. Work stays on your `directive/<slug>` branch; commit there. Only Robert merges.
- Do not create scratch or debug files in the repo; use `.devin-scratch/` if you need one.
- No absolute paths inside this repo's checkout in any file you write; use repo-relative paths.
- Files edited use CRLF line endings where the file already has them; keep them (the Edit tool preserves them). Do not convert.
- New logic goes in small new modules; no file over 600 lines.
- Player-facing text (blurbs, buttons, messages) is plain, welcoming and free of developer jargon.
- Status row meanings: when every Completion criteria box is checked and the verification tails are in the log line,
  set the row to **Review** (this is "Done" for the run). Never set it to Done: only Robert or Claude marks Done after merge.
  If you stop partway, set it to Blocked and write why.

## 7. Completion criteria

- [ ] All five Scope files are as specified; nothing else changed (`git status` shows exactly 5 paths, one of them new).
- [ ] The Grep checks in section 5 pass (state each result).
- [ ] `cd ts && npx vitest run test_four_doc_architecture.ts` shows 29 passed (real tail pasted).
- [ ] The Status row is set to Review with a one-line log entry.

## 8. Report

Findings first: the five files changed, and whether any quoted text (the ROADMAP bullet) differed from the file. Evidence second: real tails of `uv run python --version` and the vitest command and the Grep results.
Recommended action: review and merge. The reviewer then updates the `docs/CREATURE_SYSTEM.md` step in `docs/ROADMAP.md`.

## Sandbox needs

none

## Forbidden Actions

- Committing to or pushing main; pushing at all; deploying or rebuilding any embed or dist; installing or fetching anything; reading outside the worktree; touching protected repos; editing `archive/`, `docs/children.json` or `tests/fixtures/demo_lists_snapshot.json`; Lua additions; engine changes under `ts/src/engine/`; any player-layer or cloud-save work.

## Required from User

none. Review and merge are Robert's or Claude's after the run.

<!-- queue:start -->
## Queue

| Field | Value |
|---|---|
| Status | Review |
| Assigned to | devin |
| Branch | directive/docs-voidrift-family |
| Base branch | main |

**Status log**
- 2026-10-04 13:25 · robert-claude-laptop · none → Queued
- 2026-10-04 17:23 · devin-cleanroom · Queued → Review — work already merged on main as b954597e (PR #153); verified target text present at 7efe2dfb; row sync only
<!-- queue:end -->
