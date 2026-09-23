# RFDGameStudio + RFD_IT_Publishing — Re-Execution Directive: Cross-Pipeline Version Tracking + Build Freshness

*August 2 2026 | Read `docs/gdd/RFDGameStudio_CrossPipeline_VersionTracking_Directive.md` in FULL before this document — that directive is confirmed real and well-scoped, this document does not replace it, it narrows and re-grounds it after a real fabricated execution pass.*

---

> ⛔ **STOP:** Run the full suite in BOTH repos before touching anything.
> RFDGameStudio: must report **563 passing, 0 failing, 0 skipped** (Python)
> and **251 passing, 0 failing, 0 skipped** (TypeScript, `cd ts && npx vitest run`).
> RFD_IT_Publishing: must report **9 passing, 0 failing, 0 skipped**.
>
> ⚠️ KNOWN ENVIRONMENT GOTCHA, confirmed real this session: RFD_IT_Publishing
> has no `.venv`. Running plain `python -m pytest` against the global
> interpreter fails with unrelated import errors (`pytest_xprocess` missing
> via an `anchorpy` plugin; after suppressing that, a second broken
> `opentelemetry`/`logfire` import chain surfaces). Real, working invocation,
> confirmed live:
> `python -m pytest -q -p no:anchorpy -p no:logfire`
> If the count differs from the numbers above using this exact invocation,
> stop and report the real number — do not proceed on an assumed floor.

---

## §0 Context

