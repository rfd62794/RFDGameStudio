# RFDGameStudio — anyCreature Integration: The `creatureArt` Seam (rewritten 2026-10-04)

> **NO DEVIN WORK REMAINS in this repo.** The studio-side deliverables of this directive are already on
> `origin/main` (commits `6446c222` and `01a49084`, both 2026-08-31) and pass their own test. The only
> remaining work (the export script inside the sibling `anyCreature` repo, the byte-size pre-flight there, and
> the cross-repo demo run) cannot be done from a worktree and is listed under `## Manual steps (Robert,
> interactive)` below. Recommendation to the controller: mark this directive Superseded by commits `6446c222` +
> `01a49084` instead of dispatching it. If it is dispatched anyway, the run is verification-only (section 3) and
> changes no file.

## Read first

`ts/src/engine/creatureArt/types.ts`, `ts/src/engine/creatureArt/loader.ts`, `ts/src/engine/creatureArt/index.ts`
(all short) and `ts/tests/test_creatureArt.ts` (all 60 lines). Everything you need is quoted below; do not search
for anything else.

## 1. Why this exists

The original directive asked for a generic `creatureArt` seam in this repo plus an offline export script in
`C:\Github\anyCreature`. Its first run was refused: the sandbox only allows the worktree, and the run tried
`Set-Location C:\Github\anyCreature`. Evidence that the in-repo half is already done (measured against
`origin/main` `3e633eec`):

- `git log --oneline -- ts/src/engine/creatureArt` lists `01a49084` (moved the test to `ts/tests/`) and
  `6446c222` (added `types.ts`, `loader.ts`, `index.ts`, `fixtures/wolf.png`, and the first copy of the test).
- `ts/src/engine/creatureArt/fixtures/wolf.png` is 347,341 bytes.
- `cd ts && npx vitest run test_creatureArt.ts` gave `Test Files  1 passed (1)` and `Tests  3 passed (3)`.
- `git diff 6446c222 HEAD -- ts/src/engine/artGen` is empty (artGen untouched).

Quoted lines the verification relies on:

```ts
export interface CreatureArtConfig<TEntity> {
  assetPathFor: (entity: TEntity) => string;
  fallbackPathFor?: (entity: TEntity) => string;
}
```
```ts
export * from './types';
export * from './loader';
```
```ts
    expect(stat.length).toBe(347341);
```

Corrected facts (the old directive text was wrong or stale):

- Pre-flight sizes: the old text expected `C:\Github\anyCreature\out\hero.png` at 347,341 bytes and
  `out\hero.jpg` at 40,920 bytes. Measured on the live disk (2026-10-03): the file is
  `C:\Github\anyCreature\out\delivery\hero.png` at 228,387 bytes and there is no `hero.jpg`. The 347,341 figure
  is stale for the fork; it remains correct only for this repo's committed `wolf.png` fixture, which is what
  the test asserts. Do not change either number.
- The old text cited hero.mjs (fork harness folder, twice). That file does not exist in the fork; the render step is
  deliver.py (harness folder), which stamps the GLB and writes the viewer, `hero.png` and an upload pack. Read every
  `hero.mjs` as `deliver.py`.

## 2. Scope

In scope for Devin: nothing. No file in this repo needs to change. Out of scope for every run of this
directive: anything in `C:\Github\anyCreature`, the export script (a .js file named rfdgamestudio_export in the fork scripts folder), the byte-size pre-flight on
the fork's output, the live cross-repo demo, choosing a game for creatureArt, and `ts/src/engine/artGen/`.

## 3. The work

Verification only; no edits, no commits:

1. Run the test (see section 5) and paste the real tail.
2. Confirm the artGen directory is untouched with Grep or Read only (no edits are made, so it is untouched by
   construction); state that in the report.
3. Write nothing else. If the test fails, report the failing assertion; do not fix it.

## 4. What NOT to do

- Do not `Set-Location` anywhere outside the worktree, do not read outside it, do not run `gh`, and do not
  run any cross-repo command.
- Do not create the export script (a .js file named rfdgamestudio_export in the fork scripts folder) here or anywhere; it belongs in the fork and is a manual step.
- Do not edit `wolf.png`, the test, or any `creatureArt` file. Do not wire any game to `creatureArt`.
- Do not install, download, or fetch anything.

## 5. Verification

One tool call from the worktree root, paste the real tail:

```
cd ts && npx vitest run test_creatureArt.ts
```

Reference when this directive was written: `Test Files  1 passed (1)` and `Tests  3 passed (3)`. The
`cd ts && npx vitest run <bare-filename>` form is the only form that finds tests here; `ts/tests/...` paths
find none.

## 6. Rules for this run

- NON-INTERACTIVE. Any tool call that needs a confirmation is rejected and the run ends; do not retry
  another way around it, write why in the Status row.
