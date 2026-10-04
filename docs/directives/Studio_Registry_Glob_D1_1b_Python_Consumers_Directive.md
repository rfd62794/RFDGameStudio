# Python tools stop parsing and editing registry.ts text (Phase 1, D1.1b, pairs with D1.1)

**Depends on:** D1.1 (`Studio_Registry_Glob_D1_1_Directive.md`) must be merged first: this run's baseline is the glob-shaped `ts/src/games/registry.ts`. Merge D1.1 and D1.1b back to back.
**Queue-neutral:** this file carries no Queue block; the controller queues it. It was split out of D1.1 because the redesign spec's "retire the hand lists" also breaks six Python tools that read or write `registry.ts` as text; found while proving the glob.

**Read first** (everything this run needs is pasted below; these are the files to open):
`studio_mcp/pipeline_audit/repo_state.py` (lines 14-60 and 70-80), `scripts/studio_catalogue.py` (lines 108-112), `studio_mcp/import_fixer/tests/test_source_resolver_unchanged.py` (lines 1-45),
`studio_mcp/demos/register.py` (whole file), `studio_mcp/scaffold.py` (lines 186-205, 325-385), `studio_mcp/tools.py` (lines 1314-1420), `docs/superpowers/specs/2026-10-04-studio-redesign.md` (section c1).

## 1. Why this exists

After D1.1, `ts/src/games/registry.ts` has no `import ... from './<id>/config'` lines and no array: it collects `./*/config.ts` by glob, minus the folders in its negative patterns
(`'!./brewfield/config.ts'`, `'!./early_learning_buddy/config.ts'`), ordered by each config's `order`. Six Python tools still treat the old text shape as a contract. Measured 2026-10-04 by running them against a copy of the repo
with D1.1 applied:

```
uv run pytest -q -p no:cacheprovider studio_mcp/pipeline_audit/tests/test_repo_state.py studio_mcp/import_fixer/tests/test_source_resolver_unchanged.py tests/test_studio_catalogue.py tests/test_demos_naming_register.py tests/test_scaffold.py tests/test_studio_promote.py
FAILED studio_mcp/pipeline_audit/tests/test_repo_state.py::test_repo_state_reads_real_registry
FAILED studio_mcp/pipeline_audit/tests/test_repo_state.py::test_repo_state_cross_references_metadata
FAILED studio_mcp/import_fixer/tests/test_source_resolver_unchanged.py::test_source_resolver_unchanged_for_all_registry_slugs
3 failed, 44 passed
```

Readers (3 of them fail on the real file): `repo_state.read_repo_state` (parses imports and the array), `test_source_resolver_unchanged._get_registry_slugs` (parses imports), `scripts/studio_catalogue.registry_slugs`
(regex over `from './<id>/config'`, so every game would be reported "orphan"; no test covers the real file).
Writers (their tests build a temp registry, so they pass, but on the real file they would corrupt it): `studio_mcp/demos/register.py::write_registration` (inserts at `// demos:*` markers that no longer exist, and appends
`!examples/<slug>/` lines to `.gitignore`, which PR #118 already made unnecessary), `studio_mcp/scaffold.py::_scaffold_ts_native` and `studio_mcp/tools.py::studio_generate_registry_entry` (both splice an import and an
array entry into `registry.ts`).

Pre-existing and NOT yours: on origin/main `bb048831`, `test_source_resolver_unchanged_for_all_registry_slugs` already fails because its fixture `resolve_source_baseline.json` lacks `coin_pusher_arcade` and
`voidrift_particle_sandbox` (real message: `registry-only=['coin_pusher_arcade', 'voidrift_particle_sandbox'], baseline-only=[]`). After your change it must fail with exactly that same message: that proves your reader returns the
same 36 slugs the old text parser did. The controller regenerates that fixture (`scripts/regen_resolve_source_baseline.py`); you must not.

## 2. Scope

