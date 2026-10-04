# Arcade manifest `counts` block: generated game counts (Phase 0, D0.3)

**Read first** (everything this run needs is pasted below; these are the files to open):
`ts/src/arcade-manifest/buildManifest.ts` (where the manifest is built), `ts/tools/export-arcade-manifest.ts` (the CLI that writes it),
`ts/tests/test_arcade_manifest.ts` (the pattern for the new test), `docs/superpowers/specs/2026-10-04-studio-redesign.md` (Phase 0, D0.3; section on honest numbers).

## 1. Why this exists

The site says "34 games" in hand-typed copy (`content/projects/rfd-game-studio.md:9` and `:62` in the site repo) while the arcade lists 27 and the registry holds 36.
Nothing generated says how many games exist, so copy drifts. The redesign spec requires every player-visible number to be generated.
Measured on origin/main `f915dbca` (2026-10-04) by running the exporter:

```
cd ts && npx vite-node tools/export-arcade-manifest.ts
...
Wrote <repo>\ts\src\games\arcade-manifest.json (36 games)
```

Status spread of those 36 games in the exported manifest (counted from the JSON): stable 3, beta 1, dev 15, external 14, tool 3 (total 36; no `retired` today).
`GameStatus` is `'stable' | 'beta' | 'dev' | 'external' | 'tool' | 'retired'` (`ts/src/engine/types.ts` line 69).

This directive adds a `counts` block to the manifest so the site (separate directive, D0.4, site repo) can read the numbers instead of typing them.

## 2. Scope

1. New module `<!-- new: ts/src/arcade-manifest/counts.ts -->`: a pure function that computes the counts from the manifest games.
2. `ts/src/arcade-manifest/buildManifest.ts`: add `counts` to the `ArcadeManifest` interface and to the object `buildArcadeManifest` returns.
3. `ts/tools/export-arcade-manifest.ts`: print the counts in the final log line (no other change).
4. New test `<!-- new: ts/tests/test_arcade_manifest_counts.ts -->`.

## 3. The work

Files edited use CRLF line endings; keep them (the Edit tool preserves them). Do not convert. New files may use either; use CRLF to match.

**Step 1: `ts/src/arcade-manifest/counts.ts`.** Export exactly:

```ts
/** Generated game counts. The site reads these; no number is typed into copy. */
export interface ManifestCounts {
  /** Every game in the registry export. */
  total: number;
  /** Games a player can be shown: status is not 'retired' and not 'tool'. A missing status counts as 'dev'. */
  published: number;
  /** One entry per status that occurs; a missing status is counted under 'dev'. Keys are sorted alphabetically. */
  byStatus: Record<string, number>;
}

export function computeCounts(games: ReadonlyArray<{ status?: string }>): ManifestCounts
```

Rules: `status ?? 'dev'` is the effective status. `published` counts games whose effective status is neither `retired` nor `tool`. `byStatus` has no zero entries and its keys are inserted in sorted order.
Do NOT add a `withCover` field: cover images live in the site repo (`data/arcade.json` `cover`), not in the studio registry, so the studio cannot know it. The site counts covers itself (D0.4).

**Step 2: `buildManifest.ts`.** Import `computeCounts` and `ManifestCounts` from `./counts`. Add `counts: ManifestCounts;` to `interface ArcadeManifest` (after `protocol`). Change the final line of `buildArcadeManifest` from
`return { generatedAt: now(), protocol: ARCADE_PROTOCOL, games, skipped };` to
`return { generatedAt: now(), protocol: ARCADE_PROTOCOL, counts: computeCounts(games), games, skipped };`.
Change nothing else in that file (no change to `ManifestGame`).

**Step 3: `export-arcade-manifest.ts`.** Replace the last line
``console.log(`Wrote ${out} (${manifest.games.length} games)`);``
with
``console.log(`Wrote ${out} (${manifest.games.length} games; published ${manifest.counts.published}; ${JSON.stringify(manifest.counts.byStatus)})`);``

**Step 4: test `ts/tests/test_arcade_manifest_counts.ts`.** Imports: `describe, it, expect` from `vitest`; `computeCounts` from `../src/arcade-manifest/counts`; `buildArcadeManifest` from `../src/arcade-manifest/buildManifest`; `GAME_REGISTRY` from `../src/games/registry`. Tests:
- `computeCounts` on a fixture `[{status:'stable'},{status:'dev'},{status:'dev'},{status:'tool'},{status:'retired'},{status:'external'},{}]` returns `{ total: 7, published: 5, byStatus: { dev: 3, external: 1, retired: 1, stable: 1, tool: 1 } }` (the `{}` game counts as `dev`).
- `computeCounts([])` returns `{ total: 0, published: 0, byStatus: {} }`.
- real registry (contradiction check): `const m = buildArcadeManifest({ registry: GAME_REGISTRY, metadata: {}, statusEntries: [], readText: () => null })`, then
  `m.counts.total === m.games.length`, `m.counts.total === GAME_REGISTRY.length`,
  `m.counts.published === m.games.filter(g => g.status !== 'retired' && g.status !== 'tool').length`,
  and the sum of `Object.values(m.counts.byStatus)` equals `m.counts.total`.
  Do NOT hard-code 36 or 33 in the test: the registry grows.

## 4. What NOT to do

- No `withCover`, no cover logic, no reading of any site-repo file (the site repo is outside the worktree).
- No change to `ManifestGame`, to how games are built, or to the devlog code (`devlog.ts`).
- No change to `ts/src/games/registry.ts` or any game config.
- Do not commit `ts/src/games/arcade-manifest.json` (gitignored; running the exporter writes it; leave it, do not stage it).
- Do not edit `ts/tests/test_arcade_manifest.ts` (it must keep passing unchanged).
- Do not touch protected repos, `archive/`, `docs/children.json` or `tests/fixtures/demo_lists_snapshot.json`.
- Do not deploy or rebuild anything.

