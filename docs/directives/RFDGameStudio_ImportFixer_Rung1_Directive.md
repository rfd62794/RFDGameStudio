# RFDGameStudio — Import Fixer: Rung 1 Directive

*August 31 2026 | Read fully before executing anything. This is Rung 1 of
a progressive trust ladder: Devin is removed as executor for one narrow,
cataloged task class. Claude/human review is NOT removed — every output
still gets reviewed before landing. Scope is the TS harness
(`ts/src/games/`) specifically, not the repo generally.*

---

> ⛔ **STOP:** Run the real current Stage 1/2/2b + Verification Auditor
> test suites and report the real floor before touching anything. This
> phase is new code, not a continuation — there is no prior floor for
> `import_fixer` to compare against; report 0 as the honest starting
> point, don't invent one.

---

## §0 Context

**What Rung 1 actually changes:** for exactly two cataloged repair
patterns — both real, both fixed by hand tonight — an OpenRouter-called
model generates the fix instead of Devin. Nothing about the review
boundary moves. The fixer never commits, never pushes, and never marks
its own output done. It produces a diff and a report; a human or Claude
reviews both before anything lands, exactly as tonight's PlanetForge and
hover-preview fixes were reviewed after being written.

**Why exactly two patterns, not a general capability:** both are
real, already-diagnosed, already-fixed-once cases with a provably correct
answer that doesn't depend on taste or design intent — the opposite of
the `factory_idle` phase1/phase2 call or the PlanetForge Settlement-keep
decision, neither of which belongs in this catalog and neither of which
this tool is permitted to attempt.

1. **Numeric bound mismatch against a locked spec.** PlanetForge's tier
   clamp was `[0, 10]` when the locked spec said `[0, 3]`. The "correct"
   value isn't inferred by the fixer — it must be given explicitly via a
   manifest (§2), because a tool that invents what "correct" means here
   is exactly the PlanetForge failure repeating with extra steps.
2. **Silent fallback instead of thrown error.** A `default:` branch on an
   exhaustive union/enum switch that returns a value (often `null` or a
   default) instead of throwing. This one *is* self-contained — any
   value-returning default on an exhaustive type is suspect regardless of
   external spec, which is why it was safe to fix by hand tonight without
   consulting anything but the surrounding code.

**Explicitly NOT in scope:**
- Any pattern beyond these two. Adding a third pattern to the catalog is
  a human decision (per the trust-ladder design), not something this
  phase or the fixer itself does.
- Any commit, push, or "done" marking by the fixer. Output is a diff +
  report only.
- Any case where `pattern_detector.py` finds more than one plausible
  match, an ambiguous match, or a target file/symbol not covered by the
  manifest. These must produce an explicit `no_clean_match` result, never
  a best-guess fix.
- Anything outside `ts/src/games/`. This phase does not touch Lua-backed
  games, Python tooling, or `examples/`.

---

## §1 Scope Statement

| File | Status | Action |
|---|---|---|
| `studio_mcp/import_fixer/__init__.py` | New | Package init |
| `studio_mcp/import_fixer/pattern_catalog.py` | New | Defines exactly 2 patterns, no more |
| `studio_mcp/import_fixer/bound_manifest.py` | New | Loads the human-provided locked-bound manifest for Pattern 1 |
| `studio_mcp/import_fixer/pattern_detector.py` | New | Scans for clean matches; returns `no_clean_match`/`ambiguous` honestly |
| `studio_mcp/import_fixer/fix_generator.py` | New | Calls OpenRouter for a scoped, single-location fix; writes to scratch, never live files |
| `studio_mcp/import_fixer/fix_report.py` | New | Assembles diff + Verification Auditor evidence; never self-certifies |
| `bound_manifest.yaml` (new, repo root or `docs/state/`) | New | Human-authored: `{file, symbol, locked_bound}` entries. Starts with exactly one real entry — PlanetForge's own tier clamp, `[0, 3]`, as the fixture |
| `studio_mcp/import_fixer/tests/*.py` | New | Per §3 |

**Read-only:** everything outside `ts/src/games/` and this new package.
`studio_mcp/pipeline_audit/floor_runner.py`, `commit_claim_audit.py`,
`flaky_isolator.py` — imported, not modified.

> ⚠️ RULE: `fix_generator.py` never writes to a file under version control
> directly. It writes the proposed fix to a scratch path and returns a
> diff. Applying that diff to the real file is a separate, explicit step
> a human or Claude takes after reviewing the report — not something this
> phase automates.

---

## §2 Implementation

### `bound_manifest.py` + `bound_manifest.yaml`

Responsibility: the *only* source of truth for what a numeric bound
should be. The fixer must never infer this from context, a comment, or
"what looks reasonable" — only from an explicit entry a human wrote.

```yaml
# bound_manifest.yaml — human-authored, one entry per locked numeric bound.
# The fixer treats absence from this file as "no known correct value" and
# refuses to fix, never as license to guess.
- file: examples/planetforge/src/engine/slimeEngine.ts
  symbol: clampTier
  locked_min: 0
  locked_max: 3
  source: docs/directives/PlanetForge_Phase1_TS_Directive.md
```

