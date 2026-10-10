# Find and fix the intermittent access violation in the pre-push Python suite

## 1. Why this exists

On 2026-10-10 a push from a fresh worktree ended the hook's Python stage with
`FAILED: Python tests (slow and e2e excluded) (exit -1073741819)` (0xC0000005,
"Windows fatal exception: access violation") at about 21% of the suite, right
after an `RRF` (rerun, rerun, fail) in the progress output. The hook then let
the push through (fixed separately in PR `fix/prepush-enforce-exit`).

A diagnosis run on 2026-10-10 could NOT reproduce it: three full runs of the
hook's selection on clean origin/main (070e6381) finished with no crash
(1 to 7 ordinary failures, all from a missing `ts/node_modules`).

## 2. Reproduction attempts so far

```
uv run --no-sync python -X faulthandler -m pytest \
  -m "not e2e and not slow" -q -p pytest_rerunfailures --reruns 2 --no-header -rN -p no:cacheprovider
```

- At 18-22% the suite is `tests/test_game_metadata.py` then
  `tests/test_generate_dissonance_art.py` (pure Python plus PyYAML), then
  `tests/test_generic_renderer.py` (pygame, sets `SDL_VIDEODRIVER=dummy` only
  via `os.environ.setdefault` at import time).
- Suspects, most likely first: (1) pygame/SDL objects used after
  `pygame.quit()` across test modules (`tests/test_generic_renderer.py`,
  `tests/test_ui_*.py`), where a rerun re-enters a destroyed display;
  (2) the `RRF` itself, since a rerun re-runs setup of a test that had a native
  failure; (3) a subprocess/node (rolldown) interaction in
  `tests/test_game_metadata.py` when `ts/node_modules` is absent.

## 3. The work

1. Reproduce: run the command above with `-v` in a FRESH worktree (no
   `ts/node_modules`) several times, and with `-p no:randomly` if present.
   Keep the faulthandler traceback; it names the Python frame that crashed.
2. Bisect by file from the traceback, then run that file alone with `-v`.
3. Fix at the cause (destroyed-object access, or missing dummy drivers). If it
   is only environment, set `SDL_VIDEODRIVER=dummy` and `SDL_AUDIODRIVER=dummy`
   in the root `conftest.py` (the pytest-wide conftest; there is no
   `tests/conftest.py`) before any pygame import.
4. Add `faulthandler_timeout`/`-X faulthandler` to `scripts/check.ps1`'s pytest
   call so the next crash names its frame in the hook output.

## 4. What NOT to do

Do not touch protected repos. Do not weaken the hook. Do not mark tests
`slow` to dodge the crash.

## 5. Completion criteria

Five consecutive full runs of the hook's pytest selection with no access
violation, and the traceback-naming change in `scripts/check.ps1`.

## Verification

Run from the repo root in a fresh worktree. First command is the exact
selection `scripts/check.ps1` runs in the pre-push hook; the second re-runs
the suspect module alone. Set `PYTEST_DISABLE_PLUGIN_AUTOLOAD=1` in the shell
first, as `scripts/check.ps1` does before its pytest call.

```
uv run --no-sync python -m pytest -m "not e2e and not slow" -q -p pytest_rerunfailures --reruns 2
uv run --no-sync python -m pytest -v tests/test_generic_renderer.py -p pytest_rerunfailures --reruns 2
```

Expected: no `0xC0000005` / "Windows fatal exception" in either run. Exit 0 on
the first run is the pass bar; the second is the bisect check and must also
exit 0. Five consecutive clean runs of the first command satisfy section 5.

## Sandbox needs

- Exec(uv run --no-sync python -m pytest)

<!-- queue:start -->
## Queue

| Field | Value |
|---|---|
| Status | Done |
| Assigned to | devin |
| Branch | directive/rfdgamestudio-pytest-access-violation-directive |
| Base branch | - |
| Base commit | 14b8cc261286647081b6189da7dd08ca2c14b8d4 |
| Head commit | d94df2e26be2b5dbea90bd57d6d8f280c1398a68 |
| Head remote | rfd62794/rfdgamestudio |

**Status log**
- 2026-10-10 · robert-claude · none → Draft — Intermittent 0xC0000005 in pre-push pytest stage; not reproduced in diagnosis.
- 2026-10-10 00:32 · robert-claude-laptop · Draft → Queued — Queued by the laptop overseer 2026-10-10: the pre-push hook now blocks on any failed stage (PR #270), so the intermittent pytest access violation will block pushes until it is found.
- 2026-10-10 00:38 · robert-claude-laptop · Queued → Approved — lint override: Line 42 is prose stating that tests/conftest.py does NOT exist (the real root conftest.py is the cited path); not a path to read.
- 2026-10-10 00:39 · dispatcher · Approved → In progress — dispatched devin on personal-laptop in C:\GitHub\.worktrees\RFDGameStudio--rfdgamestudio-pytest-access-violation-directive; lane=default; model=swe-2-high; persona=steady-builder; agent_id=01M4J1PWFG6V1MJEY1HBHRYJ8J
- 2026-10-10 00:39 · dispatcher · worktree C:\GitHub\.worktrees\RFDGameStudio--rfdgamestudio-pytest-access-violation-directive; copied ts/src/games/game-metadata.json; provisioned: uv sync --frozen; venv pythonw swap
- 2026-10-10 01:23 · devin-overseer (delegated) · In progress → Review — SDL_VIDEODRIVER+SDL_AUDIODRIVER=dummy now set suite-wide in root conftest.py before any pygame import (several test modules set only VIDEODRIVER); -X faulthandler added to scripts/check.ps1 pytest call. 5 consecutive full runs of the hook selection clean (977 passed, exit 0 each), plus a 6th via the real pre-push hook on push. Crash itself never reproduced; fix covers the missing-dummy-driver cause and instruments the hook for the next occurrence.; under delegate.envelope [origin] spent: devin 16 min est. n/a
- 2026-10-10 07:12 · robert-claude-laptop · Review → Done — note: PR #276 merged 2026-10-10 on Robert's "merge as diagnostics": SDL dummy drivers suite-wide in conftest.py, -X faulthandler in scripts/check.ps1; 6 clean hook-selection runs, the 0xC0000005 never reproduced. The pre-push hook is enforced since #270, so a recurrence blocks the push and names its frame.
<!-- queue:end -->
