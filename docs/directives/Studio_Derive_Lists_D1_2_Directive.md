# Derive the demo lists: STANDALONE_BUILD_GAMES, the registry-export SOURCES, the board's demo rows; retire the snapshot (Phase 1, D1.2)

**Depends on:** D1.1 (`Studio_Registry_Glob_D1_1_Directive.md`) merged: every config has an `order` and `GAME_REGISTRY` is the glob registry. D1.1b (Python consumers) should also be merged, so the Python suite is green when this lands.
**Queue-neutral:** this file carries no Queue block; the controller queues it.

**Read first** (everything this run needs is pasted below; these are the files to open):
`ts/src/games/registry.ts` (whole file), `ts/tests/test_registry_export.ts` (whole file), `ts/src/status/board.data.ts` (whole file), `ts/src/status/types.ts` (lines 20-40, `ProjectEntry`), `ts/src/ui/components/MoreGamesByMe.tsx` (whole file),
`tests/test_demos_registry_parity.py` (whole file), `docs/superpowers/specs/2026-10-04-studio-redesign.md` (section c1, the "Derived, never hand-edited" bullet).

## 1. Why this exists

Adding a demo still means editing hand-kept lists next to its config. After D1.1 three of them remain, plus a fixture that pins an older copy of them (measured on origin/main `bb048831`, 2026-10-04):

1. `STANDALONE_BUILD_GAMES` in `ts/src/games/registry.ts` (14 hand entries `{ id, label }`), used by ten `App.tsx` files as the "More Games By Me" footer (`<MoreGamesByMe games={STANDALONE_BUILD_GAMES} ...>`; the component only filters the list and links to the arcade with `?game=<id>`).
   The redesign spec calls the list "standalone build games" and says derive it from a `build` field. It is not a build list: 3 of its 14 (`wire_rust`, `filipino_bpo_simulator`, `voiddrift_redux`) have no `ts/src/standalone/<id>/` entry and no build script, and 3 games that do have an entry (`dissonance`, `character_viewer`, `technique_showcase`)
   are not in it. So the new config field is named for what the list is, `moreGames`, and the export name `STANDALONE_BUILD_GAMES` stays (ten importers). Membership stays exactly the same 14.
2. `SOURCES` in `ts/tests/test_registry_export.ts`: a 14-entry copy of every demo's `source`, which must be updated by hand with every new demo.
3. `ts/src/status/board.data.ts` demo rows: 8 of the 14 sourced demos have hand-written rows; 6 have none (`ledger`, `facility_escape`, `systemic_extract`, `planetforge`, `coin_pusher_arcade`, `voidrift_particle_sandbox`), so the board is already out of date.
4. `tests/fixtures/demo_lists_snapshot.json` plus `tests/test_demos_registry_parity.py`: a frozen copy of the old hand lists, "retired" by the spec in favour of invariant tests.

Differences you will see, all intended and small: the footer lists games in registry (`order`) order instead of the old list order; two footer labels change to the config label (`Slime Coin` becomes `SlimeCoin`, `House of Kings Collab` becomes `House of Kings: Collab`); the board gains six generated rows (25 rows become 31).

## 2. Scope

1. `ts/src/engine/types.ts`: one optional field `moreGames`.
2. The 14 configs listed in Step 2: one line each.
3. `ts/src/games/registry.ts`: `STANDALONE_BUILD_GAMES` derived.
4. `ts/tests/test_dual_target_deploy.ts` and `ts/tests/test_registry_export.ts`: stop pinning text and hand copies.
5. New `<!-- new: ts/src/status/demoRows.ts -->`, new `<!-- new: ts/src/status/demoOverlay.ts -->`, `ts/src/status/board.data.ts` edited, new test `<!-- new: ts/tests/test_demo_board_rows.ts -->`.
6. Python: delete `tests/fixtures/demo_lists_snapshot.json` and `tests/test_demos_registry_parity.py`; add `<!-- new: tests/test_demos_registry_invariants.py -->`.

## 3. The work

Files in this repo use CRLF line endings (a few are LF); keep each file's existing endings (the Edit tool preserves them); new files use CRLF. Do not add or remove comments in existing code except where a step says so.

**Step 1: `ts/src/engine/types.ts`.** Directly after the line `  order?: number;  ...` (added by D1.1) add exactly:

