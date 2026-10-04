# slither_rogue: delete the dead canvas, label Restart, add the standalone build (S)

**Depends on:** none.
**Read first** (everything this run needs is pasted below; these are the files to open):
`ts/src/games/slither_rogue/components/GameHUD.tsx`, `ts/src/standalone/choke_point/entry.tsx` and `ts/src/standalone/choke_point/index.html` and `ts/vite.choke_point.config.ts` (the pattern to copy), `ts/package.json`, `docs/demos/slither_rogue/DIRECTION.md` (verdict TRIM, Replan step 1).

## 1. Why this exists

Measured on origin/main `889dd21e` (2026-10-04):

- `ts/src/games/slither_rogue/components/GameCanvas.phase2g.tsx` (791 lines) is dead: the live `GameCanvas.tsx` is 319 lines and nothing imports the old file (a repo-wide Grep for `phase2g` finds it only in `docs/demos/slither_rogue/*.md` and `docs/superpowers/specs/2026-09-23-engine-shared-modules.md`, both prose).
- The in-run Restart in `components/GameHUD.tsx` (line 113) is an icon-only button (`title="Restart"`), so the audit saw "no restart". The Menu button next to it already shows text via the class `sr-hud-btn--text`.
- There is no `build:slither_rogue` script (A7), so `ts/package.json` has no way to build the demo alone. The direction also mentions "pre-existing TS errors in its build": a prototype of this very change built clean (`vite build` produced `index-*.js` 661.89 kB, gzip 210.84 kB) and `tsc --noEmit` reports no error in any `slither_rogue` file, so that note is stale.

## 2. Scope

1. Delete `ts/src/games/slither_rogue/components/GameCanvas.phase2g.tsx`.
2. `ts/src/games/slither_rogue/components/GameHUD.tsx`: the Restart button gets a text label.
3. New files `<!-- new: ts/vite.slither_rogue.config.ts -->`, `<!-- new: ts/src/standalone/slither_rogue/entry.tsx -->`, `<!-- new: ts/src/standalone/slither_rogue/index.html -->`.
4. `ts/package.json`: one script line.
5. New test `<!-- new: ts/tests/test_slither_rogue_hygiene.ts -->`.

## 3. The work

`GameHUD.tsx` and `package.json` use CRLF; keep it.

**Step 1: delete the dead file.** Run exactly `git rm ts/src/games/slither_rogue/components/GameCanvas.phase2g.tsx`. If the sandbox refuses the delete, leave the file, do every other step, and write `phase2g delete refused` in the Status row; the controller deletes it.

**Step 2: label Restart.** In `GameHUD.tsx` change
```tsx
            <button onClick={onReset} className="sr-hud-btn" title="Restart">
              <RotateCcw className="sr-icon-sm" />
            </button>
```
to
```tsx
            <button onClick={onReset} className="sr-hud-btn sr-hud-btn--text" title="Restart this run">
              <RotateCcw className="sr-icon-sm" /> Restart
            </button>
```

**Step 3: the standalone build, copied from choke_point.** Read the three choke_point files named above, then create:
- `ts/vite.slither_rogue.config.ts` with exactly the content of `ts/vite.choke_point.config.ts` but `makeStandaloneConfig('slither_rogue')`;
- `ts/src/standalone/slither_rogue/entry.tsx`: a copy of `ts/src/standalone/choke_point/entry.tsx` with every occurrence of `choke_point` replaced by `slither_rogue` (the import `../../games/slither_rogue/App` and the `gameId` and the `games/slither_rogue/*` paths; nothing else changes);
- `ts/src/standalone/slither_rogue/index.html`: a copy of the choke_point one with `<title>Choke Point</title>` replaced by `<title>Snake Roguelike</title>`.

In `ts/package.json`, directly after the line `"build:choke_point": "vite build --config vite.choke_point.config.ts",` add `"build:slither_rogue": "vite build --config vite.slither_rogue.config.ts",`.

**Step 4: test.** Create `ts/tests/test_slither_rogue_hygiene.ts` with exactly:

```ts
// new: ts/tests/test_slither_rogue_hygiene.ts
import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ts = (rel: string) => resolve(import.meta.dirname, '..', rel);

describe('slither_rogue hygiene', () => {
  it('the dead phase-2g canvas is gone', () => {
    expect(existsSync(ts('src/games/slither_rogue/components/GameCanvas.phase2g.tsx'))).toBe(false);
  });
  it('the in-run Restart button shows a text label, not only an icon', () => {
    const hud = readFileSync(ts('src/games/slither_rogue/components/GameHUD.tsx'), 'utf8');
    expect(hud).toMatch(/title="Restart this run">\s*<RotateCcw[^>]*\/> Restart\s*<\/button>/);
  });
  it('has a standalone build script, config and entry', () => {
    const pkg = JSON.parse(readFileSync(ts('package.json'), 'utf8')) as { scripts: Record<string, string> };
    expect(pkg.scripts['build:slither_rogue']).toBe('vite build --config vite.slither_rogue.config.ts');
    expect(readFileSync(ts('vite.slither_rogue.config.ts'), 'utf8')).toContain("makeStandaloneConfig('slither_rogue')");
    expect(existsSync(ts('src/standalone/slither_rogue/entry.tsx'))).toBe(true);
    expect(existsSync(ts('src/standalone/slither_rogue/index.html'))).toBe(true);
  });
});
```

