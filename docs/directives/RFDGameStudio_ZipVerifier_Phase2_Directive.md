# RFDGameStudio — Phase 2 Directive: AI Studio Zip Verifier

*August 2026 | Read fully before executing anything.*

*Stage 2 of the agentic-flow module (Stage 1: Pipeline Audit — certified
2026-08-30). This is the first stage that makes a real LLM call. Stages
3+ (directive-writing, port execution, post-import checking, evolution
loop) remain unscoped — do not build toward them here.*

---

> ⛔ **STOP:** Confirm three things before writing any code:
> 1. Does an AI Studio zip actually ship with any completion-narrative
>    artifact (a README, a chat export, a CHANGES file) inside it, or is
>    the only signal the zip contents themselves? This directive assumes
>    the latter unless you find otherwise — check a real zip
>    (`antsim-redux_v0.1.0R1.zip` is on disk in `intake/`) before
>    assuming either way.
> 2. `OPENROUTER_API_KEY` must be set and a real, successful test call
>    made before this phase is considered started — this module makes
>    no LLM calls during its own test suite (mocked), but a live smoke
>    test against the real API is part of completion, not optional.
> 3. Confirm DeepSeek V4 Flash (`deepseek/deepseek-v4-flash-0731` or
>    whatever its current live OpenRouter slug is) is still listed and
>    priced as expected — the catalog moves weekly. Do not hardcode a
>    model string without checking `https://openrouter.ai/models` or the
>    live `/api/v1/models` endpoint first.

---

## §0 Context

**What exists after Stage 1 (certified):** `studio_mcp/pipeline_audit/`
gives live, verified repo state — real test floors, real registry
contents, real zip inventory (11 zips confirmed on disk across 6 slugs,
`antsim-redux` and `7-days-to-fry` and `facility-escape` and
`kingmaker-squads` each single-revision, `corpworld` and `slimegarden`
multi-revision). All 11 already map to imported games, so this phase has
no live import to block — it can and should be tested retroactively
against already-imported zips with zero pipeline risk.

**What this phase delivers:** a tool that takes one AI Studio zip export
and independently verifies it, using the five techniques your own
`google-ai-studio-verification` skill already documents by hand: diff
the core logic function first (when a prior revision exists to diff
against), grep for the concept the directive asked for rather than the
literal string, check the caller actually invokes what changed and not
just the function body, distrust a suspiciously clean or uniform result,
and verify real math/values rather than trusting a "should be balanced"
claim in the completion summary. Output is a verdict — `CERTIFIED`,
`BLOCKED-[reason]`, or `UNVERIFIABLE` — using the same three-way format
the agent-verification skill already uses, for consistency across both
verification tools this studio now has.

**Two real fixtures already on disk, deliberately different shapes:**
- `intake/antsim-redux/antsim-redux_v0.1.0R1.zip` — single revision, no
  prior version to diff against. Tests the "no diff baseline available"
  path — verification here has to check the zip's actual content against
  whatever original directive or prompt produced it (if one is on file
  under `docs/gdd/` or `docs/directives/`), not against a prior zip.
- `intake/corpworld/` — five real revisions (R1 through R5, real
  timestamps 2026-07-12 across roughly two hours). Tests the actual
  revision-diff path the skill's first technique assumes.

**What is NOT in scope:**
- Extracting a zip anywhere other than a scratch/temp directory — the
  real files in `intake/` are never modified, never deleted, never
  overwritten
- Any write to `registry.ts`, `game_metadata.py`, `tools.py`, or
  `scaffold.py`
- Actually importing or porting anything — that's Stage 3+, unscoped
- Any LLM call in the test suite itself — mock the OpenRouter client,
  no real network calls during `pytest`
- Picking a model and moving on without checking it's still live and
  priced as expected — confirm at build time, not from this document

---

## §1 Scope Statement

