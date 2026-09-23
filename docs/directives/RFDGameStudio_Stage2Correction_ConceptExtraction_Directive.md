# RFDGameStudio — Stage 2 Correction: Concept Extraction & Verdict Blindness

*August 31 2026 | Read `docs/directives/RFDGameStudio_BreakStreamer_Stage2Test_Directive.md`
in full before this one — that real-world test found the actual bug this
phase fixes. Three concrete, separable causes, fixed in order because
the first two make the third's residual smaller before it's touched.
A fourth cause (generic imperative verbs like "write"/"required") is
explicitly deferred — see §0.*

---

> ⛔ **STOP:** Run the real current Stage 1+2+2b+import_fixer suite
> (87/0 as of the last certified run) and confirm before touching
> anything. Also re-run `_extract_concepts` against the real
> `break-streamer_Directive.md` (already in `docs/directives/` from the
> prior test) and confirm you get the same 30-concept list already on
> record: `['current', 'state', 'ready', 'break', 'streamer',
> 'utilizing', 'divert', 'selling', 'mechanic', 'maximum', 'economic',
> 'realism', 'directive', 'engine', 'architect', 'write', 'scaffolding',
> 'contains', 'include', 'classes', 'required', 'toggle', 'controller',
> 'logic', 'handles', 'transition', 'clicking', 'hides', 'office',
> 'starts']` — before any fix, this is the honest starting point.

---

## §0 Context

**What broke, confirmed by direct investigation, not assumed:** running
Stage 2 against a real directive written in ordinary prose (not the
terse rfd-method format every existing test fixture uses) produced a
false `BLOCKED` verdict on two builds independently confirmed by hand to
correctly implement the real requirements. Root cause, traced to two
separable bugs plus one design gap in the LLM step:

1. **`_extract_concepts` strips ALL backtick-quoted text unconditionally**
   before extraction — including the single highest-signal technical
   terms in the whole directive: `` div#off-stream-ui ``, `` .hidden ``,
   `` img ``. These never had a chance to be checked for.