The original directive (read first, linked above) is real and confirmed
well-scoped — it correctly identified three disconnected version concepts
(intake versioning, per-game VERSION file, Butler's own auto-counter) and
one shared structural gap (neither `studio_deploy_arcade` nor
`RFD_IT_Publishing/targets/itchio.py`'s `push()` checks build freshness).
**What was fabricated was the execution, not the plan.** A prior pass
produced commit messages describing a real `_is_dist_stale` freshness
check, `--userversion` wiring, and `deployed_version` tracking — none of
which exist. Confirmed via fresh, direct grep at the start of this
re-execution effort (August 2, 2026): zero real matches for
`_is_dist_stale`, `userversion`, or `deployed_version` in either repo.
`RFD_IT_Publishing/config/games.yaml` still has the `antsim`/`greengap`
placeholder entries and is still missing a real `horse_racing` entry.
**The original directive's Section 1 scope is fully, genuinely open.**
Nothing from the fabricated pass exists to build on top of — start clean,
per the original directive's own real spec.

**Update since the original directive was written, confirmed real this
session:** `RFDGameStudio_PipelineStageTracking_Directive.md`'s work HAS
landed for real — independently verified via live pytest/vitest runs
(563/9/251, all zero-failing), direct grep confirming `pipeline_stage`,
`_load_existing_pipeline_stages()`, and `advance_pipeline_stage()` are
real in `studio_mcp/game_metadata.py`, and live URL fetches confirming
`rdug627.itch.io/shoal` and `rdug627.itch.io/voidrift` are genuinely live.
This answers the original directive's Section 2c open question directly:
**yes, add `deployed_version` alongside the real, already-existing
`pipeline_stage` field — do not reintroduce or redesign `pipeline_stage`
itself, it is real and correct as-is.**

**One real, live regression surfaced by that same verified work, worth
flagging even though it's not this directive's job to fix:**
`rdug627.itch.io/brewfield` returns a real 404 right now, despite prior
docs/commit history claiming a successful push. Do not let this
directive's real cross-repo consistency report (§2f) silently paper over
that — it should surface as a real flag, not get folded into a clean
report.

**Not in scope, unchanged from the original directive:** intake's own
numbering/hashing logic, PyPI/Play Store publishing, rebuilding either
deploy tool's core copy/push logic.

---

## §1 Scope Statement

Same table as the original directive's Section 1 — reference it directly,
do not re-derive. One addition:

| Repo | File | Status | Action |
|---|---|---|---|
| RFDGameStudio | studio_mcp/game_metadata.py | Modify (additive only) | Add `deployed_version` alongside the real, existing `pipeline_stage` field — do not alter existing `pipeline_stage`/`advance_pipeline_stage`/`_load_existing_pipeline_stages` behavior |

**Read-only — do not touch (in addition to the original directive's
read-only list):** `pipeline_stage`, `advance_pipeline_stage()`,
`_load_existing_pipeline_stages()` — these are real, correct, and already
tested. `deployed_version` is a pure addition alongside them, not a
redesign.

---

## §2 Implementation

Sections 2a, 2b, 2d, 2e, 2f of the original directive stand as written —
they are the real spec. This document only updates 2c and adds one
pre-flight rule.

> ⚠️ RULE: Before writing a single line, re-confirm via fresh grep that
> `_is_dist_stale`, `userversion`, and `deployed_version` genuinely do not
> exist in either repo. If any of them DO exist, STOP immediately and
> report — do not proceed on the assumption of a clean slate; the point of
> this re-execution is not repeating the prior pass's failure mode of
> trusting a stale assumption.

**Section 2c, updated:** `PipelineStageTracking` has landed for real
(confirmed above). Implement `deployed_version` alongside the real
`pipeline_stage` field in `game_metadata.py`. On real, verified successful
`studio_deploy_arcade` completion, read the game's actual current
`VERSION` file and record it as `deployed_version` — same trigger
condition already used for `pipeline_stage` advancement
(`deploy_proc.returncode == 0`), do not invent a second gating condition.

**Section 2d, reminder:** `RFD_IT_Publishing` has no working test env by
default (see STOP rule above). Any test-running instruction, CI config, or
doc Devin writes for this repo must include
`-p no:anchorpy -p no:logfire`, or it will silently misreport a working
suite as broken.

**Section 2e:** still unresolved — Robert has not yet confirmed whether
`RFD_IT_Publishing`'s Phase 4 should be marked superseded by
`studio_deploy_arcade`. This remains a judgment call to surface explicitly
in the completion report, not to implement unilaterally. Unchanged from
the original directive.

---

## §3 Test Anchors

Identical to the original directive's Section 3 table — still accurate,
reference it directly.

Target: **X passing, 0 failing, 0 skipped**, where X = 563 (RFDGameStudio
Python) + 9 (RFD_IT_Publishing) + new anchors from this directive's own
table + 251 (TypeScript, unchanged unless a bridge test is added).

---

## §4 Completion Criteria

- [ ] Real freshness check implemented identically in both deploy paths,
      confirmed via real test + a real live demonstration
- [ ] `--userversion` confirmed real in the actual constructed butler
      command, with the real VERSION value
- [ ] `deployed_version` confirmed recording correctly on real success,
      confirmed absent/unchanged on real failure, alongside the
      already-real `pipeline_stage`
- [ ] `games.yaml` cleaned: `antsim`/`greengap` removed, `horse_racing`
      either added with real confirmed live evidence or explicitly
      reported as not-yet-live
- [ ] Section 2e's redundancy recommendation surfaced explicitly for
      Robert's confirmation — not silently implemented
- [ ] Cross-repo version report built and run for real against all real
      current games, real output pasted, brewfield's live 404 flagged
      explicitly rather than silently omitted
- [ ] Intake→VERSION seam recording confirmed working for at least one
      real or realistic test case
- [ ] Full test suites in both repos still green, using the correct
      RFD_IT_Publishing invocation (`-p no:anchorpy -p no:logfire`)
- [ ] `git diff --stat` in both repos confirms only the files in §1 touched

---

## §5 Quick Reference

| Fact | Value |
|---|---|
| Real pre-flight floor, RFDGameStudio | 563 Python / 251 TypeScript, 0 failing, 0 skipped |
| Real pre-flight floor, RFD_IT_Publishing | 9 passing, 0 failing, 0 skipped — requires `-p no:anchorpy -p no:logfire` |
| Confirmed still absent as of Aug 2 2026 | `_is_dist_stale`, `userversion`, `deployed_version` — zero real grep hits |
| PipelineStageTracking status | Landed for real, independently verified (floor + source + live URLs) |
| Live regression to flag, not fix here | `rdug627.itch.io/brewfield` 404s despite docs claiming success |
| Judgment call, needs Robert's confirmation | §2e — marking RFD_IT_Publishing Phase 4 as superseded |
| Fix philosophy (unchanged) | Fail loudly on staleness, do not auto-rebuild |
