# VoidDrift family names: one spelling, three clearly different labels

**Depends on:** nothing outstanding. The Tier A polish directives are merged (the standalone `index.html` files exist on main), and the Particle Sandbox rename is merged: `Rename_Particle_Sandbox_To_GrainWorks_Directive.md` moved the game to id `grainworks` (folder `ts/src/games/grainworks/`, label `GrainWorks`). This directive was rewritten on 2026-10-09 to the post-rename paths; the sandbox is no longer renamed to "VoidDrift: Particle Sandbox", it keeps the distinct name GrainWorks.
**Queue-neutral:** this file carries no Queue block; the controller queues it. The open questions in `docs/demos/voiddrift/DIRECTION.md` and `docs/demos/voiddrift_redux/DIRECTION.md` are answered by Robert's 2026-10-04 approval of all recommendations: "VoidDrift" is the one spelling (it matches the Rust game's repo and README); the family gets visibly different labels; labels only, ids unchanged.

**Read first** (everything this run needs is pasted below; these are the files to open):
`docs/demos/voiddrift/DIRECTION.md`, `docs/demos/voiddrift_redux/DIRECTION.md` ("Open question for Robert"), `ts/src/games/voiddrift/config.ts`, `ts/src/games/voiddrift_redux/config.ts`, `ts/src/games/grainworks/config.ts`, `ts/src/games/registry.ts` (lines 20-26).

## 1. Why this exists

Three cabinet entries from one family were spelled three ways and two of them shared a name (`docs/demos/voiddrift/DIRECTION.md`: "label 'VoidRift', gameId/repo 'VoidDrift', itch slug 'voidrift'"). The sandbox rename to GrainWorks already fixed its own label. Still wrong on origin/main:
`ts/src/games/voiddrift/config.ts:6` `label: 'VoidRift',`; `ts/src/games/voiddrift_redux/config.ts:9` `label: 'VoidDrift Redux',`; the GrainWorks header still says `VOIDRIFT ... REDUX` (`ts/src/games/grainworks/components/Header.tsx:76`) and its help modal says `VoidRift Field Manual` and `VoidRift is a physical` (`ts/src/games/grainworks/components/HelpModal.tsx:21,41`). A player cannot tell the VoidDrift cards apart or tell which is the paid game.
Decision: the shipped Rust game is "VoidDrift"; the TS-native idle game is "VoidDrift: Core Loop"; the falling-sand toy keeps its own name "GrainWorks" everywhere a player sees it (it is no longer labelled as part of the VoidDrift family). The itch address stays `https://rdug627.itch.io/voidrift` (lowercase, unchanged, so no URL breaks) and every `gameId` stays as it is.

## 2. Scope

1. Labels in `ts/src/games/voiddrift/config.ts` and `ts/src/games/voiddrift_redux/config.ts` (the standalone menu list in `ts/src/games/registry.ts` is generated from the registry, so it follows).
2. The same names where players see them: `ts/src/games/voiddrift_redux/App.tsx` (3 strings), `ts/src/games/grainworks/components/Header.tsx`, `ts/src/games/grainworks/components/HelpModal.tsx`, and the `ts/src/standalone/voiddrift_redux/index.html` title.
3. One existing test that pins the old text: `ts/tests/test_arcade.ts`.
4. New test `<!-- new: ts/tests/test_voiddrift_family_names.ts -->`.

## 3. The work

Files under `ts/` use CRLF line endings; keep them (the Edit tool preserves them). Make exactly these string replacements and no others:

