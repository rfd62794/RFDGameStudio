# SlimeGarden: an honest blurb and README, and a link to SlimeWorld

**Depends on:** `Slimegarden_Phone_Fit_Directive.md` merged first (both edit `examples/slimegarden/src/App.tsx`, on different lines; running in order avoids a conflict).

**Read first** (everything this run needs is pasted below; these are the files to open):
`ts/src/games/slimegarden/config.ts`, `examples/slimegarden/README.md`, `examples/slimegarden/src/App.tsx` (the header, lines 654-670), `docs/demos/slimegarden/DIRECTION.md`.

## 1. Why this exists

SlimeGarden is a frozen origin exhibit: it exists to be visited as history, and SlimeWorld is its successor (`supersededBy: 'slimeworld'`). Three things in it are not honest or welcoming (`docs/demos/slimegarden/DIRECTION.md`):

- The registry blurb leaks a repo path and dev speak. Today (`ts/src/games/slimegarden/config.ts` line 13): `description: 'Origin project — the original multi-tank slime breeding and genetics sandbox. Merged with SlimeBreeder to become the current, live SlimeWorld (ts/src/games/slimeworld/). Real specimen dispatch, territory claims, and garrison risk across planet nodes.',`
- `examples/slimegarden/README.md` is AI Studio boilerplate that asks the reader to set a `GEMINI_API_KEY` the game never uses.
- Nothing in the game points a player to SlimeWorld. The header (`App.tsx`) has this line, with no link after it: `<p className="text-xs text-slate-400 font-mono">Asteroid-317 Laboratory Terminal</p>`.

In the arcade the game is served at `/arcade/slimegarden/` and SlimeWorld at `/arcade/slimeworld/`, so the relative link `../slimeworld/` reaches it.

## 2. Scope

1. `ts/src/games/slimegarden/config.ts`: replace the `description` value only.
2. `examples/slimegarden/README.md`: replace the whole file.
3. `examples/slimegarden/src/App.tsx`: add one `<a>` line after the `Asteroid-317 Laboratory Terminal` paragraph.
4. New test `<!-- new: ts/tests/test_slimegarden_honesty.ts -->`.

## 3. The work

**Step 1: blurb.** Replace the `description` line with exactly (53 words):
```
  description: 'Frozen origin exhibit: the early multi-tank slime breeding sandbox that grew into SlimeWorld. Breed slimes, send them on dispatches and claim planet territory. Kept for history and no longer developed. For the current game, play SlimeWorld.',
```
Leave `gameId`, `source`, `supersededBy`, `status`, `tags`, `embedUrl`, the header comment, and everything else exactly as they are.

**Step 2: README.** Replace the whole file with:
```
# SlimeGarden

An early slime-breeding sandbox: breed slimes in several tanks, send them on timed dispatches, and claim territory on a small hex planet.
It is kept as a piece of history. It was the starting point for SlimeWorld, which is the current, finished version of the idea.

Play the successor: SlimeWorld (in the arcade, next to this entry).

This game needs no API key. Your progress is saved in your browser; use Reset in the header to start over.

For developers: `npm install`, then `npm run dev`.
```

**Step 3: link.** In `App.tsx`, immediately after the line `<p className="text-xs text-slate-400 font-mono">Asteroid-317 Laboratory Terminal</p>` insert this new line, indented to match (12 spaces):
```
            <a href="../slimeworld/" className="text-xs text-cyan-400 hover:text-cyan-300 font-mono underline">Play the successor: SlimeWorld</a>
```
The file uses CRLF line endings; keep them.

**Step 4: test.** Create `<!-- new: ts/tests/test_slimegarden_honesty.ts -->` with exactly:

```ts
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import config from '../src/games/slimegarden/config';

const root = resolve(import.meta.dirname, '../../examples/slimegarden');
const appSource = readFileSync(resolve(root, 'src/App.tsx'), 'utf8');
const readme = readFileSync(resolve(root, 'README.md'), 'utf8');

describe('slimegarden honesty', () => {
  it('links to the successor game, SlimeWorld', () => {
    expect(appSource).toContain('href="../slimeworld/"');
    expect(appSource).toContain('Play the successor: SlimeWorld');
  });

  it('README no longer asks for an API key or links the AI Studio banner', () => {
    expect(readme).not.toContain('GEMINI_API_KEY');
    expect(readme).not.toContain('GHBanner');
    expect(readme).not.toContain('Run and deploy your AI Studio app');
  });

  it('README says what the game is and that SlimeWorld replaced it', () => {
    expect(readme).toContain('# SlimeGarden');
    expect(readme).toContain('SlimeWorld');
    expect(readme.split('\n').length).toBeLessThanOrEqual(20);
  });

  it('registry blurb is short, welcoming and free of repo paths', () => {
    const description = config.description ?? '';
    expect(description.trim().split(/\s+/).length).toBeLessThanOrEqual(60);
    expect(description).not.toContain('ts/src');
    expect(description).toContain('SlimeWorld');
    expect(description).toContain('Frozen origin exhibit');
    expect(config.supersededBy).toBe('slimeworld');
  });
});
```