```ts
  moreGames?: boolean;                    // listed in the "More Games By Me" footer (STANDALONE_BUILD_GAMES is derived from this)
```

**Step 2: `moreGames: true,` in 14 configs.** Insert one line `moreGames: true,` directly after the `order:` line of each of these `ts/src/games/<id>/config.ts` files, same indentation:
`shoal`, `slimeworld`, `chimera_wilds`, `mutant_battle_ball`, `scrapcrawl`, `wire_rust`, `choke_point`, `filipino_bpo_simulator`, `slime_coin`, `planetofgreed`, `gladiator_arena`, `voiddrift_redux`, `succession`, `house_of_kings_collab`.
No other config changes.

**Step 3: `ts/src/games/registry.ts`.** Replace the `STANDALONE_BUILD_GAMES` array (the `export const STANDALONE_BUILD_GAMES = [` line through its closing `];`) with exactly:

```ts
export const STANDALONE_BUILD_GAMES: { id: string; label: string }[] = GAME_REGISTRY
  .filter(g => g.moreGames)
  .map(g => ({ id: g.gameId, label: g.label }));
```
Change nothing else in the file.

**Step 4: tests that pinned the text.**

a. `ts/tests/test_dual_target_deploy.ts`: change `import { GAME_REGISTRY } from '../src/games/registry';` to `import { GAME_REGISTRY, STANDALONE_BUILD_GAMES } from '../src/games/registry';` and replace the body of test `Both games present in STANDALONE_BUILD_GAMES` (its three lines) with:

```ts
    expect(STANDALONE_BUILD_GAMES).toContainEqual({ id: 'shoal', label: 'Shoal' });
    expect(STANDALONE_BUILD_GAMES).toContainEqual({ id: 'planetofgreed', label: 'Planet of Greed' });
```

b. `ts/tests/test_registry_export.ts`: delete the `const SOURCES: Record<string, unknown> = { ... };` block; add `import { existsSync } from 'node:fs';` and `import { resolve } from 'node:path';` after the vitest import and, above `describe('registry export'`, the line `const REPO_ROOT = resolve(import.meta.dirname, '..', '..');`; replace the test `carries source for exactly the example/sibling demos` with these two tests:

```ts
  it('carries source for exactly the games whose config declares one', () => {
    const declared = GAME_REGISTRY.filter(g => g.source).map(g => [g.gameId, g.source]);
    expect(exp.games.filter(g => g.source).map(g => [g.gameId, g.source])).toEqual(declared);
    expect(declared.length).toBeGreaterThan(0);
  });

  it('points every example source at a tracked examples/<slug>/package.json, and names every sibling repo', () => {
    for (const g of exp.games) {
      if (g.source?.kind === 'example') expect(existsSync(resolve(REPO_ROOT, 'examples', g.source.slug, 'package.json')), g.gameId).toBe(true);
      if (g.source?.kind === 'sibling') expect(g.source.repo, g.gameId).toBeTruthy();
    }
  });
```

**Step 5: board demo rows.**

a. New `ts/src/status/demoRows.ts`. Exactly this content (verified):

```ts
// new: Phase 1 D1.2 -- board rows for registry demos are generated; only the hand-written parts live in the overlay.
import type { GameConfig, GameStatus } from '../engine/types';
import type { ProjectEntry, ProjectStatus } from './types';

/** The hand-written parts of a demo's board row, keyed by gameId in demoOverlay.ts. Anything absent is generated. */
export type DemoOverlay = Partial<Omit<ProjectEntry, 'id'>>;

/** lastUpdated for a generated row that has no overlay. Bump it when the generation rule changes. */
export const GENERATED_ROW_DATE = '2026-10-04';

const STATUS_FROM_CONFIG: Record<GameStatus, ProjectStatus> = {
  stable: 'shipped_mature',
  beta: 'active',
  dev: 'active',
  external: 'active',
  tool: 'active',
  retired: 'retired',
};

/**
 * One board row per registry game that declares a `source` (the AI Studio demos).
 * A config whose status is 'retired' is always a retired row; otherwise the overlay's status wins, then the mapped config status.
 */
export function buildDemoRows(registry: GameConfig[], overlay: Record<string, DemoOverlay>): ProjectEntry[] {
  return registry
    .filter(game => game.source)
    .map(game => {
      const extra = overlay[game.gameId] ?? {};
      const status: ProjectStatus = game.status === 'retired' ? 'retired' : extra.status ?? STATUS_FROM_CONFIG[game.status ?? 'dev'];
      return {
        category: status === 'retired' ? 'retired' : 'ai_studio_track',
        currentState: game.shortDescription ?? game.description ?? game.label,
        lastUpdated: GENERATED_ROW_DATE,
        ...extra,
        id: game.gameId,
        name: extra.name ?? game.label,
        status,
      };
    });
}
```

