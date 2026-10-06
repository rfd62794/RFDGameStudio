# slither_rogue: whole-run checks through the real Lua (S)

**Depends on:** none.
**Read first** (everything this run needs is pasted below; these are the files to open):
`tests/test_slither_rogue.py` (the 14 existing tests and the fixture-loading pattern), `tests/fixtures/slither_rogue/logic.lua`, `tests/fixtures/slither_rogue/render.lua`, `docs/demos/slither_rogue/DIRECTION.md` (Replan step 2).

## 1. Why this exists

The direction says slither_rogue's "run logic and balance [are] untested". That was true of the TypeScript side; the Python suite already runs the real Lua headless (`tests/test_slither_rogue.py`: init, one tick, a game-over event, the magnet nerf, hunters). What it does not do is play a whole run: nothing proves that a snake steering at fruit scores, that nothing errors over hundreds of ticks, or that a run ends exactly once when the clock runs out.
Measured on origin/main `889dd21e` (2026-10-04): `uv run python --version` is `Python 3.12.12`; `uv run pytest -q tests/test_slither_rogue.py` gives `14 passed in 0.22s`. (The evolution-card trigger itself is already covered there by `test_check_evolution_trigger_*`.)

## 2. Scope

1. New test file only: `<!-- new: tests/test_slither_rogue_runs.py -->`. It uses `tests/fixtures/slither_rogue/` (never `games/` directly) with seed 42, like its neighbour. No source file changes.

## 3. The work

Create `tests/test_slither_rogue_runs.py` with exactly this content:

```python
"""test_slither_rogue_runs.py: whole-run checks for Slither Rogue (headless, fixtures only).

Plays many ticks through the real Lua (tests/fixtures/slither_rogue/), steering at the
nearest fruit, so a regression that breaks the run (errors, no scoring, no game over,
no growth) fails here. Seed 42 throughout.
"""

import math
from pathlib import Path

import yaml

from studio.executor import Executor
from studio.loader import load_engine_source

FIXTURES_DIR = Path(__file__).parent / "fixtures" / "slither_rogue"
LUA_SOURCE = "\n\n".join(
    (FIXTURES_DIR / f).read_text(encoding="utf-8")
    for f in ["utils.lua", "state.lua", "physics.lua", "collision.lua", "render.lua", "logic.lua"]
)
DATA = yaml.safe_load((FIXTURES_DIR / "data.yaml").read_text(encoding="utf-8"))
_systems = yaml.safe_load((FIXTURES_DIR / "systems.yaml").read_text(encoding="utf-8")) or {}
ENGINE_SOURCE = load_engine_source(_systems.get("engine_systems", []))

DT = 1 / 30


def _config(duration: float) -> dict:
    arena = dict(DATA["arena"])
    arena["num_npcs"] = 2
    arena["num_fruits"] = 12
    return {
        "arena": arena,
        "fruit": DATA["fruit"],
        "player_stats": DATA["player_stats"],
        "player_preset": DATA["player_presets"][0],
        "npc_profiles": DATA["npc_profiles"],
        "npc_stats": DATA["npc_stats"],
        "evolution_cards": DATA["evolution_cards"],
        "active_evolutions": {},
        "game_duration": duration,
    }


def _steer(state: dict) -> dict:
    """Mouse vector from the head to the nearest fruit."""
    hx, hy = state["player"]["segs_x"][0], state["player"]["segs_y"][0]
    fruits = state["fruits"]
    if isinstance(fruits, dict):
        fruits = list(fruits.values())
    if not fruits:
        return {"control_type": "mouse", "mouse_x": 10, "mouse_y": 0, "keys": {}}
    f = min(fruits, key=lambda f: math.hypot(f["x"] - hx, f["y"] - hy))
    return {"control_type": "mouse", "mouse_x": f["x"] - hx, "mouse_y": f["y"] - hy, "keys": {}}


def _play(duration: float, ticks: int):
    ex = Executor(LUA_SOURCE, seed=42, engine_source=ENGINE_SOURCE)
    ex.call("init_game", _config(duration))
    state = ex.call("tick_game", DT, {"control_type": "mouse", "mouse_x": 10, "mouse_y": 0, "keys": {}})
    events = list(state["events"])
    for _ in range(ticks):
        state = ex.call("tick_game", DT, _steer(state))
        events.extend(state["events"])
    return ex, state, events


def test_a_chasing_run_eats_fruit_and_never_errors() -> None:
    ex, state, events = _play(duration=60.0, ticks=900)
    types = [e["type"] for e in events]
    assert "error" not in types
    assert types.count("fruit_eaten") >= 1
    summary = ex.call("get_state_summary")
    assert summary["score"] > 0
    assert summary["player_segments"] >= DATA["player_stats"]["initial_length"]


def test_a_run_ends_with_one_game_over_when_time_runs_out() -> None:
    ex, state, events = _play(duration=5.0, ticks=240)
    types = [e["type"] for e in events]
    assert types.count("game_over") == 1
    assert ex.call("get_state_summary")["time_left"] == 0
```

