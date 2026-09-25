# RFDGameStudio — Stage 2 Correction 2: Verdict Parsing & Corpus Contamination

**Depends on:** AgentFlow `Safe_Inbound_Files_Directive.md` (the `Copy()` rule);
until it merges this directive must not be approved. This directive's inbound
zips are declared, not read from `Downloads/` directly — approving it before
`Copy()` exists in AgentFlow's sandbox means every dispatch dies exactly the way
tonight's two attempts did (12:16 → Blocked 12:43; 20:49 → Blocked 21:07, both
below in the Queue log).

*September 2026 | Read `docs/directives/RFDGameStudio_Stage2Correction_ConceptExtraction_Directive.md`
in full before this one. Two separate, real bugs found during the actual
corrected-tool re-run against the real break-streamer zips — not
hypothetical, both independently confirmed. Neither needs a fresh
OpenRouter call to test; `concept_check` and `_allowed_verdict` are both
pure functions.*

---

> ⛔ **STOP:** Run the real current test suite and confirm before touching
> anything (baseline measured 2026-09-24 in a scratch worktree of this
> exact repo state — `uv run pytest -q -p no:cacheprovider
> studio_mcp/zip_verify/tests/test_verdict_synthesizer.py
> studio_mcp/zip_verify/tests/test_concept_grep.py` → **23 passed**; this
> is your floor, not 95/0 — confirm your own count before touching
> anything and report it if it differs). Re-run `concept_check` against
> the two real break-streamer zips — **do not read them from
> `Downloads/`.** They are declared under `## Sandbox needs` below and
> staged by the harness before this run starts, at
> `.agentflow/inbox/break-streamer.zip` and
> `.agentflow/inbox/break-streamer-mvp.zip`. Confirm the exact current
> numbers: AI Studio 0.67, Manus 0.70, before any change — these are the
> honest starting point, already independently verified twice.
>
> **`_allowed_verdict`'s whitespace fix and `concept_check`'s `.md`
> exclusion are already on `main`** (commit `4d7725a8`, "fix Stage 2
> Correction 2: exclude .md from code corpus, normalize verdict
> whitespace" — verify this yourself with `git log --oneline -- \
> studio_mcp/zip_verify/verdict_synthesizer.py
> studio_mcp/zip_verify/concept_grep.py` before assuming either bug is
> still open). What is NOT on `main`: the §3 real-zip test fixtures and
> the live before/after demonstration — that work exists only on this
> directive's own branch
> (`directive/rfdgamestudio-rfdgamestudio-stage2correction2-d-371166`,
> commit `7eee3297`) and never merged. If `main` already has both fixes
> when you check, treat §2 as verification-only (confirm the code matches
> what §2 describes, change nothing if it already does) and put your real
> effort into finishing §3 and the live demonstration below — that is the
> actual unfinished work two dispatches died on.

---

## §0 Context

**Bug 1 — verdict parsing rejects a valid BLOCKED verdict with a space.**
`_allowed_verdict` requires `text.startswith("BLOCKED-")` with no
whitespace. The model's real, raw output for the Manus run was
`"BLOCKED - Concept coverage is only 0.7..."` — a single space before
the hyphen — which fails both the exact-match check and the
`startswith` check, falls through to `None`, and gets silently replaced
with `"UNVERIFIABLE"`. A real, correctly-reasoned BLOCKED verdict was
discarded because of whitespace, not because the model's judgment was
wrong.

**Bug 2 — the matching corpus doesn't distinguish real code from
planning notes or dead files.** Traced directly, not inferred: the
Manus build's `composite` match comes only from `PLAN.md`/`STRUCTURE.md`
— its own scratch planning documents — never from the real
`Home.tsx` application code. Its `relative` match (46 hits) is almost
entirely inside the shadcn/ui component library already confirmed dead
two verification passes ago — zero real imports anywhere. `concept_check`
currently walks the whole extracted tree, including `.md` files,
concatenates everything into one corpus, and counts substring matches
without regard to whether the match came from code that runs, code that
doesn't, or a document that was never code at all. The AI Studio build
happens to have neither planning docs nor dead-library bloat, so its
0.67 is a cleaner number by construction — not evidence its real
implementation is worse, which is what a naive coverage comparison
implies.

**What this phase delivers:**
1. `_allowed_verdict` normalizes hyphen-adjacent whitespace before
   checking, so `"BLOCKED - x"`, `"BLOCKED- x"`, `"BLOCKED -x"` are all
   recognized as valid BLOCKED verdicts.
2. `concept_check`'s corpus excludes `.md` files from match-counting.
   Documentation is never the implementation — matching against it
   answers "did someone write about this concept," not "did someone
   build it."

**Explicitly NOT in scope, and why — a real, harder problem, not an
oversight:**
- Excluding *dead/unimported* code (like the shadcn boilerplate) from
  the corpus. Detecting that requires real import-graph analysis —
  walking from an actual entry point (`main.tsx`/`App.tsx`) and
  determining true reachability, which is a materially bigger, harder
  piece of work than stripping a file extension. This phase fixes the
  mechanical, unambiguous case (docs are never code); the dead-code
  case is a real, separate decision for later, the same way the
  generic-verb stoplist was deferred rather than guessed at.

---

## §1 Scope Statement

| File | Status | Action |
|---|---|---|
| `studio_mcp/zip_verify/verdict_synthesizer.py` | Modify | Normalize whitespace in `_allowed_verdict` before checking |
| `studio_mcp/zip_verify/concept_grep.py` | Modify | Exclude `.md` files from the match-counting corpus |
| `studio_mcp/zip_verify/tests/test_verdict_synthesizer.py` | Modify (additive) | New tests per §3 |
| `studio_mcp/zip_verify/tests/test_concept_grep.py` | Modify (additive) | New tests per §3, using the real break-streamer zips |

**Read-only:** both real zips, staged by the harness at
`.agentflow/inbox/break-streamer.zip` and
`.agentflow/inbox/break-streamer-mvp.zip` (declared below, never read from
`Downloads/` directly), everything else in `studio_mcp/`.

> ⚠️ RULE: `.md` files still count for `find_source_directive()` — that
> function's whole job is finding a directive written in markdown. This
> phase only excludes `.md` from the *code corpus* `concept_check` scans
> for matches, not from directive-finding. Do not conflate the two.

---

## Sandbox needs

- Copy(C:/Users/cheat/Downloads/break-streamer-mvp.zip)
- Copy(C:/Users/cheat/Downloads/break-streamer.zip)
- Exec(uv run pytest)
- Exec(uv run python -m zipfile)

The two `Copy()` entries are staged by the harness into
`.agentflow/inbox/break-streamer-mvp.zip` and
`.agentflow/inbox/break-streamer.zip` before this run starts — read them
from there, never from `C:\Users\cheat\Downloads\`, which this run cannot
see. `Exec(uv run python -m zipfile)` is the interpreter-safe form for
listing or extracting a zip from a shell command if you need to sanity-check
its contents outside a test (`uv run python -m zipfile -l
.agentflow/inbox/break-streamer.zip`); it is not a general Python escape —
`uv run python -c ...` and any other flag form of `python`/`uv run python`
remain refused. Prefer doing the actual extraction inside a named test or
script (below) over ad hoc shell probes: an undeclared, improvised command
(a scratch script run directly, e.g. last attempt's `uv run python
_demo_s2c2.py`) is refused outright because nothing here declares it — that
is exactly how both of tonight's dispatches died (Queue log below, 12:43
and 21:07).

---

## §2 Implementation

### `_allowed_verdict` — whitespace normalization

```python
def _allowed_verdict(text: str) -> str | None:
    text = text.strip().upper()
    text = re.sub(r"\s*-\s*", "-", text)  # collapse "BLOCKED - x" -> "BLOCKED-x"
    if text in VALID_VERDICTS:
        return text
    if text.startswith("BLOCKED-"):
        return text
    return None
```

> ⚠️ RULE: The collapse must happen on the whole string before either
> check, not just near "BLOCKED" specifically — a verdict like
> `"UN VERIFIABLE"` (unlikely but possible model output) should not
> incidentally become valid through an overly narrow patch. Confirm this
> doesn't change behavior for any already-passing test before
> considering it done.

### `concept_check` — exclude `.md` from the corpus

Find wherever the corpus is assembled (the `rglob` / file-walk that
concatenates source text for match-counting) and exclude files with a
`.md` extension from that specific corpus — while leaving
`find_source_directive`'s own separate `.md` search untouched.

> ⚠️ RULE: Do not silently also exclude other extensions "while you're
> in there." Only `.md` — the one confirmed, unambiguous case. Anything
> else is a separate, later decision.

---

## §3 Test Anchors

| Test name | Fixture | Behaviour |
|---|---|---|
| `test_allowed_verdict_accepts_space_before_hyphen` | `"BLOCKED - reason"` | Returns a valid BLOCKED verdict, not `None` |
| `test_allowed_verdict_accepts_space_after_hyphen` | `"BLOCKED- reason"` and `"BLOCKED -reason"` | Both return valid |
| `test_allowed_verdict_still_rejects_garbage` | `"MAYBE-reason"` | Still returns `None` — the fix doesn't loosen the check generally |
| `test_concept_check_excludes_markdown_from_corpus` | Real `break-streamer-mvp.zip` (Manus) | `composite` moves from matched to unmatched — confirmed via direct re-run, its only real occurrences are in `PLAN.md`/`STRUCTURE.md` |
| `test_concept_check_relative_drops_for_dead_boilerplate_match` | Real `break-streamer-mvp.zip` | Note in the test: this may or may not flip depending on whether `relative` also appears in real `.tsx` code outside the dead shadcn files — report the real outcome, don't assume it flips |
| `test_find_source_directive_still_finds_markdown` | Existing certified fixture | Confirms `.md` exclusion didn't break directive-finding itself |
| `test_existing_certified_fixtures_unaffected_by_md_exclusion` | Real `antsim-redux`/`corpworld` (no `.md` files in their corpus to begin with) | Coverage numbers unchanged |

Target: X passing, 0 failing, 0 skipped, real count. Baseline before you
change anything (measured 2026-09-24 in a scratch worktree of this exact
repo state, `uv run python --version` → `Python 3.12.12`):

```
uv run pytest -q -p no:cacheprovider studio_mcp/zip_verify/tests/test_verdict_synthesizer.py studio_mcp/zip_verify/tests/test_concept_grep.py
.......................                                                  [100%]
23 passed
```

Run that exact command yourself before touching anything, and again when
done — report both real counts, not this baseline restated.

**Live demonstration required at completion — as a named test, not a
scratch probe:** the previous two dispatches both died reaching for an
improvised, undeclared command (`uv run python _demo_s2c2.py`, refused
because it was never declared). Do not repeat that. Instead, add one
additive test function to
`studio_mcp/zip_verify/tests/test_concept_grep.py` — for example
`test_live_demonstration_break_streamer_before_after` — that:

1. Extracts `.agentflow/inbox/break-streamer.zip` (AI Studio) and
   `.agentflow/inbox/break-streamer-mvp.zip` (Manus) using
   `studio_mcp/zip_verify/zip_reader.extract_zip` (already in this repo —
   do not write your own extraction code).
2. Calls `concept_check` on each extracted directory, before AND after
   your `.md`-exclusion change is in effect (if it is already on `main` —
   see the STOP banner above — this may mean the "before" number is
   whatever it is with the `.md` exclusion permanently in place; say so
   plainly rather than fabricating a "before" that no longer exists in
   the code).
3. Prints (`print(...)`, captured by running pytest with `-s`) the real
   before/after coverage numbers and unmatched-concept lists side by
   side, same format as the last phase's demonstration.

Run it with `uv run pytest -q -s -p no:cacheprovider
studio_mcp/zip_verify/tests/test_concept_grep.py::test_live_demonstration_break_streamer_before_after`
(this is still `uv run pytest`, already declared under `## Sandbox needs`
above — no separate script or additional grant is needed) and paste the
real captured output into your Report. Do not run the full
`ZipVerifier.verify()` — no new OpenRouter call needed or wanted this
phase.