b. New `ts/src/status/demoOverlay.ts`. Exactly this content: the eight rows below are moved verbatim out of `board.data.ts` (same text, the `id:` key becomes the object key):

```ts
// new: Phase 1 D1.2 -- the hand-written parts of the demo rows (moved verbatim from board.data.ts); the rest is generated.
import type { DemoOverlay } from './demoRows';

export const DEMO_OVERLAY: Record<string, DemoOverlay> = {
  trinity_siege: {
    name: 'Trinity Siege/Combat', category: 'ai_studio_track', status: 'status_unconfirmed',
    currentState: 'Bevy vs. egui architecture question left unresolved.',
    nextAction: 'Direct status check — no longer blocked on the Rust-chassis question, that is confirmed Far Future Dream now.',
    lastUpdated: '2026-08-15', verificationMethod: 'research/inference',
  },
  '7_days_to_fry': {
    name: '7 Days to Fry', category: 'ai_studio_track', status: 'shipped_mature',
    currentState: 'Complete cooking-survival sim (7-day arc, win/lose). Registered in GAME_REGISTRY as an external demo and in website_collection. Own state doc (Aug 2026) reports 241/241 vitest floor — self-reported, not re-runnable in-repo.',
    nextAction: 'Promotion decision if revived — TS-native port or permanent external status; wire its own test suite into a runner the studio executes.',
    lastUpdated: '2026-09-29', verificationMethod: 'direct file read',
    capabilities: { mainMenu: 'Y', tutorial: 'N', graphicalUpgrade: '2026-08-30', soundEffects: 'N' },
  },
  antsim_redux: {
    name: 'AntSim Redux', category: 'separate_infrastructure', status: 'shipped_deliberately_paused',
    currentState: 'Phase 5, 90-test floor. Closed via named engine-death-pattern acknowledgment.',
    lastUpdated: '2026-08-15',
    capabilities: { mainMenu: 'N', tutorial: 'N', graphicalUpgrade: '—', soundEffects: 'N' },
  },
  slimegarden: {
    name: 'SlimeGarden', category: 'ai_studio_track', status: 'status_unconfirmed',
    currentState: 'Substantial design work as of mid-July (SlimeDex, Life Stages, partial Color Tree). Audit 2026-09-29 found it is the origin project merged with SlimeBreeder into the live SlimeWorld (ADR-023).',
    nextAction: 'Recommendation only: retire, superseded by SlimeWorld (origin project per ADR-023; source preserved in examples/slimegarden). Retirement is Robert\'s call.',
    lastUpdated: '2026-08-15', verificationMethod: 'research/inference',
  },
  corpworld: {
    name: 'CorpWorld', category: 'retired', status: 'retired',
    currentState: 'Source preserved read-only.', supersededBy: 'Planet of Greed', lastUpdated: '2026-08-15',
  },
  kingmaker_squads: {
    name: 'KingMaker Squads', category: 'retired', status: 'retired',
    currentState: 'Source preserved read-only.', supersededBy: 'Planet of Greed', lastUpdated: '2026-08-15',
  },
  slimebreeder: {
    name: 'SlimeBreeder', category: 'retired', status: 'retired',
    currentState: 'Established the retirement pattern itself.', lastUpdated: '2026-08-15',
  },
  voiddrift_redux: {
    name: 'VoidDrift Redux (web)', category: 'separate_infrastructure', status: 'active',
    currentState: 'Fragment drift correction landed (FRAGMENT_DRIFT_RATE in engine.ts). Auto-dispatch FSM with manual toggle. Orbital canvas with zoom/pan. Web simulation, separate from native VoidDrift.',
    lastUpdated: '2026-08-16',
    capabilities: { mainMenu: 'N', tutorial: 'N', graphicalUpgrade: '2026-08-16', soundEffects: 'N' },
  },
};
```