1. New module `<!-- new: studio_mcp/demos/registry_files.py -->` and new test `<!-- new: tests/test_registry_files.py -->`.
2. Readers: `studio_mcp/pipeline_audit/repo_state.py`, `scripts/studio_catalogue.py`, `studio_mcp/import_fixer/tests/test_source_resolver_unchanged.py`, plus one new test in `tests/test_studio_catalogue.py`.
3. Writers: `studio_mcp/demos/register.py`, `studio_mcp/scaffold.py`, `studio_mcp/tools.py`, and their tests `tests/test_demos_naming_register.py`, `tests/test_scaffold.py`, `tests/test_studio_promote.py`.

## 3. The work

Keep each file's existing line endings (some are CRLF, some LF; the Edit tool preserves them). The new files may use either.

**Step 1: new `studio_mcp/demos/registry_files.py`.** Exactly this content:

```python
# new: Phase 1 D1.1b -- read the glob registry from disk, no Node needed.
"""registry_files.py -- which games the glob registry (ts/src/games/registry.ts) collects, without running Node.

registry.ts no longer lists its games: it collects every ts/src/games/<folder>/config.ts, except the
folders named in its negative glob patterns ('!./<folder>/config.ts'), ordered by each config's `order`.
This module mirrors that rule on disk for the Python tools that used to parse registry.ts as text.
"""
from __future__ import annotations

import re
from pathlib import Path

ORDER_STEP = 10
_GAME_ID = re.compile(r"""^[ \t]*gameId:\s*['"]([^'"]+)['"]""", re.M)
_ORDER = re.compile(r"^[ \t]*order:\s*(\d+)\s*,", re.M)
_EXCLUDED = re.compile(r"""['"]!\./([A-Za-z0-9_]+)/config\.ts['"]""")


def uses_glob(registry_text: str) -> bool:
    return "import.meta.glob" in registry_text


def excluded_folders(registry_text: str) -> set[str]:
    return set(_EXCLUDED.findall(registry_text))


def registry_games(games_dir: Path) -> list[dict]:
    """[{"id", "folder", "order"}] for every registered game, sorted by (order, id) like the TypeScript registry."""
    registry = games_dir / "registry.ts"
    excluded = excluded_folders(registry.read_text(encoding="utf-8")) if registry.exists() else set()
    rows = []
    for config in sorted(games_dir.glob("*/config.ts")):
        folder = config.parent.name
        if folder in excluded:
            continue
        text = config.read_text(encoding="utf-8")
        game_id = _GAME_ID.search(text)
        order = _ORDER.search(text)
        rows.append({
            "id": game_id.group(1) if game_id else folder,
            "folder": folder,
            "order": int(order.group(1)) if order else None,
        })
    return sorted(rows, key=lambda r: (r["order"] is None, r["order"] or 0, r["id"]))


def next_order(games_dir: Path) -> int:
    """The order for a new game: the highest existing order plus ORDER_STEP (ORDER_STEP when none)."""
    orders = [r["order"] for r in registry_games(games_dir) if r["order"] is not None]
    return (max(orders) if orders else 0) + ORDER_STEP
```

**Step 2: new `tests/test_registry_files.py`.** Exactly this content:

