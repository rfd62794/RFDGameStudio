# PlanetForge Tier A: registry source link so the deploy picks the demo up

## Read first

`docs/demos/planetforge/SCOPE.md`, `docs/superpowers/specs/2026-10-03-demo-polish-standard.md` (Tier A, A1-A8),
`ts/src/games/planetforge/config.ts` (whole file), `ts/src/games/antsim_redux/config.ts` (whole file, the comparison),
`ts/tests/test_registry_export.ts` (lines 1-30), `studio_mcp/demos/registry.py` (lines 40-60),
`tests/fixtures/demo_lists_snapshot.json` (lines 1-30 and 120-125), `tests/test_demos_registry_parity.py` (lines 1-40).
Everything you need is quoted below; do not search for anything else.

## 1. Why this exists

PlanetForge is a built `external` demo (an iframe of `/arcade/planetforge/`), but it is NOT PUBLISHED: the 2026-10-03
audit (`docs/state/demo-audit-batch2-2026-10-03.md`, planetforge row) got 404 for both `/games/planetforge/` and
`/arcade/planetforge/`, so every Tier A item (A1-A4, A8) fails for the trivial reason that no page exists. The cause traced in
`docs/demos/planetforge/SCOPE.md`: the deploy only copies demos whose registry config carries a `source` of kind `example`
or `sibling`, and PlanetForge's config has none. `studio_mcp/demos/registry.py` lines 41-42:

```python
def demo_entries(games: list[dict]) -> list[dict]:
    return [g for g in games if (g.get("source") or {}).get("kind") in ("example", "sibling")]
```

Current `ts/src/games/planetforge/config.ts` (whole file):

```ts
import type { GameConfig } from '../../engine/types';

const config: GameConfig = {
  gameId: 'planetforge',
  label: 'PlanetForge',
  description: 'A planetary god-game simulation featuring a 32-tile ring world, sector zone soil stability progression, resource harvesting, and monument construction.',
  color: '#8b5cf6',
  status: 'external',
  genre: 'colony-4x',
  tags: ['god-game', 'ring-world'],
  embedUrl: '/arcade/planetforge/',
};

export default config;
```

The comparison, `ts/src/games/antsim_redux/config.ts` line 5, which is deployed:

```ts
  source: { kind: 'example', slug: 'antsim-redux' },
```

The example source is tracked in git (`examples/planetforge/`, 24 files including `package.json`, `vite.config.ts` with base
`/arcade/planetforge/`, and `src/`); its `dist/` is untracked and gitignored, so the run can neither build nor include it.

Tests that assert the exact set of demos carrying `source`, `ts/tests/test_registry_export.ts` (the `SOURCES` map, lines 5-17, and
the assertion at lines 25-28):

```ts
const SOURCES: Record<string, unknown> = {
  ledger: { kind: 'example', slug: 'ledger' },
  ...
  facility_escape: { kind: 'example', slug: 'facility-escape' },
  systemic_extract: { kind: 'example', slug: 'systemic-extract' },
};
```
```ts
    expect(withSource).toEqual(SOURCES);
```

and the Python parity fixture `tests/fixtures/demo_lists_snapshot.json`, whose `example_demos` list (lines 2-13) ends

```json
    "facility-escape",
    "systemic-extract"
  ],
```
and whose `demo_static_name` map (lines 15-27) ends
```json
    "facility-escape": "facility_escape",
    "systemic-extract": "systemic_extract"
  },
```
(`tests/test_demos_registry_parity.py` compares `reg.example_demos(games)` and `reg.demo_static_names(games)` with these, so they
must include PlanetForge once its config carries `source`.)

## 2. Scope

Copied from `docs/demos/planetforge/SCOPE.md`.

Top 3 changes, in order: 1. Add source {kind:'example', slug:'planetforge'} to config.ts (update ts/tests/test_registry_export.ts:26-27, which asserts the exact set of demos carrying source), rebuild examples/planetforge, then Claude/Robert redeploys; 2. Re-run the A1-A4, A8 audit on the live page (phone layout unverified, no page existed; A3: Reset is an icon, may need a text label); 3. Label the card honestly and add the screenshot (A5, A8).