c. `ts/src/status/board.data.ts`: delete the eight row blocks with ids `voiddrift_redux`, `antsim_redux`, `trinity_siege`, `slimegarden`, `7_days_to_fry`, `corpworld`, `kingmaker_squads`, `slimebreeder` (each is one `  { id: '...', ... },` block; keep every other row, their order and the section comments, even if a comment
is left above no row). After the import line add `import { GAME_REGISTRY } from '../games/registry';`, `import { buildDemoRows } from './demoRows';` and `import { DEMO_OVERLAY } from './demoOverlay';`. Replace the final `];` with:

```ts

  // --- Generated demo rows (registry games with a source); hand-written parts live in demoOverlay.ts ---
  ...buildDemoRows(GAME_REGISTRY, DEMO_OVERLAY),
];
```

d. New `ts/tests/test_demo_board_rows.ts`. Exactly this content (verified: 6 tests pass):

```ts
// new: Phase 1 D1.2, demo board rows are generated from the registry.
import { describe, it, expect } from 'vitest';
import type { GameConfig } from '../src/engine/types';
import { GAME_REGISTRY } from '../src/games/registry';
import { STATUS_BOARD } from '../src/status/board.data';
import { DEMO_OVERLAY } from '../src/status/demoOverlay';
import { buildDemoRows, GENERATED_ROW_DATE } from '../src/status/demoRows';

const demo = (extra: Partial<GameConfig> = {}): GameConfig => ({
  gameId: 'demo_x', label: 'Demo X', description: 'A demo.', source: { kind: 'example', slug: 'demo-x' }, ...extra,
});

describe('buildDemoRows', () => {
  it('generates a row from the config alone', () => {
    expect(buildDemoRows([demo({ status: 'external' })], {})).toEqual([{
      id: 'demo_x', name: 'Demo X', category: 'ai_studio_track', status: 'active',
      currentState: 'A demo.', lastUpdated: GENERATED_ROW_DATE,
    }]);
  });

  it('skips games with no source', () => {
    expect(buildDemoRows([demo({ source: undefined })], {})).toEqual([]);
  });

  it('lets the overlay win except that a retired config is always a retired row', () => {
    const overlay = { demo_x: { status: 'shipped_mature' as const, currentState: 'Hand note.', category: 'separate_infrastructure' as const } };
    expect(buildDemoRows([demo({ status: 'external' })], overlay)[0]).toMatchObject({ status: 'shipped_mature', currentState: 'Hand note.', category: 'separate_infrastructure' });
    expect(buildDemoRows([demo({ status: 'retired' })], overlay)[0]).toMatchObject({ status: 'retired' });
  });
});

describe('the real board', () => {
  const sourced = GAME_REGISTRY.filter(g => g.source);

  it('has exactly one row for every registry game that declares a source', () => {
    for (const g of sourced) {
      expect(STATUS_BOARD.filter(e => e.id === g.gameId), g.gameId).toHaveLength(1);
    }
  });

  it('keeps no overlay entry for a game that is not a sourced registry game', () => {
    const ids = new Set(sourced.map(g => g.gameId));
    expect(Object.keys(DEMO_OVERLAY).filter(id => !ids.has(id))).toEqual([]);
  });

  it('never shows a retired config as anything but a retired row', () => {
    for (const g of sourced.filter(x => x.status === 'retired')) {
      expect(STATUS_BOARD.find(e => e.id === g.gameId)?.status, g.gameId).toBe('retired');
    }
  });
});
```

**Step 6: Python.** Delete `tests/fixtures/demo_lists_snapshot.json` and `tests/test_demos_registry_parity.py` (both are replaced; nothing else reads the snapshot: measured with a repo-wide search, only that test and old directive prose mention it). Add `tests/test_demos_registry_invariants.py`, exactly (verified: 3 tests pass; it exports the registry through Node like the old test did):

