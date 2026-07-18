# RFDGameStudio — Framework Generation Layer: Recovery Manifest Tool

*July 18 2026 | Read fully before executing. A real, systematic
generalization of the manual audits done all day — reuses Module 1's
real AST-walking infrastructure, extended to cover all 48 real exports
(not just pure data), producing a persistent, re-runnable manifest rather
than another one-off grep session. This is the tool that would have
caught tonight's mediation bug automatically instead of by hand.*

---

> ⛔ **STOP:** Run `.venv\Scripts\python.exe -m pytest -q --tb=no` AND
> `cd ts && npx vitest run`. Report the real current floor for both
> before starting (whatever it is after the mediation fix lands).

---

## §0 Context

**Real, confirmed scale:** exactly 48 top-level exports in
`intake/slimegarden/extracted/src/gameLogic.ts` — a real, manageable,
fully-auditable number, confirmed via direct count.

**Real, proven value, not hypothetical:** a two-minute manual check of
just 4 of these 48 symbols tonight found two genuine gaps
(`stageFromLevel`/`stageModifier`, `getHueDeviation`) and one urgent,
real bug (mediation never resolves). Extrapolated across all 48, this is
real, concrete evidence the manifest will surface things a scattered,
category-by-category audit approach would keep missing.

**Real, deliberate design philosophy — alarm and draft, not silent
auto-resolution:** name-based matching across TypeScript and Lua is
genuinely unreliable in real, confirmed cases already found tonight —
`resolveDispatch` has no literal `resolve_dispatch` equivalent, its logic
lives inline inside `retrieve_completed_dispatch` under a completely
different name. A tool that confidently asserts "MISSING" for a
renamed-but-present function would be actively worse than useless — it
would erode trust in the manifest itself. **The tool produces a real
draft with a status per symbol, and any symbol it can't confidently
resolve gets a real "NEEDS HUMAN REVIEW" status, never a false-confident
MISSING or RECOVERED.**

**NOT in scope, deferred explicitly:**
- Auto-fixing anything the manifest finds — this is a reporting tool,
  not a repair tool
- Extending coverage beyond `gameLogic.ts`'s top-level exports in this
  first version — `types.ts`, `App.tsx`, `hooks/*.ts` are real, separate,
  future scope once this proves out
- Any change to Module 1's actual pure-data classification/YAML-emission
  logic — this reuses its AST-walking, doesn't modify it

---

## §1 Scope Statement

| File | Status | Action |
|---|---|---|
| `ts/tools/framework_gen/audit.ts` | New | Real, complete symbol enumeration (reuses `classify.ts`'s AST walk) + cross-reference against SlimeWorld's Lua/TS |
| `ts/tools/framework_gen/manifest_report.ts` | New | Emits the real, persistent manifest file |
| `docs/slimegarden_recovery_manifest.md` | New (generated) | The real, human-readable output — one row per symbol |
| `ts/tests/test_recovery_manifest.ts` | New | Anchors below |

**Read-only — do not touch:** `classify.ts`, `emit_yaml.ts`, `report.ts`
(Module 1's real, working code — this reuses it, doesn't modify it),
anything in `games/slimeworld/` (this tool only reads and reports).

---

## §2 Implementation

### Real symbol enumeration

Reuse `classify.ts`'s existing AST walk to get all 48 real top-level
`export function`/`export const` declarations from `gameLogic.ts` — name,
kind (function/const), and its already-computed pure-data/logic/ambiguous
classification from Module 1.

### Real, conservative cross-reference

For each symbol, in order:

1. **Direct name match**: convert to snake_case (reuse the existing,
   already-fixed `camelToSnake` from `emit_yaml.ts` — including its real
   SCREAMING_SNAKE handling), search for a matching `function` definition
   or `data.yaml` key in SlimeWorld.
2. **If found**: check whether it's genuinely *called* anywhere (not
   just defined) — real grep for the function name followed by `(` in
   both `logic.lua` and every `ts/src/games/slimeworld/*.tsx`/`.ts` file.
   Status: `RECOVERED` (found + called) or `DEFINED_NOT_CALLED` (found,
   never invoked — this is the real status that would have caught
   `applyDispatchStabilityHook` and, differently, would have caught
   mediation if its Lua counterpart existed under a matching name).
3. **If no direct name match**: status `NEEDS_HUMAN_REVIEW` — **never
   report MISSING automatically.** A human confirms whether it's
   genuinely absent, present-under-a-different-name (like
   `resolveDispatch`), or deliberately not applicable (like the retired
   Pattern-bonus system, or rendering-only geometry functions that stay
   TS-only by design).