## 4. What NOT to do

- No change to any `.lua` or yaml file, to `tests/test_slither_rogue.py`, or to `tests/fixtures/`. Do not read `games/slither_rogue` from the test (fixtures only).
- Do not loosen an assertion if one fails: STOP and write the failing assertion text in the Status row.
- No TypeScript changes, no deploys, no protected repos, no player-layer or cloud-save work.

## 5. Verification

```
uv run python --version
```
Expected: `Python 3.12.x`. Verified on this machine: `Python 3.12.12`.

This adds coverage and passes on origin/main as is (no red step):
```
uv run pytest -q tests/test_slither_rogue_runs.py
```
Real tail from the prototype (2026-10-04): `2 passed in 0.30s`.
Regression check: `uv run pytest -q tests/test_slither_rogue.py` gives `14 passed`.

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
- The Python test command is `uv run pytest -q <file>` run from the repo root (not `python -m pytest`).
- Status row meanings: when every Completion criteria box is checked and the verification tails are in the log line,
  set the row to **Review** (this is "Done" for the run). Never set it to Done: only Robert or Claude marks Done after merge.
  If you stop partway, set it to Blocked and write why.

## 7. Completion criteria

- [ ] `tests/test_slither_rogue_runs.py` exists with the content above; `uv run pytest -q tests/test_slither_rogue_runs.py` shows 2 passed (real tail pasted).
- [ ] `uv run pytest -q tests/test_slither_rogue.py` still shows 14 passed (real tail pasted).
- [ ] No other file changed.
- [ ] The Status row is set to Review with a one-line log entry.

## Sandbox needs

none

## 8. Report

Findings first: the two checks and what they prove. Evidence second: the real pytest tails. Recommended action: review and merge.

## Forbidden Actions

- Committing to or pushing main; pushing at all; deploying; installing or fetching anything; reading outside the worktree; touching protected repos; editing `archive/`, `docs/children.json` or the demo-lists snapshot fixture under `tests/fixtures/`; adding Lua code or changing the engine; any player-layer or save-to-cloud work.

## Required from User

none.

<!-- queue:start -->
## Queue

| Field | Value |
|---|---|
| Status | In progress |
| Assigned to | devin |
| Branch | directive/rfdgamestudio-slither-rogue-run-tests-directive |
| Base branch | - |
| Base commit | 5484952a537e83a5e81b24a1b4b3d8cf4b1b729b |

**Status log**
- 2026-10-04 13:28 · robert-claude-laptop · none → Queued
- 2026-10-06 19:29 · robert-claude-laptop · Queued → Approved
- 2026-10-06 19:46 · dispatcher · Approved → In progress — dispatched devin on personal-laptop in C:\GitHub\.worktrees\RFDGameStudio--rfdgamestudio-slither-rogue-run-tests-directive; lane=default; model=swe-2-high; persona=steady-builder
<!-- queue:end -->
