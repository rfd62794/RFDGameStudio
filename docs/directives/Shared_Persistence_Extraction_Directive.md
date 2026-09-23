# Shared persistence: extract `ts/src/engine/shared/persistence` (ADR-014)

**Read first:** `docs/superpowers/specs/2026-09-23-engine-shared-modules.md`,
`ts/src/engine/shared/index.ts`, and these live consumers:
`ts/src/games/dissonance/App.tsx` (lines ~25-40),
`ts/src/games/slimeworld/App.tsx` (~line 122),
`ts/src/games/slither_rogue/components/GameOverModal.tsx` + `MainMenu.tsx`
(`sr_highscores`), `ts/src/games/early_learning_buddy/App.tsx` (~44-56),
`ts/src/games/horse_racing/App.tsx` (~line 22),
`ts/src/games/gladiator_arena/context/GameContext.tsx` (~line 80),
`ts/src/games/planetofgreed/App.tsx` (~line 311).

## 1. Why this exists

8 games independently re-roll the same localStorage pattern:
`try/catch` + `JSON.parse` on read, `JSON.stringify` on write, hand-rolled
key constants, no version field, no corrupt-save recovery. This is the most
duplicated capability in the repo after vector math.

## 2. The work

### 2.1 New module `ts/src/engine/shared/persistence.ts`

```ts
export interface SaveOptions<T> {
  /** Bump when the shape changes; stale versions are migrated or dropped. */
  version?: number;
  /** (old: unknown, fromVersion: number) => current shape. Absent + stale => null. */
  migrate?: (old: unknown, fromVersion: number) => T | null;
}

export function loadSave<T>(key: string, opts?: SaveOptions<T>): T | null;
export function writeSave<T>(key: string, value: T, opts?: { version?: number }): void;
export function clearSave(key: string): void;
```

Semantics (keep boring):
- `loadSave`: missing key → `null`; malformed JSON → `null` (never throws).
  With `version`: stored value must be `{v: number, data: T}`; a version
  mismatch calls `migrate(old.data, old.v)` if given, else returns `null`.
  Unversioned loadSave reads the raw JSON as `T` (matches today's behavior).
- `writeSave`: `version` → stores `{v, data}`; without → raw value.
  Quota/serialization errors swallow silently (today's behavior).
- `clearSave`: removes the key.
- No key namespacing inside the module — callers keep their existing key
  constants so existing saves keep working (renaming would orphan saves).

Export via `export * from './persistence';` in `shared/index.ts`.

### 2.2 Migrate consumers

Convert each call site listed in §Read-first to `loadSave`/`writeSave`,
preserving the exact storage keys in use (e.g. `sr_highscores`,
`corpworld_state`, `eb_stars`). Where a site hand-rolls something the module
doesn't cover (e.g. a multi-key scan), keep that part local — migrate only
the getItem/parse/setItem core.

### 2.3 Tests

Vitest: missing key → null; malformed JSON → null (seed localStorage with
`"{broken"`); round-trip write/load; versioned write + stale load with and
without `migrate`; `clearSave`. jsdom/happy-dom localStorage is presumably
available — check how existing tests touch localStorage first and follow it;
if none do, use a minimal `globalThis.localStorage` stub.

## 3. What NOT to do

- No behavior changes beyond centralizing the pattern — same keys, same
  on-disk shapes (unversioned consumers stay unversioned).
- Do not add a namespace/prefix feature, a save-cloud sync stub, or events —
  nothing speculative.
- Do not touch games not listed above.

## 4. Completion criteria

- [ ] `cd ts && npx vitest run` — no new failures. Baseline recorded
      2026-09-23 on `main`: 3 failures, all in
      `tests/test_dual_target_deploy.ts` (ENOENT on stale `dist-shoal` asset
      hashes) — pre-existing, not yours to fix.
- [ ] `cd ts && npm run build` — tsc clean.
- [ ] `grep -rn "JSON.parse(localStorage" ts/src/games` returns nothing in
      the migrated games.

## Sandbox needs

- Exec(npm run build)
- Exec(npx vitest)
- Exec(npm test)

## 5. Rules for this run

- NON-INTERACTIVE: confirmation-requiring tool calls end the run. No
  installs, downloads, fetches, or reads outside the worktree.
- **Never use `git -C` / `git -c` / `git --git-dir` / `git --work-tree` —
  flag forms are denied by dispatch policy and a denial ends the run.** Run
  git with the worktree as your working directory.
- Branch `directive/rfdgs-shared-persistence-extraction-directive` from
  `main`. Never commit to `main`, never push.
- If a tool call is genuinely blocked, stop and write why in the Status row.