> ⚠️ RULE: this conservative, three-outcome design (`RECOVERED` /
> `DEFINED_NOT_CALLED` / `NEEDS_HUMAN_REVIEW`) is deliberate and
> non-negotiable — do not add a confident `MISSING` status that the tool
> asserts on its own. Every real "this doesn't exist" conclusion in the
> manifest must come from a human confirming a `NEEDS_HUMAN_REVIEW` row,
> not from the tool's own pattern-matching.

### Real manifest format

```markdown
| Symbol | Kind | Status | Notes | Last Checked |
|---|---|---|---|---|
| getRandomMelancholicLog | function | RECOVERED | get_random_melancholic_log, called in advance_cycle | 2026-07-18 |
| applyDispatchStabilityHook | function | DEFINED_NOT_CALLED | (or MISSING if genuinely absent — confirm real state) | 2026-07-18 |
| resolveDispatch | function | NEEDS_HUMAN_REVIEW | No direct name match — likely inline elsewhere, confirm | 2026-07-18 |
```

> ⚠️ RULE: run this tool for real against the actual current codebase as
> part of this directive's own verification — populate the real manifest
> with real, current results, don't ship an empty template. Report the
> real, resulting status breakdown (how many RECOVERED / DEFINED_NOT_CALLED
> / NEEDS_HUMAN_REVIEW) in the completion report.

> ⚠️ RULE: cross-check the tool's own output against the real, already-known
> findings from tonight (mediation's real gap, `stage_from_level`/
> `stage_modifier`/`get_hue_deviation` absent, `applyDispatchStabilityHook`
> confirmed missing) as a real correctness check on the tool itself —
> if the generated manifest disagrees with any of these already-confirmed-
> by-hand findings, the tool has a real bug, not the codebase.

---

## §3 Test Anchors

| Test | Target |
|---|---|
| `test_enumerates_all_48_real_exports` | Real, exact count from the actual source file |
| `test_camelToSnake_reused_not_reimplemented` | Confirms this imports Module 1's real function, doesn't duplicate it |
| `test_recovered_status_requires_both_presence_and_call` | A symbol that's defined but never called does NOT get marked RECOVERED |
| `test_no_symbol_ever_gets_confident_missing_status` | Real, structural check — the tool's output vocabulary never includes a bare "MISSING," only the three real statuses |
| `test_known_recovered_symbol_matches` | `get_random_melancholic_log` (already confirmed wired tonight) → real `RECOVERED` |
| `test_known_gap_symbol_flagged_correctly` | `applyDispatchStabilityHook` → real `DEFINED_NOT_CALLED` or `NEEDS_HUMAN_REVIEW` (confirm actual current state, don't assume) |
| `test_renamed_function_goes_to_human_review_not_false_missing` | `resolveDispatch` (real, known naming mismatch) → `NEEDS_HUMAN_REVIEW`, not a false-confident missing |

**Target: report the real number.**

---

## §4 Completion Criteria

- [ ] Real pre-flight floor confirmed for both suites
- [ ] Real manifest generated against the actual current codebase, not a template — pasted or attached in the report
- [ ] Real status breakdown reported (counts per status)
- [ ] Manifest cross-checked against tonight's already-known findings, any disagreement investigated as a tool bug, not dismissed
- [ ] Confirmed no symbol ever receives a bare, tool-asserted "MISSING" status
- [ ] `.venv\Scripts\python.exe -m pytest -q` AND `cd ts && npx vitest run` → raw output pasted for both, real final floors reported
- [ ] `docs/state/current.md` updated: this tool noted as real, available, and how to re-run it as future directives land

---

## §5 Quick Reference

| Fact | Value |
|---|---|
| Real scale | 48 top-level exports, `gameLogic.ts` only, this version |
| Reused infrastructure | Module 1's real AST walk + `camelToSnake` |
| Three real statuses | `RECOVERED`, `DEFINED_NOT_CALLED`, `NEEDS_HUMAN_REVIEW` — never a confident `MISSING` |
| Real proof-of-concept | 4 manually-checked symbols tonight found 2 real gaps + 1 urgent bug |
| Output | `docs/slimegarden_recovery_manifest.md`, real and re-runnable |
| Future scope, not this version | `types.ts`, `App.tsx`, `hooks/*.ts` coverage |

---

*Director: Claude | A repeatable process, not another one-off audit, 2026-07-18*
*The tool's job is to ask the right question loudly, not to guess at the answer quietly.*