---

## §4 Completion Criteria

- [ ] Real pre-flight floor confirmed before any change — run
      `uv run pytest -q -p no:cacheprovider
      studio_mcp/zip_verify/tests/test_verdict_synthesizer.py
      studio_mcp/zip_verify/tests/test_concept_grep.py` yourself and
      report the real count (this session measured 23 passed; do not
      assume it still is without running it)
- [ ] `_allowed_verdict` fix implemented and confirmed against all three
      whitespace variants — or, if already on `main` (check `git log`
      per the STOP banner), confirmed present and unmodified
- [ ] `.md` exclusion implemented, confirmed `find_source_directive`
      unaffected — or, if already on `main`, confirmed present and
      unmodified
- [ ] Live demonstration run for real, as the named test in §3 (not a
      scratch script): before/after coverage on both real zips from
      `.agentflow/inbox/`, honest report of whether `relative` actually
      flips
- [ ] `antsim-redux`/`corpworld` fixtures confirmed unchanged
- [ ] No full `ZipVerifier.verify()` re-run — no new OpenRouter spend
      this phase
- [ ] Final full test floor reported, real count
- [ ] Neither Downloads zip was ever read by path from `Downloads/` —
      only from `.agentflow/inbox/`

---

## Rules for this run

- The run is NON-INTERACTIVE and any tool call needing confirmation ends it.
- Never read outside the worktree, and never reach for
  `C:\Users\cheat\Downloads\` by path — the two zips are already staged at
  `.agentflow/inbox/` before you start; if either is missing there, stop
  and write that in the Status row rather than searching for another way
  to reach `Downloads/`.
- Never run an improvised, undeclared command (a scratch script invoked
  directly, a bare `python -c`, or anything not covered by `## Sandbox
  needs` above). If you need to do something not covered, stop and write
  why in the Status row instead of trying another way around it.
- Do not search, glob, or hunt. If something named in this directive is
  missing, stop and write that in the Status row.
- Never commit to main, never push except to this run's own `directive/*`
  branch, never deploy.
- Free models only. No model config is touched by this work.
- Create no scratch or debug files outside `.devin-scratch/`, and never
  delete files.
- If a tool call is blocked, stop and write why in the Status row.

---

## §5 Quick Reference

| Fact | Value |
|---|---|
| Bug 1 | `_allowed_verdict` rejects `"BLOCKED - x"` due to whitespace |
| Bug 2 | Corpus includes `.md` planning docs, inflating coverage on doc-only matches |
| Deferred, real, harder | Excluding dead/unimported code — needs import-graph analysis |
| Real evidence for Bug 2 | Manus's `composite` match traced to `PLAN.md` only, never `Home.tsx` |
| Pre-fix numbers, confirmed twice independently | AI Studio 0.67, Manus 0.70 |
| OpenRouter calls this phase | Zero |

---

*RFD Method | Stage 2 Correction 2 | RFDGameStudio | September 2026*
*Two bugs a real re-run found, neither one guessed at — fix them, then the next real run is the actual test of whether the tool can be trusted with a verdict that matters.*

<!-- queue:start -->
## Queue

| Field | Value |
|---|---|
| Status | Blocked |
| Assigned to | devin |
| Branch | directive/rfdgamestudio-rfdgamestudio-stage2correction2-d-371166 |
| Base branch | - |
| Base commit | 564e1ebbb1f7e4a2ea46b5a95107f5f760f2bb69 |

**Status log**
- 2026-09-23 01:26 · agentflow-tick · none → Queued — suggested by heartbeat: Self-contained pure-function bugfix + additive tests, zero OpenRouter spend, no ambiguity — ideal for Devin
- 2026-09-24 10:56 · devin-overseer (delegated) · Queued → Approved
- 2026-09-24 12:16 · dispatcher · Approved → In progress — dispatched devin on personal-laptop in C:\GitHub\.worktrees\RFDGameStudio--rfdgamestudio-rfdgamestudio-stage2correction2-d-371166; base origin/main (local main differs); copied ts/src/games/game-metadata.json; lane=strong; model=default
- 2026-09-24 12:43 · agentflow-tick · In progress → Blocked — a tool call was rejected: uv run python _demo_s2c2.py; resume cap reached (2/2)
- 2026-09-24 20:03 · robert-claude-laptop · Blocked → Queued
- 2026-09-24 20:03 · robert-claude-laptop · Queued → Approved
- 2026-09-24 20:49 · dispatcher · Approved → In progress — dispatched devin on personal-laptop in C:\GitHub\.worktrees\RFDGameStudio--rfdgamestudio-rfdgamestudio-stage2correction2-d-371166; lane=strong; model=default
- 2026-09-24 21:07 · agentflow-tick · In progress → Blocked — process gone while the directive still reads In progress; the worktree holds uncommitted files; resume cap reached (2/2)
<!-- queue:end -->