```python
# new: Phase 1 D1.2 -- invariants that replace the hand-kept demo_lists_snapshot.json.
"""The demo lists are derived from the registry; these checks keep the registry, examples/ and docs/demos/ consistent."""
import shutil

import pytest

from studio_mcp.demos import registry as reg
from studio_mcp.paths import REPO_ROOT

pytestmark = pytest.mark.skipif(shutil.which("npx") is None, reason="needs Node to export the registry")

GAMES_DIR = REPO_ROOT / "ts" / "src" / "games"
# docs/demos/<id>/SCOPE.md folders for planned demos that have no ts/src/games/<id>/config.ts yet.
# Update this set when one gains a config (the test below then tells you to remove it).
DOCS_ONLY = {"anycreature", "turboshells", "voidrift_station_sim", "voidrift_web_renderer"}


@pytest.fixture(scope="module")
def games():
    return reg.load_registry(refresh=True)


def test_every_example_source_has_a_tracked_folder(games):
    for game in reg.demo_entries(games):
        source = game["source"]
        if source["kind"] == "example":
            package = REPO_ROOT / "examples" / source["slug"] / "package.json"
            assert package.is_file(), f"{game['gameId']}: source slug {source['slug']!r} has no {package.relative_to(REPO_ROOT)}"


def test_demo_slugs_and_static_names_are_one_to_one(games):
    names = reg.demo_static_names(games)
    assert len(set(names.values())) == len(names), names
    assert list(names) == reg.example_demos(games)


def test_every_scope_file_belongs_to_a_game_folder_or_the_planned_list():
    folders = {p.parent.name for p in GAMES_DIR.glob("*/config.ts")}
    scoped = {p.parent.name for p in (REPO_ROOT / "docs" / "demos").glob("*/SCOPE.md")}
    assert scoped - folders == DOCS_ONLY
```

## 4. What NOT to do