- ONE simple command per tool call: no `;`, `&&`, `||` or `|` chains and no redirects. The only allowed
  exception is the fixed `cd ts && npx vitest run test_creatureArt.ts` line in section 5. Do not use `ls`,
  `Get-ChildItem` or `cat`: use Read, Glob and Grep.
- No installs, no downloads, no fetches. Do not read outside this worktree. Do not hunt: everything you need
  is quoted in this directive; if a quoted line or a cited path is not where it says, STOP and write why in
  the Status row.
- Never commit to main, never push, never deploy. This run makes no commit at all.
- No scratch or debug files in the tree; if you need one, put it in `.devin-scratch/`.
- Paste exact paths and quoted lines you rely on in the report (a Devin run cannot read outside its worktree).
- Do not run `agentflow lint` or any other `agentflow` CLI.
- Never use `git -C`, `git -c`, `git --git-dir` or `git --work-tree`; run git with the worktree as the
  working directory.
- Done means (the Status row): you stopped at `Review` with one line in the log giving the test pass counts.
  You do not mark Done and you do not merge.

## 7. Completion criteria

- [ ] `cd ts && npx vitest run test_creatureArt.ts` reports 3 passed, 0 failed.
- [ ] `git status` shows no changes.
- [ ] Status row `Review`, one log line giving the pass counts. The run does not mark Done and does not merge.

## 8. Report

Findings first: pass or fail of the three tests. Then evidence: the real output tail of the command in
section 5. Then one recommended action: mark the directive Superseded by `6446c222` + `01a49084`, and Robert
does the manual steps below. State that nothing was changed or deployed.

## Manual steps (Robert, interactive)

These need the sibling repo and a live machine, so no worktree run can do them. Paths are on the laptop.

1. Pre-flight in `C:\Github\anyCreature`: confirm `out\delivery\hero.png` is present (measured 228,387 bytes on
   2026-10-03; it is not 347,341, and there is no `out\hero.jpg`). If it differs, the fork changed: note it, do
   not regenerate silently.
2. Add the export script (a .js file named rfdgamestudio_export in the fork scripts folder) to the fork (there is no `scripts/` directory there yet). Usage
   `node <script> <spec.json> <target-png-path>`: run the fork compile CLI (cli.js under engine) on <spec.json> to
   make <tmp>.glb, then the fork deliver step (python3, deliver.py under harness) on <tmp>.glb, <tmp-dir> and <name>, then copy `<tmp-dir>/hero.png` to
   the explicit target. The target argument is required; no default, no inference of which game it belongs to.
3. Live demo: run it against the wolf spec with a scratch target path, not the committed fixture (the
   fixture is 347,341 bytes and the test pins that size). Paste the real output into the PR or the queue log.
4. Commit the script on a branch in `rfd62794/anyCreature`; do not touch `Ariescar/anyCreature` upstream.

## Sandbox needs

none

## Forbidden Actions

- Committing to or pushing main; pushing at all; deploying; touching protected repos; installing or fetching
  anything; reading or writing outside the worktree; `Set-Location` elsewhere; `gh`; any cross-repo command;
  editing `ts/src/engine/artGen/` or any `creatureArt` file; running `agentflow` commands.

## Required from User

The four manual steps above (Robert, interactive): fork pre-flight, export script in `anyCreature`, live demo
to a scratch path, commit in the fork. Nothing is required before a verification-only run.

<!-- queue:start -->
## Queue

| Field | Value |
|---|---|
| Status | Blocked |
| Assigned to | claude |
| Branch | directive/rfdgamestudio-anycreature-creatureartintegratio-dce71e |
| Base branch | - |
| Base commit | 70dc9149da068258e55f791081bb8657eaadcea0 |

**Status log**
- 2026-09-27 16:08 · agentflow-tick · none → Queued — suggested by heartbeat: Needs ForkValidate done first (fork and wolf images not on disk); fix hero.mjs -> deliver.py references before dispatch
- 2026-09-28 19:26 · devin-overseer (delegated) · Queued → Approved
- 2026-09-29 00:18 · dispatcher · Approved → In progress — dispatched claude on personal-laptop in C:\GitHub\.worktrees\RFDGameStudio--rfdgamestudio-anycreature-creatureartintegratio-dce71e; copied ts/src/games/game-metadata.json; lane=sonnet (default); model=claude-sonnet-5; persona=steady-builder
- 2026-09-29 00:19 · claude-dispatched · In progress → Blocked — Refused: `Set-Location C:\Github\anyCreature` (sandbox: "may only access files in the allowed working directories for this session: C:\GitHub\.worktrees\RFDGameStudio--rfdgamestudio-anycreature-creatureartintegratio-dce71e"). Directive requires scripts/rfdgamestudio_export.js in C:\Github\anyCreature plus its own pre-flight gate (confirm hero.png/hero.jpg byte sizes there) and a live cross-repo demo run — all impossible from this worktree-scoped session.
<!-- queue:end -->
