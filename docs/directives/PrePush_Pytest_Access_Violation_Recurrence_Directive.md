# RFDGameStudio: diagnose the pre-push pytest access-violation recurrence without weakening the hook

**Assignee:** devin. **Depends on:** none. Size: M.

## 1. Why this exists

The pre-push hook regressed again on `personal-laptop` after the 2026-10-10 fix in `Pytest_Access_Violation_Directive.md` was marked Done. The earlier mitigation is present on `main`: root `conftest.py` sets `SDL_VIDEODRIVER=dummy` and `SDL_AUDIODRIVER=dummy` before test modules import pygame, and `scripts/check.ps1` already runs pytest with `-X faulthandler` and the explicit rerun plugin.

Two finished branches still had to be pushed once with `git push --no-verify` on 2026-10-12 because the hook's Python stage died with Windows `0xC0000005`:

- Graphics branch `directive/rfdgamestudio-graphics-boundary-doc-directive` at `edaab7b15aaa7a02d967b69195213a15a8d78f17`: crash reported in `tests/test_intake.py`.
- Creature branch `directive/rfdgamestudio-creature-golden-snapshots-directive` at `97c539654d9eab70d6e60773ff7e2c99e0b4e871`: crash reported inside `pygame_gui`'s `ui_shadow.py` while running `tests/test_generic_renderer.py`.

Home Tower could not reproduce either crash from the repo root on `main`: `uv run pytest -q -p no:cacheprovider tests/test_intake.py` passed 17 tests, and `uv run pytest -q -p no:cacheprovider tests/test_generic_renderer.py` passed 30 tests (two existing label-size warnings only). Treat those as baseline evidence, not proof the hook is healthy: the laptop failure happened under `.githooks/pre-push` -> `scripts/check.ps1`, with `PYTEST_DISABLE_PLUGIN_AUTOLOAD=1`, `-p pytest_rerunfailures --reruns 2`, `uv sync --frozen`, metadata generation, `tsc`, and the full `not e2e and not slow` selection.

## 2. Scope

1. Reproduce first, read-only. In a clean Home Tower worktree on current `origin/main`, run the exact Python selection used by `scripts/check.ps1`, with `PYTEST_DISABLE_PLUGIN_AUTOLOAD=1`, `uv sync --frozen`, `python -X faulthandler -m pytest -m "not e2e and not slow" -q -p pytest_rerunfailures --reruns 2`. Keep the full faulthandler/native traceback and the last pytest node id. If the full selection cannot reproduce after two runs, bisect `tests/test_intake.py` and `tests/test_generic_renderer.py` under the same environment and record pass counts.
2. Name the exact crashing call. If faulthandler still stops at `pygame_gui` or SDL without the pytest node, run the suspect file alone under `-vv`/`--capture=no` with the same plugin/autoload settings and, if needed, a temporary local-only diagnostic wrapper that records `PYTEST_CURRENT_TEST`; do not commit diagnostic-only output plumbing unless it permanently helps hook triage.
3. Fix the cause at the narrowest level, in this order: (a) correct a missing driver/env or object-lifetime bug; (b) isolate the exact pygame_gui shadow/display path so it cannot touch a real native display during tests; (c) only if the crash is a third-party defect with no safe local fix, mark the single implicated test with a counted `native-risk`/skip mechanism and leave a visible baseline count. Do not skip whole files and do not weaken the hook.
4. Make the next failure actionable. Extend `scripts/check.ps1`/pytest configuration only if needed so a future `0xC0000005` prints the exact test node and Python/native stack in the hook output. Prefer existing pytest/faulthandler knobs over new dependencies.

## 3. Forbidden Actions

- Do not disable the pre-push hook, add a blanket `--no-verify`, bypass `scripts/check.ps1`, or mark broad test groups `slow`/`e2e` to dodge the crash.
- Do not touch protected repos, game logic, Lua, TS source, or unrelated tests.
- Do not remove the existing suite-wide dummy-driver setup or the rerun plugin.
- Do not rerun `uv sync --frozen` inside the dispatched worktree; the dispatcher already provisions it.
- Do not mark Done unless the merge evidence is reviewed separately.

## 4. Verification

From a fresh worktree on the directive branch:

1. Baseline commands and counts:
   - `uv run pytest -q -p no:cacheprovider tests/test_intake.py`
   - `uv run pytest -q -p no:cacheprovider tests/test_generic_renderer.py`
2. Exact hook Python selection, with `PYTEST_DISABLE_PLUGIN_AUTOLOAD=1`:
   - `uv run --no-sync python -X faulthandler -m pytest -m "not e2e and not slow" -q -p pytest_rerunfailures --reruns 2`
3. A narrow regression test or check that proves the selected fix/isolation covers the crashing path.
4. After the fix, three consecutive clean runs of the exact hook Python selection; if it is too expensive for the run, report the largest completed consecutive-run count honestly instead of claiming three.

## Sandbox needs

- Exec(uv run pytest -q -p no:cacheprovider tests/test_intake.py)
- Exec(uv run pytest -q -p no:cacheprovider tests/test_generic_renderer.py)
- Exec(uv run pytest -m "not e2e and not slow" -q -p pytest_rerunfailures --reruns 2)
- Exec(uv run pytest -vv -p pytest_rerunfailures --reruns 2 tests/test_intake.py tests/test_generic_renderer.py)
- Exec(git diff --stat)
- Exec(git status -sb)

## Required from User

none.

## Rules for this run

- This run is NON-INTERACTIVE. A tool call that needs a confirmation is rejected and the run ends mid-task.
- ONE simple command per tool call; no shell chains except the listed verification commands as written.
- Work on `directive/rfdgamestudio-prepush-pytest-access-violation-recurrence-directive`; never commit to main, never push main, never deploy.
- Keep the change surgical and preserve the hook's blocking behavior.

## Completion criteria

- [ ] The exact crashing node/call is named, or the report clearly proves Home Tower cannot reproduce the laptop-only crash.
- [ ] The hook still blocks on a nonzero Python stage; no blanket skip or hook bypass was added.
- [ ] The recurrence is fixed or the single implicated native-risk path is narrowly isolated with a counted baseline.
- [ ] Hook output now identifies the test node and native/Python stack on recurrence.
- [ ] The largest completed clean-run count and all real command tails are reported.

## Report

Start with reproduction evidence, the exact implicated node/call, and whether the outcome was a true fix or a counted narrow isolation. Include the pass/crash counts from the baseline, bisect, and post-fix hook selection. End with `Follow-ups (not in this directive): <anything found but not fixed, or "none">`.

<!-- queue:start -->
## Queue

| Field | Value |
|---|---|
| Status | Draft |
| Assigned to | devin |
| Branch | - |
| Base branch | - |

**Status log**
- 2026-10-12 · devin-home-overseer · none → Draft — laptop pre-push 0xC0000005 recurred despite the 2026-10-10 dummy-driver/faulthandler fix; claimed for drafting via claim-draft; Home Tower targeted baselines are green (17 intake, 30 generic-renderer)
<!-- queue:end -->