- Do not change `MoreGamesByMe`, any `App.tsx`, the export name `STANDALONE_BUILD_GAMES`, or which 14 games are in it (no adding `dissonance` or dropping `wire_rust`: membership is a product decision, not this run's).
- Do not edit the text of any moved overlay row, and do not add a `lastUpdated` to a generated row by hand: generated rows carry `GENERATED_ROW_DATE`.
- Do not regenerate `docs/state/StatusBoard.md` or `docs/children.json` (the controller does, see below), and do not run `uv run python -m studio.demos index` or `python -c` (the sandbox refuses them).
- Do not touch `ts/src/games/*/App.tsx`, `studio_mcp/`, `studio/`, `ts/vite.*.config.ts`, protected repos or `archive/`. Do not deploy or rebuild anything.
- Do not run the whole vitest suite: six arcade test files import the generated `ts/src/games/game-metadata.json`, absent in this worktree. The controller runs it.

## 5. Verification

```
uv run python --version
```
Expected: `Python 3.12.x`. Verified on this machine: `Python 3.12.12`.

Baselines on the D1.1 state (verified 2026-10-04):
```
cd ts && npx vitest run test_status_board.ts test_site_status_pages.ts test_generate_site_status_pages.ts test_registry_export.ts
```
Real tail: `Test Files  4 passed (4)` / `Tests  38 passed (38)`.
```
uv run pytest -q -p no:cacheprovider tests/test_demos_registry_parity.py tests/test_demos_registry.py
```
Real tail: `8 passed`.

After editing (verified 2026-10-04 by applying exactly these steps on top of D1.1 in a scratch worktree):
```
cd ts && npx vitest run test_demo_board_rows.ts test_status_board.ts test_site_status_pages.ts test_generate_site_status_pages.ts test_registry_export.ts test_collect_configs.ts
```
Expected: `Test Files  6 passed (6)` / `Tests  51 passed (51)`.
```
cd ts && npx vitest run test_dual_target_deploy.ts -t test_registry_current
```
Expected: `Test Files  1 passed (1)` / `Tests  6 passed | 20 skipped (26)`.
```
cd ts && npx tsc --noEmit
```
Expected: no output, exit 0.
```
uv run pytest -q -p no:cacheprovider tests/test_demos_registry_invariants.py tests/test_demos_registry.py
```
Expected tail: `7 passed`.
```
cd ts && npx vite-node tools/export-registry.ts
```
Expected last line: `Wrote ...registry-export.json (36 games)`.

Source checks (Grep tool, one call each): `ts/src/games/registry.ts` contains `.filter(g => g.moreGames)` once and no `{ id: 'shoal', label: 'Shoal' }`; `ts/tests/test_registry_export.ts` no longer contains `SOURCES`; `tests/fixtures/demo_lists_snapshot.json` does not exist.

## 6. Rules for this run

- This run is NON-INTERACTIVE. A tool call that needs a confirmation is rejected and the run ends mid-task.
- ONE simple command per tool call. No `;`, `&&`, `||`, `|` chains and no redirects, with the single exception of the sanctioned verification line forms in section 5 (`cd ts && npx vitest run <bare-filenames>`, `cd ts && npx tsc --noEmit`,
  `cd ts && npx vite-node tools/export-registry.ts`, and the `uv run pytest -q -p no:cacheprovider ...` lines). Do not use `ls`, `Get-ChildItem` or `cat`: use Read, Glob and Grep. Use bare test filenames as filters. No live process probing.
- Do not install, download or fetch anything. Do not read outside this worktree. Do not search or hunt for facts: every path and quoted line you need is above. If a path is missing or a quoted line differs from the file, STOP and write why in the Status row.
  If `ts/src/games/registry.ts` still has `import ... from './<id>/config'` lines, D1.1 has not merged: STOP.
- Never commit to main, never push, never deploy. Work stays on your `directive/<slug>` branch; commit there. Only Robert merges.
- Do not create scratch or debug files in the repo (deleting is denied in this sandbox, except the two files this directive tells you to delete); use `.devin-scratch/` if you need one and leave it.
- No absolute paths inside this repo's checkout in any file you write; use repo-relative paths.
- Do not run `agentflow lint` or any agentflow command. Do NOT run `uv run python -m studio.demos index` or `python -c`. Derived files are regenerated by the controller.
- New logic goes in the small new modules named above (SOLID/SRP/KISS); no file over 600 lines.
- Status row meanings: when every Completion criteria box is checked and the verification tails are in the log line, set the row to **Review** (this is "Done" for the run). Never set it to Done: only Robert or Claude marks Done
  after merge. If you stop partway, set it to Blocked and write why.

## 7. Completion criteria

- [ ] `moreGames` exists on `GameConfig`; exactly the 14 configs in Step 2 set it; `STANDALONE_BUILD_GAMES` is derived and still has 14 entries.
- [ ] `test_registry_export.ts` has no hand copy of the sources; `test_dual_target_deploy.ts` no longer reads `registry.ts` text for `STANDALONE_BUILD_GAMES`.
- [ ] `demoRows.ts`, `demoOverlay.ts` and the edited `board.data.ts` exist as specified; `STATUS_BOARD` has 31 rows (25 before).
- [ ] The snapshot fixture and parity test are deleted; the invariants test exists.
- [ ] The vitest, tsc, pytest and exporter lines in section 5 give the stated tails (real tails pasted).
- [ ] No file outside Scope changed.
- [ ] The Status row is set to Review with a one-line log entry.

## Sandbox needs

none

## 8. Report

Findings first: files changed (about 22: 14 configs, `types.ts`, `registry.ts`, 2 edited tests, `board.data.ts`) and created (`demoRows.ts`, `demoOverlay.ts`, 2 new tests), deleted (2). Evidence second: the real tails of the section 5 commands. Then say plainly: the footer order and two
labels changed as described in section 1, and the board gained six generated rows. Recommended action: review; the controller then regenerates `docs/state/StatusBoard.md` (`cd ts && npx vite-node tools/generate-status-board.ts`) and
`docs/children.json` (`uv run python -m studio.demos index`, expect no diff), runs the full suites and merges.

## Forbidden Actions

- Committing to or pushing main; pushing at all; deploying; installing or fetching anything; reading outside the worktree; touching protected repos; editing `archive/`, `docs/children.json`, `docs/state/StatusBoard.md`, any `App.tsx`, or anything under `studio_mcp/`;
  running `uv run python -m studio.demos index`.

## Required from User

none.

<!-- queue:start -->
## Queue

| Field | Value |
|---|---|
| Status | Approved |
| Assigned to | devin |
| Branch | - |
| Base branch | - |

**Status log**
- 2026-10-04 11:21 · agentflow-tick · none → Queued — suggested by heartbeat: Fully specified build work; dispatch only after D1.1 merges (directive STOPs if registry.ts still has per-config imports)
- 2026-10-04 12:20 · robert-claude-laptop · Queued → Approved — lint override: stale MCP lint; Robert 2026-10-04 12:20 'I approve all recommendations'; D1.1 merged 87961f0b
<!-- queue:end -->