| File | Status | Action |
|---|---|---|
| `studio_mcp/zip_verify/__init__.py` | New | Package init, exports `ZipVerifier` |
| `studio_mcp/zip_verify/zip_reader.py` | New | Extracts a zip to a scratch temp dir, lists contents. Never touches the original file in `intake/` |
| `studio_mcp/zip_verify/revision_diff.py` | New | If a prior revision of the same slug exists in `intake/`, diffs core logic files between them. If not, returns `no_prior_revision: True` rather than failing |
| `studio_mcp/zip_verify/concept_grep.py` | New | Given a directive or prompt text (if found) and the zip contents, checks whether the *concept* asked for shows up anywhere, not just an exact string match |
| `studio_mcp/zip_verify/caller_check.py` | New | For any changed function found by `revision_diff`, confirms the function is actually invoked somewhere in the zip's code, not just defined |
| `studio_mcp/zip_verify/verdict_synthesizer.py` | New | The one component that calls OpenRouter. Takes the structured output of the four components above and produces a verdict + reasoning, in the CERTIFIED / BLOCKED-[reason] / UNVERIFIABLE format |
| `studio_mcp/zip_verify/openrouter_client.py` | New | Thin wrapper around the OpenRouter chat-completions endpoint. Must accept an injectable/mockable client for tests |
| `studio_mcp/zip_verify/report.py` | New | Assembles full verdict + component evidence into a markdown report |
| `studio_mcp/zip_verify/tests/*.py` | New | Full coverage, OpenRouter client mocked throughout |

**Read-only — do not touch:** everything in `intake/` (extract to
scratch dir only), `ts/src/games/registry.ts`, `studio_mcp/game_metadata.py`,
`studio_mcp/tools.py`, `studio_mcp/scaffold.py`, `studio_mcp/pipeline_audit/`
(Stage 1 — call it if useful for repo-state context, do not modify it).

---

## §2 Implementation

### `zip_reader.py`

Responsibility: extract a given zip path to a fresh scratch directory
(e.g. `tempfile.mkdtemp()`), return the file tree. No mutation of the
source zip. No mutation of anything under `intake/`.

### `revision_diff.py`

> ⚠️ RULE: Must handle both cases explicitly, not assume one. Single-
> revision zips (`antsim-redux`, `7-days-to-fry`, `facility-escape`,
> `kingmaker-squads`) have no prior version — `no_prior_revision: True`
> is a valid, expected result, not an error. Multi-revision zips
> (`corpworld` R1-R5, `slimegarden` R1-R2) should diff the most recent
> two by creation timestamp.

Responsibility: locate core logic files (heuristic: `.py`, `.ts`, `.tsx`
files containing function/class definitions, excluding config/asset
files) in both revisions where a prior one exists, produce a real diff.

### `concept_grep.py`

> ⚠️ RULE: This checks for the *concept*, not the literal string given
> to AI Studio in the original prompt. If the original directive/prompt
> text isn't findable on disk for a given zip, report
> `no_source_directive_found: True` rather than guessing at what was
> asked for.

### `caller_check.py`

Responsibility: for each function `revision_diff` flags as changed,
confirm it's referenced somewhere else in the codebase (import + call
site), not just defined and unused.

### `verdict_synthesizer.py`

> ⚠️ RULE: This is the only component that calls an LLM. Route through
> OpenRouter, not a direct provider API. Confirm the model slug is
> currently live before hardcoding it (see stop rule). Input to the
> model: the structured findings from the four components above, plus
> the zip's own completion narrative if one was found — never raw file
> contents dumped wholesale, the expensive call should see structured
> findings, matching the same cost discipline OpenAgent already
> established (cheap/mechanical work stays outside the model call).

> ⚠️ RULE: Verdict output must be exactly one of `CERTIFIED`,
> `BLOCKED-[reason]`, `UNVERIFIABLE` — no other language. `UNVERIFIABLE`
> is the correct output when `no_prior_revision` and
> `no_source_directive_found` are both true and nothing else contradicts
> the completion narrative — that is a real, honest outcome, not a
> failure of the tool.

### `openrouter_client.py`

