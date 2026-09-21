# Demo Importer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** One command (`uv run python -m studio_mcp.demos import <zip>`) takes an AI Studio export to a verified local preview on the site's arcade, keeps local edits on re-import via a vendor branch, derives every demo list from the registry, and reports demo status.

**Architecture:** A new package `studio_mcp/demos/` with small single-purpose modules (naming, registry derivation, registration, vendor-branch git ops, build, verify, site staging, status, pipeline, CLI). `GameConfig.source` becomes the single source of truth; a configs-only registry export (`ts/src/games/registry-export.json`) lets Python derive the old hand-kept lists. The site gains `check_arcade.py --only`.

**Tech Stack:** Python 3.12 + pytest (studio `uv`), TypeScript + vitest + vite-node (studio `ts/`), git (branches + worktrees), Playwright (headless smoke), the site's existing Python scripts.

**Spec:** `docs/superpowers/specs/2026-09-19-demo-importer-design.md` (studio repo). Read it before starting a task.

## Global Constraints

- One run stops at a local preview: **never commit to `main`, push, or deploy.** Studio commits happen only on `ai-studio/<slug>` and `import/<slug>-<version>`; site changes stay uncommitted on site branch `import/<slug>-<version>`.
- Slug: strip a trailing ` (N)` and `.zip` (and an intake `_vX.Y.ZRn` suffix), lowercase, runs of non `[a-z0-9]` → `-`. `gameId` = slug with `-` → `_`.
- Vendor branch commits contain only the untouched export (minus `node_modules`) plus the `/arcade/<gameId>/` base normalization; message `ai-studio: <slug> v<version> (sha256 <hash>)`.
- A missing vendor branch for an existing game is refused (hint: `demos adopt`), unless `--overwrite`.
- Verification is deterministic only: `zip_verify` via `ZipVerifier(...).analyze()` **only** — never `verify()` or `write_report()` (they call OpenRouter).
- The importer writes only under `examples/<slug>/`, `intake/<slug>/`, `ts/src/games/<gameId>/`, between the registry markers, one `.gitignore` line, and the site's `static/arcade/<gameId>/` plus generated site data.
- `node_modules` is never copied or committed. `deploy_config*.json` is never printed.
- A tool call blocked by a permission or safety check stops the work and is reported; it is never retried another way.
- Windows: `core.autocrlf=true`; regexes over source files allow `\r\n`. Run Python with `PYTHONUTF8=1`. The owner's machine sets `PYTEST_DISABLE_PLUGIN_AUTOLOAD=1` (pass `-p pytest_rerunfailures` locally).
- Commit messages end with `Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>`.

## Repos, branches, commands

| | Studio (`C:\GitHub\RFDGameStudio`) | Site (`C:\GitHub\RFD_IT_Services_Site`) |
|---|---|---|
| Work branch | `feature/demo-importer` from `main` | `feature/check-arcade-only` from `main` (Task 8 only) |
| Python tests | `uv run pytest -q -p pytest_rerunfailures <file>` | `uv run --extra dev pytest -q <file>` |
| TS tests | `cd ts && npx vitest run <file>` | — |
| TS tools | `cd ts && npx vite-node tools/<file>.ts` | — |

## File map

**Studio**

| File | Responsibility |
|---|---|
| `ts/src/engine/types.ts` (modify) | `DemoSource` type; `GameConfig.source?` |
| 11 `ts/src/games/*/config.ts` (modify) | `source` on every example/sibling demo |
| `ts/src/games/registry.ts` (modify) | `// demos:imports:begin/end` and `// demos:begin/end` markers |
| `ts/src/arcade-manifest/registryExport.ts` (create) | Pure `buildRegistryExport()` |
| `ts/tools/export-registry.ts` (create) | CLI → `ts/src/games/registry-export.json` |
| `ts/tools/export-arcade-manifest.ts` (modify) | Works without `game-metadata.json` |
| `ts/tests/test_registry_export.ts` (create), `ts/tests/test_arcade_registry_directive.ts` (modify) | Export shape; invariants replace the pinned order/count |
| `studio_mcp/demos/__init__.py` | Package marker |
| `studio_mcp/demos/result.py` | `StageResult` |
| `studio_mcp/demos/registry.py` | Load/refresh the registry export; derive demo lists and `GAME_PATHS` |
| `studio_mcp/demos/naming.py` | `slug_from_zip`, `game_id` |
| `studio_mcp/demos/register.py` | `config.ts` rendering, registry marker edit, `.gitignore` line, `metadata.json` read |
| `studio_mcp/demos/vendor.py` | Vendor/import branches, worktree export commit, adopt, merge + lock regeneration |
| `studio_mcp/demos/build.py` | Base normalization (shared with promote), `npm install`, `vite build`, typecheck |
| `studio_mcp/demos/verify.py` | Headless smoke, `zip_verify` analyze, unused-dependency scan |
| `studio_mcp/demos/stage.py` | Site staging |
| `studio_mcp/demos/status.py` | Status rows |
| `studio_mcp/demos/pipeline.py` | `import_demo()` orchestration + report |
| `studio_mcp/demos/__main__.py` | CLI `import` / `adopt` / `status` |
| `studio_mcp/tools.py`, `studio_mcp/game_metadata.py` (modify) | Hand lists replaced by derived functions; MCP tool functions |
| `studio_mcp/server.py` (modify) | Register `studio_import_demo`, `studio_demos_status` |
| `tests/fixtures/demo_lists_snapshot.json`, `tests/fixtures/registry_export_sample.json` (create) | Parity snapshot; unit fixture |
| `tests/test_demos_*.py` (create) | Unit + integration tests |
| `docs/playbooks/import-demo.md` (create) | How to use it |
| `.gitignore` (modify) | Ignore `ts/src/games/registry-export.json` |

**Site:** `scripts/site/check_arcade.py` (`--only`), `tests/test_check_arcade.py`.

---

> **STATUS 2026-09-20: Tasks 1, 2 and 3 are DONE** on branch `feature/demo-importer`
> (commits `7c4a7196`, `a6fdf35b`). Verified: 26 targeted tests pass; the full TS suite
> is 1674 passed / 1 failed, and that one failure
> (`test_game_loader_back_button_returns_clean_url`) also fails on `main`, so it is
> pre-existing. Task 3 adds studio_mcp/demos (8 tests, parity holds). Resume at Task 4.

## Task 1: `GameConfig.source`, the registry export, optional metadata

**Files:**
- Modify: `ts/src/engine/types.ts`, the 11 configs below, `ts/tools/export-arcade-manifest.ts`, `.gitignore`
- Create: `ts/src/arcade-manifest/registryExport.ts`, `ts/tools/export-registry.ts`, `ts/tests/test_registry_export.ts`

**Interfaces:**
- Produces: `type DemoSource = { kind: 'example'; slug: string } | { kind: 'sibling'; repo: string }`; `GameConfig.source?: DemoSource`; `buildRegistryExport(registry: GameConfig[], now?: () => string): RegistryExport` where `RegistryExport = { generatedAt: string; games: RegistryExportEntry[] }` and `RegistryExportEntry = { gameId: string; label: string; status?: string; embedUrl?: string; hasComponent: boolean; source?: DemoSource; supersededBy?: string }`; the file `ts/src/games/registry-export.json` (gitignored). Tasks 3–10 read it.