## 4. What NOT to do

- No change to any `games/slither_rogue/*.lua` or yaml (ADR-013: the Lua sim stays as is), to `GameCanvas.tsx`, `App.tsx` or the sound code. No new evolution cards, no physics changes.
- Do not run `npm run build:slither_rogue` (the sandbox refuses builds; the controller builds after merge).
- Do not register the game in `STANDALONE_BUILD_GAMES`, `publishing/games.yaml` or anywhere else: this directive adds the script only.
- No deploys, no protected repos, no player-layer or cloud-save work.

## 5. Verification

```
uv run python --version
```
Expected: `Python 3.12.x`. Verified on this machine: `Python 3.12.12`.

Baseline, before editing (the new test against origin/main `889dd21e`, verified 2026-10-04):
```
cd ts && npx vitest run test_slither_rogue_hygiene.ts
```
Real tail: `Test Files  1 failed (1)` / `Tests  3 failed (3)`.

After editing, the same command. Real tail from a prototype of exactly these edits (2026-10-04): `Test Files  1 passed (1)` / `Tests  3 passed (3)`.
Regression check: `cd ts && npx vitest run test_slither_rogue_sound.ts` gives `Tests  12 passed (12)`.

Source check (Grep tool, one call): a Grep for `phase2g` under `ts` finds nothing.

**Controller finish (after merge):** `cd ts && npm run build:slither_rogue` (expect exit 0; the prototype built in about 6 seconds) and confirm `ts/dist-slither_rogue` appears and stays untracked.

## 6. Rules for this run

- This run is NON-INTERACTIVE. A tool call that needs a confirmation is rejected and the run ends mid-task.
- ONE simple command per tool call. No `;`, `&&`, `||`, `|` chains and no redirects, with the single exception of
  the sanctioned verification line form `cd ts && npx vitest run <bare-filename>.ts`. Do not use `ls`, `Get-ChildItem`
  or `cat`: use Read, Glob and Grep. Use the bare test filename as the filter (a path filter finds no tests). No live process probing.
- Do not install, download or fetch anything. Do not read outside this worktree. Do not search or hunt for facts: every
  path and quoted line you need is above. If a path is missing or a quoted line differs from the file, STOP and write why in the Status row.
- Never commit to main, never push, never deploy. Work stays on your `directive/<slug>` branch; commit there. Only Robert merges.
- Do not create scratch or debug files in the repo; use `.devin-scratch/` if you need one.
- No absolute paths inside this repo's checkout in any file you write; use repo-relative paths.
- Do not run `agentflow lint` or any agentflow command. Do NOT run `npm run build:*`, `vite-node` or
  `uv run python -m studio.demos index` (the sandbox refuses them; the controller runs builds and exporters after merge, see Controller finish).
  Do not use `npx tsc` as a check: in a fresh worktree it reports unrelated errors about the gitignored `game-metadata.json`.
- Do not run `git merge origin/main`. If you need to know whether main moved, use `git fetch origin` then `git rev-list --count HEAD..origin/main`.
- Files you edit use CRLF line endings; keep them (the Edit tool preserves them). New files may use either; use CRLF to match.
- New behaviour goes in small new modules (SRP/KISS); no file over 600 lines.
- Status row meanings: when every Completion criteria box is checked and the verification tails are in the log line,
  set the row to **Review** (this is "Done" for the run). Never set it to Done: only Robert or Claude marks Done after merge.
  If you stop partway, set it to Blocked and write why.

## 7. Completion criteria

- [ ] `GameCanvas.phase2g.tsx` is gone (or the Status row says the delete was refused).
- [ ] The HUD Restart button shows the word Restart.
- [ ] The three standalone files and the `build:slither_rogue` script exist exactly as described.
- [ ] `cd ts && npx vitest run test_slither_rogue_hygiene.ts` shows 3 passed and `test_slither_rogue_sound.ts` still passes (real tails pasted; if the delete was refused, the first hygiene test is the one expected to fail and you say so).
- [ ] No file outside Scope changed.
- [ ] The Status row is set to Review with a one-line log entry.

## Sandbox needs

none

## 8. Report

Findings first: what was removed (791 lines), what was added, and whether the delete went through. Evidence second: real tails. Recommended action: review, merge, then the controller runs the build.

## Forbidden Actions

- Committing to or pushing main; pushing at all; deploying; installing or fetching anything; reading outside the worktree; touching protected repos; editing `archive/`, `docs/children.json` or `tests/fixtures/demo_lists_snapshot.json`; adding Lua code or changing the engine; any player-layer or save-to-cloud work.

## Required from User

none.
