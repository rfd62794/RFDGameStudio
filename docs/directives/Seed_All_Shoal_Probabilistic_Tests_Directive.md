# Seed every probabilistic shoal test, so the suite stops failing at random

## 1. Why this exists

`tests/test_shoal.py` has **76 tests that exercise the simulation without setting a spawn
seed**, against 15 that set one. Every unseeded test seeds its PRNG from `os.time()`, so the
geometry differs on every run and each of those tests is a latent flake.

This is not theoretical. Measured 2026-09-20, on the same commit, back to back:

- Full non-slow suite, run 1: **724 passed, 0 failed**
- Full non-slow suite, run 2: **1 failed** — `test_fish_school_align_headings`

```
assert final_var < initial_var
E   assert 0.2548742775207019 < 0.17609348112290824
```

Earlier the same evening a *different* one failed: `test_shark_catches_sinking_chunk`,
fixed in `6b482cda` by seeding it. And git history already carries `3c1d32d1`,
*"fix flaky test_breed_thresholds_read_from_data"* — a third instance of the same defect,
fixed one test at a time.

**The repo has a pre-push hook that runs this suite, so any one of these failing blocks
every `git push` from every branch.** Fixing them one at a time as they surface has been
tried three times and has not converged.

## 2. Scope

One file: `tests/test_shoal.py`.

The 15 tests that already set `data["spawn"]["seed"]` show the established pattern - for
example `test_fish_flee_increases_distance_from_shark` and, as of `6b482cda`,
`test_shark_catches_sinking_chunk`.

## 3. The work

1. **Find every test in the file whose outcome depends on the PRNG.** A test qualifies if
   it ticks the simulation and then asserts on something the RNG influences: positions,
   headings, variance, counts, breeding, escapes, catches, spawn geometry.

2. **Give each one a fixed seed**, `data["spawn"]["seed"] = 42`, in the same place the
   existing seeded tests put it — with the other `data["spawn"][...]` setup, before the
   sim is constructed.

3. **If a test fails once seeded**, that is a finding, not a licence to pick a different
   seed until it passes. Seed-shopping hides a real behavioural gap. Leave that test
   failing, note it in the report, and move on.

4. **Leave genuinely deterministic tests alone.** A test that only checks config parsing or
   data shape does not need a seed, and adding one is noise.

## 4. What NOT to do

- **Do not change any assertion**, threshold, or tolerance. If an assertion only passes on
  a lucky seed, report it; do not relax it.
- **Do not try seeds until one passes.** Use 42 everywhere. A test that needs a specific
  seed is telling you something.
- **Do not add retry decorators or `xfail`.**
- **Do not change the simulation** under `studio/` or anywhere else. This is a test-only
  change. If you find a real sim bug, stop and report it.
- **Do not touch any file other than `tests/test_shoal.py`.**

## 5. Verification

```bash
uv run pytest -q -p pytest_rerunfailures tests/test_shoal.py
uv run pytest -q -p pytest_rerunfailures -m "not slow and not e2e"
uv run pytest -q -p pytest_rerunfailures -m "not slow and not e2e"
uv run pytest -q -p pytest_rerunfailures -m "not slow and not e2e"
```

Expected: every run passes with **0 failures and 0 reruns consumed**. Three consecutive
clean full-suite runs is the bar — one pass proves nothing about a flake, which is exactly
how the previous fix looked complete and was not.

## 6. Rules for this run

- This run is **NON-INTERACTIVE**. Any tool call that needs a confirmation is rejected
  outright and the run ends mid-task. Do not install, download or fetch anything - the
  dependencies are already present in this worktree. Do not read outside this working
  directory, and do not use a search, memory or web tool. Everything you need is
  `tests/test_shoal.py` and the seeded examples already inside it.
- The test command for this repo is exactly `uv run pytest -q -p pytest_rerunfailures <file>`.
- Work only on your `directive/<slug>` branch. **Never commit to main, never push, never
  deploy.** Only Robert merges.
- Update this directive's Status row when you finish or stop partway.
- If a tool call is genuinely blocked, stop and write why in the Status row instead of
  trying another way around it.

## 7. Completion criteria

- [ ] Every PRNG-dependent test in `tests/test_shoal.py` sets `data["spawn"]["seed"] = 42`.
- [ ] No assertion, threshold or tolerance was changed.
- [ ] No file other than `tests/test_shoal.py` was touched.
- [ ] Three consecutive full non-slow suite runs pass with 0 failures and 0 reruns.
- [ ] Any test that fails *because* it was seeded is listed in the report, still failing,
      not worked around.

## 8. Report

State how many tests you seeded, how many you judged deterministic and left alone, the
three full-suite results, and any test that failed once seeded — that last list is the
valuable part, because each entry is a real behaviour that only ever passed by luck.

<!-- queue:start -->
## Queue

| Field | Value |
|---|---|
| Status | Review |
| Assigned to | devin |
| Branch | directive/rfdgamestudio-seed-all-shoal-probabilistic-tests-direc |
| Base branch | directive/rfdgamestudio-flaky-shoal-shark-chunk-directive |

**Status log**
- 2026-09-20 21:43 · robert-claude · none → Queued — 76 unseeded probabilistic tests vs 15 seeded; three separate one-at-a-time fixes have not converged, and any one failing blocks every push via the pre-push hook
- 2026-09-20 21:44 · robert-claude · Queued → Approved
- 2026-09-20 21:44 · dispatcher · Approved → In progress — dispatched devin in C:\GitHub\.worktrees\RFDGameStudio--rfdgamestudio-seed-all-shoal-probabilistic-tests-direc
- 2026-09-20 22:30 · claude-heartbeat · In progress → Blocked — run pid 3856 is gone and the directive never moved; started 2026-09-20T21:44:03
- 2026-09-21 14:57 · robert-claude · Blocked → Queued — retry: the run died on 09-19/20, before the dispatch fixes (venv/node_modules junctions); the branch keeps its work
- 2026-09-21 14:57 · robert-claude · Queued → Approved — Robert approved the retry (2026-09-21); the tick dispatches it within the concurrency limit
- 2026-09-22 11:40 · dispatcher · Approved → In progress — dispatched devin in C:\GitHub\.worktrees\RFDGameStudio--rfdgamestudio-seed-all-shoal-probabilistic-tests-direc
- 2026-09-22 11:57 · devin · In progress → Review
<!-- queue:end -->
