# Engine: namespaced save keys and a migration registry in shared persistence

**Read first:** `ts/src/engine/shared/persistence.ts` (60 lines, pasted below),
`ts/tests/test_shared_persistence.ts` (9 tests, must stay green untouched),
`docs/superpowers/specs/2026-10-04-engine-tooling-roadmap.md` (section e, E0).

## 1. Why this exists

38 games pick their own localStorage keys with no namespace, so two games can collide and a
version bump has no shared migration path. Today's API (real file, origin/main `cc793954`):

```ts
export interface SaveOptions<T> { version?: number; migrate?: (old: unknown, fromVersion: number) => T | null; }
interface SaveEnvelope { v: number; data: unknown; }
export function loadSave<T>(key: string, opts?: SaveOptions<T>): T | null   // never throws; stale + no migrate => null
export function writeSave<T>(key: string, value: T, opts?: { version?: number }): void
export function clearSave(key: string): void
```

Baseline: `cd ts && npx vitest run test_shared_persistence.ts` printed
`tests/test_shared_persistence.ts (9 tests) 5ms`, `Test Files 1 passed (1)`, `Tests 9 passed (9)`.
`cd ts && npx tsc --noEmit` exit 0.

## 2. Scope (in order)

1. NEW `ts/src/engine/shared/saveNamespace.ts`: `saveKey(gameId: string, slot = 'main'): string` returning `rfd:<gameId>:<slot>:save`; validates gameId/slot match `/^[a-z0-9_]+$/` (throw `Error` on invalid: a programmer error, not a runtime save error).
2. NEW `ts/src/engine/shared/saveMigrations.ts`: `type Migration = (data: unknown) => unknown`; `createMigrationRegistry(steps: Record<number, Migration>)` returning `{ migrate(old: unknown, fromVersion: number, toVersion: number): unknown | null }` that applies `steps[from]` for from, from+1, ... toVersion-1 in order, returns `null` if any step is missing or throws, and `null` if fromVersion > toVersion.
3. EDIT `ts/src/engine/shared/persistence.ts`: add `export` helper `registryMigrate<T>(registry, toVersion)` returning a `migrate` callback usable in `SaveOptions` (type-compatible with the existing option). Do not change any existing signature or behaviour.
4. EDIT `ts/src/engine/shared/index.ts`: add `export * from './saveNamespace'; export * from './saveMigrations';`.
5. NEW `ts/tests/test_save_namespace.ts` (first line comment `// NEW: save namespacing + migrations`): saveKey format and invalid input throws; registry runs steps 1->3 in order; missing step returns null; throwing step returns null; `loadSave` with `registryMigrate` loads a v1 envelope as v3 data; a legacy un-namespaced key still loads through the old API (backward compatible).

## 3. The work

Every new file starts with a comment marker `// NEW: <purpose>, see docs/superpowers/specs/2026-10-04-engine-tooling-roadmap.md`. Keep each file under 60 lines. localStorage in tests is jsdom's (the existing test file calls `localStorage.clear()` in `beforeEach`; copy that).

## 4. What NOT to do

- Do not migrate any game to the new keys; do not rename any existing key (saves must keep working).
- Do not change `loadSave` / `writeSave` / `clearSave` behaviour; the 9 existing tests stay green and unedited.
- No new dependencies (no zod). No UI. No export/import-JSON feature (a later directive).
- No build or vite-node commands.

## 5. Verification

- `cd ts && npx vitest run test_save_namespace.ts` : all new tests pass.
- `cd ts && npx vitest run test_shared_persistence.ts` : still `9 passed`.
- `cd ts && npx tsc --noEmit` : exit 0.
- `git status`: 3 new files, 2 edited (`persistence.ts`, `index.ts`) plus the new test.

## 6. Rules for this run

- The run is NON-INTERACTIVE. Any tool call needing confirmation is rejected and the run ends mid-task. Install, download or fetch nothing; read nothing outside the working directory. Do not search, glob or hunt: if something expected is missing, stop and write that in the Status row.
- Sandbox needs only `cd ts && npx vitest run <bare filename>`, `cd ts && npx tsc --noEmit`, `git status`, `git diff`, and edits. No build, vite-node, or python commands.
- Never commit to main/master, never push, never deploy. Work on branch `directive/engine-save-namespacing`; Robert merges.
- Create no scratch or debug files (deleting is denied in the sandbox). If one is unavoidable it goes under `.devin-scratch/` and stays.
- Do not hand-write a Queue block. If a tool call is genuinely blocked, stop and write why in the Status row.

## 7. Completion criteria

New tests pass, old 9 pass, tsc exit 0, files carry markers, Status row notes the verification output; done = branch committed.

## 8. Report

Test tails for both files, the public API as final signatures, and any behaviour you chose where this spec was silent.

<!-- queue:start -->
## Queue

| Field | Value |
|---|---|
| Status | In progress |
| Assigned to | devin |
| Branch | directive/rfdgamestudio-engine-save-envelope-namespacing--3a8f05 |
| Base branch | - |
| Base commit | 17c15eaa597ac341ca9e7eded282f38563019bd4 |

**Status log**
- 2026-10-04 17:33 · robert-claude-laptop · none → Queued
- 2026-10-04 17:35 · robert-claude-laptop · Queued → Approved — lint override: author ran baseline proofs; Robert 2026-10-04 17:28 'use your recommendations for the game engine' and approved all recommendations
- 2026-10-04 18:28 · dispatcher · Approved → In progress — dispatched devin on personal-laptop in C:\GitHub\.worktrees\RFDGameStudio--rfdgamestudio-engine-save-envelope-namespacing--3a8f05; lane=default; model=swe-2-high; persona=steady-builder
- 2026-10-04 18:29 · dispatcher · worktree C:\GitHub\.worktrees\RFDGameStudio--rfdgamestudio-engine-save-envelope-namespacing--3a8f05; copied ts/src/games/game-metadata.json; provisioned: uv sync --frozen
<!-- queue:end -->