Out of scope: deciding gameLogic.ts vs slimeEngine.ts (Phase2/2b directives; Phase2b is Approved), new mechanics, a TS-native rewrite, renaming the "SlimeWorld" text.

This directive targets Tier A. It executes the code part of change 1 only: the `source` field and the tests that assert it.
Rebuilding `examples/planetforge` (its `dist/` is untracked) and redeploying are Robert's separate steps, and the run does
not deploy. Change 2 needs the live page, which does not exist until that deploy, so it follows the deploy. Change 3 is
not doable here: the arcade manifest has no screenshot field (`ts/src/arcade-manifest/buildManifest.ts`, `ManifestGame`) and no
card-label mechanism for embeds was located, so the run must not invent one; report it as a follow-up.

## 3. The work

1. `ts/src/games/planetforge/config.ts`: add the line `  source: { kind: 'example', slug: 'planetforge' },` directly
   after the `gameId: 'planetforge',` line, matching `ts/src/games/antsim_redux/config.ts`. Change nothing else in the file.
2. `ts/tests/test_registry_export.ts`: add `  planetforge: { kind: 'example', slug: 'planetforge' },` to `SOURCES`, after the
   `systemic_extract` line.
3. `tests/fixtures/demo_lists_snapshot.json`: add `"planetforge"` as the last entry of `example_demos`, and
   `"planetforge": "planetforge"` as the last entry of `demo_static_name` (mind the commas). Touch nothing else in the
   file.
4. If `tests/test_demos_registry_parity.py` or `tests/test_game_metadata.py` still fails after steps 1-3, fix only with the
   smallest change that keeps them true; if the cause is not obvious from these files, STOP and write the failing test
   name and message in the Status row (do not search the repo).

## 4. What NOT to do

- Do not touch the engine question: no edits to `ts/src/games/planetforge/gameLogic.ts`, `ts/tests/test_planetforge_gameLogic.ts`,
  anything under `examples/planetforge/` (queued Phase2/2b directives own it; Phase2b is Approved), or
  `docs/directives/PlanetForge_Phase2b_Correction_Directive.md`.
- Do not change `embedUrl`, `status` (`external`), the description, or add a screenshot or card label (see Scope).
- Do not rename the "SlimeWorld" text, add mechanics, or start a TS-native rewrite.
- Do not build or copy the example's `dist/` folder, do not deploy, do not touch the site repo.

## 5. Verification

Run each as its own tool call, from the worktree root, and paste the real output tails in the report:

```
uv run python --version
cd ts && npx vitest run test_registry_export.ts test_planetforge_gameLogic.ts
```

Also run these as separate tool calls (they need Node; if the parity test is skipped because `npx` is missing, record that):

```
uv run pytest -q -p no:cacheprovider tests/test_demos_registry_parity.py
uv run pytest -q -p no:cacheprovider tests/test_game_metadata.py
```

The full suite and the live-page audit (A1-A4, A8) are not part of this run.

Reference, run on main (f3208bc1) when this directive was written: `uv run python --version` gave
`Python 3.12.12`. The vitest line on main (the two files, without the new SOURCES entry) gave `Test Files  2 passed (2)` and
`Tests  7 passed (7)` (4 and 3 tests). The two Python test files were not pre-run when this directive was written (they export the registry through Node); if either
fails on a clean main, record it as pre-existing.
The `cd ts && npx vitest run <bare-filename>` form is the only form that finds tests here; full-path filters such as `ts/tests/<name>.ts`
find none. Record any failure that also fails on a clean main as pre-existing, do not fix it.

## 6. Rules for this run

- NON-INTERACTIVE. Any tool call that needs a confirmation is rejected and the run ends; do not retry another
  way around it, write why in the Status row.
