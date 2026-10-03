# RFDGameStudio — Import Fixer: Patterns 3 & 4 Directive

*August 31 2026 | Read `docs/directives/RFDGameStudio_ImportFixer_Rung1_Directive.md`
in full before this one. Adds exactly two new patterns to the catalog,
per the explicit rule that adding a pattern is a human decision — this
directive is that decision, made after finding real evidence for both
tonight, not a default expansion.*

---

> ⛔ **STOP:** Run the real current import_fixer + pipeline_audit +
> zip_verify suites and report the real floor (76/0 as of the last
> certified run — confirm it's still that, don't assume). Also confirm,
> via `git ls-files ts/src/games/{slug}` for `dissonance_prototype`,
> `ledger`, `planetforge`, `slimebreeder`, `trinity_siege`,
> `factory_idle`, that each still shows exactly 1 tracked file there —
> these are expected config-only cases (real source lives in the
> allow-listed `examples/` tree), not bugs. If any of the six differs,
> report it before proceeding.

---

## §0 Context

**Both patterns are mechanical in a stronger sense than Patterns 1 and
2** — neither needs an OpenRouter call at all. Pattern 1 and 2's fixes
required a model to generate corrected code. Both new patterns' fixes are
assembled entirely from facts already produced by existing, certified
tools (`source_resolver.py`, `commit_claim_audit.py`) — there's no code
generation step, so there's no windowing/scope-creep risk the way
`fix_generator.py` had to guard against for Patterns 1-2. This is worth
stating plainly rather than building the same guardrails a lower-risk
category doesn't need.

**Pattern 3 — untracked source for a registry-linked game.** The
PlanetForge git-tracking bug, real, found and fixed eight separate times
tonight. Detection is fully mechanical: for a registry slug, does a real
source directory exist on disk that isn't git-tracked, while the
slug has no other tracked source (no zip, no substantial `ts/src/games/`
content)? No manifest is needed — unlike Pattern 1, there's no case where
"this shipped game's source should stay permanently unrecoverable" is
correct, so there's nothing to look up, only to check.

**Pattern 4 — commit message falsely claims to "add" a pre-existing
symbol.** Scoped narrowly, not "commit message doesn't match diff" in
general (too fuzzy to detect mechanically without guessing). Only the
specific, checkable claim: message contains "add/adds/added `<symbol>`"
language, and `commit_claim_audit.audit_addition_claim` proves the symbol
predates the commit. Real fixture already in this repo's own history —
commit `4b05c02`.

**Explicitly NOT in scope:**
- Any OpenRouter/LLM call in either pattern's detector or fix generator.
  Grepping for `openrouter` or `OpenRouterClient` in the new files must
  return zero hits.
- General commit-message-vs-diff mismatch detection beyond the specific
  "add X" claim. That's a judgment call about what a message *should*
  have said — out of scope.
- Actually running `git add`, `git commit`, or `git push` for Pattern 3's
  fix, or pushing Pattern 4's corrective commit. Both produce a proposed
  action (file list + `.gitignore` diff for Pattern 3; commit message
  text for Pattern 4) for human/Claude review — same as Patterns 1-2,
  the fixer never lands its own output.
- Any third or fourth game beyond what's found by scanning the real
  registry. Do not invent test cases beyond the real repo state plus the
  one scratch-reverted fixture per pattern required for the live demo.

---

## §1 Scope Statement

