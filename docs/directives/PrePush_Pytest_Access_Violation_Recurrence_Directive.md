# RFDGameStudio: diagnose the pre-push pytest access-violation recurrence without weakening the hook

**Assignee:** devin. **Depends on:** none. Size: M.

## 1. Why this exists

The pre-push hook regressed again on `personal-laptop` after the 2026-10-10 fix in `Pytest_Access_Violation_Directive.md` was marked Done. The earlier mitigation is present on `main`: root `conftest.py` sets SDL dummy drivers before test modules import pygame, and `scripts/check.ps1` already runs pytest with `-X faulthandler` and the explicit rerun plugin.

Two finished branches still had to be pushed once with `git push --no-verify` on 2026-10-12 because the hook's Python stage died with Windows `0xC0000005`:

- Graphics branch `directive/rfdgamestudio-graphics-boundary-doc-directive` at `edaab7b15aaa7a02d967b69195213a15a8d78f17`: crash reported in `tests/test_intake.py` near the 21% mark. That file is pure Python, so treat it as the victim frame where heap corruption surfaced, not the cause.
- Creature branch `directive/rfdgamestudio-creature-golden-snapshots-directive` at `97c539654d9eab70d6e60773ff7e2c99e0b4e871`: deterministic crash inside `pygame_gui`'s `ui_shadow.py` while running `tests/test_generic_renderer.py::test_horse_racing_renderer_uses_generic_pipeline` (`HorseRacingRenderer()` construction).

Home Tower could not reproduce either crash from the repo root on `main`: `uv run pytest -q -p no:cacheprovider tests/test_intake.py` passed 17 tests, and `uv run pytest -q -p no:cacheprovider tests/test_generic_renderer.py` passed 30 tests (two existing label-size warnings only). Treat those as baseline evidence, not proof the hook is healthy: the laptop failure happened under `.githooks/pre-push` -> `scripts/check.ps1`, with `PYTEST_DISABLE_PLUGIN_AUTOLOAD=1`, `-p pytest_rerunfailures --reruns 2`, and the full `not e2e and not slow` selection.

The strongest new lead is a dual-provider collision: `pyproject.toml` directly declares `pygame>=2.5` while `pygame_gui` depends on `pygame-ce`; `uv.lock` records both `pygame` and `pygame-ce`. Both distributions install files into the same `pygame/` package directory, so fresh `uv sync` runs can leave a machine with a mixed/coherent set of Python files, `.pyd` modules, and `SDL2.dll` depending on write order. That explains why identical code can pass five times on one day and crash deterministically in a different fresh worktree later.

The likely native path is `HorseRacingRenderer()` -> `PyGameEngine.__init__` (`pygame.init()` and `pygame.display.set_mode`) -> `pygame_gui.UIManager` -> `UIAppearanceTheme._preload_shadow_edges()` -> `ShadowGenerator.create_shadow_corners` in `pygame_gui/core/ui_shadow.py`, which calls `pygame.transform.smoothscale`, `transform.rotate`, `transform.flip`, `draw.circle`, and blended `Surface.blit` operations.

## 2. Scope

1. Reproduce first, read-only. In the dispatched worktree, run the closest sandbox-safe form of the hook's Python leg: `uv run pytest -m "not e2e and not slow" -q -p pytest_rerunfailures --reruns 2`, with `PYTEST_DISABLE_PLUGIN_AUTOLOAD=1` and `PYTHONFAULTHANDLER=1` set in the tool environment where supported. Record the exact last pytest node and native/Python frames. If the full selection does not reproduce after two runs, bisect `tests/test_intake.py` and `tests/test_generic_renderer.py` under the same settings.
2. Check the pygame provider set before changing code. Use read/list tools on `.venv/Lib/site-packages` to determine whether both `pygame-*.dist-info` and `pygame_ce-*.dist-info` exist, then use a temporary test or existing test runner to report `pygame.ver`, `pygame.get_sdl_version()`, and `pygame.__file__`. Do not use a `python -c` one-liner; it is intentionally not grantable in a dispatched run.
3. Fix at the narrowest safe level, in this order:
   - Force headless drivers for the hook run: `scripts/check.ps1` should assign `$env:SDL_VIDEODRIVER = "dummy"` and `$env:SDL_AUDIODRIVER = "dummy"` before pytest, and root `conftest.py` may use assignment rather than `setdefault` if a pre-set real driver is part of the failure.
   - Remove or centralize repeated pygame lifecycle churn if needed: mid-suite `pygame.quit()` calls plus later `display.set_mode`/`UIManager` construction are plausible stale-surface/double-free inputs. Prefer a session fixture or removing unnecessary `quit()` calls over touching render code.
   - If evidence proves the dual-provider collision is the cause, do not hand-edit `uv.lock` and do not weaken the hook. Make the smallest `pyproject.toml` dependency correction only if the run can update the lock through an allowed path; otherwise set Blocked with a precise handoff asking Robert/laptop to run `uv lock` and `uv sync --frozen` on the branch.
   - Only if all safe fixes fail, isolate the single implicated pygame_gui shadow path with a counted baseline. Do not deselect whole files.