```python
# new: Phase 1 D1.1b -- the Python mirror of the glob registry.
from __future__ import annotations

from pathlib import Path

from studio_mcp.demos.registry_files import ORDER_STEP, excluded_folders, next_order, registry_games, uses_glob
from studio_mcp.paths import REPO_ROOT

GAMES = REPO_ROOT / "ts" / "src" / "games"

REGISTRY = """import type { GameConfig } from '../engine/types';
export const GAME_REGISTRY: GameConfig[] = collectConfigs(
  import.meta.glob<{ default: GameConfig }>(
    ['./*/config.ts', '!./skipped/config.ts'],
    { eager: true },
  ),
);
"""


def make_games(tmp_path: Path) -> Path:
    games = tmp_path / "games"
    (games).mkdir()
    (games / "registry.ts").write_text(REGISTRY, encoding="utf-8")
    for folder, order in (("beta", 20), ("alpha", 20), ("first", 10), ("skipped", 5)):
        (games / folder).mkdir()
        (games / folder / "config.ts").write_text(
            f"const config = {{\n  gameId:   '{folder}',\n  order: {order},\n}};\nexport default config;\n", encoding="utf-8")
    (games / "noorder").mkdir()
    (games / "noorder" / "config.ts").write_text("const config = { gameId: 'noorder' };\nexport default config;\n", encoding="utf-8")
    return games


def test_uses_glob_and_excluded_folders() -> None:
    assert uses_glob(REGISTRY)
    assert not uses_glob("import a from './a/config';\n")
    assert excluded_folders(REGISTRY) == {"skipped"}


def test_registry_games_sorts_by_order_then_id_and_skips_excluded(tmp_path: Path) -> None:
    rows = registry_games(make_games(tmp_path))
    assert [r["id"] for r in rows] == ["first", "alpha", "beta", "noorder"]
    assert rows[-1]["order"] is None


def test_next_order_is_highest_plus_step(tmp_path: Path) -> None:
    games = make_games(tmp_path)
    assert next_order(games) == 20 + ORDER_STEP


def test_real_registry_matches_the_typescript_registry() -> None:
    ids = [r["id"] for r in registry_games(GAMES)]
    assert len(ids) == 36
    assert ids[:3] == ["dissonance", "slimeworld", "shoal"]
    assert ids[-1] == "kingmaker_squads"
    assert "brewfield" not in ids and "early_learning_buddy" not in ids
```

**Step 3: readers.**

a. `studio_mcp/pipeline_audit/repo_state.py`: after the line `from typing import Any` add a blank line and `from studio_mcp.demos.registry_files import registry_games, uses_glob`. In `read_repo_state`, replace the line
`    games = _extract_registry_games(registry_text)` with:

```python
    if uses_glob(registry_text):
        games = [{"id": r["id"], "config_export": "default"} for r in registry_games(registry_path.parent)]
    else:
        games = _extract_registry_games(registry_text)
```
Leave `_extract_registry_games` and its test (`test_extract_registry_games...`, which feeds it old-shape text) untouched.

b. `scripts/studio_catalogue.py` (stays standalone; it must not import `studio_mcp`): in `registry_slugs`, replace the final `return set(re.findall(...))` line with:

```python
    if "import.meta.glob" in text:
        # Glob registry: every <folder>/config.ts except the folders its negative patterns exclude.
        excluded = set(re.findall(r"""['"]!\./([A-Za-z0-9_]+)/config\.ts['"]""", text))
        return {c.parent.name for c in path.parent.glob("*/config.ts")} - excluded
    return set(re.findall(r"""from\s+['"]\./([A-Za-z0-9_]+)/config['"]""", text))
```
and append this test at the end of `tests/test_studio_catalogue.py`:

```python


def test_glob_registry_lists_every_config_folder_except_excluded(tmp_path) -> None:
    glob_registry = "import.meta.glob(['./*/config.ts', '!./ghost/config.ts'], { eager: true });\n"
    root, site = make_tree(
        tmp_path,
        games={"live": {"config": _config("live")}, "ghost": {"config": _config("ghost")}},
        registry=glob_registry,
        site=_site(),
    )
    assert sc.registry_slugs(root / "ts" / "src" / "games" / "registry.ts") == {"live"}
    cat = sc.build_catalogue(root, site)
    orphans = [f["slug"] for f in cat["findings"] if f["kind"] == "orphan"]
    assert orphans == ["ghost"]
```

c. `studio_mcp/import_fixer/tests/test_source_resolver_unchanged.py`: replace the whole body of `_get_registry_slugs` (everything after its `def` line) with `    return [r["id"] for r in registry_games(REPO_ROOT / "ts" / "src" / "games")]`; add
`from studio_mcp.demos.registry_files import registry_games` after the `from studio_mcp.zip_verify.source_resolver import ...` line; delete the now-unused `import re` line. Do not touch the baseline JSON fixture.

**Step 4: writers stop editing `registry.ts` and `.gitignore`.** New games get their display order from `next_order(<games dir>)` and are picked up by the glob.