### `pattern_detector.py`

Two detection functions, each returning one of `clean_match`,
`no_clean_match`, or `ambiguous` — never a fix, never a guess.

`detect_bound_mismatch(file_path) -> dict` — finds numeric clamp
expressions (`Math.min`/`Math.max` pairs, or equivalent range checks),
cross-references against `bound_manifest.yaml`. A clamp with no manifest
entry is `no_clean_match`. A clamp whose current bound already matches
the manifest is `no_clean_match` (nothing to fix). Only a real mismatch
against a real manifest entry is `clean_match`.

`detect_silent_fallback(file_path) -> dict` — finds `default:` (or
equivalent) branches in switch/match statements over TypeScript
discriminated unions or string-literal unions, where the default branch
returns a value instead of throwing. Multiple such branches in one file
→ report each as a separate `clean_match`, do not batch them into one fix.

> ⚠️ RULE: If `detect_bound_mismatch` or `detect_silent_fallback` finds a
> pattern that's *almost* a match but doesn't cleanly fit (e.g. a clamp
> using a variable bound instead of a literal, a default branch that logs
> before returning) — report `ambiguous` with the specific reason. Do not
> force it into `clean_match` to make the tool feel more capable.

### `fix_generator.py`

Given exactly one `clean_match` result, calls OpenRouter
(`deepseek/deepseek-v4-flash-0731`, confirm still live per prior sessions'
rule) with a prompt containing only: the pattern name, the exact file and
location, and — for Pattern 1 — the locked bound from the manifest. The
prompt must not ask the model to "review the file and fix issues" — it
asks for the minimal diff for the one named, located problem, nothing
broader.

### `fix_report.py`

Responsibility: assemble the proposed diff, then run
`floor_claim_diff` (against the real test command for the affected
package) on the *before* state, apply the diff to a scratch copy, run it
again on the *after* state, and include both in the report. Never marks
CERTIFIED/BLOCKED — that's still a human/Claude call, per AGENT_CONTRACT.md.

---

## §3 Test Anchors

| Test name | Fixture | Behaviour |
|---|---|---|
| `test_detect_bound_mismatch_finds_real_planetforge_case` | Real `examples/planetforge/src/engine/slimeEngine.ts` (now fixed — use a scratch copy with the bound manually reverted to `[0,10]` for the test) | Returns `clean_match` against the manifest entry |
| `test_detect_bound_mismatch_no_manifest_entry_is_no_clean_match` | Any TS file with a clamp, no manifest entry | Returns `no_clean_match`, never a guessed fix |
| `test_detect_silent_fallback_finds_real_pattern` | Synthetic TS fixture matching tonight's real `default: return null` shape | Returns `clean_match` |
| `test_detect_silent_fallback_ignores_logging_default` | Synthetic default branch that logs then throws | Returns `ambiguous`, not `clean_match` — it already throws |
| `test_fix_generator_never_writes_to_live_path` | Mocked OpenRouter client | Confirms output path is always under a scratch/temp directory |
| `test_fix_report_includes_before_after_floor_diff` | Mocked full pipeline | Report contains both floor states, no self-certification language |

Target: X passing, 0 failing, 0 skipped, real count.

**Live demo required at completion:** run the full pipeline against the
real `bound_manifest.yaml` entry (PlanetForge's tier clamp, deliberately
reverted to `[0,10]` in a scratch copy for this demo only — never in the
real tracked file) and paste the real generated diff plus the real
before/after floor comparison.

---

## §4 Completion Criteria

- [ ] Real pre-flight floor reported (0, honestly, since this is new)
- [ ] Exactly two patterns in the catalog — confirmed via grep that no
      third pattern type exists anywhere in `pattern_catalog.py`
- [ ] `bound_manifest.yaml` contains exactly the one real PlanetForge
      entry — no invented entries
- [ ] All §3 test anchors present and passing
- [ ] Live demo run for real, real diff and real floor comparison pasted
- [ ] Confirmed: no commit, push, or file write to any tracked path
      outside the scratch directory anywhere in this phase's code —
      grep for `git commit`, `git push`, `git add` returning zero hits
      in the new package
- [ ] Confirmed: `fix_report.py` contains no CERTIFIED/BLOCKED/UNVERIFIABLE
      or equivalent self-certifying language — grep confirms

---

## §5 Quick Reference

| Fact | Value |
|---|---|
| Patterns in catalog | Exactly 2 — bound mismatch, silent fallback |
| Devin removed for | These 2 patterns, in `ts/src/games/` only |
| Devin/Claude still required for | Everything else — every other repair, every judgment call, every landing decision |
| Fixer can commit/push | Never |
| Fixer can self-certify | Never |
| Model | `deepseek/deepseek-v4-flash-0731` — confirm still live before hardcoding |
| Adding pattern #3 | Human decision, not this phase's job |

---

*RFD Method | Import Fixer | Rung 1 | RFDGameStudio*
*Director → Pipeline → Agent, with one Agent slot now OpenRouter instead of Devin, for exactly this much and no more.*