4. Make the next failure actionable. Extend `scripts/check.ps1`/pytest configuration only if needed so a future `0xC0000005` prints the exact test node and Python/native stack in hook output. Prefer existing pytest/faulthandler knobs over new dependencies.

## 3. Forbidden Actions

- Do not disable the pre-push hook, add a blanket `--no-verify`, bypass `scripts/check.ps1`, or mark broad test groups `slow`/`e2e` to dodge the crash.
- Do not touch protected repos, game logic, Lua, TS source, or unrelated tests.
- Do not "fix" `tests/test_intake.py`; it is a victim frame.
- Do not remove the existing suite-wide dummy-driver protection or the rerun plugin.
- Do not rerun `uv sync --frozen`, `uv lock`, `npm ci`, or other environment mutation inside the dispatched worktree; the dispatcher already provisions it.
- Do not mark Done unless the merge evidence is reviewed separately.

## 4. Verification

From the dispatched worktree on the directive branch:

1. Baselines:
   - `uv run pytest -q -p no:cacheprovider tests/test_intake.py`
   - `uv run pytest -q -p no:cacheprovider tests/test_generic_renderer.py`
2. Bisect the named crash site:
   - `uv run pytest -vv -p pytest_rerunfailures --reruns 2 tests/test_intake.py tests/test_generic_renderer.py`
   - `uv run pytest -q -p no:cacheprovider tests/test_generic_renderer.py::test_horse_racing_renderer_uses_generic_pipeline tests/test_generic_renderer.py::test_horse_racing_renderer_render_no_crash`
3. Closest hook Python selection, with `PYTEST_DISABLE_PLUGIN_AUTOLOAD=1` and `PYTHONFAULTHANDLER=1` where supported:
   - `uv run pytest -m "not e2e and not slow" -q -p pytest_rerunfailures --reruns 2`
4. A narrow regression test or check that proves the selected fix/isolation covers the implicated path.
5. After the fix, three consecutive clean runs of the closest hook Python selection; if that is too expensive for the run, report the largest completed consecutive-run count honestly instead of claiming three.
6. `git diff --stat` and `git status -sb` before the report.

## Sandbox needs

- Exec(uv run pytest -q -p no:cacheprovider tests/test_intake.py)
- Exec(uv run pytest -q -p no:cacheprovider tests/test_generic_renderer.py)
- Exec(uv run pytest -m "not e2e and not slow" -q -p pytest_rerunfailures --reruns 2)
- Exec(uv run pytest -vv -p pytest_rerunfailures --reruns 2 tests/test_intake.py tests/test_generic_renderer.py)
- Exec(git diff --stat)
- Exec(git status -sb)

## Required from User

Only if the dual-provider diagnosis is proven and the run cannot update `uv.lock` through an allowed path: run `uv lock` and `uv sync --frozen` on the directive branch, then hand the worktree back for verification.

## Rules for this run

- This run is NON-INTERACTIVE. A tool call that needs a confirmation is rejected and the run ends mid-task.
- ONE simple command per tool call; no shell chains except the listed verification commands as written.
- Work on `directive/rfdgamestudio-prepush-pytest-access-violation-recurrence-directive`; never commit to main, never push main, never deploy.
- Keep the change surgical and preserve the hook's blocking behavior.

## Completion criteria

- [ ] The exact crashing node/call is named, or the report clearly proves Home Tower cannot reproduce the laptop-only crash.
- [ ] The pygame/pygame-ce provider state is recorded and, if implicated, handled through a real lockfile path rather than a hand edit.
- [ ] The hook still blocks on a nonzero Python stage; no blanket skip or hook bypass was added.
- [ ] The recurrence is fixed or the single implicated native-risk path is narrowly isolated with a counted baseline.
- [ ] Hook or pytest output now identifies the test node and native/Python stack on recurrence.
- [ ] The largest completed clean-run count and all real command tails are reported.

## Report

Start with reproduction evidence, the exact implicated node/call, and the provider-state finding. Include the pass/crash counts from baseline, bisect, and post-fix hook selection. State whether the outcome was a true fix, a narrow isolation, or a Blocked handoff for lockfile regeneration. End with `Follow-ups (not in this directive): <anything found but not fixed, or "none">`.

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
- 2026-10-12 · devin-home-overseer · Draft → Draft — added delegated evidence: exact `test_horse_racing_renderer_uses_generic_pipeline`/`pygame_gui ui_shadow.py` path, `test_intake.py` as GC victim frame, and the pygame/pygame-ce dual-provider lead
<!-- queue:end -->
