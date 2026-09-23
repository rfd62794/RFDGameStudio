# RFDGameStudio + RFD_IT_Publishing — Third Execution: Cross-Pipeline Version Tracking + Build Freshness

*August 30 2026 | Read BOTH prior documents in full before this one:
`docs/gdd/RFDGameStudio_CrossPipeline_VersionTracking_Directive.md` (original
spec, real and well-scoped, Sections 2a/2b/2d/2e/2f still stand exactly as
written) and `docs/gdd/RFDGameStudio_CrossPipeline_VersionTracking_ReExecution_Directive.md`
(second attempt, Section 2c update still stands). This document does not
replace either — it re-grounds the STOP-rule floor with tonight's fresh
numbers and confirms, for the third time, that nothing has actually landed.*

---

> ⛔ **STOP:** Two prior attempts at this exact directive produced fabricated
> completion claims or silently stalled. Before writing anything:
> 1. Run the real suites. RFDGameStudio Python floor is **NOT 563 anymore**
>    — independently verified tonight (Aug 30) at **588 passed, 1 failed**
>    (`uv run pytest -m "not slow"`; the 1 failure is
>    `test_chimera_wilds.py::test_data_yaml_parts_match_mbb_source_values`,
>    pre-existing, unrelated to this directive — confirmed via git log,
>    do not attempt to fix it as part of this work). TypeScript floor is
>    **NOT 251 anymore** — **1644 passed, 2 failed** (`npx vitest run` from
>    `ts/`), both pre-existing and unrelated. RFD_IT_Publishing is
>    unchanged: **9 passed, 0 failed** (`python -m pytest -q -p no:anchorpy
>    -p no:logfire` — this invocation is still required, confirmed live
>    tonight, do not use plain `python -m pytest`).
> 2. Grep fresh, yourself, before assuming anything: `_is_dist_stale`,
>    `userversion`, `deployed_version` across both repos. As of tonight the
>    only real hits are inside `studio_mcp/pipeline_audit/known_issues.py`
>    and its test — that file *searches for* these strings as part of an
>    automated audit tool, it does not implement them. If your grep finds
>    anything different, STOP and report the discrepancy before proceeding.
> 3. Confirm live: `https://rdug627.itch.io/brewfield` — as of tonight it
>    still returns a real 404, unresolved since it was first flagged
>    August 2. Not this directive's job to fix, but the cross-repo
>    consistency report in §2f must surface it explicitly, not omit it.

---

## §0 Context

This is the third attempt at the same real, unchanged scope. The first
attempt fabricated its completion report (fake commit messages, zero real
implementation). The second attempt's re-execution directive is real,
correct, and was never actually run to completion — nothing from it
exists in either repo, confirmed by fresh grep tonight, months after it
was written. **The spec has not changed. What needs to change is that
someone actually builds it and someone actually re-verifies independently
before it's marked done** — not by reading a completion summary, by
running the real commands in this STOP rule yourself.

**Nothing else about the plan is different.** `PipelineStageTracking` is
still real and correct (`pipeline_stage`, `advance_pipeline_stage()`,
`_load_existing_pipeline_stages()` in `studio_mcp/game_metadata.py`) —
`deployed_version` is still a pure, additive field alongside it, not a
redesign. The three disconnected version concepts (intake versioning,
per-game VERSION file, Butler's auto-counter) are still disconnected.
Neither `studio_deploy_arcade` nor `RFD_IT_Publishing/targets/itchio.py`'s
`push()` still checks build freshness before deploying.

---

## §1 Scope Statement

Identical to both prior directives — reference them directly, do not
re-derive. No new files beyond what they already specify.

---

## §2 Implementation

Sections 2a, 2b, 2c (as updated by the second directive), 2d, 2e, 2f of
the prior documents stand exactly as written. Implement them for real
this time. Two additions specific to this attempt:

> ⚠️ RULE: At completion, do not paste a summary of what changed. Paste
> the actual `git diff --stat` output for both repos, and paste the raw
> terminal output of both full test suites using the exact invocations in
> the STOP rule above. A prose description of a diff is not the diff.

> ⚠️ RULE: If you find yourself unable to complete any part of §2e's
> judgment call (whether `RFD_IT_Publishing` Phase 4 is superseded by
> `studio_deploy_arcade`) — do not guess, do not implement a default, stop
> and report it as an open question exactly as both prior directives
> required. This has been correctly left open twice; a third attempt
> silently resolving it is a worse outcome than leaving it open a third
> time.

---

## §3 Test Anchors

Identical table from the original directive. Target floor for this
directive's own new anchors: reported for real by whoever executes this,
not assumed. Full-repo floors before and after must be pasted raw,
per the STOP rule's real numbers above — not the stale 563/251 from
either prior document.

---

## §4 Completion Criteria

Identical checklist from the second directive's §4, with one addition:

- [ ] Real pre-flight floor confirmed as 588/1/pass-with-1-known-failure
      (Python) and 1644/2/pass-with-2-known-failures (TypeScript) and
      9/0 (RFD_IT_Publishing) — not 563/251/9 — before any change
- [ ] All original §4 items from the re-execution directive, unchanged
- [ ] `rdug627.itch.io/brewfield`'s live status re-checked and stated
      explicitly in the completion report, whatever it is by then

---

## §5 Quick Reference

| Fact | Value |
|---|---|
| This is | Attempt 3. Attempts 1 and 2 did not land. |
| Real pre-flight floor, RFDGameStudio (Aug 30, not Aug 2) | 588 passed / 1 failed (Python, pre-existing, unrelated) / 1644 passed / 2 failed (TypeScript, pre-existing, unrelated) |
| Real pre-flight floor, RFD_IT_Publishing | 9 passed, 0 failed — requires `-p no:anchorpy -p no:logfire` |
| Confirmed still absent, third independent check | `_is_dist_stale`, `userversion`, `deployed_version` — zero real implementation hits |
| `rdug627.itch.io/brewfield` | Still 404, confirmed live tonight, unresolved since Aug 2 |
| Judgment call, still open, still not this directive's to resolve silently | §2e — RFD_IT_Publishing Phase 4 superseded or not |
| Proof standard | Raw `git diff --stat` + raw test output, not a summary |
