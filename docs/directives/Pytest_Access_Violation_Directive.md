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
| Status | Draft |
| Assigned to | devin |
| Branch | - |
| Base branch | - |
| Base commit | - |

**Status log**
- 2026-10-10 · robert-claude · none → Draft — Intermittent 0xC0000005 in pre-push pytest stage; not reproduced in diagnosis.
<!-- queue:end -->