a. `studio_mcp/demos/register.py`: change the first docstring line to `"""register.py — register a new demo: write its config.ts (the glob registry picks it up; spec section c1)."""`;
add `from studio_mcp.demos.registry_files import next_order` (own import group after `from pathlib import Path`); delete the constants `IMPORTS_END` and `ARRAY_END` and the functions `_insert_before_marker`, `insert_registry_entry`,
`add_gitignore_line` (keep `import_name`, `color_for`, `PALETTE`, `read_zip_metadata`); give `render_config_ts` a fifth parameter `order: int` and emit `f"  order: {order},\n"` directly after the `gameId` line; in `write_registration`
pass `next_order(config.parent.parent)` as that argument and delete everything from the `registry = repo_root / ...` line to just before `return changed` (so only `config.ts` is ever written; `changed` lists at most that one file).

b. `tests/test_demos_naming_register.py`: in `test_render_config_ts` pass `370` as a fifth argument and add `assert "  order: 370," in ts` after the `gameId` assertion; delete the `REGISTRY` constant and the three tests
`test_insert_registry_entry_keeps_crlf_and_is_idempotent`, `test_insert_registry_entry_requires_markers`, `test_add_gitignore_line`; in `test_write_registration` replace the two lines that write `registry.ts` and `.gitignore` with:

```python
    registry_text = "export const GAME_REGISTRY = collectConfigs(import.meta.glob(['./*/config.ts']));\n"
    (games / "registry.ts").write_text(registry_text, encoding="utf-8", newline="")
    (games / "ledger").mkdir()
    (games / "ledger" / "config.ts").write_text("  gameId: 'ledger',\n  order: 140,\n", encoding="utf-8")
    gitignore_text = "examples/*\n"
    (tmp_path / ".gitignore").write_text(gitignore_text, encoding="utf-8")
```
and replace its `assert changed == [...]` line with these four lines (keep the existing `label` assertion between them as it is, and the final `== []` assertion):

```python
    assert changed == ["ts/src/games/neon_drift/config.ts"]
    assert "  order: 150," in (games / "neon_drift" / "config.ts").read_text(encoding="utf-8")
    assert (games / "registry.ts").read_text(encoding="utf-8") == registry_text
    assert (tmp_path / ".gitignore").read_text(encoding="utf-8") == gitignore_text
```

c. `studio_mcp/scaffold.py`: add `from studio_mcp.demos.registry_files import next_order` after the `from studio_mcp.intake import _game_id_from_slug` line; in the string `_TS_CONFIG_STUB` add the line `  order: {order},` directly after `  gameId: '{game_id}',`;
in `_scaffold_ts_native` add the keyword `order=next_order(games_src),` to the `_TS_CONFIG_STUB.format(...)` call; delete the whole block from the comment `# Registry entry — additive only` to just before `files_created = [` and put the single comment
`    # No registry edit: registry.ts collects every ts/src/games/<id>/config.ts by glob.` there; return `"registry_modified": False,`. Leave `_camel_case_from_game_id` alone.

d. `studio_mcp/tools.py`: add `from studio_mcp.demos.registry_files import next_order` after the line `from studio_mcp.demos import registry as demo_registry`. In `studio_generate_registry_entry`: replace its docstring's first sentence so it no longer promises a registry edit
(`"""Create ts/src/games/{game_id}/config.ts (with its display `order`); registry.ts collects it by glob and is not edited. ...`) and change `"registry_modified": bool` in the Returns text to `"registry_modified": False`;
delete the lines `registry_content = registry_path.read_text(...)` and the whole "Refuse if game_id is already referenced in the registry" block (the earlier "Refuse if config.ts already exists" check still stops duplicates);
in `config_template` add the line `"  order: {order},\n"` directly after the `"  gameId: '{game_id}',\n"` line; add `order=next_order(games_src),` to the `config_template.format(...)` call; delete the whole block from the comment
`# Minimal insertion into registry.ts: one import line + one array entry.` to the line `registry_path.write_text(registry_text, encoding="utf-8")`; return `"registry_modified": False`. Keep the earlier "registry.ts not found" refusal and the `import_name` return field.

e. `tests/test_scaffold.py`: replace `test_registry_entry_additive_only` (and its header comment) with:

```python
# Test 4: registry.ts is not edited (it collects configs by glob); the config carries its order
# ---------------------------------------------------------------------------

def test_registry_is_not_edited_and_config_has_order(scaffold_env):
    """registry.ts stays byte-identical; the new config.ts gets the next display order."""
    tmp_path, games_src, registry_path = scaffold_env
    examples_dir = tmp_path / "examples"
    _make_ts_example(examples_dir, "new-concept")
    (games_src / "horse_racing").mkdir()
    (games_src / "horse_racing" / "config.ts").write_text("  gameId: 'horse_racing',\n  order: 50,\n", encoding="utf-8")

    original = registry_path.read_text(encoding="utf-8")

    result = studio_scaffold_game("new-concept", target_type="ts_native")

    assert "error" not in result
    assert result["registry_modified"] is False
    assert registry_path.read_text(encoding="utf-8") == original
    config = (games_src / "new_concept" / "config.ts").read_text(encoding="utf-8")
    assert "  order: 60," in config
```

f. `tests/test_studio_promote.py`: replace `test_generate_registry_entry_adds_import_and_array_entry` with:

```python
def test_generate_registry_entry_leaves_registry_alone_and_sets_order(registry_env) -> None:
    """registry.ts collects configs by glob: it stays byte-identical; the new config gets the next order."""
    tmp_path, games_src, registry_path = registry_env
    original = registry_path.read_text(encoding="utf-8")
    (games_src / "horse_racing").mkdir()
    (games_src / "horse_racing" / "config.ts").write_text("  gameId: 'horse_racing',\n  order: 50,\n", encoding="utf-8")

    result = studio_generate_registry_entry(
        "slime-garden", "A slime breeding sandbox."
    )

    assert "error" not in result
    assert result["import_name"] == "slimeGardenConfig"
    assert result["registry_modified"] is False
    assert registry_path.read_text(encoding="utf-8") == original
    config = (games_src / "slime_garden" / "config.ts").read_text(encoding="utf-8")
    assert "  order: 60," in config
```
and change the comment `# Refusal could be "config.ts already exists" or "already in registry.ts"` in `test_generate_registry_entry_refuses_duplicate_slug` to `# Refusal is "config.ts already exists"`.

## 4. What NOT to do

- Do not edit `ts/` (D1.1 owns it), `docs/children.json`, `tests/fixtures/demo_lists_snapshot.json`, or `studio_mcp/import_fixer/tests/fixtures/resolve_source_baseline.json` (stale baseline: controller regenerates).
- Do not run `scripts/regen_resolve_source_baseline.py`, `uv run python -m studio.demos index`, or `python -c` (the sandbox refuses them).
- Do not make `scripts/studio_catalogue.py` import `studio_mcp`; do not change `_extract_registry_games` or its old-shape test.
- Do not remove `import_name`, `color_for`, `read_zip_metadata`, `studio_mcp/demos/registry.py`, or the `import_name` / `registry_modified` keys the two tools return.
- Do not run the `studio_mcp/pipeline_audit` test directory: it takes about 7 minutes and rewrites `docs/state/PipelineAuditReport.*`. Run only the files named in section 5.
- Do not touch protected repos, `archive/`, or deploy or rebuild anything.

## 5. Verification

```
uv run python --version
```
Expected: `Python 3.12.x`. Verified on this machine: `Python 3.12.12`.

Baseline on a tree with D1.1 applied (verified 2026-10-04): the failing command in section 1 (`3 failed, 44 passed`). Baseline on origin/main before D1.1 (same command): `1 failed, 46 passed` (the one is the stale-fixture test above).

After editing (verified 2026-10-04 by applying exactly these steps on top of D1.1 in a scratch worktree):
```
uv run pytest -q -p no:cacheprovider tests/test_registry_files.py studio_mcp/pipeline_audit/tests/test_repo_state.py studio_mcp/import_fixer/tests/test_source_resolver_unchanged.py tests/test_studio_catalogue.py tests/test_demos_naming_register.py tests/test_scaffold.py tests/test_studio_promote.py
```
Expected tail: `1 failed, 47 passed`, the one failure being `test_source_resolver_unchanged_for_all_registry_slugs` with `registry-only=['coin_pusher_arcade', 'voidrift_particle_sandbox'], baseline-only=[]`. Any other failure is yours.