## 5. Verification

```
uv run python --version
```
Expected: `Python 3.12.x` (no Python is changed here; this is the standing interpreter check).

Baseline, before editing (verified 2026-10-04 on origin/main `f915dbca`):
```
cd ts && npx vitest run test_arcade_manifest.ts
```
Real tail: `Test Files  1 passed (1)` / `Tests  4 passed (4)`.

After editing:
```
cd ts && npx vitest run test_arcade_manifest_counts.ts
```
Expected: 1 file, 5 tests passed. Then the regression check (same form):
```
cd ts && npx vitest run test_arcade_manifest.ts test_registry_export.ts
```
Expected: all passed. Baseline real tail (before editing, same command): `Test Files  2 passed (2)` / `Tests  7 passed (7)`; after editing it must be the same.
`uv run python --version` verified on this machine: `Python 3.12.12`.

Then the exporter (writes the gitignored JSON; makes no tracked change):
```
cd ts && npx vite-node tools/export-arcade-manifest.ts
```
Expected last line shape, with today's registry: `Wrote ...arcade-manifest.json (36 games; published 33; {"beta":1,"dev":15,"external":14,"stable":3,"tool":3})`. The exact numbers move with the registry; `published` must equal `games minus tool minus retired`.

Source check (Grep tool, one call each): `ts/src/arcade-manifest/buildManifest.ts` contains `counts: computeCounts(games)` once.

## 6. Rules for this run

- This run is NON-INTERACTIVE. A tool call that needs a confirmation is rejected and the run ends mid-task.
- ONE simple command per tool call. No `;`, `&&`, `||`, `|` chains and no redirects, with the single exception of
  the sanctioned verification line form `cd ts && npx vitest run <bare-filename>.ts` (and the `cd ts && npx vite-node ...` line above). Do not use `ls`, `Get-ChildItem`
  or `cat`: use Read, Glob and Grep. Use the bare test filename as the filter (a path filter finds no tests). No live process probing.
- Do not install, download or fetch anything. Do not read outside this worktree. Do not search or hunt for facts: every
  path and quoted line you need is above. If a path is missing or a quoted line differs from the file, STOP and write why in the Status row.
- Never commit to main, never push, never deploy. Work stays on your `directive/<slug>` branch; commit there. Only Robert merges.
- Do not create scratch or debug files in the repo; use `.devin-scratch/` if you need one.
- No absolute paths inside this repo's checkout in any file you write; use repo-relative paths.
- Do not run `agentflow lint` or any agentflow command. Do NOT run `uv run python -m studio.demos index` (the sandbox refuses it).
- New logic goes in small new modules; no file over 600 lines (this run adds about 25 lines in `counts.ts`).
- Status row meanings: when every Completion criteria box is checked and the verification tails are in the log line,
  set the row to **Review** (this is "Done" for the run). Never set it to Done: only Robert or Claude marks Done after merge.
  If you stop partway, set it to Blocked and write why.

## 7. Completion criteria

- [ ] `ts/src/arcade-manifest/counts.ts` exists and exports `ManifestCounts` and `computeCounts` as specified.
- [ ] `buildArcadeManifest` returns `counts`; `ArcadeManifest` declares it.
- [ ] `ts/tests/test_arcade_manifest_counts.ts` exists; `cd ts && npx vitest run test_arcade_manifest_counts.ts` passes (real tail pasted).
- [ ] `cd ts && npx vitest run test_arcade_manifest.ts test_registry_export.ts` passes (real tail pasted).
- [ ] The exporter's last line shows the counts (real line pasted).
- [ ] No file outside the four in Scope changed.
- [ ] The Status row is set to Review with a one-line log entry.

## Sandbox needs

none

## 8. Report

Findings first: the four files, and the real counts the exporter printed. Evidence second: the real tails of `uv run python --version` and the vitest and exporter
commands. Then say plainly: `published` here is "status not retired and not tool" (the registry has no `external-origin` status; origin exhibits are `external`),
and it will NOT equal the site's arcade count (27 on 2026-10-04) because the site also gates on build health; reconciling the two is D0.4 (site repo), not this run.
Recommended action: review, merge, then D0.4 reads `counts`.

## Forbidden Actions

- Committing to or pushing main; pushing at all; deploying; installing or fetching anything; reading outside the worktree; touching protected repos; editing `archive/`, `docs/children.json` or `tests/fixtures/demo_lists_snapshot.json`; staging `ts/src/games/arcade-manifest.json`.

## Required from User

none.

<!-- queue:start -->
## Queue

| Field | Value |
|---|---|
| Status | In progress |
| Assigned to | devin |
| Branch | directive/rfdgamestudio-manifest-counts-block-directive |
| Base branch | - |
| Base commit | b8674911ce5a8128ffbd690d757dd941f05466b3 |

**Status log**
- 2026-10-04 09:26 · robert-claude-laptop · none → Queued
- 2026-10-04 09:26 · robert-claude-laptop · Queued → Approved — lint override: stale MCP lint; new-file markers present; author ran baselines
- 2026-10-04 11:37 · dispatcher · Approved → In progress — dispatched devin on personal-laptop in C:\GitHub\.worktrees\RFDGameStudio--rfdgamestudio-manifest-counts-block-directive; lane=default; model=swe-2-high; persona=steady-builder
<!-- queue:end -->