## 4. What NOT to do

- Do not change any gameplay code, the Reset button, the terminal tone or other copy inside the game (only the one added link).
- Do not change `status`, `source`, `supersededBy`, `embedUrl`, `tags`, `label` or `gameId` in the config (registry parity tests key on them).
- Do not touch `examples/slimeworld/`, `intake/slimegarden/`, `package.json`, `docs/children.json`, the demo-lists snapshot fixture under `tests/fixtures/`.
- Do not run any build or install in `examples/`; do not deploy.

## 5. Verification

```
uv run python --version
```
Expected: `Python 3.12.x` (verified: `Python 3.12.12`).

After editing (verified on a prototype of exactly this change):
```
cd ts && npx vitest run test_slimegarden_honesty.ts test_registry_export.ts test_arcade_manifest.ts
```
Real tail: `Test Files  3 passed (3)` / `Tests  11 passed (11)`.

Source checks (Grep tool, one call each): `ts/src/games/slimegarden/config.ts` contains `Frozen origin exhibit` once and no longer contains `ts/src/games/slimeworld`; `examples/slimegarden/README.md` does not contain `GEMINI_API_KEY`.

## 6. Rules for this run

- This run is NON-INTERACTIVE. A tool call that needs a confirmation is rejected and the run ends mid-task.
- ONE simple command per tool call. No `;`, `&&`, `||`, `|` chains and no redirects, with the single exception of
  the sanctioned verification line form `cd ts && npx vitest run <bare-filename>.ts`. Do not use `ls`, `Get-ChildItem`
  or `cat`: use Read, Glob and Grep. Use the bare test filename as the filter (a path filter finds no tests). No live process probing.
- Allowed commands are only: `uv run pytest ...`, `cd ts && npx vitest run <bare filename>`, `cd ts && npx tsc --noEmit`, `git status`, `git diff`, `git add`, `git commit`.
  Do NOT run `npm run build:*`, `vite-node`, `agentflow lint` or any agentflow command, `git merge`, or `uv run python -m studio.demos index` (the sandbox refuses them).
- Do not install, download or fetch anything. Do not read outside this worktree. Do not search or hunt for facts: every
  path and quoted line you need is above. If a path is missing or a quoted line differs from the file, STOP and write why in the Status row.
- Never commit to main, never push, never deploy. Work stays on your `directive/<slug>` branch; commit there. Only Robert merges.
- Do not create scratch or debug files in the repo; use `.devin-scratch/` if you need one.
- No absolute paths inside this repo's checkout in any file you write; use repo-relative paths.
- Files edited use CRLF line endings where the file already has them; keep them (the Edit tool preserves them). Do not convert.
- New logic goes in small new modules; no file over 600 lines.
- Player-facing text (blurbs, buttons, messages) is plain, welcoming and free of developer jargon.
- Status row meanings: when every Completion criteria box is checked and the verification tails are in the log line,
  set the row to **Review** (this is "Done" for the run). Never set it to Done: only Robert or Claude marks Done after merge.
  If you stop partway, set it to Blocked and write why.

## 7. Completion criteria

- [ ] The four files are as specified; nothing else changed.
- [ ] `cd ts && npx vitest run test_slimegarden_honesty.ts test_registry_export.ts test_arcade_manifest.ts` shows 3 files, 11 tests passed (real tail pasted).
- [ ] The Grep checks in section 5 pass.
- [ ] The Status row is set to Review with a one-line log entry.

## 8. Report

Findings first: the four files. Evidence second: real tails of `uv run python --version` and the vitest command.
Then say plainly: the link and README change reach players only after the controller rebuilds the embed (`npm run build:demo -- slimegarden`) and Robert redeploys. Controller finish: rebuild, click the link in a browser, confirm it opens SlimeWorld.
Recommended action: review, merge, then the controller's rebuild.

## Sandbox needs

none

## Forbidden Actions

- Committing to or pushing main; pushing at all; deploying or rebuilding any embed or dist; installing or fetching anything; reading outside the worktree; touching protected repos; editing `archive/`, `docs/children.json` or the demo-lists snapshot fixture under `tests/fixtures/`; Lua additions; engine changes under `ts/src/engine/`; any player-layer or cloud-save work.

## Required from User

none. Review and merge are Robert's or Claude's after the run.

<!-- queue:start -->
## Queue

| Field | Value |
|---|---|
| Status | Approved |
| Assigned to | devin |
| Branch | - |
| Base branch | - |

**Status log**
- 2026-10-04 13:25 · agentflow-tick · none → Queued — suggested by heartbeat: Fully specified 4-file copy+link change with a pasted test; dispatch after Slimegarden_Phone_Fit merges (shared App.tsx).
- 2026-10-08 03:12 · robert-claude-laptop · Queued → Approved
<!-- queue:end -->
