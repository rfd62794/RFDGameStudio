# Rename the Voidrift Particle Sandbox to GrainWorks (id `grainworks`)

**Depends on:** `Polish_Voidrift_Particle_Sandbox_TierA_Directive.md` and `Polish_Voidrift_Particle_Sandbox_Phone_Directive.md` merged (both edit files this run renames; renaming first would conflict with them).
**Decided by Robert, 2026-10-08:** "it's a unique concept unrelated to voidrift"; the name is GrainWorks.

## 1. Why this exists

The falling-sand factory game ported from the AI Studio export is a different game from VoidDrift: no shared code, no space theme, a different loop (`docs/demos/voidrift_particle_sandbox/DIRECTION.md`, "most toy-like, shareable member of the family"). Its only link to VoidDrift is the label "VoidRift Particle Sandbox" and the id `voidrift_particle_sandbox`. Robert named it GrainWorks and wants the family tie gone from the id, folders, tests, registry entries and the in-game title.

Measured footprint (Grep, 2026-10-08, excluding `node_modules`, `dist*`, `review-ranch-save/`, `wt-cpw/`):
- Game folder: `ts/src/games/voidrift_particle_sandbox/` (23 files).
- Source example folder: `examples/voidrift-redux-particle-sandbox/`.
- Direction docs folder: `docs/demos/voidrift_particle_sandbox/` (`DIRECTION.md`, `SCOPE.md`).
- Tests: `ts/tests/test_voidrift_particle_sandbox_flow.ts`, `_reactions.ts`, `_registry.ts`, `_simulation.ts`, `_tiles_materials.ts` (plus `_tier_a.ts` and any phone test the two dependency directives add).
- Id or title strings inside: `ts/src/games/voidrift_particle_sandbox/App.tsx`, `ts/src/games/voidrift_particle_sandbox/config.ts`, `ts/tests/test_collect_configs.ts`, `ts/tests/seeded_sim_guard.baseline.json`, `docs/children.json`. The generated registry files in the games folder (arcade manifest, game metadata and registry export JSONs) are gitignored and not in the worktree: do not look for or edit them; the controller regenerates them after merge.
- Pending directive that names the old paths: `docs/directives/Voidrift_Particle_Sandbox_Save_Golden_Directive.md`.

## 2. Scope

New names: id `grainworks`, display title `GrainWorks`, game folder `ts/src/games/grainworks/`, example folder `examples/grainworks/`, docs folder `docs/demos/grainworks/`, tests `ts/tests/test_grainworks_*.ts`.

1. Move the three folders and the test files with `git mv` only (this directive declares `Exec(git mv)` below). No copy-then-delete.
2. Replace the old id and title strings in the files listed above. Every `voidrift_particle_sandbox` becomes `grainworks`; every `voidrift-redux-particle-sandbox` becomes `grainworks`; every "VoidRift Particle Sandbox" or "Voidrift Particle Sandbox" becomes "GrainWorks". Keep the registry `status` (`dev`) and every other field as it is.
3. Fix relative imports inside the moved files and tests so they resolve to the new paths.
4. In `docs/directives/Voidrift_Particle_Sandbox_Save_Golden_Directive.md`, update the path and test-file names it cites to the new ones and add one line at the top: "Renamed to GrainWorks by Rename_Particle_Sandbox_To_GrainWorks_Directive.md". Do not touch its Queue block.
5. Leave historical directives and notes that already ran (anything under `docs/directives/` other than the Save_Golden file, `docs/state/`, `docs/RFDGameStudio_DemoPortingRoadmap.md`, `docs/superpowers/`) untouched: they are records of what was true when written.

## 3. What NOT to do

- Do not run `npm run build:*`, `vite-node`, any exporter, `agentflow` commands or `uv run python -m studio.demos index`. The generated registry JSONs are edited by hand for the id and title only; the controller regenerates and verifies them after merge.
- Do not edit `studio_mcp/import_fixer/tests/fixtures/resolve_source_baseline.json` or anything under `ts/dist-*`, `review-ranch-save/`, `wt-cpw/`. If a test fails only because of the fixture, report it in the Status row; do not change it.
- Do not use `git rm` (the sandbox denies it) or delete anything. Do not change game behaviour, balance, materials, saves, or any test assertion other than the id and path strings.
- Do not rename the VoidDrift or VoidDrift Redux games. Do not run `git merge origin/main`. Do not install, download or fetch anything, read outside the worktree, or search for facts: every path you need is listed above. If a listed path is missing, stop and write why in the Status row.
- Never commit to main, never push except your `directive/<slug>` branch, never deploy. No scratch files (use `.devin-scratch/`).

## Sandbox needs

- Exec(git mv)

## 5. Verification

```
uv run python --version
```
Expected `Python 3.12.x`.

