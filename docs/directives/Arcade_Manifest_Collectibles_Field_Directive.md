# Arcade manifest: an empty, typed `collectibles` field on every game (roadmap M4.2, Size S)

**Depends on:** `Federated_Arcade_Source_Contract_Directive.md` merged first (it is in Review at the time of writing). It also edits `GameConfig` in `ts/src/engine/types.ts` and `ManifestGame` in `ts/src/arcade-manifest/buildManifest.ts`, and adds `ts/tests/test_arcade_manifest_relationships.ts`. If `relatedGames` is not yet in `ManifestGame` when you start, STOP and write why in the Status row.

**Read first:** `docs/ROADMAP.md` (milestone M4, step M4.2), `ts/src/arcade-manifest/buildManifest.ts` (the whole file, 140 lines; note `leaderboards: g.leaderboards ?? []` is the exact pattern to copy), `ts/src/engine/types.ts` (`GameConfig` and `LeaderboardDef`), `ts/tools/export-arcade-manifest.ts`, `ts/tests/test_arcade_manifest.ts` and `ts/tests/test_arcade_manifest_counts.ts`.

## 1. Why this exists

Roadmap M4.2 mirrors the website roadmap's M4.1: "Add the collectibles field to the arcade manifest before anything ships". The reasoning recorded there: nothing in the manifest models per-game collectibles, a cross-game collection needs the field, adding it across 27 entries later is a retrofit, and adding the empty field now is one commit. The studio generates the manifest the site reads, so the field has to exist on this side first. The roadmap step also fixes one design constraint: pulls are stored as a part id plus a variant id reference, never a combined key, or extending a set later means migrating every player's history. What a game REPORTS versus what the hub GRANTS is a separate open question (M4.3, waiting on Robert), so this run adds only the typed, empty field and its validation; no game populates it.

## 2. Scope

1. `ts/src/engine/types.ts`: new exported interface `CollectibleRef { partId: string; variantId: string }` with a doc comment quoting the no-combined-key rule, and an optional `collectibles?: CollectibleRef[]` on `GameConfig`, next to `leaderboards`.
2. New pure module `ts/src/arcade-manifest/collectibles.ts` <!-- new: ts/src/arcade-manifest/collectibles.ts -->: `normalizeCollectibles(gameId, refs): CollectibleRef[]`. It returns `[]` for `undefined`; throws an `Error` whose message starts with `<gameId>.collectibles` for any entry whose `partId` or `variantId` is not a non-empty string after trimming, for any value containing the characters `:` or `|` (a combined-key smell), and for a duplicate `(partId, variantId)` pair; otherwise returns the refs trimmed and sorted by `partId` then `variantId`.
3. `buildManifest.ts`: add `collectibles: CollectibleRef[]` to `ManifestGame` and set `collectibles: normalizeCollectibles(g.gameId, g.collectibles)` in `buildArcadeManifest`, placed right after `leaderboards`. Do not change `ARCADE_PROTOCOL`: the field is additive and always present. Change nothing else in the file.
4. Tests, written first and watched failing: new `ts/tests/test_arcade_manifest_collectibles.ts` <!-- new: ts/tests/test_arcade_manifest_collectibles.ts --> asserting (a) `normalizeCollectibles` for undefined, a valid list (sorted output), empty strings, a `:` in an id, a `|` in an id, and a duplicate pair (the throw messages start with the game id); (b) `buildArcadeManifest` over the real `GAME_REGISTRY` (see `ts/tests/test_arcade_manifest.ts` for the inputs) gives every game `collectibles` equal to `[]`; (c) a registry fixture with one game carrying two valid refs appears sorted in the output, and a fixture with an invalid ref makes `buildArcadeManifest` throw before returning; (d) every other manifest field of a sample game is unchanged by comparing against the same game built without the field (deep-equal after removing `collectibles`).

## 3. What NOT to do

- Do not give any game a collectible, do not invent a part or variant catalogue, do not decide report-versus-grant (M4.3), and do not add a currency, odds table or wheel (site roadmap, later steps).
- Do not edit `RFD_IT_Services_Site`, `data/arcade.json`, or the generated `ts/src/games/arcade-manifest.json` (gitignored).
- Do not change existing ids, URLs, badges, counts or the Federated directive's fields.
- Do not run `npx vite-node tools/export-arcade-manifest.ts` (not an allowed command); the vitest cases cover the build.

