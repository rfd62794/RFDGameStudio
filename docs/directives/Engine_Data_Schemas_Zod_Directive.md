# Engine: Zod schemas for game YAML data, validated by one vitest (3 games first)

**Read first:** `docs/superpowers/specs/2026-10-04-engine-tooling-roadmap.md` (sections a, c row 1, e E0),
`ts/src/engine/loader.ts` (static `?raw` YAML imports, lines about 70-90), `ts/src/engine/types.ts` (`GameFiles`).

## PRECONDITION (controller, not Devin)

`zod` is NOT in `ts/package.json`, `ts/package-lock.json` or `ts/node_modules` (verified at origin/main `cc793954`:
`grep -n '"zod"' ts/package.json` empty; `ls ts/node_modules/zod` not found). A non-interactive Devin run cannot install it.
The CONTROLLER runs `cd ts && npm install zod` on branch `directive/engine-data-schemas` and commits `package.json` + lockfile
BEFORE this directive is dispatched. Devin starts after and only imports `from 'zod'`. If `ts/node_modules/zod` is absent when
you start, stop and write that in the Status row; do not install, search or work around it.

## 1. Why this exists

The 12 games' YAML (`games/<id>/data.yaml`) is parsed by js-yaml and trusted: a typo shows up as a Lua nil mid-game.
The only validated data today is the glossary (`docs/glossary.schema.json` + a validate test), which is the model here.
Real top-level keys at origin/main `cc793954` (`grep -E "^[a-z_]+:" games/<g>/data.yaml`):

```
chimera_wilds: game, part_slots, parts, baseline_player
horse_racing:  game, stable, betting, race, horse, coat_colors, silk_colors, race_classes, race_distances,
               name_prefixes, name_suffixes, race_venues, race_types, starter_horses (and more below)
choke_point:   game, constants, towers, waves
```

Baseline: `cd ts && npx tsc --noEmit` exit 0; js-yaml is 4.2.0 (already a dependency).

## 2. Scope (in order)

1. NEW `ts/src/engine/schemas/commonSchemas.ts`: shared Zod pieces only: `gameBlock` (`game:` map, passthrough), `nonEmptyString`, `positiveNumber`, `nameList`.
2. NEW `ts/src/engine/schemas/chimeraWilds.ts`, `horseRacing.ts`, `chokePoint.ts`: one schema per game, each `export const <name>DataSchema = z.object({...}).passthrough()` that requires the keys listed above with the right types (read each data.yaml to decide types; use `.passthrough()` so unknown keys are allowed, we only catch missing or wrongly typed required ones).
3. NEW `ts/src/engine/schemas/index.ts`: `export const dataSchemas: Record<string, z.ZodTypeAny>` keyed by game id, and `validateGameData(gameId, parsed): { ok: true } | { ok: false; issues: string[] }` where issues read `games/<id>/data.yaml: <path>: <message>`. A game with no schema returns `{ ok: true }` (not yet covered).
4. NEW `ts/tests/test_engine_data_schemas.ts`: reads each of the 3 data.yaml files with `node:fs` + js-yaml, asserts `validateGameData` ok; plus one negative test per game that deletes a required key from the parsed object and expects `ok:false` with the file path and key in the issue text; plus a coverage test that lists the games lacking a schema and asserts the count equals 9 (the 12 YAML games minus these 3), so adding a schema forces updating the number.

## 3. The work

Every new file starts with `// NEW: <purpose>, see docs/superpowers/specs/2026-10-04-engine-tooling-roadmap.md`. Keep schemas dependency-light: only `zod` and relative imports; no JSON-Schema conversion yet. Do not call the validator from the loader in this directive (build-time/test-time only).

## 4. What NOT to do

- Do not edit any `data.yaml`, `loader.ts`, `runtime.ts` or any Lua file. Do not add schemas for the other 9 games.
- Do not install or upgrade packages. Do not use a different validator.
- Do not make schemas strict (`.strict()`): unknown keys must pass.
- No build or vite-node commands.

## 5. Verification

- `cd ts && npx vitest run test_engine_data_schemas.ts` : all tests pass (3 ok, 3 negative, 1 coverage).
- `cd ts && npx tsc --noEmit` : exit 0.
- `git status`: 5 new source files, 1 new test; `git diff --stat` empty for tracked files.

## 6. Rules for this run

- The run is NON-INTERACTIVE. Any tool call needing confirmation is rejected and the run ends mid-task. Install, download or fetch nothing; read nothing outside the working directory. Do not search, glob or hunt: if something expected is missing, stop and write that in the Status row.
- Sandbox needs only `cd ts && npx vitest run <bare filename>`, `cd ts && npx tsc --noEmit`, `git status`, `git diff`, and edits. No build, vite-node, or python commands.
- Never commit to main/master, never push, never deploy. Work on branch `directive/engine-data-schemas`; Robert merges.
- Create no scratch or debug files (deleting is denied in the sandbox). If one is unavoidable it goes under `.devin-scratch/` and stays.
- Do not hand-write a Queue block. If a tool call is genuinely blocked, stop and write why in the Status row.

## 7. Completion criteria

Tests green, tsc exit 0, markers present, loader untouched; Status row notes the verification output; done = branch committed.

## 8. Report

Test tail, per game the keys you made required and any key you left optional because the data was inconsistent, and which of the 9 remaining games look easiest next.

<!-- queue:start -->
## Queue

| Field | Value |
|---|---|
| Status | Queued |
| Assigned to | devin |
| Branch | - |
| Base branch | - |

**Status log**
- 2026-10-04 17:33 · robert-claude-laptop · none → Queued
<!-- queue:end -->