The 11 sources (from today's `_EXAMPLE_DEMOS` and `_DEMO_EXTERNAL_PATHS` in `studio_mcp/tools.py`):

| Config | `source` |
|---|---|
| `ledger` | `{ kind: 'example', slug: 'ledger' }` |
| `trinity_siege` | `{ kind: 'example', slug: 'trinity-siege' }` |
| `slimebreeder` | `{ kind: 'sibling', repo: 'SlimeBreeder' }` |
| `corpworld` | `{ kind: 'example', slug: 'corpworld' }` |
| `slimegarden` | `{ kind: 'example', slug: 'slimegarden' }` |
| `slimeworld` | `{ kind: 'example', slug: 'slimeworld' }` |
| `7_days_to_fry` | `{ kind: 'example', slug: '7-days-to-fry' }` |
| `kingmaker_squads` | `{ kind: 'example', slug: 'kingmaker-squads' }` |
| `antsim_redux` | `{ kind: 'example', slug: 'antsim-redux' }` |
| `facility_escape` | `{ kind: 'example', slug: 'facility-escape' }` |
| `systemic_extract` | `{ kind: 'example', slug: 'systemic-extract' }` |

- [x] **Step 1: Write the failing test** `ts/tests/test_registry_export.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { GAME_REGISTRY } from '../src/games/registry';
import { buildRegistryExport } from '../src/arcade-manifest/registryExport';

const SOURCES: Record<string, unknown> = {
  ledger: { kind: 'example', slug: 'ledger' },
  trinity_siege: { kind: 'example', slug: 'trinity-siege' },
  slimebreeder: { kind: 'sibling', repo: 'SlimeBreeder' },
  corpworld: { kind: 'example', slug: 'corpworld' },
  slimegarden: { kind: 'example', slug: 'slimegarden' },
  slimeworld: { kind: 'example', slug: 'slimeworld' },
  '7_days_to_fry': { kind: 'example', slug: '7-days-to-fry' },
  kingmaker_squads: { kind: 'example', slug: 'kingmaker-squads' },
  antsim_redux: { kind: 'example', slug: 'antsim-redux' },
  facility_escape: { kind: 'example', slug: 'facility-escape' },
  systemic_extract: { kind: 'example', slug: 'systemic-extract' },
};

describe('registry export', () => {
  const exp = buildRegistryExport(GAME_REGISTRY, () => 'T');

  it('lists every registry game in order', () => {
    expect(exp.games.map(g => g.gameId)).toEqual(GAME_REGISTRY.map(g => g.gameId));
    expect(exp.generatedAt).toBe('T');
  });

  it('carries source for exactly the example/sibling demos', () => {
    const withSource = Object.fromEntries(exp.games.filter(g => g.source).map(g => [g.gameId, g.source]));
    expect(withSource).toEqual(SOURCES);
  });

  it('flags component games and keeps embedUrl', () => {
    const byId = Object.fromEntries(exp.games.map(g => [g.gameId, g]));
    expect(byId.shoal.hasComponent).toBe(true);
    expect(byId.systemic_extract.hasComponent).toBe(false);
    expect(byId.systemic_extract.embedUrl).toBe('/arcade/systemic_extract/');
  });
});
```

- [x] **Step 2: Run and confirm failure**

Run: `cd ts && npx vitest run tests/test_registry_export.ts`
Expected: FAIL (module not found).

- [x] **Step 3: Add the type.** In `ts/src/engine/types.ts`, after the `LeaderboardDef` interface, add:

```ts
/** Where a standalone demo's build comes from. Absent = a game built inside the studio app. */
export type DemoSource =
  | { kind: 'example'; slug: string }   // examples/<slug>/ (AI Studio exports)
  | { kind: 'sibling'; repo: string };  // a sibling repository, e.g. SlimeBreeder
```

and in `GameConfig`, after `saves?: boolean;`:

```ts
  source?: DemoSource;                    // single source of truth for demo lists (studio_mcp.demos)
```

- [x] **Step 4: Add `source` to the 11 configs** from the table. In each file insert the `source` line directly under the `gameId: …,` line, e.g. in `ts/src/games/systemic_extract/config.ts`:

```ts
  gameId: 'systemic_extract',
  source: { kind: 'example', slug: 'systemic-extract' },
```

- [x] **Step 5: Implement** `ts/src/arcade-manifest/registryExport.ts`:

```ts
/**
 * Configs-only view of GAME_REGISTRY for Python tooling (studio_mcp.demos).
 * Written by tools/export-registry.ts to ts/src/games/registry-export.json (gitignored).
 */
import type { DemoSource, GameConfig } from '../engine/types';

export interface RegistryExportEntry {
  gameId: string;
  label: string;
  status?: string;
  embedUrl?: string;
  hasComponent: boolean;
  source?: DemoSource;
  supersededBy?: string;
}

export interface RegistryExport {
  generatedAt: string;
  games: RegistryExportEntry[];
}

export function buildRegistryExport(registry: GameConfig[], now: () => string = () => new Date().toISOString()): RegistryExport {
  return {
    generatedAt: now(),
    games: registry.map(g => ({
      gameId: g.gameId,
      label: g.label,
      status: g.status,
      embedUrl: g.embedUrl,
      hasComponent: Boolean(g.component),
      source: g.source,
      supersededBy: g.supersededBy,
    })),
  };
}
```

`ts/tools/export-registry.ts`:

```ts
/**
 * Write ts/src/games/registry-export.json (configs only; no metadata needed).
 * Usage (from ts/): npx vite-node tools/export-registry.ts
 */
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { GAME_REGISTRY } from '../src/games/registry';
import { buildRegistryExport } from '../src/arcade-manifest/registryExport';

const out = resolve(__dirname, '..', 'src', 'games', 'registry-export.json');
writeFileSync(out, `${JSON.stringify(buildRegistryExport(GAME_REGISTRY), null, 2)}\n`, 'utf-8');
console.log(`Wrote ${out} (${GAME_REGISTRY.length} games)`);
```

- [x] **Step 6: Make the manifest CLI work without metadata.** In `ts/tools/export-arcade-manifest.ts`, replace the block that exits when `game-metadata.json` is missing:

```ts
if (!existsSync(metadataPath)) {
  console.error(`Missing ${metadataPath}. Generate it first:\n  uv run python -c "from studio_mcp.game_metadata import write_game_metadata; write_game_metadata()"`);
  process.exit(1);
}
```

with:

```ts
const haveMetadata = existsSync(metadataPath);
if (!haveMetadata) console.warn(`No ${metadataPath}; versions and dates will be null.`);
```

and change `metadata: JSON.parse(readFileSync(metadataPath, 'utf-8')),` to `metadata: haveMetadata ? JSON.parse(readFileSync(metadataPath, 'utf-8')) : {},`.

- [x] **Step 7: Ignore the export.** In `.gitignore`, under `ts/src/games/arcade-manifest.json`, add `ts/src/games/registry-export.json`.

- [x] **Step 8: Run tests and the tool**

```bash
cd ts && npx vitest run tests/test_registry_export.ts tests/test_arcade_manifest.ts tests/test_arcade_lineage.tsx
npx vite-node tools/export-registry.ts
git -C .. status --short ts/src/games/registry-export.json
```

Expected: tests PASS; `Wrote …registry-export.json (34 games)`; `git status` prints nothing (ignored).

- [x] **Step 9: Commit**

```bash
git add ts/src/engine/types.ts ts/src/games/*/config.ts ts/src/arcade-manifest/registryExport.ts ts/tools/export-registry.ts ts/tools/export-arcade-manifest.ts ts/tests/test_registry_export.ts .gitignore
git commit -m "registry: GameConfig.source and a configs-only registry export for Python tooling

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

## Task 2: Registry markers and invariant tests

**Files:**
- Modify: `ts/src/games/registry.ts`, `ts/tests/test_arcade_registry_directive.ts`

**Interfaces:**
- Produces: marker lines Task 5 edits: `// demos:imports:begin` / `// demos:imports:end` (after the last import) and `  // demos:begin` / `  // demos:end` inside `GAME_REGISTRY` around the contiguous demo block (`ledgerConfig` … `systemicExtractConfig`).

- [x] **Step 1: Replace the pinned tests.** In `ts/tests/test_arcade_registry_directive.ts`, delete the `EXPECTED_ORDER` constant, the test `test_registry_order_matches_spec`, and the test `test_registry_total_count_includes_legacy_origin_projects`. Add `readdirSync, readFileSync` to the `node:fs` import, and append:

```ts
// Game folders with a config.ts that are intentionally NOT in GAME_REGISTRY.
const UNREGISTERED: Record<string, string> = {
  brewfield: 'superseded by Dissonance Depths (owner decision, docs/state/current.md)',
  early_learning_buddy: 'present but never registered; owner to decide',
};

describe('Registry invariants (replace the pinned order/count, Sep 19 2026)', () => {
  const gamesDir = resolve(__dirname, '../src/games');
  const registryText = readFileSync(resolve(gamesDir, 'registry.ts'), 'utf-8');

  it('game ids are unique', () => {
    const ids = GAME_REGISTRY.map(g => g.gameId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every game folder with a config.ts is registered, except known exceptions', () => {
    const registered = new Set(GAME_REGISTRY.map(g => g.gameId));
    const folders = readdirSync(gamesDir, { withFileTypes: true })
      .filter(d => d.isDirectory() && existsSync(resolve(gamesDir, d.name, 'config.ts')))
      .map(d => d.name);
    const missing = folders.filter(f => !registered.has(f) && !(f in UNREGISTERED));
    expect(missing).toEqual([]);
  });

  it('has exactly one pair of each demos marker', () => {
    for (const marker of ['// demos:imports:begin', '// demos:imports:end', '// demos:begin', '// demos:end']) {
      expect(registryText.split(marker).length - 1, marker).toBe(1);
    }
  });

  it('every entry between the demos markers is an example demo', () => {
    // Skip the rest of the begin-marker line (it carries a comment), stop at the end marker.
    const block = registryText.split('// demos:begin')[1].split('\n').slice(1).join('\n').split('// demos:end')[0];
    const names = block.split(/[\s,]+/).filter(Boolean);
    const importMap: Record<string, string> = Object.fromEntries(
      [...registryText.matchAll(/import\s+(?:\{\s*(\w+)\s*\}|(\w+))\s+from\s+'\.\/(\w+)\/config'/g)]
        .map(m => [m[1] ?? m[2], m[3]]));
    expect(names.length).toBeGreaterThan(0);
    for (const name of names) {
      const game = GAME_REGISTRY.find(g => g.gameId === importMap[name]);
      expect(game?.source?.kind, name).toBe('example');
    }
  });
});
```

- [x] **Step 2: Run and confirm failure**

Run: `cd ts && npx vitest run tests/test_arcade_registry_directive.ts`
Expected: FAIL on the marker tests (markers not present yet); the other invariants PASS.

- [x] **Step 3: Add the markers** in `ts/src/games/registry.ts`. After the last `import … from './kingmaker_squads/config';` line add:

```ts
// demos:imports:begin — imports added by `studio_mcp.demos import` (keep this pair)
// demos:imports:end
```

In `GAME_REGISTRY`, put `  // demos:begin — AI Studio example demos; the importer appends above demos:end` on the line before `  ledgerConfig,` and `  // demos:end` on the line after `  systemicExtractConfig,`.

- [x] **Step 4: Run the registry tests**

Run: `cd ts && npx vitest run tests/test_arcade_registry_directive.ts tests/test_arcade_routing.ts tests/test_registry_export.ts`
Expected: PASS.

- [x] **Step 5: Commit**

```bash
git add ts/src/games/registry.ts ts/tests/test_arcade_registry_directive.ts
git commit -m "registry: demos markers; invariants replace the pinned order and count

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

## Task 3: Derive the demo lists from the registry (with a parity snapshot)

**Files:**
- Create: `studio_mcp/demos/__init__.py`, `studio_mcp/demos/result.py`, `studio_mcp/demos/registry.py`
- Create: `tests/fixtures/demo_lists_snapshot.json` (captured from today's code), `tests/fixtures/registry_export_sample.json`
- Test: `tests/test_demos_registry.py`, `tests/test_demos_registry_parity.py`

**Interfaces:**
- Consumes: `ts/src/games/registry-export.json` (Task 1).
- Produces (module `studio_mcp.demos.registry`): `REGISTRY_EXPORT: Path`; `export_registry(run=subprocess.run) -> Path`; `load_registry(path=REGISTRY_EXPORT, refresh=True, run=subprocess.run) -> list[dict]`; `demo_entries(games) -> list[dict]`; `demo_key(game) -> str`; `example_demos(games) -> list[str]`; `demo_static_names(games) -> dict[str, str]`; `external_demo_paths(games) -> dict[str, Path]`; `external_repos(games) -> dict[str, Path]`; `game_paths(games, repo_root: Path) -> dict[str, list[str]]`; `find_by_slug(games, slug) -> dict | None`.
- Produces (module `studio_mcp.demos.result`): `@dataclass StageResult(stage: str, ok: bool, detail: str = "", next_step: str = "", data: dict = field(default_factory=dict))` with `as_dict()`.

Derivation rules (spec §4):
- A **demo** is a game whose `source.kind` is `example` or `sibling`. Its **key** (the old `_EXAMPLE_DEMOS` entry) is `source.slug` for `example`, and `gameId` for `sibling`.
- Static folder name = `gameId`. Sibling path = `sibling_repo(source.repo)`.
- `game_paths`: for every registry game, in order: `games/<id>` if that directory exists; `ts/src/games/<id>`; `examples/<slug>` for `example` sources; `intake/<id with - for _>` if that directory exists.

- [x] **Step 1: Capture the snapshot BEFORE anything changes.** From the repo root:

```bash
uv run python -c "
import json
from studio_mcp import tools, game_metadata as gm
snap = {
    'example_demos': tools._EXAMPLE_DEMOS,
    'demo_static_name': tools._DEMO_STATIC_NAME,
    'demo_external_paths': {k: v.name for k, v in tools._DEMO_EXTERNAL_PATHS.items()},
    'game_paths': gm.GAME_PATHS,
    'external_repos': {k: v.name for k, v in gm._EXTERNAL_REPOS.items()},
}
open('tests/fixtures/demo_lists_snapshot.json', 'w', encoding='utf-8').write(json.dumps(snap, indent=2) + '\n')
print(len(snap['example_demos']), 'demos,', len(snap['game_paths']), 'game path entries')"
```

Expected: `11 demos, 35 game path entries` (the dict includes the unregistered `brewfield`).

- [x] **Step 2: Write the unit-test fixture** `tests/fixtures/registry_export_sample.json`:

```json
{
  "generatedAt": "T",
  "games": [
    {"gameId": "shoal", "label": "Shoal", "status": "stable", "hasComponent": true},
    {"gameId": "ledger", "label": "Ledger", "status": "external", "embedUrl": "/arcade/ledger/", "hasComponent": false,
     "source": {"kind": "example", "slug": "ledger"}},
    {"gameId": "slimebreeder", "label": "SlimeBreeder", "status": "external", "embedUrl": "/arcade/slimebreeder/", "hasComponent": false,
     "source": {"kind": "sibling", "repo": "SlimeBreeder"}},
    {"gameId": "systemic_extract", "label": "Systemic Extract", "status": "external", "embedUrl": "/arcade/systemic_extract/", "hasComponent": false,
     "source": {"kind": "example", "slug": "systemic-extract"}}
  ]
}
```

- [x] **Step 3: Write the failing unit tests** `tests/test_demos_registry.py`:

```python
import json
from pathlib import Path

from studio_mcp.demos import registry as reg
from studio_mcp.paths import REPOS_ROOT

FIXTURE = Path(__file__).parent / "fixtures" / "registry_export_sample.json"
GAMES = json.loads(FIXTURE.read_text(encoding="utf-8"))["games"]


def test_demo_lists_come_from_source():
    assert reg.example_demos(GAMES) == ["ledger", "slimebreeder", "systemic-extract"]
    assert reg.demo_static_names(GAMES) == {
        "ledger": "ledger", "slimebreeder": "slimebreeder", "systemic-extract": "systemic_extract"}
    assert reg.external_demo_paths(GAMES) == {"slimebreeder": REPOS_ROOT / "SlimeBreeder"}
    assert reg.external_repos(GAMES) == {"slimebreeder": REPOS_ROOT / "SlimeBreeder"}


def test_game_paths_follow_the_rule(tmp_path):
    (tmp_path / "games" / "shoal").mkdir(parents=True)
    (tmp_path / "intake" / "systemic-extract").mkdir(parents=True)
    paths = reg.game_paths(GAMES, tmp_path)
    assert paths["shoal"] == ["games/shoal", "ts/src/games/shoal"]
    assert paths["ledger"] == ["ts/src/games/ledger", "examples/ledger"]
    assert paths["slimebreeder"] == ["ts/src/games/slimebreeder"]
    assert paths["systemic_extract"] == [
        "ts/src/games/systemic_extract", "examples/systemic-extract", "intake/systemic-extract"]
    assert list(paths) == [g["gameId"] for g in GAMES]


def test_find_by_slug():
    assert reg.find_by_slug(GAMES, "systemic-extract")["gameId"] == "systemic_extract"
    assert reg.find_by_slug(GAMES, "nope") is None


def test_load_registry_refreshes_only_when_stale(tmp_path, monkeypatch):
    out = tmp_path / "registry-export.json"
    out.write_text(FIXTURE.read_text(encoding="utf-8"), encoding="utf-8")
    calls = []
    monkeypatch.setattr(reg, "export_registry", lambda run=None: calls.append(1))
    monkeypatch.setattr(reg, "_newest_source_mtime", lambda: out.stat().st_mtime - 10)
    assert len(reg.load_registry(out)) == 4
    assert calls == []
    monkeypatch.setattr(reg, "_newest_source_mtime", lambda: out.stat().st_mtime + 10)
    reg.load_registry(out)
    assert calls == [1]
```

- [x] **Step 4: Write the failing parity test** `tests/test_demos_registry_parity.py`:

```python
"""Parity: the derived lists reproduce the hand-kept lists they replace (spec §4 migration)."""
import json
import shutil
from pathlib import Path

import pytest

from studio_mcp.demos import registry as reg
from studio_mcp.paths import REPO_ROOT

SNAP = json.loads((Path(__file__).parent / "fixtures" / "demo_lists_snapshot.json").read_text(encoding="utf-8"))
# Snapshot entries intentionally not reproduced, with the reason.
DROPPED = {"brewfield": "not in GAME_REGISTRY (superseded by Dissonance Depths)"}

pytestmark = pytest.mark.skipif(shutil.which("npx") is None, reason="needs Node to export the registry")


@pytest.fixture(scope="module")
def games():
    return reg.load_registry(refresh=True)


def test_deploy_list_matches(games):
    # Order within the demo deploy loop does not matter (each copies to its own folder).
    assert sorted(reg.example_demos(games)) == sorted(SNAP["example_demos"])


def test_static_names_match_for_every_deployed_demo(games):
    expected = {k: v for k, v in SNAP["demo_static_name"].items() if k in SNAP["example_demos"]}
    assert reg.demo_static_names(games) == expected


def test_external_paths_match(games):
    assert {k: v.name for k, v in reg.external_demo_paths(games).items()} == SNAP["demo_external_paths"]
    assert {k: v.name for k, v in reg.external_repos(games).items()} == SNAP["external_repos"]


def test_game_paths_cover_every_old_path(games):
    derived = reg.game_paths(games, REPO_ROOT)
    for game_id, old in SNAP["game_paths"].items():
        if game_id in DROPPED:
            assert game_id not in derived
            continue
        missing = set(old) - set(derived[game_id])
        assert not missing, f"{game_id}: derived paths lack {missing}"
```

- [x] **Step 5: Run and confirm failure**

Run: `uv run pytest -q -p pytest_rerunfailures tests/test_demos_registry.py tests/test_demos_registry_parity.py`
Expected: FAIL (`studio_mcp.demos` does not exist).

- [x] **Step 6: Implement.** `studio_mcp/demos/__init__.py`:

```python
"""studio_mcp.demos — import AI Studio demos and derive demo lists from the registry."""
```

`studio_mcp/demos/result.py`:

```python
"""result.py — the result every importer stage returns."""
from __future__ import annotations

from dataclasses import asdict, dataclass, field


@dataclass
class StageResult:
    stage: str
    ok: bool
    detail: str = ""
    next_step: str = ""
    data: dict = field(default_factory=dict)

    def as_dict(self) -> dict:
        return asdict(self)
```

`studio_mcp/demos/registry.py`:

```python
"""registry.py — the registry export as the single source for demo lists (spec §4).

GAME_REGISTRY (TypeScript) is exported configs-only to ts/src/games/registry-export.json
by ts/tools/export-registry.ts; everything that used to be a hand-kept list is derived here.
"""
from __future__ import annotations

import json
import shutil
import subprocess
from pathlib import Path

from studio_mcp.paths import REPO_ROOT, sibling_repo

TS_DIR = REPO_ROOT / "ts"
GAMES_DIR = TS_DIR / "src" / "games"
REGISTRY_EXPORT = GAMES_DIR / "registry-export.json"


def _newest_source_mtime() -> float:
    files = [GAMES_DIR / "registry.ts", *GAMES_DIR.glob("*/config.ts")]
    return max(f.stat().st_mtime for f in files if f.exists())


def export_registry(run=subprocess.run) -> Path:
    npx = shutil.which("npx") or "npx"  # resolves npx.cmd on Windows; no shell needed
    proc = run([npx, "vite-node", "tools/export-registry.ts"], cwd=str(TS_DIR),
               capture_output=True, text=True, encoding="utf-8", errors="replace")
    if proc.returncode != 0 or not REGISTRY_EXPORT.exists():
        raise RuntimeError("registry export failed:\n" + ((proc.stdout or "") + (proc.stderr or ""))[-2000:])
    return REGISTRY_EXPORT


def load_registry(path: Path = REGISTRY_EXPORT, refresh: bool = True, run=subprocess.run) -> list[dict]:
    """Registry games in order; re-exports first when the file is missing or older than any config."""
    if refresh and (not path.exists() or path.stat().st_mtime < _newest_source_mtime()):
        export_registry(run)
    return json.loads(path.read_text(encoding="utf-8"))["games"]


def demo_entries(games: list[dict]) -> list[dict]:
    return [g for g in games if (g.get("source") or {}).get("kind") in ("example", "sibling")]


def demo_key(game: dict) -> str:
    source = game["source"]
    return source["slug"] if source["kind"] == "example" else game["gameId"]


def example_demos(games: list[dict]) -> list[str]:
    return [demo_key(g) for g in demo_entries(games)]


def demo_static_names(games: list[dict]) -> dict[str, str]:
    return {demo_key(g): g["gameId"] for g in demo_entries(games)}


def external_demo_paths(games: list[dict]) -> dict[str, Path]:
    return {demo_key(g): sibling_repo(g["source"]["repo"]) for g in demo_entries(games)
            if g["source"]["kind"] == "sibling"}


def external_repos(games: list[dict]) -> dict[str, Path]:
    return {g["gameId"]: sibling_repo(g["source"]["repo"]) for g in demo_entries(games)
            if g["source"]["kind"] == "sibling"}


def game_paths(games: list[dict], repo_root: Path) -> dict[str, list[str]]:
    result: dict[str, list[str]] = {}
    for g in games:
        gid = g["gameId"]
        paths = []
        if (repo_root / "games" / gid).is_dir():
            paths.append(f"games/{gid}")
        paths.append(f"ts/src/games/{gid}")
        source = g.get("source") or {}
        if source.get("kind") == "example":
            paths.append(f"examples/{source['slug']}")
        intake = gid.replace("_", "-")
        if (repo_root / "intake" / intake).is_dir():
            paths.append(f"intake/{intake}")
        result[gid] = paths
    return result


def find_by_slug(games: list[dict], slug: str) -> dict | None:
    for g in demo_entries(games):
        if demo_key(g) == slug:
            return g
    return None
```

- [x] **Step 7: Run the tests**

Run: `uv run pytest -q -p pytest_rerunfailures tests/test_demos_registry.py tests/test_demos_registry_parity.py`
Expected: PASS. If a parity test fails, do not change the snapshot: report the exact difference (it is a real behavior change the controller must rule on).

- [x] **Step 8: Commit**

```bash
git add studio_mcp/demos tests/fixtures/demo_lists_snapshot.json tests/fixtures/registry_export_sample.json tests/test_demos_registry.py tests/test_demos_registry_parity.py
git commit -m "demos: derive demo lists and GAME_PATHS from the registry export (with parity snapshot)

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

## Task 4: Replace the hand-kept lists with the derived functions

**Files:**
- Modify: `studio_mcp/game_metadata.py`, `studio_mcp/tools.py`
- Modify tests: `tests/test_game_metadata.py`, `tests/test_studio_mcp.py`, `tests/test_cross_pipeline_version_tracking.py`

**Interfaces:**
- Consumes: `studio_mcp.demos.registry` (Task 3).
- Produces: `studio_mcp.game_metadata.game_paths() -> dict[str, list[str]]`, `studio_mcp.game_metadata.external_repos() -> dict[str, Path]`; in `studio_mcp.tools`: `_example_demos() -> list[str]`, `_demo_static_names() -> dict[str, str]`, `_external_demo_paths() -> dict[str, Path]` (tests monkeypatch these by name). The constants `_EXAMPLE_DEMOS`, `_DEMO_STATIC_NAME`, `_DEMO_EXTERNAL_PATHS`, `GAME_PATHS`, `_EXTERNAL_REPOS` no longer exist.

- [ ] **Step 1: Record today's metadata output** (for the behavior diff in Step 6), before editing:

```bash
uv run python -c "
import json
from studio_mcp.game_metadata import generate_game_metadata
keep = ('created', 'last_updated', 'version', 'tracked')
m = generate_game_metadata()
json.dump({g: {k: v.get(k) for k in keep} for g, v in m.items()}, open('.superpowers/metadata-before.json', 'w'), indent=1)"
```

(`.superpowers/` is ignored locally; create it with `mkdir -p .superpowers` if needed.)

- [ ] **Step 2: game_metadata.py.** Delete the `_EXTERNAL_REPOS` dict and the `GAME_PATHS` dict (with their comment blocks). Add under `REPO_ROOT = …`:

```python
from studio_mcp.demos import registry as demo_registry


def game_paths() -> dict[str, list[str]]:
    """Every registered game → the paths whose git history dates it (derived; spec §4)."""
    return demo_registry.game_paths(demo_registry.load_registry(), REPO_ROOT)


def external_repos() -> dict[str, Path]:
    """Games whose history lives in a sibling repo (derived from `source.kind == 'sibling'`)."""
    return demo_registry.external_repos(demo_registry.load_registry())
```

In `generate_game_metadata`, replace `for game_id, paths in GAME_PATHS.items():` with:

```python
    repos = external_repos()
    for game_id, paths in game_paths().items():
```

and `external_repo = _EXTERNAL_REPOS.get(game_id)` with `external_repo = repos.get(game_id)`. Remove the now-unused `sibling_repo` import if nothing else uses it.

- [ ] **Step 3: tools.py.**
  - In the `from studio_mcp.game_metadata import (…)` block, replace `GAME_PATHS,` with `game_paths,` and `_EXTERNAL_REPOS,` with `external_repos,`, and add `from studio_mcp.demos import registry as demo_registry` below that import.
  - Delete `_EXAMPLE_DEMOS`, `_DEMO_STATIC_NAME` and `_DEMO_EXTERNAL_PATHS` (with their comments). Add in their place:

```python
def _example_demos() -> list[str]:
    """Demo folder keys deployed to the arcade (derived from GameConfig.source; spec §4)."""
    return demo_registry.example_demos(demo_registry.load_registry())


def _demo_static_names() -> dict[str, str]:
    return demo_registry.demo_static_names(demo_registry.load_registry())


def _external_demo_paths() -> dict[str, Path]:
    return demo_registry.external_demo_paths(demo_registry.load_registry())
```

  - In `_demo_source_path`, replace the two `_DEMO_EXTERNAL_PATHS` references with a local `external = _external_demo_paths()` and use `external`.
  - In `studio_deploy_arcade`: before the first loop add `demos = _example_demos()`; change the three `for demo_slug in _EXAMPLE_DEMOS:` to `for demo_slug in demos:`; replace `static_name = _DEMO_STATIC_NAME[demo_slug]` with `static_name = _demo_static_names()[demo_slug]`.
  - In the pipeline-stage block, replace `for tracked_game_id in GAME_PATHS:` with `paths_by_game = game_paths()` / `repos = external_repos()` / `for tracked_game_id in paths_by_game:`, and the three uses inside with `repos` / `paths_by_game[tracked_game_id]`.

- [ ] **Step 4: Update the tests to patch the functions.**
  - `tests/test_game_metadata.py`: change the import `GAME_PATHS,` to `game_paths,`, and add `GAME_PATHS = game_paths()` right after the imports (the test body keeps using the name).
  - `tests/test_studio_mcp.py`: `for demo_slug in tools._EXAMPLE_DEMOS:` → `for demo_slug in tools._example_demos():` (2 places); `monkeypatch.setattr(tools, "_DEMO_EXTERNAL_PATHS", {})` → `monkeypatch.setattr(tools, "_external_demo_paths", lambda: {})` (2 places); `tools.GAME_PATHS` → `tools.game_paths()` (3 places).
  - `tests/test_cross_pipeline_version_tracking.py`: `patch("studio_mcp.tools._EXAMPLE_DEMOS", ["ledger"])` → `patch("studio_mcp.tools._example_demos", lambda: ["ledger"])`; `patch("studio_mcp.tools.GAME_PATHS", {})` → `patch("studio_mcp.tools.game_paths", lambda: {})`; `patch("studio_mcp.tools._EXTERNAL_REPOS", {})` → `patch("studio_mcp.tools.external_repos", lambda: {})`; `monkeypatch.setattr(tools, "_EXAMPLE_DEMOS", ["ledger"])` → `monkeypatch.setattr(tools, "_example_demos", lambda: ["ledger"])`; `monkeypatch.setattr(tools, "GAME_PATHS", {...})` → `monkeypatch.setattr(tools, "game_paths", lambda: {"demo_game": ["games/demo_game"]})`; `monkeypatch.setattr(gm, "GAME_PATHS", {...})` → `monkeypatch.setattr(gm, "game_paths", lambda: {"demo_game": ["games/demo_game"]})`; `monkeypatch.setattr(tools, "_EXTERNAL_REPOS", {})` → `monkeypatch.setattr(tools, "external_repos", lambda: {})`. If the test's `generate_game_metadata` path also reads `external_repos`, patch `gm.external_repos` to `lambda: {}` the same way.

- [ ] **Step 5: Run the affected suites**

```bash
uv run pytest -q -p pytest_rerunfailures tests/test_game_metadata.py tests/test_studio_mcp.py tests/test_cross_pipeline_version_tracking.py tests/test_prepare_site_arcade.py tests/test_demos_registry.py tests/test_demos_registry_parity.py
grep -rn "_EXAMPLE_DEMOS\|_DEMO_STATIC_NAME\|_DEMO_EXTERNAL_PATHS\|GAME_PATHS\b\|_EXTERNAL_REPOS" studio_mcp tests --include=*.py
```

Expected: tests PASS; the grep prints only the test-local `GAME_PATHS = game_paths()` alias and its uses in `tests/test_game_metadata.py`.

- [ ] **Step 6: Report the metadata behavior diff** (do not "fix" it; the controller rules on it):

```bash
uv run python -c "
import json
from studio_mcp.game_metadata import generate_game_metadata
keep = ('created', 'last_updated', 'version', 'tracked')
before = json.load(open('.superpowers/metadata-before.json'))
after = {g: {k: v.get(k) for k in keep} for g, v in generate_game_metadata().items()}
for g in sorted(set(before) | set(after)):
    if before.get(g) != after.get(g):
        print(g, before.get(g), '->', after.get(g))"
```

Expected differences only: `brewfield` gone; possibly `slimegarden`, `corpworld`, and games with an `intake/<slug>/` folder gaining dates from their now-included example/intake paths. Paste the output into the report.

- [ ] **Step 7: Commit**

```bash
git add studio_mcp/game_metadata.py studio_mcp/tools.py tests/test_game_metadata.py tests/test_studio_mcp.py tests/test_cross_pipeline_version_tracking.py
git commit -m "tools, game_metadata: use lists derived from the registry; hand-kept lists removed

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

## Task 5: Naming and registration

**Files:**
- Create: `studio_mcp/demos/naming.py`, `studio_mcp/demos/register.py`
- Test: `tests/test_demos_naming_register.py`

**Interfaces:**
- Produces: `naming.slug_from_zip(name: str) -> str`; `naming.game_id(slug: str) -> str`; `register.PALETTE: list[str]`; `register.color_for(slug) -> str`; `register.import_name(game_id) -> str`; `register.render_config_ts(game_id, slug, label, description) -> str`; `register.insert_registry_entry(text, game_id) -> str`; `register.add_gitignore_line(text, slug) -> str`; `register.read_zip_metadata(zip_path) -> dict`; `register.write_registration(repo_root: Path, game_id, slug, zip_path) -> list[str]` (repo-relative paths it changed).

- [ ] **Step 1: Write the failing tests** `tests/test_demos_naming_register.py`:

```python
import json
import zipfile

import pytest

from studio_mcp.demos import naming, register


@pytest.mark.parametrize("name,slug", [
    ("systemic-extract (12).zip", "systemic-extract"),
    (r"C:\Users\x\Downloads\systemic-extract (12).zip", "systemic-extract"),
    ("My Cool Game.zip", "my-cool-game"),
    ("systemic-extract_v0.1.0R2.zip", "systemic-extract"),
    ("Neon__Drift!!.ZIP", "neon-drift"),
])
def test_slug_from_zip(name, slug):
    assert naming.slug_from_zip(name) == slug


def test_slug_from_zip_rejects_empty():
    with pytest.raises(ValueError):
        naming.slug_from_zip("(3).zip")


def test_game_id():
    assert naming.game_id("7-days-to-fry") == "7_days_to_fry"


def test_import_name_is_a_valid_identifier():
    assert register.import_name("systemic_extract") == "systemicExtractConfig"
    assert register.import_name("7_days_to_fry") == "demo7DaysToFryConfig"


def test_color_is_deterministic_and_from_the_palette():
    assert register.color_for("systemic-extract") == register.color_for("systemic-extract")
    assert register.color_for("systemic-extract") in register.PALETTE


def test_render_config_ts():
    ts = register.render_config_ts("neon_drift", "neon-drift", 'Neon "Drift"', "A racer.")
    assert "gameId: \"neon_drift\"," in ts
    assert "label: \"Neon \\\"Drift\\\"\"," in ts
    assert "status: 'external'," in ts
    assert "source: { kind: 'example', slug: \"neon-drift\" }," in ts
    assert "embedUrl: '/arcade/neon_drift/'," in ts
    assert ts.endswith("export default config;\n")


REGISTRY = (
    "import aConfig from './a/config';\r\n"
    "// demos:imports:begin — keep\r\n"
    "// demos:imports:end\r\n"
    "export const GAME_REGISTRY: GameConfig[] = [\r\n"
    "  aConfig,\r\n"
    "  // demos:begin — demos\r\n"
    "  ledgerConfig,\r\n"
    "  // demos:end\r\n"
    "];\r\n"
)


def test_insert_registry_entry_keeps_crlf_and_is_idempotent():
    once = register.insert_registry_entry(REGISTRY, "neon_drift")
    assert "import neonDriftConfig from './neon_drift/config';\r\n// demos:imports:end" in once
    assert "  ledgerConfig,\r\n  neonDriftConfig,\r\n  // demos:end" in once
    assert register.insert_registry_entry(once, "neon_drift") == once


def test_insert_registry_entry_requires_markers():
    with pytest.raises(ValueError):
        register.insert_registry_entry("export const GAME_REGISTRY = [];\n", "x")


def test_add_gitignore_line():
    text = "examples/*\n!examples/ledger/\n!examples/systemic-extract/\n\n# Screenshots\n"
    out = register.add_gitignore_line(text, "neon-drift")
    assert "!examples/systemic-extract/\n!examples/neon-drift/\n" in out
    assert register.add_gitignore_line(out, "neon-drift") == out


def test_read_zip_metadata(tmp_path):
    z = tmp_path / "g.zip"
    with zipfile.ZipFile(z, "w") as f:
        f.writestr("metadata.json", json.dumps({"name": "Neon Drift", "description": "A racer."}))
    assert register.read_zip_metadata(z) == {"name": "Neon Drift", "description": "A racer."}
    empty = tmp_path / "e.zip"
    with zipfile.ZipFile(empty, "w") as f:
        f.writestr("index.html", "")
    assert register.read_zip_metadata(empty) == {}


def test_write_registration(tmp_path):
    games = tmp_path / "ts" / "src" / "games"
    games.mkdir(parents=True)
    (games / "registry.ts").write_text(REGISTRY, encoding="utf-8", newline="")
    (tmp_path / ".gitignore").write_text("examples/*\n!examples/ledger/\n", encoding="utf-8")
    z = tmp_path / "g.zip"
    with zipfile.ZipFile(z, "w") as f:
        f.writestr("metadata.json", json.dumps({"name": "Neon Drift", "description": "A racer."}))
    changed = register.write_registration(tmp_path, "neon_drift", "neon-drift", z)
    assert changed == ["ts/src/games/neon_drift/config.ts", "ts/src/games/registry.ts", ".gitignore"]
    assert "label: \"Neon Drift\"," in (games / "neon_drift" / "config.ts").read_text(encoding="utf-8")
    assert register.write_registration(tmp_path, "neon_drift", "neon-drift", z) == []
```

- [ ] **Step 2: Run and confirm failure**

Run: `uv run pytest -q -p pytest_rerunfailures tests/test_demos_naming_register.py`
Expected: FAIL (modules not found).

- [ ] **Step 3: Implement** `studio_mcp/demos/naming.py`:

```python
"""naming.py — slug and game id from an AI Studio zip name (spec §2 stage 1)."""
from __future__ import annotations

import re

_COPY_SUFFIX = re.compile(r"\s*\(\d+\)$")
_VERSION_SUFFIX = re.compile(r"_v\d+\.\d+\.\d+R\d+$")


def slug_from_zip(name: str) -> str:
    stem = re.split(r"[\\/]", name)[-1]
    if stem.lower().endswith(".zip"):
        stem = stem[:-4]
    stem = _VERSION_SUFFIX.sub("", _COPY_SUFFIX.sub("", stem.strip()))
    slug = re.sub(r"[^a-z0-9]+", "-", stem.lower()).strip("-")
    if not slug:
        raise ValueError(f"cannot derive a slug from {name!r}; pass --slug")
    return slug


def game_id(slug: str) -> str:
    return slug.replace("-", "_")
```

`studio_mcp/demos/register.py`:

```python
"""register.py — register a new demo: config.ts, registry marker edit, .gitignore (spec §4)."""
from __future__ import annotations

import hashlib
import json
import zipfile
from pathlib import Path

PALETTE = ["#22d3ee", "#a78bfa", "#34d399", "#f472b6", "#fb923c", "#60a5fa", "#facc15", "#f87171"]
IMPORTS_END = "// demos:imports:end"
ARRAY_END = "// demos:end"


def color_for(slug: str) -> str:
    return PALETTE[int(hashlib.sha256(slug.encode("utf-8")).hexdigest(), 16) % len(PALETTE)]


def import_name(game_id: str) -> str:
    first, *rest = game_id.split("_")
    name = first + "".join(p[:1].upper() + p[1:] for p in rest) + "Config"
    return name if name[0].isalpha() else "demo" + name[0].upper() + name[1:]


def render_config_ts(game_id: str, slug: str, label: str, description: str) -> str:
    q = json.dumps
    return (
        "import type { GameConfig } from '../../engine/types';\n\n"
        "// Generated by `studio_mcp.demos import` from the AI Studio export's metadata.json.\n"
        "// Edit freely: re-imports never rewrite this file.\n"
        "const config: GameConfig = {\n"
        f"  gameId: {q(game_id)},\n"
        f"  label: {q(label)},\n"
        f"  description: {q(description)},\n"
        f"  color: {q(color_for(slug))},\n"
        "  status: 'external',\n"
        f"  source: {{ kind: 'example', slug: {q(slug)} }},\n"
        f"  embedUrl: '/arcade/{game_id}/',\n"
        "};\n\n"
        "export default config;\n"
    )


def _insert_before_marker(text: str, marker: str, line: str) -> str:
    nl = "\r\n" if "\r\n" in text else "\n"
    lines = text.split(nl)
    for i, existing in enumerate(lines):
        if existing.strip().startswith(marker):
            indent = existing[: len(existing) - len(existing.lstrip())]
            lines.insert(i, indent + line)
            return nl.join(lines)
    raise ValueError(f"registry.ts has no {marker!r} marker")


def insert_registry_entry(text: str, game_id: str) -> str:
    name = import_name(game_id)
    import_line = f"import {name} from './{game_id}/config';"
    if import_line in text:
        return text
    text = _insert_before_marker(text, IMPORTS_END, import_line)
    return _insert_before_marker(text, ARRAY_END, f"{name},")


def add_gitignore_line(text: str, slug: str) -> str:
    line = f"!examples/{slug}/"
    lines = text.split("\n")
    if line in (l.rstrip("\r") for l in lines):
        return text
    last = max((i for i, l in enumerate(lines) if l.startswith("!examples/")), default=len(lines) - 1)
    lines.insert(last + 1, line)
    return "\n".join(lines)


def read_zip_metadata(zip_path: Path) -> dict:
    with zipfile.ZipFile(zip_path) as zf:
        names = [n for n in zf.namelist() if n == "metadata.json" or n.endswith("/metadata.json")]
        if not names:
            return {}
        data = json.loads(zf.read(min(names, key=len)).decode("utf-8", errors="replace"))
    return {k: data[k] for k in ("name", "description") if isinstance(data.get(k), str)}


def write_registration(repo_root: Path, game_id: str, slug: str, zip_path: Path) -> list[str]:
    """Register a brand-new demo. Returns the repo-relative files it changed (empty when already done)."""
    changed: list[str] = []
    meta = read_zip_metadata(zip_path)
    config = repo_root / "ts" / "src" / "games" / game_id / "config.ts"
    if not config.exists():
        config.parent.mkdir(parents=True, exist_ok=True)
        label = meta.get("name") or slug.replace("-", " ").title()
        config.write_text(render_config_ts(game_id, slug, label, meta.get("description", "")), encoding="utf-8")
        changed.append(f"ts/src/games/{game_id}/config.ts")
    registry = repo_root / "ts" / "src" / "games" / "registry.ts"
    with open(registry, encoding="utf-8", newline="") as f:
        text = f.read()
    new = insert_registry_entry(text, game_id)
    if new != text:
        with open(registry, "w", encoding="utf-8", newline="") as f:
            f.write(new)
        changed.append("ts/src/games/registry.ts")
    gitignore = repo_root / ".gitignore"
    with open(gitignore, encoding="utf-8", newline="") as f:
        text = f.read()
    new = add_gitignore_line(text, slug)
    if new != text:
        with open(gitignore, "w", encoding="utf-8", newline="") as f:
            f.write(new)
        changed.append(".gitignore")
    return changed
```

- [ ] **Step 4: Run the tests**

Run: `uv run pytest -q -p pytest_rerunfailures tests/test_demos_naming_register.py`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add studio_mcp/demos/naming.py studio_mcp/demos/register.py tests/test_demos_naming_register.py
git commit -m "demos: slug naming and new-demo registration (config.ts, registry markers, .gitignore)

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

## Task 6: Vendor branch, adopt, merge

**Files:**
- Create: `studio_mcp/demos/vendor.py`
- Test: `tests/test_demos_vendor.py` (throwaway git repos in `tmp_path`; never the real repo)

**Interfaces:**
- Consumes: `build.normalize_vite_base` is not available until Task 7, so this task defines the base normalization callable as a parameter (`normalize=callable(path, base)`) and Task 7 passes the real one.
- Produces: `class GitError(RuntimeError)`, `class NeedsAdopt(RuntimeError)`, `class DirtyTree(RuntimeError)`; `vendor_branch(slug) -> str`; `import_branch(slug, version) -> str`; `branch_exists(repo, name) -> bool`; `require_clean(repo)`; `adopt(repo, slug, baseline) -> str`; `ensure_vendor_branch(repo, slug, *, new_game: bool, overwrite: bool) -> bool` (True when it created the branch); `commit_export(repo, slug, zip_path, version, sha, base, normalize) -> str | None` (new commit sha, or None when that version is already on the vendor branch); `ensure_import_branch(repo, name, base="main")`; `merge_in_progress(repo) -> bool`; `@dataclass MergeResult(clean: bool, conflicts: list[str], lock_regenerated: bool = False, already_merged: bool = False)`; `merge_vendor(repo, slug, version, npm_install=_npm_lock_only) -> MergeResult`.

- [ ] **Step 1: Write the failing tests** `tests/test_demos_vendor.py`:

```python
import subprocess
import zipfile
from pathlib import Path

import pytest

from studio_mcp.demos import vendor


def git(repo, *args):
    return subprocess.run(["git", *args], cwd=repo, check=True, capture_output=True, text=True).stdout.strip()


@pytest.fixture
def repo(tmp_path):
    r = tmp_path / "studio"
    r.mkdir()
    git(r, "init", "-q", "-b", "main")
    for k, v in (("user.email", "t@example.com"), ("user.name", "t"), ("core.autocrlf", "false")):
        git(r, "config", k, v)
    (r / ".gitignore").write_text("examples/*\n!examples/demo/\n", encoding="utf-8")
    git(r, "add", ".")
    git(r, "commit", "-qm", "init")
    return r


def make_zip(path: Path, files: dict[str, str]) -> Path:
    with zipfile.ZipFile(path, "w") as z:
        for name, body in files.items():
            z.writestr(name, body)
    return path


def fake_normalize(path: Path, base: str) -> str:
    path.write_text(path.read_text(encoding="utf-8") + f"// base {base}\n", encoding="utf-8")
    return "injected"


V1 = {"src/a.ts": "export const a = 1;\n", "vite.config.ts": "export default {};\n",
      "node_modules/x/index.js": "junk", "package-lock.json": '{"v": 1}\n'}


def import_version(repo, tmp_path, version, files, *, new_game=False):
    z = make_zip(tmp_path / f"demo_v{version}.zip", files)
    vendor.ensure_vendor_branch(repo, "demo", new_game=new_game, overwrite=False)
    vendor.commit_export(repo, "demo", z, version, "sha", "/arcade/demo/", fake_normalize)
    vendor.ensure_import_branch(repo, vendor.import_branch("demo", version))
    return vendor.merge_vendor(repo, "demo", version)


def show(repo, ref, path):
    return git(repo, "show", f"{ref}:{path}")


def test_first_import_creates_vendor_branch_and_leaves_main_alone(repo, tmp_path):
    result = import_version(repo, tmp_path, "0.1.0R1", V1, new_game=True)
    assert result.clean
    assert vendor.branch_exists(repo, "ai-studio/demo")
    assert show(repo, "ai-studio/demo", "examples/demo/src/a.ts") == "export const a = 1;"
    assert "// base /arcade/demo/" in show(repo, "ai-studio/demo", "examples/demo/vite.config.ts")
    assert "node_modules" not in git(repo, "ls-tree", "-r", "--name-only", "ai-studio/demo")
    assert "examples/demo" not in git(repo, "ls-tree", "-r", "--name-only", "main")
    assert git(repo, "branch", "--show-current") == "import/demo-0.1.0R1"


def owner_merges_and_edits(repo, edit_path, edit_body):
    git(repo, "switch", "-q", "main")
    git(repo, "merge", "-q", "--no-ff", "import/demo-0.1.0R1", "-m", "owner merge")
    target = repo / edit_path
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(edit_body, encoding="utf-8")
    git(repo, "add", edit_path)
    git(repo, "commit", "-qm", "local edit")


def test_reimport_keeps_local_edits(repo, tmp_path):
    import_version(repo, tmp_path, "0.1.0R1", V1, new_game=True)
    owner_merges_and_edits(repo, "examples/demo/src/b.ts", "export const mine = true;\n")
    v2 = {**V1, "src/a.ts": "export const a = 2;\n"}
    result = import_version(repo, tmp_path, "0.1.0R2", v2)
    assert result.clean
    assert (repo / "examples/demo/src/a.ts").read_text(encoding="utf-8") == "export const a = 2;\n"
    assert (repo / "examples/demo/src/b.ts").read_text(encoding="utf-8") == "export const mine = true;\n"


def test_same_line_conflict_stops_and_lists_the_file(repo, tmp_path):
    import_version(repo, tmp_path, "0.1.0R1", V1, new_game=True)
    owner_merges_and_edits(repo, "examples/demo/src/a.ts", "export const a = 'mine';\n")
    result = import_version(repo, tmp_path, "0.1.0R2", {**V1, "src/a.ts": "export const a = 2;\n"})
    assert not result.clean
    assert result.conflicts == ["examples/demo/src/a.ts"]
    assert vendor.merge_in_progress(repo)


def test_lock_only_conflict_is_regenerated(repo, tmp_path):
    import_version(repo, tmp_path, "0.1.0R1", V1, new_game=True)
    owner_merges_and_edits(repo, "examples/demo/package-lock.json", '{"v": "mine"}\n')
    z = make_zip(tmp_path / "demo_v0.1.0R2.zip", {**V1, "package-lock.json": '{"v": 2}\n'})
    vendor.commit_export(repo, "demo", z, "0.1.0R2", "sha", "/arcade/demo/", fake_normalize)
    vendor.ensure_import_branch(repo, "import/demo-0.1.0R2")

    def fake_npm(project_dir: Path):
        (project_dir / "package-lock.json").write_text('{"regenerated": true}\n', encoding="utf-8")

    result = vendor.merge_vendor(repo, "demo", "0.1.0R2", npm_install=fake_npm)
    assert result.clean and result.lock_regenerated
    assert not vendor.merge_in_progress(repo)
    assert "regenerated" in (repo / "examples/demo/package-lock.json").read_text(encoding="utf-8")


def test_commit_export_is_idempotent_per_version(repo, tmp_path):
    z = make_zip(tmp_path / "demo_v0.1.0R1.zip", V1)
    vendor.ensure_vendor_branch(repo, "demo", new_game=True, overwrite=False)
    assert vendor.commit_export(repo, "demo", z, "0.1.0R1", "sha", "/arcade/demo/", fake_normalize)
    assert vendor.commit_export(repo, "demo", z, "0.1.0R1", "sha", "/arcade/demo/", fake_normalize) is None


def test_existing_game_without_vendor_branch_is_refused(repo):
    with pytest.raises(vendor.NeedsAdopt, match="demos adopt"):
        vendor.ensure_vendor_branch(repo, "demo", new_game=False, overwrite=False)


def test_adopt_requires_the_folder_at_the_baseline(repo, tmp_path):
    with pytest.raises(vendor.GitError):
        vendor.adopt(repo, "demo", "main")  # main has no examples/demo
    (repo / "examples/demo").mkdir(parents=True)
    (repo / "examples/demo/a.ts").write_text("x\n", encoding="utf-8")
    git(repo, "add", "examples/demo")
    git(repo, "commit", "-qm", "pristine import")
    sha = git(repo, "rev-parse", "HEAD")
    vendor.adopt(repo, "demo", sha)
    assert git(repo, "rev-parse", "ai-studio/demo") == sha


def test_require_clean_rejects_tracked_changes(repo):
    (repo / ".gitignore").write_text("changed\n", encoding="utf-8")
    with pytest.raises(vendor.DirtyTree):
        vendor.require_clean(repo)
```

- [ ] **Step 2: Run and confirm failure**

Run: `uv run pytest -q -p pytest_rerunfailures tests/test_demos_vendor.py`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement** `studio_mcp/demos/vendor.py`:

```python
"""vendor.py — the ai-studio/<slug> vendor branch and import branches (spec §3).

The vendor branch holds only untouched exports (plus base-path normalization), one
commit per version. Each import merges it into import/<slug>-<version> cut from main,
so the previous export is the merge base and local edits survive.
"""
from __future__ import annotations

import shutil
import subprocess
import tempfile
import zipfile
from dataclasses import dataclass, field
from pathlib import Path

TRAILER = "Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"


class GitError(RuntimeError):
    pass


class NeedsAdopt(RuntimeError):
    pass


class DirtyTree(RuntimeError):
    pass


def _git(repo: Path, *args: str, check: bool = True) -> subprocess.CompletedProcess:
    proc = subprocess.run(["git", *args], cwd=repo, capture_output=True, text=True, encoding="utf-8", errors="replace")
    if check and proc.returncode != 0:
        raise GitError(f"git {' '.join(args)} failed:\n{proc.stderr.strip() or proc.stdout.strip()}")
    return proc


def vendor_branch(slug: str) -> str:
    return f"ai-studio/{slug}"


def import_branch(slug: str, version: str) -> str:
    return f"import/{slug}-{version}"


def branch_exists(repo: Path, name: str) -> bool:
    return _git(repo, "rev-parse", "--verify", "--quiet", f"refs/heads/{name}", check=False).returncode == 0


def require_clean(repo: Path) -> None:
    if _git(repo, "status", "--porcelain", "--untracked-files=no").stdout.strip():
        raise DirtyTree(f"{repo} has uncommitted changes to tracked files; commit or stash them first.")


def adopt(repo: Path, slug: str, baseline: str) -> str:
    branch = vendor_branch(slug)
    if branch_exists(repo, branch):
        raise GitError(f"{branch} already exists")
    if not _git(repo, "ls-tree", "-d", "--name-only", baseline, f"examples/{slug}", check=False).stdout.strip():
        raise GitError(f"{baseline} has no examples/{slug}/; pick the commit that holds the pristine export")
    _git(repo, "branch", branch, baseline)
    return _git(repo, "rev-parse", branch).stdout.strip()


def ensure_vendor_branch(repo: Path, slug: str, *, new_game: bool, overwrite: bool) -> bool:
    branch = vendor_branch(slug)
    if branch_exists(repo, branch):
        return False
    if not (new_game or overwrite):
        raise NeedsAdopt(
            f"{slug} has no {branch} branch. Run `uv run python -m studio_mcp.demos adopt {slug} --baseline <commit>` "
            f"with the commit that holds its untouched export, or re-run with --overwrite to let the new export win.")
    _git(repo, "branch", branch, "main")
    return True


def _version_committed(repo: Path, slug: str, version: str) -> bool:
    log = _git(repo, "log", "--format=%s", vendor_branch(slug)).stdout
    return any(line.startswith(f"ai-studio: {slug} v{version} ") for line in log.splitlines())


def commit_export(repo: Path, slug: str, zip_path: Path, version: str, sha: str, base: str, normalize) -> str | None:
    if _version_committed(repo, slug, version):
        return None
    tmp = Path(tempfile.mkdtemp(prefix="demo-vendor-"))
    worktree = tmp / "wt"
    _git(repo, "worktree", "add", "-q", str(worktree), vendor_branch(slug))
    try:
        target = worktree / "examples" / slug
        _git(worktree, "rm", "-r", "-q", "--ignore-unmatch", f"examples/{slug}")
        shutil.rmtree(target, ignore_errors=True)
        with zipfile.ZipFile(zip_path) as zf:
            members = [m for m in zf.infolist() if not m.filename.startswith("node_modules/") and "/node_modules/" not in m.filename]
            zf.extractall(target, members)
        vite_config = target / "vite.config.ts"
        if vite_config.exists():
            normalize(vite_config, base)
        _git(worktree, "add", "-f", "-A", f"examples/{slug}")
        _git(worktree, "commit", "-q", "-m", f"ai-studio: {slug} v{version} (sha256 {sha})\n\n{TRAILER}")
        return _git(worktree, "rev-parse", "HEAD").stdout.strip()
    finally:
        _git(repo, "worktree", "remove", "--force", str(worktree), check=False)
        shutil.rmtree(tmp, ignore_errors=True)


def ensure_import_branch(repo: Path, name: str, base: str = "main") -> None:
    if branch_exists(repo, name):
        _git(repo, "switch", "-q", name)
    else:
        _git(repo, "switch", "-q", "-c", name, base)


def merge_in_progress(repo: Path) -> bool:
    return _git(repo, "rev-parse", "-q", "--verify", "MERGE_HEAD", check=False).returncode == 0


@dataclass
class MergeResult:
    clean: bool
    conflicts: list[str] = field(default_factory=list)
    lock_regenerated: bool = False
    already_merged: bool = False


def _npm_lock_only(project_dir: Path) -> None:
    npm = shutil.which("npm")
    if not npm:
        raise RuntimeError("npm not found on PATH")
    subprocess.run([npm, "install", "--package-lock-only", "--no-audit", "--no-fund"], cwd=project_dir, check=True,
                   capture_output=True, text=True)


def merge_vendor(repo: Path, slug: str, version: str, npm_install=_npm_lock_only) -> MergeResult:
    branch = vendor_branch(slug)
    if _git(repo, "merge-base", "--is-ancestor", branch, "HEAD", check=False).returncode == 0:
        return MergeResult(clean=True, already_merged=True)
    proc = _git(repo, "merge", "--no-ff", "-m", f"Merge {branch} v{version}\n\n{TRAILER}", branch, check=False)
    if proc.returncode == 0:
        return MergeResult(clean=True)
    conflicts = sorted(_git(repo, "diff", "--name-only", "--diff-filter=U").stdout.split())
    if not conflicts:
        raise GitError(f"merge of {branch} failed:\n{proc.stderr.strip() or proc.stdout.strip()}")
    if all(Path(c).name == "package-lock.json" for c in conflicts):
        for lock in conflicts:
            _git(repo, "checkout", "--theirs", "--", lock)
            npm_install((repo / lock).parent)
            _git(repo, "add", lock)
        _git(repo, "commit", "-q", "--no-edit")
        return MergeResult(clean=True, conflicts=conflicts, lock_regenerated=True)
    return MergeResult(clean=False, conflicts=conflicts)
```

- [ ] **Step 4: Run the tests**

Run: `uv run pytest -q -p pytest_rerunfailures tests/test_demos_vendor.py`
Expected: PASS (8 tests).

- [ ] **Step 5: Commit**

```bash
git add studio_mcp/demos/vendor.py tests/test_demos_vendor.py
git commit -m "demos: vendor branch, adopt and merge (local edits survive re-imports)

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

## Task 7: Build and verify

**Files:**
- Create: `studio_mcp/demos/build.py`, `studio_mcp/demos/verify.py`
- Modify: `studio_mcp/tools.py` (`studio_promote_to_examples` uses `normalize_vite_base`)
- Test: `tests/test_demos_build_verify.py`

**Interfaces:**
- Consumes: `StageResult` (Task 3); `studio_mcp.zip_verify.ZipVerifier`.
- Produces: `build.normalize_vite_base(vite_config: Path, expected_base: str) -> str` ("injected" | "corrected" | "already-correct"; raises `ValueError`); `build.npm_install(project_dir, run=subprocess.run) -> StageResult`; `build.vite_build(project_dir, run=subprocess.run) -> StageResult`; `build.typecheck(project_dir, run=subprocess.run) -> StageResult`; `verify.smoke_test(dist_dir: Path, game_id: str, settle_ms: int = 4000) -> StageResult`; `verify.zip_findings(versioned_zip: Path) -> dict`; `verify.unused_dependencies(project_dir: Path) -> list[str]`.

- [ ] **Step 1: Write the failing tests** `tests/test_demos_build_verify.py`:

```python
import json
from types import SimpleNamespace

import pytest

from studio_mcp.demos import build, verify


def test_normalize_vite_base_injects_corrects_and_keeps(tmp_path):
    cfg = tmp_path / "vite.config.ts"
    cfg.write_text("export default defineConfig(() => {\n  return {\n    plugins: [],\n  };\n});\n", encoding="utf-8")
    assert build.normalize_vite_base(cfg, "/arcade/g/") == "injected"
    assert "base: '/arcade/g/'," in cfg.read_text(encoding="utf-8")
    assert build.normalize_vite_base(cfg, "/arcade/g/") == "already-correct"
    assert build.normalize_vite_base(cfg, "/arcade/h/") == "corrected"
    assert "base: '/arcade/h/'" in cfg.read_text(encoding="utf-8")


def test_normalize_vite_base_handles_object_form(tmp_path):
    cfg = tmp_path / "vite.config.ts"
    cfg.write_text("export default defineConfig({\n  plugins: [],\n});\n", encoding="utf-8")
    assert build.normalize_vite_base(cfg, "/arcade/g/") == "injected"
    assert "defineConfig({\n  base: '/arcade/g/'," in cfg.read_text(encoding="utf-8")


def test_normalize_vite_base_refuses_unknown_shapes(tmp_path):
    cfg = tmp_path / "vite.config.ts"
    cfg.write_text("module.exports = config;\n", encoding="utf-8")
    with pytest.raises(ValueError):
        build.normalize_vite_base(cfg, "/arcade/g/")


def recorder(returncode=0):
    calls = []

    def run(cmd, **kwargs):
        calls.append((cmd, kwargs.get("cwd")))
        return SimpleNamespace(returncode=returncode, stdout="out", stderr="")

    return run, calls


def test_npm_install_and_vite_build_run_in_the_project(tmp_path):
    (tmp_path / "node_modules" / "vite" / "bin").mkdir(parents=True)
    (tmp_path / "node_modules" / "vite" / "bin" / "vite.js").write_text("", encoding="utf-8")
    run, calls = recorder()
    assert build.npm_install(tmp_path, run).ok
    assert build.vite_build(tmp_path, run).ok
    assert calls[0][0][1:] == ["install", "--no-audit", "--no-fund"]
    assert calls[1][0][0] == "node" and calls[1][0][-1] == "build"
    assert all(c[1] == str(tmp_path) for c in calls)


def test_vite_build_fails_without_vite(tmp_path):
    run, _ = recorder()
    result = build.vite_build(tmp_path, run)
    assert not result.ok and "npm install" in result.next_step


def test_typecheck_skips_without_tsconfig_and_runs_with_it(tmp_path):
    run, calls = recorder()
    assert build.typecheck(tmp_path, run).detail == "skipped: no tsconfig.json"
    (tmp_path / "tsconfig.json").write_text("{}", encoding="utf-8")
    (tmp_path / "node_modules" / "typescript" / "bin").mkdir(parents=True)
    (tmp_path / "node_modules" / "typescript" / "bin" / "tsc").write_text("", encoding="utf-8")
    assert build.typecheck(tmp_path, run).ok
    assert calls[-1][0][-1] == "--noEmit"


def test_unused_dependencies(tmp_path):
    (tmp_path / "package.json").write_text(json.dumps({"dependencies": {
        "react": "1", "@google/genai": "1", "lucide-react": "1", "vite": "1", "express": "1"}}), encoding="utf-8")
    (tmp_path / "src").mkdir()
    (tmp_path / "src" / "App.tsx").write_text("import React from 'react';\nimport { X } from \"lucide-react/icons\";\n", encoding="utf-8")
    (tmp_path / "vite.config.ts").write_text("import { defineConfig } from 'vite';\n", encoding="utf-8")
    assert verify.unused_dependencies(tmp_path) == ["@google/genai", "express"]


def test_zip_findings_uses_analyze_only(monkeypatch, tmp_path):
    class Fake:
        def __init__(self, zip_path):
            self.zip_path = zip_path

        def analyze(self):
            return {"slug": "g", "caller_check": {}}

        def verify(self):
            raise AssertionError("verify() calls the OpenRouter model and must never be used")

    monkeypatch.setattr(verify, "ZipVerifier", Fake)
    assert verify.zip_findings(tmp_path / "g_v0.1.0R1.zip") == {"slug": "g", "caller_check": {}}


def test_zip_findings_reports_errors(monkeypatch, tmp_path):
    def boom(zip_path):
        raise OSError("bad zip")

    monkeypatch.setattr(verify, "ZipVerifier", boom)
    assert verify.zip_findings(tmp_path / "g.zip") == {"error": "OSError: bad zip"}


@pytest.fixture
def dist(tmp_path):
    pytest.importorskip("playwright.sync_api")
    d = tmp_path / "dist"
    d.mkdir()
    return d


def test_smoke_passes_for_a_rendering_build(dist):
    (dist / "index.html").write_text("<!doctype html><div id=root><p>hi</p></div>", encoding="utf-8")
    result = verify.smoke_test(dist, "g", settle_ms=300)
    assert result.ok, result.detail


def test_smoke_fails_on_page_errors(dist):
    (dist / "index.html").write_text(
        "<!doctype html><div id=root><p>hi</p></div><script>throw new Error('boom')</script>", encoding="utf-8")
    result = verify.smoke_test(dist, "g", settle_ms=300)
    assert not result.ok and "boom" in result.detail
```

- [ ] **Step 2: Run and confirm failure**

Run: `uv run pytest -q -p pytest_rerunfailures tests/test_demos_build_verify.py`
Expected: FAIL (modules not found).

- [ ] **Step 3: Implement** `studio_mcp/demos/build.py`:

```python
"""build.py — build an example demo (spec §2 stage 4)."""
from __future__ import annotations

import os
import re
import shutil
import subprocess
from pathlib import Path

from studio_mcp.demos.result import StageResult

_BASE = re.compile(r'base\s*:\s*(["\'])(.*?)\1')


def normalize_vite_base(vite_config: Path, expected_base: str) -> str:
    content = vite_config.read_text(encoding="utf-8")
    match = _BASE.search(content)
    if match is None:
        for pattern, indent in ((r"(return\s*\{)", "    "), (r"(defineConfig\(\s*\{)", "  ")):
            new, count = re.subn(pattern, rf"\1\n{indent}base: '{expected_base}',", content, count=1)
            if count:
                vite_config.write_text(new, encoding="utf-8")
                return "injected"
        raise ValueError(f"{vite_config}: cannot find where to add `base`")
    if match.group(2) == expected_base:
        return "already-correct"
    vite_config.write_text(content[:match.start(2)] + expected_base + content[match.end(2):], encoding="utf-8")
    return "corrected"


def _tail(proc) -> str:
    return ((proc.stdout or "") + (proc.stderr or ""))[-1500:]


def npm_install(project_dir: Path, run=subprocess.run) -> StageResult:
    node_modules = project_dir / "node_modules"
    if node_modules.is_symlink() or (hasattr(os.path, "isjunction") and os.path.isjunction(node_modules)):
        os.unlink(node_modules)  # removes the link only, never the sibling's packages
    npm = shutil.which("npm") or "npm"
    proc = run([npm, "install", "--no-audit", "--no-fund"], cwd=str(project_dir),
               capture_output=True, text=True, encoding="utf-8", errors="replace")
    ok = proc.returncode == 0
    return StageResult("build: npm install", ok, _tail(proc), "" if ok else "Fix the dependency error in package.json, then re-run the import.")


def vite_build(project_dir: Path, run=subprocess.run) -> StageResult:
    vite = project_dir / "node_modules" / "vite" / "bin" / "vite.js"
    if not vite.exists():
        return StageResult("build: vite", False, "vite is not installed", "Run npm install in the demo folder, then re-run.")
    proc = run(["node", str(vite), "build"], cwd=str(project_dir), capture_output=True, text=True,
               encoding="utf-8", errors="replace", timeout=300)
    ok = proc.returncode == 0
    return StageResult("build: vite", ok, _tail(proc), "" if ok else "Fix the build error shown above, then re-run.")


def typecheck(project_dir: Path, run=subprocess.run) -> StageResult:
    if not (project_dir / "tsconfig.json").exists():
        return StageResult("verify: typecheck", True, "skipped: no tsconfig.json")
    tsc = project_dir / "node_modules" / "typescript" / "bin" / "tsc"
    if not tsc.exists():
        return StageResult("verify: typecheck", True, "skipped: typescript is not a dependency")
    proc = run(["node", str(tsc), "--noEmit"], cwd=str(project_dir), capture_output=True, text=True,
               encoding="utf-8", errors="replace", timeout=300)
    ok = proc.returncode == 0
    return StageResult("verify: typecheck", ok, _tail(proc), "" if ok else "Fix the type errors shown above, then re-run.")
```

`studio_mcp/demos/verify.py`:

```python
"""verify.py — deterministic checks on a built demo (spec §2 stage 6). No AI calls."""
from __future__ import annotations

import functools
import http.server
import json
import re
import shutil
import socketserver
import tempfile
import threading
from pathlib import Path

from studio_mcp.demos.result import StageResult
from studio_mcp.zip_verify import ZipVerifier

_SOURCE_GLOBS = ("src/**/*.ts", "src/**/*.tsx", "src/**/*.js", "src/**/*.jsx", "src/**/*.mjs",
                 "vite.config.*", "tailwind.config.*", "postcss.config.*", "index.html", "*.ts")


def smoke_test(dist_dir: Path, game_id: str, settle_ms: int = 4000) -> StageResult:
    from playwright.sync_api import sync_playwright

    root = Path(tempfile.mkdtemp(prefix="demo-smoke-"))
    shutil.copytree(dist_dir, root / "arcade" / game_id)
    handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(root))
    errors: list[str] = []
    content = 0
    with socketserver.ThreadingTCPServer(("127.0.0.1", 0), handler) as server:
        threading.Thread(target=server.serve_forever, daemon=True).start()
        try:
            with sync_playwright() as p:
                browser = p.chromium.launch()
                page = browser.new_page()
                page.on("pageerror", lambda exc: errors.append(str(exc)))
                page.on("console", lambda m: errors.append(m.text) if m.type == "error" and "favicon" not in m.text else None)
                page.goto(f"http://127.0.0.1:{server.server_address[1]}/arcade/{game_id}/", wait_until="load", timeout=30000)
                page.wait_for_timeout(settle_ms)
                content = page.evaluate(
                    "() => document.querySelectorAll('canvas').length"
                    " + ((document.querySelector('#root, #app') || {childElementCount: 0}).childElementCount)")
                browser.close()
        except Exception as exc:  # navigation timeout or crash
            errors.append(f"load failed: {exc}")
        finally:
            server.shutdown()
    shutil.rmtree(root, ignore_errors=True)
    ok = content > 0 and not errors
    detail = "renders, no page errors" if ok else "; ".join(errors[:5]) or "nothing rendered (no canvas, empty #root/#app)"
    return StageResult("verify: smoke", ok, detail, "" if ok else "Open the build locally to see the error, fix it, then re-run.")


def zip_findings(versioned_zip: Path) -> dict:
    """The four non-AI zip_verify checks. Never verify()/write_report(): those call OpenRouter."""
    try:
        return ZipVerifier(versioned_zip).analyze()
    except Exception as exc:
        return {"error": f"{type(exc).__name__}: {exc}"}


def unused_dependencies(project_dir: Path) -> list[str]:
    deps = json.loads((project_dir / "package.json").read_text(encoding="utf-8")).get("dependencies", {})
    text = "\n".join(
        f.read_text(encoding="utf-8", errors="replace")
        for pattern in _SOURCE_GLOBS for f in project_dir.glob(pattern) if f.is_file())
    unused = []
    for name in deps:
        pattern = rf"""(?:from\s*|import\s*\(\s*|require\s*\(\s*|import\s+)["']{re.escape(name)}(?:/[^"']*)?["']"""
        if not re.search(pattern, text):
            unused.append(name)
    return sorted(unused)
```

- [ ] **Step 4: Share the normalization with promote.** In `studio_mcp/tools.py` `studio_promote_to_examples`, replace the block from `content = vite_config.read_text(encoding="utf-8")` through the `else: base_action = "already-correct"` branch (the three-way `base_match` logic) with:

```python
    from studio_mcp.demos.build import normalize_vite_base

    try:
        base_action = normalize_vite_base(vite_config, expected_base)
    except ValueError as exc:
        return {"error": str(exc), "tool": "studio_promote_to_examples", "base_expected": expected_base}
    actual_base = expected_base
```

- [ ] **Step 5: Run the tests**

```bash
uv run pytest -q -p pytest_rerunfailures tests/test_demos_build_verify.py tests/test_studio_mcp.py
```

Expected: PASS. The smoke tests need Playwright's Chromium (already used by the site); if it is missing, run `uv run playwright install chromium` once.

- [ ] **Step 6: Commit**

```bash
git add studio_mcp/demos/build.py studio_mcp/demos/verify.py studio_mcp/tools.py tests/test_demos_build_verify.py
git commit -m "demos: build (own node_modules, vite, typecheck) and deterministic verify (smoke, zip analyze, unused deps)

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

## Task 8: Site staging (`check_arcade --only`) and `stage.py`

**Files:**
- Site repo (branch `feature/check-arcade-only` from `main`): modify `scripts/site/check_arcade.py`, `tests/test_check_arcade.py`
- Studio: create `studio_mcp/demos/stage.py`, test `tests/test_demos_stage.py`

**Interfaces:**
- Produces (site): `check_arcade.update_health(report: dict, folder: str, entry: dict, now: str) -> dict`; `check_arcade.main(argv: list[str] | None = None) -> int` accepting `--only <folder>` (returns 2 for an unknown folder).
- Produces (studio): `stage.SITE_ROOT: Path`; `stage.stage_on_site(game_id: str, dist_dir: Path, branch: str, *, run=subprocess.run, site: Path = SITE_ROOT, studio_exports=None) -> list[StageResult]` (stops at the first failure; `studio_exports` defaults to exporting the registry, writing game metadata and exporting the arcade manifest).

- [ ] **Step 1 (site): failing tests.** Append to `tests/test_check_arcade.py`:

```python
from scripts.site import check_arcade


def test_update_health_replaces_one_build_and_keeps_the_rest():
    report = {"checked_at": "old", "builds": {"a": {"ok": True}, "b": {"ok": False}}}
    out = check_arcade.update_health(report, "b", {"ok": True}, now="new")
    assert out == {"checked_at": "new", "builds": {"a": {"ok": True}, "b": {"ok": True}}}
    assert report["builds"]["b"] == {"ok": False}  # input not mutated


def test_only_rejects_an_unknown_folder(tmp_path, monkeypatch):
    monkeypatch.setattr(check_arcade, "ARCADE", tmp_path)
    assert check_arcade.main(["--only", "nope"]) == 2
```

Run: `uv run --extra dev pytest -q tests/test_check_arcade.py` — Expected: FAIL.

- [ ] **Step 2 (site): implement.** In `scripts/site/check_arcade.py` add `import argparse` and, above `main`:

```python
def update_health(report: dict, folder: str, entry: dict, now: str) -> dict:
    builds = {**report.get("builds", {}), folder: entry}
    return {"checked_at": now, "builds": dict(sorted(builds.items()))}
```

Replace `def main() -> int:` and its first lines up to the `for folder in sorted(...)` loop so that `main` reads:

```python
def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Cartridge contract for static/arcade builds.")
    parser.add_argument("--only", help="check one build folder and update only its entry")
    args = parser.parse_args(argv)
    if args.only and not (ARCADE / args.only).is_dir():
        print(f"no build folder static/arcade/{args.only}/")
        return 2
    folders = [args.only] if args.only else sorted(d.name for d in ARCADE.iterdir() if d.is_dir())
    health_file = ROOT / "data" / "arcade_health.json"
    handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(STATIC))
    health: dict[str, dict] = {}
    with socketserver.ThreadingTCPServer(("127.0.0.1", 0), handler) as server:
        threading.Thread(target=server.serve_forever, daemon=True).start()
        base = f"http://127.0.0.1:{server.server_address[1]}"
        for folder in folders:
```

Keep the loop body as it is. After the `with` block, replace the report writing with:

```python
    now = datetime.now(timezone.utc).isoformat(timespec="seconds")
    if args.only:
        existing = json.loads(health_file.read_text(encoding="utf-8")) if health_file.exists() else {}
        report = update_health(existing, args.only, health[args.only], now)
    else:
        report = {"checked_at": now, "builds": health}
    health_file.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(f"{sum(h['ok'] for h in health.values())}/{len(health)} builds pass the cartridge contract")
    return 0
```

Also change the bottom to `sys.exit(main())` if it isn't already.

- [ ] **Step 3 (site): run, then a real single-build check**

```bash
uv run --extra dev pytest -q tests/test_check_arcade.py
PYTHONUTF8=1 uv run --extra dev python scripts/site/check_arcade.py --only systemic_extract
git diff --stat data/arcade_health.json
```

Expected: tests PASS; `1/1 builds pass the cartridge contract`; the health file diff touches only `checked_at` and the `systemic_extract` entry. Then `git checkout -- data static/images/games` (keep the data unchanged in this commit).

- [ ] **Step 4 (site): commit**

```bash
git add scripts/site/check_arcade.py tests/test_check_arcade.py
git commit -m "check_arcade: --only <folder> checks one build and updates only its health entry

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