- ONE simple command per tool call: no `;`, `&&` or `||` chains, no pipes, no redirects. The one allowed
  exception is the fixed verification line `cd ts && npx vitest run test_registry_export.ts test_planetforge_gameLogic.ts`. Do not use `ls`, `Get-ChildItem` or `cat`: use
  Read, Glob and Grep.
- No installs, no downloads, no fetches. Do not read outside this worktree. Do not search or hunt for files
  that are not named in this directive: every path you need is quoted above. If something named here is
  missing or different from the quote, STOP and write exactly what is missing in the Status row.
- Work only on branch `directive/rfdgamestudio-polish-planetforge-tiera-directive`. Never commit to main, never push, never deploy.
- No scratch or debug files in the tree; if you need one, put it in `.devin-scratch/`.
- No absolute paths inside this repo's checkout (in code, tests or docs you write).
- Mark every file you create with a `<!-- new: ... -->` marker in your report, and a `// new:` header comment in new code files.
- New logic goes in the small new modules named in The work (SOLID/SRP/KISS). Keep every file you touch under
  600 lines where it already is; where a file is already over 600 lines, its net line count must not grow by more
  than 10.
- Free models only wherever any model config is touched (none is expected in this directive).
- Do not run `agentflow lint` or any other `agentflow` CLI. Never use `git -C`, `git -c`, `git --git-dir` or
  `git --work-tree`.
- Update this directive's Status row when you finish or stop partway. Done for the Status row means: the files in
  The work are changed or created, the verification commands in section 5 were run and their real tails are in
  the report, and the work is committed on the directive branch (not pushed). Move the row to `Review`, never to
  Done.

## 7. Completion criteria

Done means all of: (a) `ts/src/games/planetforge/config.ts` carries `source: { kind: 'example', slug: 'planetforge' }`;
(b) `SOURCES` and the parity fixture list PlanetForge, and `test_registry_export.ts` passes (3 tests) together with
`test_planetforge_gameLogic.ts` (4 tests); (c) the parity and game-metadata pytest files show no new failures versus main;
(d) the work is committed on the directive branch, not pushed. Status row: `Review`, with one line giving the pass counts.
The run does not mark Done and does not merge.

## 8. Report

Findings first: what changed, in which files. Then evidence: the real output tails of the commands in section 5.
Then one recommended action per open item. List every created file with a `<!-- new: ... -->` marker. State that
nothing was deployed and that nothing was pushed.

## Sandbox needs

none

## Forbidden Actions

- Committing to or pushing main; pushing at all; deploying; touching the site repo; touching protected repos
  (TeleseroAdminSuite2026, DialerListPulse); editing `.gitignore`, `examples/` (unless this directive names a
  file there), any `dist` or `dist-*` directory, or any other demo's files; installing or fetching anything.

## Required from User

none for the run. Deploying is Robert's. After Review and merge, his steps in order: build `examples/planetforge` (the deploy requires
the example's `dist/` folder), run the deploy, then check `https://games.rfditservices.com/games/planetforge/` and the A1-A4, A8
audit on the live page (including whether the icon-only Reset needs a text label). The run does not deploy.

<!-- queue:start -->
## Queue

| Field | Value |
|---|---|
| Status | In progress |
| Assigned to | devin |
| Branch | directive/rfdgamestudio-polish-planetforge-tiera-directive |
| Base branch | - |
| Base commit | 5910e2b241c7c515b88cd89ea40b73691dc20eb9 |

**Status log**
- 2026-10-03 · robert-claude-laptop · none → Queued — demo polish wave 1, Tier A only; Scope and Out of scope copied from the demo's SCOPE.md
- 2026-10-04 00:00 · robert-claude-laptop · Queued → Approved
- 2026-10-04 03:07 · dispatcher · Approved → In progress — dispatched devin on personal-laptop in C:\GitHub\.worktrees\RFDGameStudio--rfdgamestudio-polish-planetforge-tiera-directive; lane=default; model=swe-2-high; persona=steady-builder
<!-- queue:end -->
