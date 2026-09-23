# RFDGameStudio — Pipeline Audit Extension: Verification Auditor

*August 31 2026 | Read `docs/directives/RFDGameStudio_PipelineAudit_Phase1_Directive.md`
in full before this one — this extends the certified Stage 1 module, it is
not a new package. Three new components added to
`studio_mcp/pipeline_audit/`, each targeting one mechanical check that was
performed by hand, repeatedly, across tonight's real completion reports —
not a hypothetical design, a direct extraction of what actually happened.*

---

> ⛔ **STOP:** Run the real current Stage 1 + Stage 2 test suites
> (`studio_mcp/pipeline_audit/tests`, `studio_mcp/zip_verify/tests`) and
> report the real floor before touching anything. Do not assume any
> number from a prior directive in this repo — every one of them has been
> stale by the time it mattered at least once tonight.

---

## §0 Context

**Why this, not a directive-writer:** every real judgment call tonight —
whether to keep the `Settlement` feature in PlanetForge, which of
`factory_idle`'s two build phases is canonical, whether an open question
should be left open rather than silently resolved — needed a human. Every
*mechanical* check tonight — did the claimed test count actually run, does
a commit's file list match its own message, is a "newly added" function
actually new, does a reported failure repeat in isolation — did not. This
phase mechanizes the second category only. It does not decide CERTIFIED
or BLOCKED; it produces the evidence a human (or Claude, acting as
Pipeline) uses to decide faster.

**Three real incidents tonight, each now a required test fixture, not a
hypothetical:**

