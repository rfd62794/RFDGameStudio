# Dissonance Prototype: honest card text and corrected source-path notes (Size S)

**Depends on:** none. **Why this entry:** Robert's 2026-10-04 approval of the DIRECTION.md verdict for `dissonance_prototype`: FOLD-INTO `dissonance` (an Origin exhibit, Tier A only, no code decisions). This directive covers the text half (replan 2 plus directive 3 of the list: description and stale comments). The other half, the link from Dissonance's title, is `Dissonance_Origin_Link_Directive`. Building and publishing the embed at `/arcade/dissonance_prototype/` is a controller step, not a directive (the Devin sandbox refuses builds).

**Read first** (everything this run needs is pasted below; these are the files to open):
`docs/demos/dissonance_prototype/DIRECTION.md`, `ts/src/games/dissonance_prototype/config.ts` (whole file, 21 lines), `docs/adr/ADR-023-legacy-origin-projects-type.md` (lines 12-21).

## 1. Why this exists

The card for this Origin entry shows players a repo path and a tool name. The description in `ts/src/games/dissonance_prototype/config.ts` is, today:

```
Origin project — the original AI Studio (Gemini API) core-loop prototype that became the live Dissonance Depths (ts/src/games/dissonance/). Tested turn-based combat, relation-based combination mechanics, and Locked/Hinted/Discovered stabilization.
```

Players need neither the path nor "Gemini API" (the redesign spec's no-dev-speak rule, `docs/superpowers/specs/2026-10-04-studio-redesign.md` section a; polish standard item A5; the audit's batch1 item 8). The same file and the ADR also say the source lives in `tmp/dissonance-src/`; it lives in `examples/dissonance-prototype/` (verified: that folder holds `package.json`, `src/`, `metadata.json` on origin/main `d3084de0`).

## 2. Scope

1. `ts/src/games/dissonance_prototype/config.ts`: new description, corrected header comment.
2. `docs/adr/ADR-023-legacy-origin-projects-type.md`: one corrected path on line 18.
3. New test `<!-- new: ts/tests/test_dissonance_prototype_entry.ts -->`.

## 3. The work

**Step 1 and 2: apply this diff** (both files use CRLF; the Edit tool keeps it; change nothing else; the line-103 mention of `tmp/dissonance-src/` in the ADR is a dated historical statement and stays):

```diff
diff --git a/docs/adr/ADR-023-legacy-origin-projects-type.md b/docs/adr/ADR-023-legacy-origin-projects-type.md
index 8a17f98b..cb1d4590 100644
--- a/docs/adr/ADR-023-legacy-origin-projects-type.md
+++ b/docs/adr/ADR-023-legacy-origin-projects-type.md
@@ -17,3 +17,3 @@ Kingmaker Squads (Planet of Greed's real ancestors, previously retired
 from the registry entirely), and for the Dissonance Loop Prototype
-(`tmp/dissonance-src/`), the real original AI Studio source behind the
+(`examples/dissonance-prototype/`), the real original AI Studio source behind the
 live Dissonance Depths.
diff --git a/ts/src/games/dissonance_prototype/config.ts b/ts/src/games/dissonance_prototype/config.ts
index a72697d3..7bb919a8 100644
--- a/ts/src/games/dissonance_prototype/config.ts
+++ b/ts/src/games/dissonance_prototype/config.ts
@@ -3,4 +3,4 @@ import type { GameConfig } from '../../engine/types';
 // Legacy/Origin Project — see docs/adr/ADR-023-legacy-origin-projects-type.md.
-// This is "Dissonance Loop Prototype" (tmp/dissonance-src/), the original
-// AI Studio (Gemini API) source that became the live Dissonance Depths
+// This is "Dissonance Loop Prototype" (source in examples/dissonance-prototype/),
+// the original AI Studio source that became the live Dissonance Depths
 // (ts/src/games/dissonance/). Presented here as real origin history, not
@@ -12,3 +12,3 @@ const config: GameConfig = {
   supersededBy: 'dissonance',
-  description: 'Origin project — the original AI Studio (Gemini API) core-loop prototype that became the live Dissonance Depths (ts/src/games/dissonance/). Tested turn-based combat, relation-based combination mechanics, and Locked/Hinted/Discovered stabilization.',
+  description: 'Where Dissonance Depths began: the first version of its turn-based card duels, where cards combine by how their elements relate. Kept as it was built, so you can see how the game grew.',
   color: '#78716c',
```

**Step 3: create `ts/tests/test_dissonance_prototype_entry.ts`:**

```ts
// new: ts/tests/test_dissonance_prototype_entry.ts
import { describe, it, expect } from 'vitest';
import config from '../src/games/dissonance_prototype/config';

describe('dissonance_prototype registry entry', () => {
  const text = (config.description ?? '').toLowerCase();

  it('is still an Origin entry that points at the game it became', () => {
    expect(config.status).toBe('external');
    expect(config.supersededBy).toBe('dissonance');
    expect(config.embedUrl).toBe('/arcade/dissonance_prototype/');
  });

  it('has a description of 60 words or fewer that names Dissonance Depths', () => {
    expect(text.split(/\s+/).filter(Boolean).length).toBeLessThanOrEqual(60);
    expect(text).toContain('dissonance depths');
  });

  it('leaks no repo path, tool name or developer wording to players', () => {
    for (const banned of ['ts/src', 'examples/', 'tmp/', 'gemini', 'ai studio', 'prototype', 'directive', 'todo']) {
      expect(text).not.toContain(banned);
    }
  });
});
```