| File | Status | Action |
|---|---|---|
| `studio_mcp/import_fixer/pattern_catalog.py` | Modify (additive) | Add `UNTRACKED_REGISTRY_SOURCE`, `MISLABELED_ADD_CLAIM` — total 4 patterns, not more |
| `studio_mcp/import_fixer/pattern_detector.py` | Modify (additive) | Add `detect_untracked_registry_source()`, `detect_mislabeled_add_claim()` |
| `studio_mcp/import_fixer/tracking_fix_generator.py` | New | Mechanical fix for Pattern 3 — `.gitignore` diff + dry-run file list, no OpenRouter |
| `studio_mcp/import_fixer/commit_note_generator.py` | New | Mechanical fix for Pattern 4 — templated corrective commit text from `commit_claim_audit` output only, no OpenRouter |
| `studio_mcp/zip_verify/source_resolver.py` | Modify (additive) | Expose a tracking-agnostic directory finder (the existing `_find_examples_dir` logic, without the `_is_git_tracked` gate) for Pattern 3's detector to use — existing public behavior (git-tracking required for `resolve_source`) must not change |
| `studio_mcp/import_fixer/tests/test_pattern_detector.py` | Modify (additive) | New tests per §3 |
| `studio_mcp/import_fixer/tests/test_tracking_fix_generator.py`, `test_commit_note_generator.py` | New | Per §3 |

> ⚠️ RULE: The `source_resolver.py` change must not alter what
> `resolve_source()` itself returns for any of the 30 real registry
> slugs — re-run the classification for all 30 before and after this
> phase's change and confirm the output is byte-identical except for the
> new function's addition. This function is used by Stage 2b; breaking
> its existing behavior to serve Pattern 3 would be a regression in
> already-certified code, not progress.

---

## §2 Implementation

### `detect_untracked_registry_source(slug) -> DetectionResult`

For the given registry slug: check whether it has a zip source (via
`_has_intake_zip`, already built) — if so, `no_clean_match`, zip is a
valid recoverable source, an untracked `examples/` copy alongside it is
expected and fine (matches tonight's real finding for `corpworld` /
`kingmaker_squads`). If no zip: check `ts/src/games/{slug}/`'s real
tracked file count — more than 1 real file (not just `config.ts`) means
`no_clean_match`, it's properly ported, nothing to fix. Otherwise, use
the new tracking-agnostic finder to look for a real, on-disk candidate
directory. Zero candidates → `no_clean_match` (genuinely nothing found,
not this pattern's problem — matches `source_resolver`'s existing
`no_source_found` case). Exactly one untracked candidate → `clean_match`.
More than one untracked candidate (the `factory_idle` phase1/phase2
shape) → `ambiguous`, name all candidates, do not guess which is
canonical.

### `tracking_fix_generator.py`