2. **Extraction runs over the entire document**, including narrative
   framing ("Current State of Play," "You are the Lead Engine
   Architect," "for maximum economic realism") that was never a
   technical requirement. Every real rfd-method directive in this repo
   has the same shape — framing prose, then a numbered
   `**Directive:**` block or a `§` section — and extraction currently
   can't tell them apart.
3. **`verdict_synthesizer` never receives the directive text or the
   specific unmatched concepts** — only a bare coverage percentage. Its
   own raw reasoning in the real report confirmed this directly: *"we
   don't have its content."* It reasoned itself into treating an
   uninterpretable number as sufficient evidence.

**Explicitly deferred, not this phase:** generic imperative verbs inside
the real directive section itself ("write," "required," "include").
Fixes 1 and 2 below are expected to shrink this residual substantially
before it's clear whether it's still a real problem worth its own fix —
building a stoplist against a problem that might already be gone is the
same premature-scope mistake this whole pipeline has stayed away from
all night.

**What this phase delivers:**
1. Selective backtick handling — short, single-line spans (identifiers,
   selectors, short code fragments) are kept as extractable text; only
   genuine multi-line or long code blocks are stripped.
2. Section-scoped extraction — when a `**Directive:**` marker or an
   rfd-method `§` section exists, extract concepts from that section
   onward, not the whole document. Falls back to whole-document
   extraction when no such marker is found, so existing certified
   fixtures (which don't have this exact shape) don't regress.
3. `verdict_synthesizer`'s prompt includes the real, specific list of
   unmatched concepts (not just the coverage percentage), so the model
   judges relevance instead of pattern-matching a number it admitted it
   couldn't interpret.

**Explicitly NOT in scope:**
- The generic-verb stoplist (§0, deferred)
- Any change to `pattern_detector.py`, `import_fixer/`, or anything
  outside `studio_mcp/zip_verify/concept_grep.py` and
  `verdict_synthesizer.py`
- Re-running the real break-streamer verification to produce a new
  official verdict on either build — this phase fixes the tool and
  proves the fix against the real fixture; a fresh official run is a
  separate, later step
- Guaranteeing both builds come back `CERTIFIED` after this fix. The
  honest prediction is a *more differentiated* verdict — the AI Studio
  build's real CSS-only compositing (no actual `<img>` tag) is a
  legitimate thing a corrected tool might still flag, while the Manus
  build's real image compositing might not be. Do not treat "both
  should pass now" as a success criterion.

---

## §1 Scope Statement

| File | Status | Action |
|---|---|---|
| `studio_mcp/zip_verify/concept_grep.py` | Modify | Selective backtick handling, section-scoped extraction |
| `studio_mcp/zip_verify/verdict_synthesizer.py` | Modify | Pass real unmatched-concept list to the prompt |
| `studio_mcp/zip_verify/tests/test_concept_grep.py` | Modify (additive) | New tests per §3, using the real break-streamer directive as a fixture |
| `studio_mcp/zip_verify/tests/test_verdict_synthesizer.py` | Modify (additive) | New test confirming the prompt contains the real missing-concept list |

**Read-only:** `docs/directives/break-streamer_Directive.md` and
`break-streamer-mvp_Directive.md` (real fixtures, already on disk from
the prior test — do not modify their content), every other file in
`studio_mcp/zip_verify/`, all of `pattern_catalog.py`/`pattern_detector.py`
in `import_fixer/`.

---

## §2 Implementation

### `concept_grep.py` — selective backtick handling

Replace the unconditional strip:

```python
text = re.sub(r"`[^`]+`", "", text)
```

with a function that keeps short, single-line backtick spans and only
strips genuine code blocks:

```python
def _strip_long_backtick_spans(text: str) -> str:
    def _replace(m: re.Match) -> str:
        content = m.group(1)
        if "\n" in content or len(content) > 40:
            return ""  # real code block — strip
        return content  # short identifier/selector — keep, feeds extraction
    return re.sub(r"`([^`]+)`", _replace, text)
```

> ⚠️ RULE: Apply this before the existing `[^A-Za-z0-9_\-\s]` cleanup
> step, not after — the cleanup step already correctly turns
> `div#off-stream-ui` into two space-separated tokens (`div`,
> `off-stream-ui`) once the surrounding backticks are gone; it never
> needed to change.

### `concept_grep.py` — section-scoped extraction

```python
_DIRECTIVE_MARKERS = [
    re.compile(r"\*\*Directive:\*\*", re.IGNORECASE),
    re.compile(r"^##?\s*§\d", re.MULTILINE),
]

def _scope_to_directive_section(text: str) -> str:
    """Return the text from the first directive marker onward, if found.
    Falls back to the full text when no marker matches — existing
    fixtures without this shape must not regress."""
    earliest = None
    for pattern in _DIRECTIVE_MARKERS:
        m = pattern.search(text)
        if m and (earliest is None or m.start() < earliest):
            earliest = m.start()
    return text[earliest:] if earliest is not None else text
```

Call this at the start of `_extract_concepts`, before any other
processing.

> ⚠️ RULE: Do not add a third marker pattern speculatively "in case it's
> needed." Two real, confirmed directive shapes exist in this repo
> (the `**Directive:**` prose style, the rfd-method `§` style) — cover
> those two, not hypothetical others.

### `verdict_synthesizer.py` — pass the real missing concepts

`concept_check` in `concept_grep.py` already computes `concepts` (the
full list) and `matches` (the ones found) — the set difference is
already available, just never passed forward. Thread it into whatever
function builds the LLM prompt (`_build_prompt` or equivalent) as an
explicit field, e.g. `unmatched_concepts: list[str]`, and include it in
the prompt text so the model can see specifically what's missing, not
just a percentage.

> ⚠️ RULE: Do not have this phase pre-filter the unmatched list before
> sending it (e.g., don't try to guess which missing words "matter").
> That's exactly the judgment call this phase is handing to the model by
> giving it real information — pre-filtering it defeats the point.

---

## §3 Test Anchors

| Test name | Fixture | Behaviour |
|---|---|---|
| `test_strip_long_backtick_spans_keeps_short_identifiers` | Synthetic text with `` `div#off-stream-ui` `` and `` `.hidden` `` | Both survive as extractable text |
| `test_strip_long_backtick_spans_removes_real_code_block` | Synthetic multi-line backtick code block | Fully stripped, as before |
| `test_scope_to_directive_section_finds_prose_marker` | Real `break-streamer_Directive.md` | Extraction starts at `**Directive:**`, excludes "Current State of Play" framing |
| `test_scope_to_directive_section_finds_rfd_method_marker` | Real directive from this repo using `§` sections (e.g. this phase's own directive once committed) | Extraction starts at first `§` section |
| `test_scope_to_directive_section_falls_back_when_no_marker` | Existing certified fixture text with neither marker | Falls back to whole-document extraction, unchanged behavior |
| `test_extract_concepts_real_break_streamer_directive_includes_selector_terms` | Real `break-streamer_Directive.md` | `off-stream-ui`, `hidden` (or equivalent post-cleanup tokens) now appear in the extracted concept list — confirmed absent before this phase |
| `test_verdict_synthesizer_prompt_includes_unmatched_concepts` | Mocked findings with a known unmatched list | Prompt text contains the real list, not just a percentage |
| `test_existing_certified_fixtures_unaffected` | Real `antsim-redux`, `corpworld` directives already used in Stage 2's original test suite | Coverage numbers unchanged from their previously-certified values — confirms no regression |

Target: X passing, 0 failing, 0 skipped, real count.

**Live demonstration required at completion:** re-run `_extract_concepts`
against the real `break-streamer_Directive.md` and paste the real,
complete before/after concept lists side by side. Do not re-run the full
`ZipVerifier.verify()` against either real zip as part of this phase —
that's explicitly deferred (§0).

---

## §4 Completion Criteria

- [ ] Real pre-flight floor confirmed (87/0) before any change
- [ ] Both `concept_grep.py` changes implemented per §2
- [ ] `verdict_synthesizer.py` change implemented per §2
- [ ] All §3 test anchors present and passing, real fixtures used where
      marked real
- [ ] Live demonstration run for real: before/after concept lists for
      the real break-streamer directive, pasted in full
- [ ] Confirmed: `antsim-redux`/`corpworld` fixture coverage numbers
      unchanged — no regression in already-certified behavior
- [ ] No re-run of the full break-streamer `ZipVerifier.verify()` in
      this phase's completion report — that's a deliberate next step,
      not this one
- [ ] Full final test floor (import_fixer + pipeline_audit + zip_verify)
      reported, real count

---

## §5 Quick Reference

| Fact | Value |
|---|---|
| Root causes fixed this phase | Backtick over-stripping, whole-document extraction, blind percentage in the LLM prompt |
| Deferred | Generic-verb stoplist (§0) |
| Real fixture confirming the bug | `docs/directives/break-streamer_Directive.md`, already on disk |
| Not this phase's job | Producing a new official verdict on either real build |
| Success criterion | A more differentiated, evidence-grounded verdict — not "both pass" |

---

*RFD Method | Stage 2 Correction | RFDGameStudio | August 2026*
*Director → Pipeline → Agent. The tool found a real bug in itself, on the first real thing it was pointed at outside its own fixtures — fix the tool, not the test.*