1. **Floor-claim mismatch.** The CrossPipeline_VersionTracking completion
   report's own top-line summary ("629 passed, 1 failed") contradicted its
   own pasted raw pytest output two paragraphs later ("635 passed, 1
   failed") — inside the same message. A human caught it by reading both
   numbers. This should never require a human read twice.
2. **Commit-message/diff mismatch.** Real, permanent history in this
   repo: commit `4e3ceb0` is titled "update examples/SlimeBreeder
   submodule to dirty state" but its actual diff contains the entire
   `_is_dist_stale()`/`record_deployed_version()` feature. Commit `4b05c02`,
   titled "Cross-pipeline version tracking: build freshness +
   deployed_version," is really just a path-resolution refactor — the
   function it claims to "add" already existed by the time it ran
   (confirmed via `git log -S`). Both commits are real, permanent, and
   usable as a live fixture — they are not going anywhere.
3. **Flaky test.** `tests/test_shoal.py::test_breed_thresholds_read_from_data`
   failed in three separate full-suite runs tonight and passed every time
   it was re-run in isolation. Real, reproducible, currently in this repo.

**What this phase delivers:**
1. `floor_claim_diff.py` — given a claimed test command and a claimed
   pass/fail/skip count, re-run the command for real and report whether
   the claim matches, reusing `floor_runner.py`'s existing summary
   parsers rather than duplicating them.
2. `commit_claim_audit.py` — given a commit hash and either a claimed file
   list or a claimed "added X" statement, check the real `git show --stat`
   output and (for "added" claims) run `git log -S` to confirm the symbol
   genuinely didn't exist before that commit.
3. `flaky_isolator.py` — given a list of test names that failed in a full
   run, re-run each individually and classify each as `flaky` (passes
   alone) or `real` (fails alone too).

**Explicitly NOT in scope:**
- Any CERTIFIED/BLOCKED/UNVERIFIABLE verdict language — that's Stage 2's
  domain for zip/tracked-dir content, and this phase doesn't produce
  verdicts on completion reports, only structured facts a verdict-maker
  (human or Stage 2-style LLM step) can use.
- Fixing the real `test_breed_thresholds_read_from_data` flakiness itself.
  This phase detects and classifies flakiness; it does not repair it.
- Any change to `floor_runner.py`'s existing parsers — reuse them as a
  library import, do not fork or duplicate their logic.
- Any LLM/OpenRouter call anywhere in this phase. Every check here is
  deterministic — re-run a command, run git, compare strings. If a check
  needs judgment, it doesn't belong in this phase.

---

## §1 Scope Statement

| File | Status | Action |
|---|---|---|
| `studio_mcp/pipeline_audit/floor_claim_diff.py` | New | Re-run a claimed command, diff real vs claimed counts |
| `studio_mcp/pipeline_audit/commit_claim_audit.py` | New | Diff a commit's real `--stat` against a claimed file list; `git log -S` for "added X" claims |
| `studio_mcp/pipeline_audit/flaky_isolator.py` | New | Re-run named failing tests in isolation, classify flaky vs real |
| `studio_mcp/pipeline_audit/floor_runner.py` | Read-only | Import `parse_pytest_summary`/`parse_vitest_summary` from here — do not duplicate |
| `studio_mcp/pipeline_audit/tests/test_floor_claim_diff.py`, `test_commit_claim_audit.py`, `test_flaky_isolator.py` | New | Per §3, using the real fixtures in §0 |

---

## §2 Implementation

### `floor_claim_diff.py`

Responsibility: accept a command string, a claimed passed/failed/skipped
tuple, and a working directory. Run the command for real (subprocess,
same pattern as `floor_runner.py`'s `AsyncTestRunner`-derived approach),
parse the real output using the imported parsers, and return a structured
diff: `matches: bool`, `claimed: tuple`, `real: tuple`, `mismatch_detail:
str | None`.

> ⚠️ RULE: If a completion report's own text contains two different
> numbers for the same run (as the CrossPipeline report did), this tool
> only has one command to actually execute and one real result to compare
> against — it cannot resolve which of the two claimed numbers the
> submitter "meant." Report the real number and flag that multiple
> claimed numbers existed in the source text, don't guess which one to
> reconcile against.

### `commit_claim_audit.py`

Two entry points:

`audit_file_list(commit_hash: str, claimed_files: list[str]) -> dict` —
runs `git show --stat {commit_hash}`, extracts the real touched-file list,
diffs against `claimed_files`. Returns files claimed-but-not-touched and
files touched-but-not-claimed, both real signal — the second is at least
as important as the first (an unclaimed touched file is scope creep even
if every claimed file really was touched).

`audit_addition_claim(symbol: str, commit_hash: str) -> dict` — runs
`git log -S "{symbol}" --oneline` and checks whether `commit_hash` is the
*first* commit in that output touching the symbol. If an earlier commit
already introduced it, the "added" claim is false regardless of what the
message under audit says — return `pre_existing_since: <hash>`.

> ⚠️ RULE: `git log -S` search must be scoped to the real file(s) the
> claim is about, not the whole repo, or an unrelated identical string
> elsewhere (e.g. a test file quoting a function name) produces a false
> "pre-existing" result. Use `git log -S "{symbol}" -- {file}`.

### `flaky_isolator.py`

Responsibility: given a list of `pytest`/`vitest` test node IDs that
failed in a full run, re-invoke each individually. `flaky` = fails in the
full run, passes alone. `real` = fails both ways. Report both categories
plainly — do not silently drop flaky results from a summary the way a
human skimming output might.

---

## §3 Test Anchors

| Test name | Fixture | Behaviour |
|---|---|---|
| `test_floor_claim_diff_detects_real_mismatch` | Synthetic command + wrong claimed count | Reports `matches: False` with the real vs claimed numbers |
| `test_floor_claim_diff_confirms_real_match` | Synthetic command + correct claimed count | Reports `matches: True` |
| `test_commit_claim_audit_detects_unclaimed_file` | Real commit `4e3ceb0` in this repo | Diffing its real `--stat` against a deliberately incomplete claimed file list correctly flags the omission |
| `test_commit_claim_audit_addition_claim_false_positive` | Real commits `4e3ceb0`/`4b05c02`, symbol `_is_dist_stale` | `audit_addition_claim('_is_dist_stale', '4b05c02...')` correctly reports `pre_existing_since` pointing at `4e3ceb0`, not confirming the false "added" claim |
| `test_commit_claim_audit_addition_claim_true_positive` | Same symbol, commit `4e3ceb0` itself | Correctly confirms `_is_dist_stale` genuinely originates in this commit |
| `test_flaky_isolator_classifies_real_flaky_test` | Real test `tests/test_shoal.py::test_breed_thresholds_read_from_data` | Passes in isolation → classified `flaky`, not `real` |
| `test_flaky_isolator_classifies_real_failure_as_real` | Real test `tests/test_chimera_wilds.py::test_data_yaml_parts_match_mbb_source_values` | Fails in isolation too → classified `real`, not `flaky` |

Target: X passing, 0 failing, 0 skipped — real count, reported, not
assumed. Fixtures using real commits (`4e3ceb0`, `4b05c02`) and real
current test names must reference them by exact hash/name and fail loudly
if either is ever missing from history — do not silently skip if a
fixture commit somehow isn't found, that's itself a signal something is
wrong with the repo state.

---

## §4 Completion Criteria

- [ ] Real pre-flight floor for Stage 1 + Stage 2 reported before any
      change
- [ ] All three new components implemented per §2
- [ ] `floor_runner.py`'s parsers imported, not duplicated — confirmed via
      diff that `floor_runner.py` itself is untouched
- [ ] All §3 test anchors present and passing, using the real fixture
      commits/tests named — not synthetic substitutes
- [ ] Live demonstration: run `commit_claim_audit.audit_addition_claim`
      against the real `4b05c02`/`_is_dist_stale` pair and paste the real
      output showing it correctly does NOT confirm the false claim
- [ ] Live demonstration: run `flaky_isolator` against the real
      `test_breed_thresholds_read_from_data` and paste real output
      classifying it `flaky`
- [ ] No CERTIFIED/BLOCKED/UNVERIFIABLE language anywhere in this phase's
      output — confirmed by grep
- [ ] No OpenRouter/LLM call anywhere in this phase — confirmed by grep
      for any import from `openrouter_client`

---

## §5 Quick Reference

| Fact | Value |
|---|---|
| New components | `floor_claim_diff.py`, `commit_claim_audit.py`, `flaky_isolator.py` |
| Reused, not duplicated | `floor_runner.py`'s summary parsers |
| Real fixture commits (permanent, in this repo) | `4e3ceb0` (real feature, mislabeled), `4b05c02` (refactor, mislabeled as the feature) |
| Real fixture test (currently flaky) | `tests/test_shoal.py::test_breed_thresholds_read_from_data` |
| Real fixture test (currently, genuinely failing) | `tests/test_chimera_wilds.py::test_data_yaml_parts_match_mbb_source_values` |
| LLM calls this phase | Zero |
| Produces verdicts | No — produces facts a verdict-maker uses |
| Judgment calls this phase still can't make | Which of two claimed numbers was meant; whether an unclaimed touched file was a real problem or not |

---

*RFD Method | Pipeline Audit Extension | RFDGameStudio | August 2026*
*Director → Pipeline → Agent. This phase does the part that was never judgment in the first place.*