- [ ] **Step 5 (studio): failing test** `tests/test_demos_stage.py`:

```python
import subprocess
from types import SimpleNamespace

import pytest

from studio_mcp.demos import stage


def git(repo, *args):
    subprocess.run(["git", *args], cwd=repo, check=True, capture_output=True, text=True)


@pytest.fixture
def site(tmp_path):
    s = tmp_path / "site"
    (s / "static" / "arcade").mkdir(parents=True)
    git(s, "init", "-q", "-b", "main")
    git(s, "config", "user.email", "t@example.com")
    git(s, "config", "user.name", "t")
    (s / "README.md").write_text("site\n", encoding="utf-8")
    git(s, "add", ".")
    git(s, "commit", "-qm", "init")
    return s


@pytest.fixture
def dist(tmp_path):
    d = tmp_path / "dist"
    d.mkdir()
    (d / "index.html").write_text("<div id=root></div>", encoding="utf-8")
    return d


def test_stage_copies_the_build_and_runs_site_scripts_in_order(site, dist):
    calls = []

    def run(cmd, **kwargs):
        calls.append(cmd)
        return SimpleNamespace(returncode=0, stdout="", stderr="")

    results = stage.stage_on_site("neon_drift", dist, "import/neon-drift-0.1.0R1", run=run, site=site,
                                  studio_exports=lambda: None)
    assert all(r.ok for r in results), [r.as_dict() for r in results]
    assert (site / "static" / "arcade" / "neon_drift" / "index.html").exists()
    scripts = [c[1] for c in calls]
    assert scripts == ["scripts/site/inject_return.py", "scripts/site/check_arcade.py", "scripts/site/build_all.py"]
    assert calls[1][2:] == ["--only", "neon_drift"]
    branch = subprocess.run(["git", "branch", "--show-current"], cwd=site, capture_output=True, text=True).stdout.strip()
    assert branch == "import/neon-drift-0.1.0R1"


def test_stage_refuses_a_dirty_site(site, dist):
    (site / "README.md").write_text("changed\n", encoding="utf-8")
    results = stage.stage_on_site("g", dist, "import/g-0.1.0R1", run=None, site=site, studio_exports=lambda: None)
    assert results[-1].ok is False and "uncommitted" in results[-1].detail


def test_stage_stops_at_the_first_failing_script(site, dist):
    def run(cmd, **kwargs):
        return SimpleNamespace(returncode=1 if "check_arcade" in cmd[1] else 0, stdout="", stderr="FAIL g")

    results = stage.stage_on_site("g", dist, "import/g-0.1.0R1", run=run, site=site, studio_exports=lambda: None)
    assert results[-1].ok is False and results[-1].stage == "stage: check_arcade.py"
```