## 4. What NOT to do

- Keep `gameId`, `label`, `status: 'external'`, `supersededBy`, `embedUrl`, `genre`, `tags` and `order` exactly as they are (other tests pin them: `test_arcade_registry_directive.ts`, `test_arcade_lineage.tsx`, `test_collect_configs.ts`). The description must still contain `Dissonance Depths` (`test_arcade_registry_directive.ts` asserts it).
- Do not rename the label "Dissonance Loop Prototype" (a label change is a separate decision for Robert, since the redesign's banned-word list contains "prototype").
- Do not touch `examples/dissonance-prototype/`, other docs that mention `tmp/dissonance-src` (analysis notes, test-skip notes, other tests), or any other game.
- No hiding or removing of the entry (that is the site's grid; see the Report). No builds, no deploys, no protected repos.

## 5. Verification

```
uv run python --version
```
Expected: `Python 3.12.x` (verified: `Python 3.12.12`).

Baseline before editing (origin/main `d3084de0`, 2026-10-04):
```
cd ts && npx vitest run test_arcade_registry_directive.ts test_arcade_lineage.tsx test_collect_configs.ts test_arcade_metadata_expansion.ts
```
Real tail: `Test Files  4 passed (4)` / `Tests  44 passed | 1 skipped (45)` (the skipped one needs the gitignored `tmp/dissonance-src` and is skipped by design).

After editing:
```
cd ts && npx vitest run test_dissonance_prototype_entry.ts test_arcade_registry_directive.ts test_arcade_lineage.tsx test_collect_configs.ts test_arcade_metadata_expansion.ts
```
Expected (verified on the prototype): `Test Files  5 passed (5)` / `Tests  47 passed | 1 skipped (48)`.
The new test fails before the edit: real output with the test file present and the diff not applied: `Tests  1 failed | 2 passed (3)`, the failing one being "leaks no repo path, tool name or developer wording to players".
```
cd ts && npx tsc --noEmit
```
Expected: no output, exit 0 (verified; needs the gitignored `ts/src/games/game-metadata.json`, copied by the dispatcher).

Then one Grep (not a shell command) for `tmp/dissonance-src` in `ts/src/games/dissonance_prototype/config.ts`: expected no match. In the ADR the only remaining match is the dated line about untouched folders (around line 103).

## 6. Rules for this run

- This run is NON-INTERACTIVE. A tool call that needs a confirmation is rejected and the run ends mid-task.
- ONE simple command per tool call. No `;`, `&&`, `||`, `|` chains and no redirects, with the single exception of
  the sanctioned verification line form `cd ts && npx vitest run <bare-filename>` (several bare filenames may follow one `vitest run`) and `cd ts && npx tsc --noEmit`. Do not use `ls`, `Get-ChildItem`
  or `cat`: use Read, Glob and Grep. Use the bare test filename as the filter (a path filter finds no tests). No live process probing.
- Do not install, download or fetch anything. Do not read outside this worktree. Do not search or hunt for facts: every
  path and quoted line you need is above. If a path is missing or a quoted line differs from the file, STOP and write why in the Status row.
- Do NOT run `npm run build:*`, `vite-node`, `agentflow` commands or `uv run python -m studio.demos index` (the sandbox refuses them; the controller runs builds and exporters after merge).
- Do not run `git merge origin/main`.
- Never commit to main, never push, never deploy. Work stays on your `directive/<slug>` branch; commit there. Only Robert merges.
- Do not create scratch or debug files in the repo; use `.devin-scratch/` if you need one.
- No absolute paths inside this repo's checkout in any file you write; use repo-relative paths.
- Files marked CRLF keep CRLF (the Edit tool preserves it). New files may use either; use CRLF to match.
- New logic goes in small new modules; no file over 600 lines.
- Status row meanings: when every Completion criteria box is checked and the verification tails are in the log line,
  set the row to **Review** (this is "Done" for the run). Never set it to Done: only Robert or Claude marks Done after merge.
  If you stop partway, set it to Blocked and write why.

## 7. Completion criteria

- [ ] The diff is applied and `test_dissonance_prototype_entry.ts` exists; the four-file baseline command still passes and the five-file command passes with the counts above (real tails pasted).
- [ ] `cd ts && npx tsc --noEmit` is clean (real tail pasted); the Grep check above is as expected.
- [ ] `git status` shows only the three files in Scope.
- [ ] The Status row is set to Review with a one-line log entry.

## 8. Report

Findings first: the three files and the new description. Evidence second: real tails. Controller finish (not for this run): build `examples/dissonance-prototype` and publish it at `/arcade/dissonance_prototype/` (Robert approves deploys), `curl -I` for 200, and decide the home-grid treatment in the site repo (hide the card or keep a labelled "(Origin)" card as Slimebreeder does; DIRECTION.md's default is to follow Slimebreeder). Recommended action: review, merge.

## Sandbox needs

none

## Forbidden Actions

- Committing to or pushing main; pushing at all; deploying; installing or fetching anything; reading outside the worktree; touching protected repos; editing `archive/`, `docs/children.json` or `tests/fixtures/demo_lists_snapshot.json`.

## Required from User

none.