## 4. Verification

Baseline first: `cd ts && npx vitest run` once; record pass and fail counts and failing file names. Then:

```text
cd ts && npx vitest run test_arcade_manifest_collectibles.ts
cd ts && npx vitest run test_arcade_manifest test_arcade_manifest_relationships test_registry_export test_arcade_devlog
cd ts && npx tsc --noEmit
cd ts && npx vitest run
```

Expected: the new file passes (at least 9 tests); the listed existing files stay green (`test_arcade_manifest` is a name filter that also matches `test_arcade_manifest_counts`); full failing set equals the baseline or is smaller; `tsc` has no new errors.

## Sandbox needs

- Exec(cd ts && npx vitest run)
- Exec(cd ts && npx vitest run test_arcade_manifest_collectibles.ts)
- Exec(cd ts && npx vitest run test_arcade_manifest test_arcade_manifest_relationships test_registry_export test_arcade_devlog)
- Exec(cd ts && npx tsc --noEmit)

## Forbidden Actions

- Committing to or pushing main; pushing at all; deploying; installing or fetching anything; reading outside the worktree; touching protected repos; editing `archive/`, `docs/children.json` or `tests/fixtures/demo_lists_snapshot.json`; editing the site repo or any deployed output.

## Required from User

none. Robert's later answer to report-versus-grant (M4.3) decides how games fill the field.

## Rules for this run

- This run is NON-INTERACTIVE. A tool call that needs a confirmation is rejected and the run ends mid-task.
- ONE simple command per tool call. No `;`, `&&`, `||`, `|` chains and no redirects, with the single exception of the sanctioned verification line forms `cd ts && npx vitest run <bare-filename> [<bare-filename> ...]` and `cd ts && npx tsc --noEmit`. Use Read, Glob and Grep, not `ls`/`cat`. Use the bare test filename as the filter.
- Do not install, download or fetch anything. Do not read outside this worktree. If a path is missing or a quoted line differs from the file, STOP and write why in the Status row.
- Do not run `git merge origin/main`. Never commit to main, never push, never deploy. Work stays on your `directive/<slug>` branch; commit there. Only Robert merges.
- Do not create scratch or debug files in the repo; use `.devin-scratch/` if you need one. Deleting files is not permitted.
- No absolute paths inside this repo in any file you write; use repo-relative paths. Files already CRLF keep CRLF; new files use CRLF to match.
- New logic goes in small new modules (SOLID/SRP/KISS): validation is `collectibles.ts`; `buildManifest.ts` only calls it.
- When every Completion criteria box is checked and the verification tails are in the log line, set the Status row to **Review**. Never set it to Done. If you stop partway, set it to Blocked and write why.

## Completion criteria

- [ ] `CollectibleRef`, `GameConfig.collectibles?`, `normalizeCollectibles`, and `ManifestGame.collectibles` exist; every game in the real registry exports `collectibles: []`.
- [ ] The new test file passes and was red before the change; the existing manifest/registry/devlog files stay green; full failing set equals or is smaller than baseline; `tsc` clean of new errors (real tails pasted).
- [ ] `git diff --stat` shows only: `types.ts`, `collectibles.ts`, `buildManifest.ts`, the new test.
- [ ] Status row set to Review with a one-line log entry.

## Report

Findings first: the field shape, the validation rules, and confirmation that the protocol string is unchanged. Evidence second: real tails of the vitest and tsc commands. Recommended action: review, merge; then tell the site run (its M4.1) that the studio side exists.

<!-- queue:start -->
## Queue

| Field | Value |
|---|---|
| Status | Draft |
| Assigned to | devin |
| Branch | - |
| Base branch | - |

**Status log**
- 2026-10-12 · robert-claude-laptop · none → Draft — roadmap M4.2 (approved milestone, studio side of site M4.1) had no directive; needs Federated_Arcade_Source_Contract merged first (same two files)
<!-- queue:end -->