Given a `clean_match` from Pattern 3: construct the `.gitignore`
exception line (`!examples/{dirname}/`), run `git add --dry-run` against
the real candidate directory, and report the real file list — flagging
if `node_modules`/`dist` would be swept in (if so, downgrade to
`ambiguous`, don't propose adding it uncleaned). Output is the proposed
`.gitignore` diff plus the confirmed-clean file list. No `git add`,
`git commit`, or actual file write to `.gitignore` — this generator
produces the proposal, applying it is a separate reviewed step.

### `detect_mislabeled_add_claim(commit_hash) -> DetectionResult`

Parse the commit's message (via `git log -1 --format=%B {commit_hash}`)
for a pattern matching `\b(add|adds|added)\s+` followed by a
backtick-quoted or bare identifier. No such pattern → `no_clean_match`.
Pattern found → run `commit_claim_audit.audit_addition_claim(symbol,
commit_hash, [changed files from the commit])`. If it confirms the claim
is true (symbol really is new here) → `no_clean_match`. If it returns
`pre_existing_since` → `clean_match`. If the message contains multiple
"add X" claims → return one `DetectionResult` per claim, same
non-batching rule as Pattern 2.

### `commit_note_generator.py`

Given a `clean_match`, generate the corrective empty-commit message using
*only* the fields already returned by `audit_addition_claim` — the
symbol, the audited commit hash, and `pre_existing_since`. Template, not
free text:

```
Correction: commit {commit_hash} claims to add `{symbol}`, which
already existed as of {pre_existing_since}.

This empty commit records the accurate mapping for git-log archaeology.
```

> ⚠️ RULE: This generator must not call any model or write any prose
> beyond the fixed template above. If a richer explanation seems
> warranted, that's a human/Claude judgment call for a manual corrective
> commit, not something this pattern automates.

---

## §3 Test Anchors

| Test name | Fixture | Behaviour |
|---|---|---|
| `test_detect_untracked_registry_source_finds_scratch_reverted_case` | Real `examples/planetforge/` copied to a scratch dir and deliberately removed from a scratch git index (simulating pre-fix state) | `clean_match` |
| `test_detect_untracked_registry_source_zip_source_is_no_clean_match` | Real `corpworld` (has intake zip) | `no_clean_match` — zip is a valid source |
| `test_detect_untracked_registry_source_properly_ported_is_no_clean_match` | Real `succession` (48 tracked files in `ts/src/games/succession`) | `no_clean_match` |
| `test_detect_untracked_registry_source_multiple_candidates_is_ambiguous` | Synthetic slug with two untracked candidate dirs (mirrors real `factory_idle` shape) | `ambiguous`, names both |
| `test_tracking_fix_generator_flags_node_modules_leak` | Synthetic dir containing `node_modules/` | Downgrades to `ambiguous`, does not propose the add |
| `test_detect_mislabeled_add_claim_real_4b05c02_case` | Real commit `4b05c02` in this repo, symbol `_is_dist_stale` | `clean_match`, `pre_existing_since` = `4e3ceb0` |
| `test_detect_mislabeled_add_claim_true_addition_is_no_clean_match` | Real commit `4e3ceb0`, same symbol | `no_clean_match` — genuinely first appearance |
| `test_commit_note_generator_output_matches_template_exactly` | Mocked audit result | Output is the fixed template, nothing else |
| `test_source_resolver_unchanged_for_all_30_slugs` | Full registry | `resolve_source()` output identical before/after this phase's change |

Target: X passing, 0 failing, 0 skipped, real count.

**Live demos required at completion, both for real:**
1. Revert a scratch copy of `examples/planetforge/` to untracked, run
   `detect_untracked_registry_source('planetforge')` against it, paste
   the real `clean_match` result and the real proposed `.gitignore` diff
   from `tracking_fix_generator`.
2. Run `detect_mislabeled_add_claim('4b05c02')` for real against this
   repo's actual history, paste the real result, then run
   `commit_note_generator` on it and paste the real generated text.

---

## §4 Completion Criteria

- [ ] Real pre-flight floor reported, and the six expected config-only
      slugs confirmed unchanged before any code is written
- [ ] Exactly 4 patterns in the catalog after this phase — confirmed via
      grep, not 3, not 5
- [ ] Zero `openrouter`/`OpenRouterClient` references anywhere in
      `tracking_fix_generator.py` or `commit_note_generator.py`
- [ ] `source_resolver.py`'s existing `resolve_source()` output confirmed
      byte-identical for all 30 real registry slugs, before vs. after
- [ ] All §3 test anchors present and passing, real fixture commits/slugs
      used, not synthetic substitutes for the ones marked "real"
- [ ] Both live demos run for real, real output pasted in full
- [ ] Confirmed: neither generator calls `git add`, `git commit`, or
      writes to any tracked file — grep confirms
- [ ] Final full test floor (import_fixer + pipeline_audit + zip_verify)
      reported, real count

---

## §5 Quick Reference

| Fact | Value |
|---|---|
| Patterns after this phase | 4 total — bound_mismatch, silent_fallback, untracked_registry_source, mislabeled_add_claim |
| OpenRouter calls in either new pattern | Zero |
| Real fixture for Pattern 3's live demo | Scratch-reverted `examples/planetforge/` |
| Real fixture for Pattern 4 | Commits `4b05c02` (false claim) / `4e3ceb0` (true origin), already in this repo's history |
| `source_resolver.py`'s existing behavior | Must not change for any of the 30 real slugs |
| Adding pattern #5 | Still a human decision, still not this phase's job |

---

*RFD Method | Import Fixer | Patterns 3 & 4 | RFDGameStudio*
*Two more cataloged repairs, both mechanical enough to need no model at all — the safest kind of expansion this ladder has, because there's nothing here for a model to get wrong.*

<!-- queue:start -->
## Queue

| Field | Value |
|---|---|
| Status | Superseded |
| Assigned to | claude |
| Branch | directive/rfdgamestudio-rfdgamestudio-importfixer-pattern-8f08ab |
| Base branch | - |
| Base commit | 4f1db4508cfa28cce657ef7a5cf2f81e226d5ff5 |

**Status log**
- 2026-09-27 16:07 · agentflow-tick · none → Queued — suggested by heartbeat: Code and tests appear to be built already; claude checks the completion list (floor, live demos, greps) and marks Done
- 2026-09-28 19:25 · devin-overseer (delegated) · Queued → Approved
- 2026-09-29 03:55 · dispatcher · Approved → In progress — dispatched claude on personal-laptop in C:\GitHub\.worktrees\RFDGameStudio--rfdgamestudio-rfdgamestudio-importfixer-pattern-8f08ab; copied ts/src/games/game-metadata.json; lane=sonnet (default); model=claude-sonnet-5; persona=steady-builder
- 2026-09-29 04:06 · claude-dispatched · In progress → Blocked — set_directive_status(status='Review') was refused by the queue tool: "branch directive/rfdgamestudio-rfdgamestudio-importfixer-pattern-8f08ab has no commits beyond main" -- not retried. Root cause: all §1 scope work (pattern_catalog.py's 4 patterns, pattern_detector.py, tracking_fix_generator.py, commit_note_generator.py, source_resolver.py's additive finder, all §3 tests) was already committed and merged into origin/main by the prior Rung1 devin run before this run started; this branch's HEAD (4f1db450) is an ancestor of origin/main, so it carries zero distinct commits to submit for review. Verification-only work done this run, no code changed: floor = 117 passed/8 skipped/0 failed (import_fixer+pipeline_audit+zip_verify, vs directive's 76/0 baseline -- count grew, no failures). Six expected config-only slugs: 5 match (1 tracked file); planetforge now differs (2 files: config.ts+gameLogic.ts, added by commit 62a3d8cf dated 2026-09-24, after this directive was authored 2026-08-31) -- forward progress (properly ported), not a regression, flagged per directive instruction. Exactly 4 patterns confirmed in catalog. Zero openrouter/OpenRouterClient hits in the two new generators (docstring disclaimers only). source_resolver.py's resolve_source() unchanged per passing test_source_resolver_unchanged_for_all_registry_slugs anchor. All §3 test anchors present and passing. No git add/commit/push in either generator beyond docstrings + a non-writing `git add --dry-run`. Both live demos run for real via .devin-scratch/test_live_demo_patterns_3_4.py (kept, gitignored): (1) scratch-reverted copy of real examples/planetforge/ -> detect_untracked_registry_source('planetforge') = clean_match -> generate_tracking_fix -> gitignore_diff "!examples/planetforge/", 24 clean dry-run files. (2) detect_mislabeled_add_claim('4b05c02') on real history = clean_match, symbol=_is_dist_stale, pre_existing_since=4e3ceb0 -> generate_commit_note produced the exact template. Side note: running the suite left docs/state/PipelineAuditReport.json/.md and ts/src/games/registry-export.json locally modified (regenerated timestamps only) as tooling side effects -- left uncommitted, out of scope, not force-reverted since checkout/restore/reset are refused commands here. Recommend: since the work is already live on main, this directive can likely be closed/superseded rather than requeued -- Robert's call.
- 2026-10-03 18:10 · robert-claude-laptop · Blocked → Superseded — superseded_by: commit:46a26f00
<!-- queue:end -->