Responsibility: thin, injectable wrapper. Real implementation calls
`https://openrouter.ai/api/v1/chat/completions` with the confirmed
current model slug. Tests inject a fake client that returns fixed
responses — zero real network calls during `pytest`.

### `report.py`

Responsibility: assemble everything into `docs/state/ZipVerifyReport_{slug}.md`.

---

## §3 Test Anchors

| Test name | Target file | Behaviour |
|---|---|---|
| `test_zip_reader_extracts_to_scratch_dir` | zip_reader.py | Extraction never touches the original zip path or `intake/` |
| `test_revision_diff_handles_single_revision` | revision_diff.py | `antsim-redux` (real, on disk) returns `no_prior_revision: True`, not an error |
| `test_revision_diff_finds_real_diff_across_revisions` | revision_diff.py | `corpworld` R4→R5 (real, on disk) produces a non-empty diff |
| `test_concept_grep_reports_missing_source_directive` | concept_grep.py | Zips with no findable source directive report the flag honestly |
| `test_caller_check_flags_unused_changed_function` | caller_check.py | A changed-but-never-called function is flagged, not silently passed |
| `test_verdict_synthesizer_uses_mocked_client` | verdict_synthesizer.py | No real network call; injected fake client controls the response |
| `test_verdict_synthesizer_output_is_one_of_three_values` | verdict_synthesizer.py | Rejects/errors on any output string outside the three allowed values |
| `test_verdict_unverifiable_when_no_baseline_and_no_directive` | verdict_synthesizer.py | Confirms UNVERIFIABLE is treated as a valid, real outcome |
| `test_report_writes_real_markdown` | report.py | Output file contains all component sections |

Target: X passing, 0 failing, 0 skipped — real number reported by the
executing agent, not assumed.

**Separately, not part of the pytest suite:** one real, live smoke test
— run the verifier against the real `antsim-redux` zip and the real
`corpworld` R4→R5 pair, with a real OpenRouter call, and paste the actual
verdict and raw API response into the completion report. This is the
part that proves the integration works outside of mocks — do not skip
it and do not summarize it.

---

## §4 Completion Criteria

- [ ] Confirmed whether AI Studio zips carry any completion-narrative
      artifact — reported plainly either way
- [ ] `OPENROUTER_API_KEY` set, live test call succeeded, raw response
      pasted into completion report
- [ ] Current OpenRouter model slug for the verdict step confirmed live
      (not assumed from this document) and named in the report
- [ ] All five components implemented per §2
- [ ] All §3 test anchors present and passing, real count reported
- [ ] Live smoke test run against real `antsim-redux` zip — real verdict
      pasted in full
- [ ] Live smoke test run against real `corpworld` R4→R5 — real verdict
      pasted in full, confirms the revision-diff path actually fires
- [ ] Zero writes to any read-only path in §1, confirmed via diff
- [ ] Zero real network calls inside the pytest suite itself, confirmed
      by running tests with network disabled if possible
- [ ] Working tree clean and committed at end of phase — no unstaged
      files left behind (Stage 1's gap, not repeating it here)

---

## §5 Quick Reference

| Key | Value |
|---|---|
| New package | `studio_mcp/zip_verify/` |
| First LLM call in this module family | Yes — `verdict_synthesizer.py` only |
| Recommended model (confirm live first) | DeepSeek V4 Flash (0731), paid tier — not a `:free` slug, those churn weekly on OpenRouter |
| Real fixtures | `antsim-redux` (single-rev), `corpworld` R4→R5 (multi-rev) |
| Blast radius | Zero on `intake/` originals or any pipeline file — extraction is scratch-dir only |
| Verdict format | `CERTIFIED` / `BLOCKED-[reason]` / `UNVERIFIABLE`, matching agent-verification skill's format |
| Not in scope | Actual import/port execution — Stage 3+ |

---

*RFD Method | Phase 2 | RFDGameStudio Zip Verifier Module | August 2026*
*Director → Pipeline → Agent. Spec first. Verdicts are real or they're UNVERIFIABLE — never assumed clean.*