| File | Old text | New text |
|---|---|---|
| `ts/src/games/voiddrift/config.ts` | `label: 'VoidRift',` | `label: 'VoidDrift',` |
| `ts/src/games/voiddrift_redux/config.ts` | `label: 'VoidDrift Redux',` | `label: 'VoidDrift: Core Loop',` |
| `ts/src/games/voiddrift_redux/App.tsx` (2 places) | `gameLabel="VoidDrift Redux"` | `gameLabel="VoidDrift: Core Loop"` |
| `ts/src/games/voiddrift_redux/App.tsx` (1 place) | `title="VoidDrift Redux"` | `title="VoidDrift: Core Loop"` |
| `ts/src/games/grainworks/components/Header.tsx` | `VOIDRIFT <span className="text-cyan-400 font-mono text-xs">REDUX</span>` | `GRAINWORKS <span className="text-cyan-400 font-mono text-xs">SANDBOX</span>` |
| `ts/src/games/grainworks/components/HelpModal.tsx` | `VoidRift Field Manual` | `GrainWorks Field Manual` |
| `ts/src/games/grainworks/components/HelpModal.tsx` | `VoidRift is a physical` | `GrainWorks is a physical` |
| `ts/src/standalone/voiddrift_redux/index.html` | `<title>VoidDrift Redux</title>` | `<title>VoidDrift: Core Loop</title>` |
| `ts/tests/test_arcade.ts` | `c.textContent?.includes('VoidRift')` | `c.textContent?.includes('A mining simulation at the edge of a black hole')` |

