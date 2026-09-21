# test_shark_catches_sinking_chunk is flaky and blocks every push

## 1. Why this exists

`tests/test_shoal.py::test_shark_catches_sinking_chunk` fails intermittently in the full
suite and passes reliably on its own. Measured 2026-09-20:

- Alone: `uv run pytest -q tests/test_shoal.py::test_shark_catches_sinking_chunk` — **3/3 passed**.
- Full suite: `uv run pytest -q -p pytest_rerunfailures -m "not slow and not e2e"` —
  **1 failed, 739 passed, 2 rerun**. It survived two automatic reruns.
- One full-suite run before that passed 740/740, so it is genuinely intermittent.

The failure is always the same assertion:

```
assert state["stats"]["chunk_count"] == 0
E   assert 1 == 0
```

This is not cosmetic. The repo has a **pre-push hook that runs this suite**, so the flake
blocks every `git push` from every branch until it is fixed.

There is a precedent fix in this repo for the same class of problem: commit `3c1d32d1`,
*"fix flaky test_breed_thresholds_read_from_data: 5 ticks insufficient for a probabilistic
breed roll"*. Read it before writing your own fix.

## 2. Scope

One test, one file: `tests/test_shoal.py::test_shark_catches_sinking_chunk`.

**Read first:** commit `3c1d32d1` and the surrounding tests in `tests/test_shoal.py`, so the
fix matches how this repo already handles probabilistic simulation tests.

## 3. The work

Find why the chunk is sometimes still present when the assertion runs, and make the test
deterministic about the thing it is actually asserting.

The likely shapes, in the order worth trying:

1. **Too few ticks.** The shark needs N ticks to reach and eat the chunk, and the test
   allows fewer than the worst case. Raise the tick budget, or loop until the condition
   holds with a bounded maximum.
2. **Unseeded randomness.** If the sim draws from `random`, seed it in the test so the run
   is reproducible.
3. **Shared state between tests.** `chunk_count == 1` may be a chunk left by an earlier
   test rather than the one under test. If so, assert on the specific chunk's identity, or
   isolate the fixture.

Prefer the smallest change that makes the assertion true for the right reason. Do not
assert on a weaker condition just to get green — if the shark genuinely fails to catch the
chunk sometimes, that is a simulation finding and belongs in the report.

## 4. What NOT to do

- **Do not delete, skip, or `xfail` the test.** It is the only coverage of this behaviour.
- **Do not add a retry decorator** to paper over it; `pytest_rerunfailures` already reran it
  twice and it still failed.
- **Do not change `studio/` or the shoal simulation itself** unless you find a real bug in
  it. If you do, stop and report it rather than fixing the sim under a test directive.
- **Do not touch any other test**, even one that looks similarly flaky.
- **Do not weaken the assertion** (for example to `<= 1`).

## 5. Verification

```bash
uv run pytest -q -p pytest_rerunfailures tests/test_shoal.py
uv run pytest -q -p pytest_rerunfailures -m "not slow and not e2e"
```

Expected: the targeted file passes, and the full suite passes with **0 failures** and
**0 reruns consumed** by this test. Run the full suite at least twice; a flake that passes
once has not been shown to be fixed.

## 6. Rules for this run

- This run is **NON-INTERACTIVE**. Any tool call that needs a confirmation is rejected
  outright and the run ends mid-task. Do not install, download, or fetch anything — the
  dependencies are already present. Do not read outside this working directory.
- The test command for this repo is `uv run pytest -q -p pytest_rerunfailures <path>`.
  Do not guess another runner.
- Work only on your `directive/<slug>` branch. **Never commit to main, never push, never
  deploy.** Only Robert merges.
- Update this directive's Status row when you finish or stop partway — DirectiveQueueMCP
  reads it across every repo.
- If something is genuinely blocked, stop and write why in the Status row instead of trying
  another way around it.

## 7. Completion criteria

- [ ] The root cause is identified and named in the report (which of the three shapes, or another).
- [ ] The fix is the smallest change that makes the assertion hold for the right reason.
- [ ] `tests/test_shoal.py` passes.
- [ ] The full non-slow suite passes twice in a row with no reruns consumed by this test.
- [ ] The assertion still checks `chunk_count == 0`, not a weakened condition.

## 8. Report

State: the root cause, the change made, and the two full-suite results. If you found a real
simulation bug rather than a test bug, say so plainly and do not fix it here.

<!-- queue:start -->
## Queue

| Field | Value |
|---|---|
| Status | Review |
| Assigned to | devin |
| Branch | directive/rfdgamestudio-flaky-shoal-shark-chunk-directive |
| Base branch | - |

**Status log**
- 2026-09-20 21:13 · robert-claude · none → Queued — flaky test blocks the pre-push hook on every branch; written to the new writing-devin-directives standard
- 2026-09-20 21:13 · robert-claude · Queued → Approved
- 2026-09-20 21:13 · dispatcher · Approved → In progress — dispatched devin in C:\GitHub\.worktrees\RFDGameStudio--rfdgamestudio-flaky-shoal-shark-chunk-directive
- 2026-09-20 21:43 · robert-claude · In progress → Review — Root cause was unseeded spawn PRNG (os.time()), fixed with seed 42 matching the suite's own pattern; commit 6b482cda. Target test fixed and 111 passed. Full suite NOT green twice: run 2 failed on test_fish_school_align_headings, a different test with the same defect. 76 probabilistic shoal tests have no seed vs 15 that do - that class needs its own directive.
<!-- queue:end -->