Source checks (Grep tool, one call each): `studio_mcp/demos/register.py` no longer contains `insert_registry_entry`, `IMPORTS_END` or `add_gitignore_line`; `studio_mcp/scaffold.py` and `studio_mcp/tools.py` no longer contain `registry_path.write_text`;
`git status` shows `.gitignore` and `ts/` unchanged.

## 6. Rules for this run

- This run is NON-INTERACTIVE. A tool call that needs a confirmation is rejected and the run ends mid-task.
- ONE simple command per tool call. No `;`, `&&`, `||`, `|` chains and no redirects. The sanctioned command forms are the `uv run python --version` line and the `uv run pytest -q -p no:cacheprovider ...` lines in section 5.
  Do not use `ls`, `Get-ChildItem` or `cat`: use Read, Glob and Grep. No live process probing.
- Do not install, download or fetch anything. Do not read outside this worktree. Do not search or hunt for facts: every path and quoted line you need is above. If a path is missing or a quoted line differs from the file,
  STOP and write why in the Status row. If the glob-shaped `registry.ts` from D1.1 is not what you find (it still has `import ... from './<id>/config'` lines), STOP: D1.1 has not merged.
- Never commit to main, never push, never deploy. Work stays on your `directive/<slug>` branch; commit there. Only Robert merges.
- Do not create scratch or debug files in the repo (deleting is denied in this sandbox); use `.devin-scratch/` if you need one and leave it.
- No absolute paths inside this repo's checkout in any file you write; use repo-relative paths.
- Do not run `agentflow lint` or any agentflow command. Do NOT run `uv run python -m studio.demos index` or `python -c`.
- New logic goes in the small new module named above (SOLID/SRP/KISS); no file over 600 lines; do not grow a file already over 600 lines by more than 10 net lines (`studio_mcp/tools.py` only shrinks here).
- Status row meanings: when every Completion criteria box is checked and the verification tails are in the log line, set the row to **Review** (this is "Done" for the run). Never set it to Done: only Robert or Claude marks Done
  after merge. If you stop partway, set it to Blocked and write why.

## 7. Completion criteria

- [ ] `studio_mcp/demos/registry_files.py` and `tests/test_registry_files.py` exist with the content in Steps 1-2.
- [ ] The three readers use the glob rule (Step 3) and the new catalogue test exists.
- [ ] The three writers no longer edit `registry.ts` or `.gitignore` and write `order` into new configs (Step 4); their tests are updated as listed.
- [ ] The pytest line in section 5 ends `1 failed, 47 passed` with only the known stale-fixture failure (real tail pasted, including that failure's message line).
- [ ] No file outside Scope changed.
- [ ] The Status row is set to Review with a one-line log entry.

## Sandbox needs

none

## 8. Report

Findings first: files created (2) and changed (10 Python files, 6 of them tests). Evidence second: the real tails of `uv run python --version` and the pytest command, including the one expected failure message. Then say plainly what you did
not run: the Node-backed registry tests (`tests/test_demos_registry_parity.py` etc.; D1.2 retires the snapshot they use) and the `pipeline_audit` directory. Recommended action: review; the controller regenerates
`resolve_source_baseline.json`, merges D1.1 and D1.1b together, then runs the full Python suite (`uv run pytest -q`).

## Forbidden Actions

- Committing to or pushing main; pushing at all; deploying; installing or fetching anything; reading outside the worktree; touching protected repos; editing `archive/`, `docs/children.json`, `tests/fixtures/demo_lists_snapshot.json`,
  `resolve_source_baseline.json`, `.gitignore` or anything under `ts/`; running `uv run python -m studio.demos index`.

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
- 2026-10-04 10:47 · robert-claude-laptop · none → Queued
- 2026-10-04 10:48 · robert-claude-laptop · Queued → Approved — lint override: stale MCP lint; new-file markers present; author ran baseline and after proofs
<!-- queue:end -->
