# systemic_extract: an honest blurb, no favicon 404, no promise of a hideout (S)

**Depends on:** none.
**Read first** (everything this run needs is pasted below; these are the files to open):
`ts/src/games/systemic_extract/config.ts`, `examples/systemic-extract/index.html`, `examples/systemic-extract/README.md` (Backlog items 1 and 5), `docs/demos/systemic_extract/DIRECTION.md` (verdict PARK, Replan step 1).

## 1. Why this exists

Systemic Extract is parked at an honest embed: the raid loop plays and restarts, but the hideout meta loop is orphaned, so a successful run ends with salvage that cannot be spent. The card should say so kindly instead of promising a base-building loop that is not reachable.
Measured on origin/main `889dd21e` (2026-10-04):

- `ts/src/games/systemic_extract/config.ts` description is `A 2D top-down systemic extraction sandbox: deploy from a sanctuary base into four dungeon sectors, ...` and the tags include `base-building`; `HideoutView` and `useHideoutState` are imported only by each other, so no base-building is reachable (a Grep for `HideoutView` under `examples/systemic-extract/src` finds only its own file and the hook's comment).
- `examples/systemic-extract/index.html` advertises, in `description` and `og:description`, `Bevy-style ECS simulation and an Abiotic Factor & SS13-inspired research and deconstruction hideout loop` (developer words, and the loop is unreachable), and has no `<link rel="icon">`, so browsers request a favicon and get a 404 (README backlog item 5).

(The cover screenshot is a browser step: not part of this run.)

## 2. Scope

1. `ts/src/games/systemic_extract/config.ts`: description and tags.
2. `examples/systemic-extract/index.html`: two meta descriptions and one icon line.
3. New test `<!-- new: ts/tests/test_systemic_extract_blurb.ts -->`.

## 3. The work

Both edited files use CRLF; keep it.

The new description (33 words), used in all three places:
`Deploy from a sanctuary into four dungeon sectors, survive spreading hazards and escalating hives, and extract with salvage. An early build: the hideout where salvage gets spent is not open yet.`

**Step 1: `config.ts`.** Replace the whole `description:` string with the text above, and change `tags: ['extraction', 'ecs-sandbox', 'base-building'],` to `tags: ['extraction', 'ecs-sandbox'],`.

**Step 2: `index.html`.** Replace the `content` of `<meta name="description" ...>` and of `<meta property="og:description" ...>` with the text above (keep the tags otherwise as they are). Directly above the line `<link rel="preconnect" href="https://fonts.googleapis.com">` add this single line (an inline icon, so no new binary file):

```html
    <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 32 32%27%3E%3Crect width=%2732%27 height=%2732%27 rx=%276%27 fill=%27%230b0e14%27/%3E%3Ccircle cx=%2716%27 cy=%2716%27 r=%278%27 fill=%27none%27 stroke=%27%2322d3ee%27 stroke-width=%273%27/%3E%3Ccircle cx=%2716%27 cy=%2716%27 r=%273%27 fill=%27%2322d3ee%27/%3E%3C/svg%3E" />
```

**Step 3: test.** Create `ts/tests/test_systemic_extract_blurb.ts` with exactly:

```ts
// new: ts/tests/test_systemic_extract_blurb.ts
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import config from '../src/games/systemic_extract/config';

const indexHtml = readFileSync(resolve(import.meta.dirname, '../../examples/systemic-extract/index.html'), 'utf8');

describe('systemic_extract blurb and page head', () => {
  const d = config.description ?? '';
  it('description is 60 words or fewer and says the hideout is not open yet', () => {
    expect(d.trim().split(/\s+/).length).toBeLessThanOrEqual(60);
    expect(d.toLowerCase()).toContain('not open yet');
  });
  it('description has no dev-speak', () => {
    for (const t of ['ecs', 'bevy', 'ss13', 'abiotic', 'sandbox', 'todo', 'tbd']) expect(d.toLowerCase()).not.toContain(t);
  });
  it('does not advertise base-building while the hideout is unreachable', () => {
    expect(config.tags ?? []).not.toContain('base-building');
  });
  it('the example page declares an icon (no more favicon 404) and the same honest description', () => {
    expect(indexHtml).toMatch(/<link rel="icon"/);
    expect(indexHtml).not.toMatch(/Bevy-style|SS13/);
    expect(indexHtml).toContain('not open yet');
  });
});
```

## 4. What NOT to do

- Do not wire in, change or delete `HideoutView`, `useHideoutState`, the hideout panels or `hideout-service.ts`: the decision on the hideout is Robert's and has its own page (see `Docs_E_Corrections_Directive`).
- No change to any other game, to the sim (`examples/systemic-extract/src/**`), to the restart wiring or to `test_systemic_extract_restart.ts`.
- No new binary file (no favicon.ico, no png); the inline SVG line is the whole icon.
- No deploys, no protected repos, no player-layer or cloud-save work. An AI Studio re-promotion would overwrite the example edits (README "Improvement workflow"), which is why the diff stays this small.

## 5. Verification

```
uv run python --version
```
Expected: `Python 3.12.x`. Verified on this machine: `Python 3.12.12`.

Baseline, before editing (the new test against origin/main `889dd21e`, verified 2026-10-04):
```
cd ts && npx vitest run test_systemic_extract_blurb.ts
```
Real tail: `Test Files  1 failed (1)` / `Tests  4 failed (4)`.

After editing, the same command. Real tail from a prototype of exactly these edits (2026-10-04): `Test Files  1 passed (1)` / `Tests  4 passed (4)`.
Regression check:
```
cd ts && npx vitest run test_systemic_extract_restart.ts test_registry_export.ts test_arcade_manifest.ts
```
Real tail from the prototype: `Test Files  3 passed (3)` / `Tests  14 passed (14)`.

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

- [ ] `config.ts` and `index.html` carry the new description; the `base-building` tag is gone; the icon line is present.
- [ ] `cd ts && npx vitest run test_systemic_extract_blurb.ts` shows 4 passed, and the three regression files pass (real tails pasted).
- [ ] No file outside the three in Scope changed.
- [ ] The Status row is set to Review with a one-line log entry.

## Sandbox needs

none

## 8. Report

Findings first: the new blurb as shipped and that the favicon is an inline icon. Evidence second: real tails. Say plainly that the cover screenshot, the "embed" card label check and the A1 console check (zero errors, no favicon 404) are browser steps for the controller after the embed is rebuilt.

## Forbidden Actions

- Committing to or pushing main; pushing at all; deploying; installing or fetching anything; reading outside the worktree; touching protected repos; editing `archive/`, `docs/children.json` or `tests/fixtures/demo_lists_snapshot.json`; adding Lua code or changing the engine; any player-layer or save-to-cloud work.

## Required from User

none.

<!-- queue:start -->
## Queue

| Field | Value |
|---|---|
| Status | Review |
| Assigned to | devin |
| Branch | directive/rfdgamestudio-systemic-extract-honest-blurb-directive |
| Base branch | main @ 1d8383aa |

**Status log**
- 2026-10-04 13:28 · robert-claude-laptop · none → Queued
- 2026-10-04 14:40 · robert-claude-laptop · Queued → Approved — lint override: lint false positives (verified; fix in AgentFlow PR #534 pending); author ran baseline+after proofs; Robert 2026-10-04 approved all recommendations
- 2026-10-05 · devin-cleanroom-overseer · Approved → Review — `config.ts` description/tags + `index.html` two meta descriptions + inline SVG favicon line applied verbatim; `ts/tests/test_systemic_extract_blurb.ts` created verbatim. Verified: `cd ts && npx vitest run test_systemic_extract_blurb.ts` → `Test Files 1 passed (1)` / `Tests 4 passed (4)` spec-exact; regression trio `test_systemic_extract_restart.ts test_registry_export.ts test_arcade_manifest.ts` → `3 passed (3)` / `15 passed (15)` (spec predicted 14 — one regression file grew a test since the spec was written; all green). Findings: new blurb shipped in all three places; favicon is an inline icon, no binary file. The cover screenshot, embed card label check and A1 console check are browser steps for the controller after the embed is rebuilt.
<!-- queue:end -->
