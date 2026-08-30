# RFDGameStudio — Phase 1 Directive: Pipeline Audit Module

*August 2026 | Read fully before executing anything.*

*Stage 1 of a planned multi-stage agentic-flow module. This phase is read-only,
produces zero side effects, and its output is the evidence base for scoping
every later stage — later stages are NOT designed yet and should not be
inferred from this document.*

---

> ⛔ **STOP:** Do not trust any test floor number in this directive.
> `563 passed, 0 failed, 0 skipped` (Python) and `251 passed, 0 failed`
> (TypeScript) were last independently verified 2026-08-02 — over three
> weeks stale as of this directive. Run the real suites yourself
> (`pytest` from repo root per existing convention, `npx vitest run`
> from `ts/`) and report the actual current numbers before writing any
> code. If the count differs from the numbers above, that is expected —
> report it, don't reconcile it.

---

## §0 Context

**What exists today, real and confirmed:**

- RFDGameStudio's own pipeline tooling lives in `studio_mcp/` — `tools.py`
  (intake chain: `process_intake`, `_ensure_node_modules`,
  `studio_promote_to_examples`, `studio_generate_registry_entry`),
  `game_metadata.py` (`pipeline_stage` 3-value enum,
  `_load_existing_pipeline_stages()`, `advance_pipeline_stage()`),
  `scaffold.py` (separate scaffolding path, contains its own unfixed copy
  of `_camel_case_from_game_id`'s digit-leading-ID bug).
- Games land in `ts/src/games/registry.ts` — NOT `ts/src/arcade/registry.ts`.
  This path has been gotten wrong twice before during manual verification.
  Confirm it live before writing any code that references it.
- `game-metadata.json` is gitignored, regenerated on every deploy. Real
  edits will never appear in `git diff` for this file — read it directly,
  never infer its state from git status.
- A separate, prior repo — **OpenAgentMCP** (`C:/Github/OpenAgentMCP`,
  SSE :8008, stdio transport per ADR-004) — already has three of the four
  components this phase needs, last verified 2026-06-21 at Phase 9,
  122/0/0: `GitContextReader` (active_branch, last_commit,
  uncommitted_files, workflows, state_phase), `AsyncTestRunner`
  (`TestCommandResolver`, `run_tests`/`get_test_log` MCP tools, real
  Popen+shell=True execution with log+PID files), and
  `RepoScanner`/`RepoCache` (`list_repos`, `get_repo`, SQLite cache with
  TTL). This state is two-plus months old — confirm it's still real
  before porting anything from it.
- Two specific open items, status currently unknown, must be resolved by
  this phase's output, not assumed either way:
  1. Was `_ensure_node_modules` (`studio_mcp/tools.py`, was line ~830)
     actually fixed to run real `npm install` instead of silently
     returning `None`? Devin was dispatched on this 2026-08-05; never
     independently reverified.
  2. Is `CrossPipeline_VersionTracking`'s real work — freshness check in
     both deploy paths, `--userversion` wiring, `games.yaml` cleanup,
     intake→VERSION seam — actually done? A prior pass found the entire
     thing fabricated (commit messages described work with zero real
     grep hits). A re-execution directive was written 2026-08-02; whether
     it landed is unverified.

**What this phase delivers:** a new, read-only audit module inside
RFDGameStudio that reports, on demand, the true current state of the
AI-Studio-to-Arcade pipeline: live test floors (not stored ones), which
AI Studio exports exist versus which are actually in `registry.ts`, and
the resolved status of both open items above. This is Stage 1 of a
planned pipeline (audit → zip-verify → directive-write → port-execute →
post-import-check → evolution loop) — only Stage 1 is scoped here. Do not
build any part of Stages 2+.

**Why this phase first, specifically:** it is the only stage with zero
blast radius (no writes, no git, no code generation), and its output is
what determines how Stage 2+ actually get scoped — replacing a guess with
real, current evidence about what's still broken and what's repeated
across imports.

**What is NOT in scope:**
- Any write operation, any git operation, anything touching
  `registry.ts`, `game_metadata.py`, or `tools.py` beyond reading them
- Zip content verification (diffing core logic, grepping for concepts,
  checking callers) — that's Stage 2, not this phase
- Any directive generation or code generation
- Any OpenRouter or LLM call of any kind — this phase is deterministic
- Fixing either of the two open items found — this phase reports their
  status, it does not resolve them

---

## §1 Scope Statement

| File | Status | Action |
|---|---|---|
| `studio_mcp/pipeline_audit/__init__.py` | New | Package init, exports `PipelineAuditor` |
| `studio_mcp/pipeline_audit/repo_state.py` | New | Reads `registry.ts`, `game_metadata.py` pipeline_stage data, `examples/` dir listing |
| `studio_mcp/pipeline_audit/floor_runner.py` | New | Live-runs pytest + vitest, parses real pass/fail/skip. Port from OpenAgentMCP's `AsyncTestRunner` — confirm its real interface via direct read first, do not guess its signature |
| `studio_mcp/pipeline_audit/zip_inventory.py` | New | Lists known AI Studio zip exports, cross-references against `registry.ts` entries to flag not-yet-imported ones. **Confirm with Robert where zip exports actually live before writing this file** — location not established in this directive |
| `studio_mcp/pipeline_audit/known_issues.py` | New | Hardcoded checks for the two open items in §0 — grep-based, no model call |
| `studio_mcp/pipeline_audit/report.py` | New | Assembles structured JSON + human-readable markdown report |
| `studio_mcp/pipeline_audit/tests/test_repo_state.py` | New | Tests for repo_state.py |
| `studio_mcp/pipeline_audit/tests/test_floor_runner.py` | New | Tests for floor_runner.py, mocked subprocess |
| `studio_mcp/pipeline_audit/tests/test_known_issues.py` | New | Tests for known_issues.py |
| `docs/state/current.md` | Modify | Record Phase 1 complete, real floor |

**Read-only — do not touch:**
`ts/src/games/registry.ts`, `studio_mcp/game_metadata.py`,
`studio_mcp/tools.py`, `studio_mcp/scaffold.py`, everything in
`C:/Github/OpenAgentMCP` (a separate repo and a live service — read/port
from it, never edit it in place).

Report before fixing either of the two open items found. Do not silently
resolve them as part of "just fixing what I found."

---

## §2 Implementation

### `repo_state.py`

> ⚠️ RULE: Confirm the real current shape of `registry.ts` and
> `game_metadata.py` via direct read before writing the parser. Do not
> assume the field names or structure described in this directive are
> complete — this directive was written without live repo access this
> session.

Responsibility: return a structured list of every game currently in
`registry.ts` (name, config export, pipeline_stage if present in
`game_metadata.py`), plus `examples/` directory contents for
cross-reference.

### `floor_runner.py`

Responsibility: execute the real Python test suite (repo root, per
existing convention — NOT from `ts/`, that's the wrong-environment
failure mode already caught once this project) and the real TypeScript
suite (`npx vitest run` from `ts/`), parse the actual summary line, return
structured pass/fail/skip counts for both.

> ⚠️ RULE: Port the execution pattern from OpenAgentMCP's
> `AsyncTestRunner` (`TestCommandResolver` → detection → Popen with
> `shell=True`, log+PID files) rather than writing a new subprocess
> pattern from scratch — confirm the real interface by reading
> `C:/Github/OpenAgentMCP` directly first.

### `zip_inventory.py`

> ⚠️ RULE: This file cannot be written correctly without first
> confirming where AI Studio zip exports are actually stored on disk.
> Ask before assuming a path.

Responsibility: list known AI Studio exports, flag which ones have no
matching entry in `registry.ts` (candidates for the not-yet-built Stage 3
import).

### `known_issues.py`

Responsibility: two hardcoded, named checks — (1) grep
`studio_mcp/tools.py` for the real current body of
`_ensure_node_modules`, report whether it still returns `None` on the
no-match path or actually calls `npm install`; (2) grep both
`RFDGameStudio` and `RFD_IT_Publishing` for `_is_dist_stale`,
`--userversion`, `deployed_version` — the exact strings a prior pass
confirmed had zero real hits despite a commit message claiming otherwise
— report current hit count for each.

> ⚠️ RULE: No LLM call anywhere in this file. These are grep checks
> with known-answer expectations, not judgment calls.

### `report.py`

Responsibility: assemble `repo_state` + `floor_runner` + `zip_inventory`
+ `known_issues` output into one structured report (JSON for machine
use, Markdown for Robert to read), written to
`docs/state/PipelineAuditReport.md`, timestamped.

---

## §3 Test Anchors

| Test name | Target file | Behaviour |
|---|---|---|
| `test_repo_state_reads_real_registry` | repo_state.py | Parses actual current `registry.ts`, returns non-empty game list matching real entry count |
| `test_repo_state_cross_references_metadata` | repo_state.py | Games present in `game_metadata.py` show correct `pipeline_stage` |
| `test_floor_runner_parses_real_pytest_output` | floor_runner.py | Given real (or realistic mocked) pytest summary line, returns correct passed/failed/skipped ints |
| `test_floor_runner_parses_real_vitest_output` | floor_runner.py | Same, for vitest summary format |
| `test_floor_runner_flags_nonzero_failed_or_skipped` | floor_runner.py | Any failed>0 or skipped>0 sets a `certified: false` flag, never silently reported as clean |
| `test_known_issues_node_modules_check` | known_issues.py | Correctly reports current real state of `_ensure_node_modules` (whichever it turns out to be) |
| `test_known_issues_crosspipeline_check` | known_issues.py | Correctly reports current real hit count for the three named strings |
| `test_report_assembles_all_four_sources` | report.py | Output report contains data from all four components, no silent omission on partial failure |

Mock external calls (subprocess for floor_runner tests). No network. No
real API during tests — this phase makes no LLM calls, so there's no
external-key exception to worry about either.

Target: X passing, 0 failing, 0 skipped — exact X reported by the
executing agent once collected, not assumed here.

---

## §4 Completion Criteria

- [ ] Real current pytest/vitest floor confirmed and reported BEFORE any
      new code is written (per stop rule)
- [ ] Confirmed live whether `C:/Github/OpenAgentMCP` still exists and
      is still real at (or near) 122/0/0 before porting from it
- [ ] Confirmed with Robert where AI Studio zip exports actually live,
      before writing `zip_inventory.py`
- [ ] `repo_state.py`, `floor_runner.py`, `zip_inventory.py`,
      `known_issues.py`, `report.py` all implemented per §2
- [ ] All §3 test anchors present and passing
- [ ] `PipelineAuditReport.md` generated at least once against the real
      repo, pasted into the completion report in full — not summarized
- [ ] Report explicitly states, in plain language, the real current
      answer to both open items in §0 — fixed, not fixed, or partially
- [ ] Zero writes to any read-only file in §1, confirmed via diff
- [ ] `docs/state/current.md` updated to Phase 1 complete with the real
      certified floor

---

## §5 Quick Reference

| Key | Value |
|---|---|
| New package | `studio_mcp/pipeline_audit/` |
| Components | repo_state, floor_runner, zip_inventory, known_issues, report |
| LLM calls this phase | Zero |
| Primary reuse source | OpenAgentMCP (`C:/Github/OpenAgentMCP`) — confirm live state first |
| Blast radius | Zero — read-only, no git, no writes outside `current.md` |
| Open items this phase must resolve (report, not fix) | `_ensure_node_modules` real status; CrossPipeline_VersionTracking real status |
| Unresolved before coding starts | Real current test floor; zip export storage location; whether OpenAgentMCP is still real at 122/0/0 |
| Next stage (not scoped here) | Stage 2 — Zip Verifier, first stage that needs an LLM call |

---

*RFD Method | Phase 1 | RFDGameStudio Pipeline Audit Module | August 2026*
*Director → Pipeline → Agent. Spec first. Test floor always real.*
*This phase produces evidence. It does not produce conclusions about Stage 2+.*
