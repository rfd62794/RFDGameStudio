# RFDGameStudio — Stage 2 Correction 2: Verdict Parsing & Corpus Contamination

*September 2026 | Read `docs/directives/RFDGameStudio_Stage2Correction_ConceptExtraction_Directive.md`
in full before this one. Two separate, real bugs found during the actual
corrected-tool re-run against the real break-streamer zips — not
hypothetical, both independently confirmed. Neither needs a fresh
OpenRouter call to test; `concept_check` and `_allowed_verdict` are both
pure functions.*

---

> ⛔ **STOP:** Run the real current test suite (95/0 as of the last
> certified run) and confirm before touching anything. Re-run
> `concept_check` against the real, already-on-disk break-streamer zips
> (`C:\Users\cheat\Downloads\break-streamer.zip`,
> `break-streamer-mvp.zip`) and confirm the exact current numbers:
> AI Studio 0.67, Manus 0.70, before any change — these are the honest
> starting point, already independently verified twice.

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

**Read-only:** both real zips in `Downloads/`, everything else in
`studio_mcp/`.

> ⚠️ RULE: `.md` files still count for `find_source_directive()` — that
> function's whole job is finding a directive written in markdown. This
> phase only excludes `.md` from the *code corpus* `concept_check` scans
> for matches, not from directive-finding. Do not conflate the two.

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

Target: X passing, 0 failing, 0 skipped, real count.

**Live demonstration required at completion:** re-run `concept_check`
(not the full `ZipVerifier.verify()` — no new OpenRouter call needed or
wanted this phase) against both real break-streamer zips, paste the
real before/after coverage numbers and unmatched lists side by side,
same format as the last phase's demonstration.

---

## §4 Completion Criteria

- [ ] Real pre-flight floor confirmed (95/0) before any change
- [ ] `_allowed_verdict` fix implemented and confirmed against all three
      whitespace variants
- [ ] `.md` exclusion implemented, confirmed `find_source_directive`
      unaffected
- [ ] Live demonstration run for real: before/after coverage on both
      real zips, honest report of whether `relative` actually flips
- [ ] `antsim-redux`/`corpworld` fixtures confirmed unchanged
- [ ] No full `ZipVerifier.verify()` re-run — no new OpenRouter spend
      this phase
- [ ] Final full test floor reported, real count

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