Run: `uv run pytest -q -p pytest_rerunfailures tests/test_demos_stage.py` — Expected: FAIL.

- [ ] **Step 6 (studio): implement** `studio_mcp/demos/stage.py`:

```python
"""stage.py — stage a built demo on the site's local arcade (spec §2 stage 7). Never commits or deploys."""
from __future__ import annotations

import os
import shutil
import subprocess
from pathlib import Path

from studio_mcp.demos import vendor
from studio_mcp.demos.result import StageResult
from studio_mcp.paths import REPO_ROOT, sibling_repo

SITE_ROOT = sibling_repo("RFD_IT_Services_Site", "SITE_REPO_PATH")
SITE_SCRIPTS = (
    ["scripts/site/inject_return.py"],
    ["scripts/site/check_arcade.py", "--only", "{game_id}"],
    ["scripts/site/build_all.py"],
)


def _default_studio_exports() -> None:
    from studio_mcp.demos import registry
    from studio_mcp.game_metadata import write_game_metadata

    registry.export_registry()
    write_game_metadata()
    npx = shutil.which("npx") or "npx"
    proc = subprocess.run([npx, "vite-node", "tools/export-arcade-manifest.ts"], cwd=str(REPO_ROOT / "ts"),
                          capture_output=True, text=True, encoding="utf-8", errors="replace")
    if proc.returncode != 0:
        raise RuntimeError(((proc.stdout or "") + (proc.stderr or ""))[-1500:])


def stage_on_site(game_id: str, dist_dir: Path, branch: str, *, run=subprocess.run, site: Path = SITE_ROOT,
                  studio_exports=None) -> list[StageResult]:
    results: list[StageResult] = []
    try:
        vendor.require_clean(site)
    except vendor.DirtyTree as exc:
        return [StageResult("stage: site clean", False, str(exc), "Commit or stash the site repo's changes, then re-run.")]
    vendor.ensure_import_branch(site, branch)
    results.append(StageResult("stage: site branch", True, branch))
    try:
        (studio_exports or _default_studio_exports)()
    except Exception as exc:
        results.append(StageResult("stage: studio exports", False, str(exc), "Fix the export error, then re-run."))
        return results
    results.append(StageResult("stage: studio exports", True, "registry, metadata, arcade manifest"))
    dest = site / "static" / "arcade" / game_id
    shutil.rmtree(dest, ignore_errors=True)
    shutil.copytree(dist_dir, dest)
    results.append(StageResult("stage: copy build", True, str(dest)))
    python = str(site / ".venv" / "Scripts" / "python.exe")
    env = {**os.environ, "PYTHONUTF8": "1"}
    for script in SITE_SCRIPTS:
        args = [a.format(game_id=game_id) for a in script]
        proc = run([python, *args], cwd=str(site), capture_output=True, text=True, encoding="utf-8",
                   errors="replace", env=env)
        name = f"stage: {Path(args[0]).name}"
        ok = proc.returncode == 0
        results.append(StageResult(name, ok, ((proc.stdout or "") + (proc.stderr or ""))[-1500:],
                                   "" if ok else "See the output above; fix it in the site repo, then re-run."))
        if not ok:
            break
    return results
```

- [ ] **Step 7 (studio): run and commit**

```bash
uv run pytest -q -p pytest_rerunfailures tests/test_demos_stage.py
git add studio_mcp/demos/stage.py tests/test_demos_stage.py
git commit -m "demos: stage a built demo on the site's local arcade (no commit, no deploy)

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```