(The last row: the test finds the VoidDrift card by text; with the new labels "VoidDrift" would also match the two siblings, so it finds the card by the game's own description instead. The `voiddrift` description string is unchanged.)

**New test**, exactly `ts/tests/test_voiddrift_family_names.ts`:
```
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { findGame, STANDALONE_BUILD_GAMES } from '../src/games/registry';

const root = resolve(import.meta.dirname, '..');
const read = (rel: string) => readFileSync(resolve(root, rel), 'utf8');

const PLAYER_FACING_FILES = [
  'src/games/voiddrift/config.ts',
  'src/games/voiddrift_redux/config.ts',
  'src/games/voiddrift_redux/App.tsx',
  'src/games/grainworks/config.ts',
  'src/games/grainworks/App.tsx',
  'src/games/grainworks/TitleGate.tsx',
  'src/games/grainworks/components/Header.tsx',
  'src/games/grainworks/components/HelpModal.tsx',
  'src/standalone/voiddrift_redux/index.html',
  'src/standalone/grainworks/index.html',
];

describe('VoidDrift family names', () => {
  it('gives the three cabinet entries one spelling and visibly different labels', () => {
    expect(findGame('voiddrift')?.label).toBe('VoidDrift');
    expect(findGame('voiddrift_redux')?.label).toBe('VoidDrift: Core Loop');
    expect(findGame('grainworks')?.label).toBe('GrainWorks');
  });

  it('keeps ids and the itch address unchanged', () => {
    expect(findGame('voiddrift')?.externalUrl).toBe('https://rdug627.itch.io/voidrift');
    expect(findGame('voiddrift_redux')).toBeDefined();
    expect(findGame('grainworks')).toBeDefined();
  });

  it('no player-facing string still says VoidRift, VOIDRIFT or VoidDrift Redux', () => {
    for (const rel of PLAYER_FACING_FILES) {
      const text = read(rel);
      expect(text, `${rel} has VoidRift`).not.toContain('VoidRift');
      expect(text, `${rel} has VOIDRIFT`).not.toContain('VOIDRIFT');
      expect(text, `${rel} has VoidDrift Redux`).not.toContain('VoidDrift Redux');
    }
  });

  it('the generated standalone menu list uses the new Core Loop label', () => {
    expect(STANDALONE_BUILD_GAMES.find((g) => g.id === 'voiddrift_redux')?.label).toBe('VoidDrift: Core Loop');
  });
});
```

## 4. What NOT to do

- Do NOT change any `gameId`, folder name, file name, `source.slug`, the itch URLs (`externalUrl`, `embedUrl`), `STANDALONE_BUILD_GAMES` ids, or the build script names.
- Do not change the comment mentioning "VoidDrift Redux" in `ts/src/games/voiddrift_redux/components/DriftPrimer.tsx` (comments are not touched) or any file under `docs/` or `examples/`.
- Do not change blurbs or descriptions (the description strings stay as they are), and do not touch the unregistered `examples/voidrift-redux-station-sim` folder.
- No Lua, no engine changes, no deploys, no protected repos, no player-layer work.

## 5. Verification

```
uv run python --version
```
Expected `Python 3.12.x`; verified here: `Python 3.12.12`.

Baseline (run before editing):
```
cd ts && npx vitest run test_arcade.ts test_grainworks_registry.ts test_voiddrift_redux_chrome.ts test_registry_export.ts
```
Paste the real tail in the report (counts are not pinned here: the suite has changed since this was first measured).

After editing:
```
cd ts && npx vitest run test_voiddrift_family_names.ts test_arcade.ts test_grainworks_registry.ts test_voiddrift_redux_chrome.ts test_registry_export.ts
```
Paste the real tail in the report; expect one more test file than the baseline and four new tests.
Type check, prints nothing when clean: `cd ts && npx tsc --noEmit` (a lone missing `game-metadata.json` import error means the worktree lacks that gitignored file: write that in the Status row, do not hunt).
Source check (Grep tool, each over `ts/src`): the case-sensitive strings `VoidRift`, `VOIDRIFT` and `VoidDrift Redux` appear only in `ts/src/arcade/GameLoader.tsx` (a code comment), `ts/src/games/voiddrift_redux/components/DriftPrimer.tsx` (a code comment), `ts/src/games/character_viewer/CHANGELOG.md` and `ts/src/status/*.ts` (status text). Those are out of scope; write nothing about them.

## 6. Rules for this run

- This run is NON-INTERACTIVE. A tool call that needs a confirmation is rejected and the run ends mid-task.
- ONE simple command per tool call. No `;`, `&&`, `||`, `|` chains and no redirects, with the single exception of
  the sanctioned verification line form `cd ts && npx vitest run <bare-filename>` (several bare filenames may follow one `vitest run`), `cd ts && npx tsc --noEmit`, `uv run python --version` and (only where a Verification section names it) `uv run pytest tests/test_wire_rust.py -q`. Do not use `ls`, `Get-ChildItem`
  or `cat`: use Read, Glob and Grep. Use the bare test filename as the filter (a path filter finds no tests). No live process probing.
- Do not install, download or fetch anything. Do not read outside this worktree. Do not search or hunt for facts: every
  path and quoted line you need is above. If a path is missing or a quoted line differs from the file, STOP and write why in the Status row.
- Do NOT run `npm run build:*`, `vite-node`, `agentflow` commands or `uv run python -m studio.demos index` (the sandbox refuses them; the controller runs builds and exporters after merge).
- Do not run `git merge origin/main`.
- Never commit to main, never push, never deploy. Work stays on your `directive/<slug>` branch; commit there. Only Robert merges.
- Do not create scratch or debug files in the repo; use `.devin-scratch/` if you need one.
- No absolute paths inside this repo's checkout in any file you write; use repo-relative paths.
- Files under `ts/` and `docs/` use CRLF line endings in the worktree; keep them (the Edit tool preserves them). New files may use either; git normalizes line endings on commit.
- New logic goes in small new modules; no file over 600 lines.
- Status row meanings: when every Completion criteria box is checked and the verification tails are in the log line,
  set the row to **Review** (this is "Done" for the run). Never set it to Done: only Robert or Claude marks Done after merge.
  If you stop partway, set it to Blocked and write why.

## 7. Completion criteria

- [ ] All nine replacement rows are made and nothing else changed except the one new test file.
- [ ] `cd ts && npx vitest run test_voiddrift_family_names.ts test_arcade.ts test_grainworks_registry.ts test_voiddrift_redux_chrome.ts test_registry_export.ts` passes (real tail pasted).
- [ ] `cd ts && npx tsc --noEmit` prints nothing.
- [ ] The Status row is set to Review with a one-line log entry.

## 8. Report

Findings first: the files changed and the real test counts. Evidence second: the real tails.
**Controller finish (after merge):** regenerate the arcade manifest and status pages the usual way (run `ts/tools/export-arcade-manifest.ts` via `npx vite-node` from the `ts` directory; the sandbox refuses it), so the site cards read the new labels.
Recommended action: review, merge.

## Sandbox needs

none

## Forbidden Actions

- Committing to or pushing main; pushing at all; deploying; installing or fetching anything; reading outside the worktree; touching protected repos; editing `archive/`, `docs/children.json` or the demo-lists snapshot fixture under `tests/fixtures/`.

## Required from User

none.

<!-- queue:start -->
## Queue

| Field | Value |
|---|---|
| Status | Done |
| Assigned to | devin |
| Branch | directive/rfdgamestudio-voiddrift-family-naming-directive |
| Base branch | - |
| Base commit | 05106980aaa361b09917b4c28483ef0ebf899018 |
| Head commit | 1b19288ed6b05c8994e12bd1ffd7096505533c54 |
| Head remote | rfd62794/rfdgamestudio |

**Status log**
- 2026-10-04 13:29 · robert-claude-laptop · none → Queued
- 2026-10-08 03:14 · robert-claude-laptop · Queued → Approved
- 2026-10-08 03:15 · dispatcher · Approved → In progress — dispatched devin on personal-laptop in C:\GitHub\.worktrees\RFDGameStudio--rfdgamestudio-voiddrift-family-naming-directive; lane=default; model=swe-2-high; persona=steady-builder; agent_id=01M4D5V4J5WDF62TQZCZBVZJ75
- 2026-10-08 03:15 · dispatcher · worktree C:\GitHub\.worktrees\RFDGameStudio--rfdgamestudio-voiddrift-family-naming-directive; copied ts/src/games/game-metadata.json; provisioned: uv sync --frozen
- 2026-10-08 03:18 · devin · In progress → Blocked — Dependencies not merged: TitleGate.tsx and both standalone index.html files missing; registry.ts quoted line differs (glob-derived list, no literal entry). Requeue after the two Tier A directives merge and re-measure registry.ts.
- 2026-10-09 06:27 · robert-claude-laptop · Blocked → Queued — Blocked on TierA/Phone deps, both merged to main (PR 244/247); branch has 0 commits so nothing lost. Re-measure registry.ts line (glob-derived list) per Save_Golden log.
- 2026-10-09 23:48 · robert-claude-laptop · Queued → Approved
- 2026-10-09 23:48 · dispatcher · Approved → In progress — dispatched devin on personal-laptop in C:\GitHub\.worktrees\RFDGameStudio--rfdgamestudio-voiddrift-family-naming-directive; lane=default; model=swe-2-high; persona=steady-builder; agent_id=01M4HYTN690WQFTZR9RK6M0B4A
- 2026-10-09 23:48 · dispatcher · worktree C:\GitHub\.worktrees\RFDGameStudio--rfdgamestudio-voiddrift-family-naming-directive; resynced: merged main into directive/rfdgamestudio-voiddrift-family-naming-directive (276 commit(s), clean); provisioned: uv sync --frozen; venv pythonw swap
- 2026-10-09 23:56 · devin · In progress → Blocked — Work complete and verified (commit 1b19288e, all 9 replacements + new test; vitest 5 files/59 tests pass; tsc --noEmit clean; Python 3.12.12) but cannot push: `git push -u origin directive/rfdgamestudio-voiddrift-family-naming-directive` fails in pre-push hook - pytest collection errors on broken pygame import (pygame.base __version__ ImportError) in worktree venv, unrelated to the change. Review refused without pushed branch.
- 2026-10-10 00:10 · robert-claude-laptop · Blocked → Review — Branch 1b19288e pushed by the controller from a clean-venv worktree (the run's own venv had python.exe swapped for pythonw, fixed in AgentFlow #672). Run's verification: vitest 5 files/59 tests, tsc clean. Python suite crashed with an access violation during the pre-push hook and the hook did not block - flagged separately. [origin] spent: devin 5 min est. n/a
- 2026-10-10 00:14 · robert-claude-laptop · Review → Done — note: PR #265 merged 2026-10-10 after Sonnet review (5 files / 59 tests passed, tsc clean; labels VoidDrift / VoidDrift: Core Loop / GrainWorks). Arcade manifest export queued as a controller follow-up.
<!-- queue:end -->