After the moves and edits:
```
cd ts && npx vitest run test_grainworks_registry.ts test_grainworks_simulation.ts test_grainworks_flow.ts test_grainworks_reactions.ts test_grainworks_tiles_materials.ts test_collect_configs.ts
```
Expected all test files passed, 0 failed (the Tier A and Phone test files, if present, are included by name).
```
cd ts && npx tsc --noEmit
```
Prints nothing when clean (a lone missing `game-metadata.json` import error means the worktree lacks that gitignored file: write that in the Status row, do not hunt).

Source check (Grep tool, whole repo excluding `node_modules`, `dist*`, `review-ranch-save`, `wt-cpw`, `docs/state`, `docs/superpowers`, historical directives): no remaining `voidrift_particle_sandbox`, `voidrift-redux-particle-sandbox` or "VoidRift Particle Sandbox" in `ts/`, `examples/`, `docs/demos/` or `docs/children.json`.

## 6. Completion criteria

1. The game, its tests, its example and its docs live under the `grainworks` names and no old id remains in the listed locations.
2. The vitest command above shows 0 failed and `tsc --noEmit` is clean.
3. The Save_Golden directive cites the new paths.
4. The branch is pushed and the Status row is Review.

## 7. Report

In the Status row: the file moves (counts), the vitest and tsc tails verbatim, and anything you could not change and why.

<!-- queue:start -->
## Queue

| Field | Value |
|---|---|
| Status | Superseded |
| Assigned to | devin-any |
| Branch | directive/rfdgamestudio-rename-particle-sandbox-to-grainw-cb7df6 |
| Base branch | - |
| Base commit | ee348031c108ecc76fb64813054badf0b6198273 |
| Head commit | eb2cb76edbfd72e9b1378bc7c6f892ca86de40f8 |
| Head remote | rfd62794/rfdgamestudio |

**Status log**
- 2026-10-08 19:49 · robert-claude-laptop · none → Queued — Robert 2026-10-08: GrainWorks, unrelated to Voidrift; runs after Tier A and Phone merge
- 2026-10-09 00:34 · robert-claude-laptop · Queued → Approved
- 2026-10-09 00:35 · dispatcher · Approved → In progress — dispatched devin-any on personal-laptop in C:\GitHub\.worktrees\RFDGameStudio--rfdgamestudio-rename-particle-sandbox-to-grainw-cb7df6; lane=default; model=swe-2-high; persona=steady-builder; agent_id=01M4FF3B5NJGS0VD3FM3MCS7RN
- 2026-10-09 00:35 · dispatcher · worktree C:\GitHub\.worktrees\RFDGameStudio--rfdgamestudio-rename-particle-sandbox-to-grainw-cb7df6; copied ts/src/games/game-metadata.json; provisioned: uv sync --frozen
- 2026-10-09 00:44 · devin-overseer (delegated) · In progress → Blocked — Sandbox refused `git mv ts/src/games/voidrift_particle_sandbox ts/src/games/grainworks` — declared Exec(git mv) was not granted (git mv is outside the run's allowed command list). No permitted alternative exists: directive requires git mv only / no copy-then-delete, and no move/rename primitive (mv, Move-Item, git rm) is allowed. No files changed; worktree clean. Grant git mv or perform the 12 moves out-of-band, then requeue.; under delegate.envelope
- 2026-10-09 00:47 · robert-claude-laptop · Blocked → Queued — requeue: git mv was refused because '## 4. Sandbox needs' (numbered) was not parsed (sandbox_grants empty); heading fixed to '## Sandbox needs'
- 2026-10-09 00:48 · robert-claude-laptop · Queued → Approved
- 2026-10-09 00:48 · dispatcher · Approved → In progress — dispatched devin-any on personal-laptop in C:\GitHub\.worktrees\RFDGameStudio--rfdgamestudio-rename-particle-sandbox-to-grainw-cb7df6; lane=default; model=swe-2-high; persona=steady-builder; agent_id=01M4FFVDFM2HR6K8A21ANAYQBM
- 2026-10-09 00:48 · dispatcher · worktree C:\GitHub\.worktrees\RFDGameStudio--rfdgamestudio-rename-particle-sandbox-to-grainw-cb7df6; resynced: merged main into directive/rfdgamestudio-rename-particle-sandbox-to-grainw-cb7df6 (6 commit(s), clean); provisioned: uv sync --frozen
- 2026-10-09 06:20 · robert-claude-laptop · In progress → Review — Run stopped at pre-push hook after push landed; remote tip eb2cb76e verified, vitest 77/77 + tsc clean per log. Overseer salvage. [origin] spent: devin 18 min est. n/a
- 2026-10-09 06:35 · robert-claude-laptop · Review → Superseded — superseded_by: commit:e591efd9 - note: Landed via PR #248 (merge e591efd9); Sonnet review MERGE, vitest 77/77 + tsc clean. Follow-ups: regenerate registry JSONs, fix resolve_source_baseline.json:206.
<!-- queue:end -->
