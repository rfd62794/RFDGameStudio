# antsim_redux: take the lab notebook out of the player UI (S)

**Depends on:** none.
**Read first** (everything this run needs is pasted below; these are the files to open):
`examples/antsim-redux/src/App.tsx`, `examples/antsim-redux/README.md`, `ts/src/games/antsim_redux/config.ts`, `docs/demos/antsim_redux/DIRECTION.md` (verdict TRIM), `docs/superpowers/specs/2026-10-03-demo-polish-standard.md` (Tier A, item A5/A8).

## 1. Why this exists

The embed at `/arcade/antsim_redux/` is an honest ant-colony toy (Robert settled 2026-10-04: honest embed, Tier A only). A player who opens it still meets developer words.
Measured on origin/main `889dd21e` (2026-10-04) by reading `examples/antsim-redux/src/App.tsx`:

- header badge `Phase 2c` and subtitle `Trophallaxis, Queen Feeding & Egg Lifecycle` (the project's own state doc says phase 4g, so the badge is also wrong);
- a second tab, `Test Anchors (sample list)`, that lists 28 internal test names (`testResults`, ids 1 to 28). The list is static: it is not run in the page; the real checks live in `examples/antsim-redux/tests/simulation.test.ts`;
- a footer-style banner headed `Core Directive` that explains the sim's internal priority rules.

Nothing asks the player to do anything. The one action the game offers is dropping food on the canvas (click), so say so in one plain line.

## 2. Scope

1. `examples/antsim-redux/src/App.tsx`: remove the phase badge, replace the subtitle, remove the Test Anchors tab and its data, reword the `Core Directive` banner.
2. `examples/antsim-redux/README.md`: one line pointing at the state doc.
3. New test `<!-- new: ts/tests/test_antsim_redux_player_copy.ts -->`.

No other file changes (the registry description in `ts/src/games/antsim_redux/config.ts` is already player-facing; the test only pins it).

## 3. The work

Files edited use CRLF line endings; keep them.

**Step 1: `examples/antsim-redux/src/App.tsx`.** Make these edits (read the file first; the line numbers below are from `889dd21e`):

1. Delete the whole `const [testResults] = useState<...>([ ... ]);` block (about lines 27 to 56, the 28 `{ id: N, name: '...' }` rows) and the line `const [activeTab, setActiveTab] = useState<'sim' | 'anchors'>('sim');` (line 58).
2. Header (about lines 160 to 163): change
   `AntSim Redux <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Phase 2c</span>` to just `AntSim Redux`,
   and the subtitle `Trophallaxis, Queen Feeding & Egg Lifecycle` to `Drop food and watch the colony find it`.
3. Delete the whole `{/* View Tabs */}` block (the `div` holding the two tab buttons, about lines 167 to 190), so the header ends after the title block.
4. Make the simulation view unconditional: change `{activeTab === 'sim' ? (` to `{(` and delete the `) : (` branch through its closing `)}` (the Test Anchors view, about lines 366 to 399), leaving `)}` as the end of the simulation view. Keep everything inside the simulation view unchanged.
5. In the banner that reads `<ShieldCheck className="w-4 h-4" /> Core Directive`, change `Core Directive` to `How the ants decide`, and replace its paragraph
   `Direct food sensing strictly outranks trail-following in logic priority. Pheromone emission and decay are balanced to prevent origin runaway stacking.`
   with
   `Ants head straight for food they can sense. Otherwise they follow the strongest scent trail. Trails fade over time, so one path never takes over.`
6. Leave the `ShieldCheck` import (the banner still uses it). Remove any import that is now unused only if the file fails to compile without the change; do not touch anything else.

**Step 2: `examples/antsim-redux/README.md`.** Directly under the line `# Run and deploy your AI Studio app`, add a blank line then: ``Current project state: see `docs/state/current.md`.``

**Step 3: the test `ts/tests/test_antsim_redux_player_copy.ts`.** Create it with exactly this content:

```ts
// new: ts/tests/test_antsim_redux_player_copy.ts
// Source-text guard: the embed shows a player a colony to watch, not a lab notebook.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import config from '../src/games/antsim_redux/config';

const read = (rel: string) => readFileSync(resolve(import.meta.dirname, '../../examples/antsim-redux', rel), 'utf8');
const app = read('src/App.tsx');

describe('antsim_redux player-facing copy', () => {
  it('the embed UI has no phase badge, anchors tab, test-name list or lab headings', () => {
    expect(app).not.toMatch(/phase\s*\d/i);
    expect(app).not.toMatch(/anchor/i);
    expect(app).not.toMatch(/trophallaxis/i);
    expect(app).not.toMatch(/core directive/i);
  });
  it('the embed UI shows the player line', () => {
    expect(app).toContain('Drop food and watch the colony find it');
  });
  it('the README points at the project state doc', () => {
    expect(read('README.md')).toContain('docs/state/current.md');
  });
  it('the registry description is player-facing', () => {
    const d = (config.description ?? '').toLowerCase();
    expect(d.trim().split(/\s+/).length).toBeLessThanOrEqual(60);
    for (const w of ['phase', 'anchor', 'todo', 'tbd']) expect(d).not.toContain(w);
  });
});
```

## 4. What NOT to do

- No change to the simulation (`simulation.ts`, `tunnel_network.ts`, `combat.ts`, `colony_lifecycle.ts`, `pheromones.ts`, `render.ts`) or to `tests/simulation.test.ts`. No new mechanics, no goal or scoring, no TS-native port (all outside the settled Tier A decision).
- No edit to `ts/src/games/antsim_redux/config.ts`, the registry or any other game. No Lua, no engine change.
- Do not add a replacement tab or a test list. Do not reformat the file; keep the diff tiny (an AI Studio re-import overwrites this embed, so every extra edit is rework).
- Do not deploy or rebuild anything. Never touch protected repos. No player-layer or cloud-save work.

## 5. Verification

```
uv run python --version
```
Expected: `Python 3.12.x`. Verified on this machine: `Python 3.12.12`.

Baseline, before editing (the new test against origin/main `889dd21e`, verified 2026-10-04):
```
cd ts && npx vitest run test_antsim_redux_player_copy.ts
```
Real tail: `Test Files  1 failed (1)` / `Tests  3 failed | 1 passed (4)` (the three failures are the banned words, the missing player line, the missing README pointer; the registry-description check already passes).

After editing, the same command. Real tail from a prototype of exactly these edits (2026-10-04): `Test Files  1 passed (1)` / `Tests  4 passed (4)`.

Source check (Grep tool, one call): `examples/antsim-redux/src/App.tsx` has no match for `anchor` (case-insensitive) and no match for `Phase 2c`.

The example app has no `node_modules` in a fresh worktree, so its own `tsc` and `vite build` cannot run here; the test is the gate.

**Controller finish (after merge, not part of this run):** rebuild the embed (`cd ts && npm run build:antsim_redux` if that script exists, else the example's own build), re-measure the phone fit at 390x844 and take the A5 screenshot for the arcade manifest. Those need a browser and are separate steps.

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

- [ ] `examples/antsim-redux/src/App.tsx` has no phase badge, no Test Anchors tab or data, no `Core Directive` heading, and shows `Drop food and watch the colony find it`.
- [ ] `examples/antsim-redux/README.md` points at `docs/state/current.md`.
- [ ] `ts/tests/test_antsim_redux_player_copy.ts` exists with the content above; `cd ts && npx vitest run test_antsim_redux_player_copy.ts` shows 4 passed (real tail pasted).
- [ ] No file outside the three in Scope changed.
- [ ] The Status row is set to Review with a one-line log entry.

## Sandbox needs

none

## 8. Report

Findings first: the three files and what was removed (count of lines removed from `App.tsx`). Evidence second: the real vitest tail. Say plainly that the phone-fit re-measure and the A5 screenshot are NOT done by this run (they need a browser). Recommended action: review, merge, then the controller rebuilds the embed and screenshots it.

## Forbidden Actions

- Committing to or pushing main; pushing at all; deploying; installing or fetching anything; reading outside the worktree; touching protected repos; editing `archive/`, `docs/children.json` or `tests/fixtures/demo_lists_snapshot.json`; adding Lua code or changing the engine; any player-layer or save-to-cloud work.

## Required from User

none.

<!-- queue:start -->
## Queue

| Field | Value |
|---|---|
| Status | Queued |
| Assigned to | devin |
| Branch | - |
| Base branch | - |

**Status log**
- 2026-10-04 13:17 · agentflow-tick · none → Queued — suggested by heartbeat: Fully specified S-size worktree edit; quoted lines verified on live checkout; Devin-shaped.
<!-- queue:end -->
