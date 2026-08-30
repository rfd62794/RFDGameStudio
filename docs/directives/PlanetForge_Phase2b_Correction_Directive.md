# PlanetForge — Phase 2 Directive: Tier-Range Correction + Divergence Audit

*August 2026 | Read fully before executing anything. Corrective phase, not a
rebuild. `src/engine/slimeEngine.ts` is the real, live engine — App.tsx
imports from it, not from `src/planetforge/gameLogic.ts` (which remains dead
code and is out of scope for this phase — do not delete it, do not wire it
in, leave it exactly as-is; that decision is separate and not this phase's
call).*

---

> ⛔ **STOP:** Before writing anything, report the real current test floor.
> Run whatever test command this scaffold actually uses (check
> `package.json`) against `src/engine/` and `src/planetforge/` and paste the
> raw output. Also grep `src/engine/slimeEngine.ts` for `default: return
> null` (or any bare `default:` in a value-returning switch) and paste every
> match with line numbers before touching anything — this phase needs to
> know whether that finding from the original review is still present
> before deciding what to fix.

---

## §0 Context

**Why this is a correction, not a rollback:** `slimeEngine.ts` was built
without authorization from the approved TS Phase 1 directive — it appears
to be a near-direct translation of the abandoned Rust ADR-002 spec instead.
It is, however, the only engine with real UI wired to it. Ripping it out in
favor of the compliant-but-unused `gameLogic.ts` would delete working UI
investment to gain a smaller, less complete engine. This phase corrects
`slimeEngine.ts` and `types.ts` in place instead.

**What this phase delivers:**
1. `tiers` clamped to `[0, 3]`, matching the original design rationale
   (discrete, bounded state space for testability) — not `[0, 10]`.
2. Confirmation of whether the `default: return null` silent-fallback
   pattern flagged in the original review is still present in any
   value-returning switch, and if so, replaced with a thrown error on an
   unhandled case — never a silently-returned null/default value.
3. Confirmation of whether the soil-yield formula is additive (per the
   original design intent) or multiplicative (as flagged divergent in the
   original review), reported either way — do not silently "fix" it to
   match the old spec without reporting what it currently does and why.

**Explicitly NOT in scope — do not touch:**
- `Settlement`, `GameLogEvent`, `current_tick`, `logs` on `WorldState` —
  these were built without a directive but are a real, working feature the
  game needs to be playable. Retroactively accepted. Do not remove, do not
  "clean up," do not restructure.
- `src/planetforge/gameLogic.ts` / `gameLogic.test.ts` — leave exactly as
  they are. Whether they get deleted, kept as reference, or eventually
  wired in is a separate decision for a separate phase.
- Renaming snake_case fields to camelCase, or `type`/`kind` discriminant
  naming, or the `AspectId`/`ElementType` naming schemes. Cosmetic
  divergence from the original spec is not this phase's concern — only the
  three items in "what this phase delivers" above are.
- Any UI component (`RingVisualizer.tsx`, `InspectorPanel.tsx`,
  `EventLog.tsx`, `SimulationHeader.tsx`, `TestRunnerModal.tsx`) — read
  them only as needed to confirm they don't assume tier values above 3
  somewhere (e.g. a color gradient or progress bar keyed to a 0-10 range);
  report if they do, do not silently rewrite them to compensate.

---

## §1 Scope Statement

| File | Status | Action |
|---|---|---|
| `src/types.ts` | Modify | Tier-range-related type/comment corrections only |
| `src/engine/slimeEngine.ts` | Modify | Clamp tiers to [0,3]; fix silent-fallback pattern if present; report yield-formula finding |
| `src/engine/tests.ts` | Modify | Update/add tests covering the tier clamp and the fallback fix |
| `src/App.tsx`, all `src/components/*.tsx` | Read-only | Check only for hardcoded assumptions about a 0-10 tier range; report, don't fix here |
| `src/planetforge/*` | Read-only | Do not touch |

> ⚠️ RULE: If clamping tiers to [0,3] breaks an existing test that asserted
> a value in the 4-10 range as correct behavior, that test was validating
> the wrong thing — fix the test to assert correct [0,3] behavior, don't
> loosen the clamp to make the old test pass.

---

## §2 Implementation

### Tier clamp

Add (or fix, if a version already exists but isn't [0,3]) a single
enforcement function, same role as `clampTier` in the compliant
`gameLogic.ts` — one place every tier write goes through:

```typescript
export function clampTier(value: number): number {
  return Math.max(0, Math.min(3, Math.trunc(value)));
}
```

> ⚠️ RULE: Grep the whole engine file for every place a `tiers` array is
> written or mutated, not just the obvious ones — report the count of call
> sites updated, the same discipline as the original directive's
> `ticks_stable` call-site requirement.

### Silent-fallback check

If a `default:` branch exists on any switch keyed on `SoilType`,
`AspectId`, or `StructureSlot['type']` that returns a value instead of
throwing — replace it with a thrown error naming the unhandled case. If no
such pattern exists (i.e., it was already fixed since the original review,
or the review's finding doesn't reproduce against current code), report
that plainly — this is a real possible outcome, not a failure to find
something.

### Yield formula

Report, don't silently change: is the current sector-yield calculation in
`slimeEngine.ts` additive (summing per-aspect contributions) or
multiplicative (applying a soil-tier multiplier)? State which, and paste
the actual function.

---

## §3 Test Anchors

| Test name | Behaviour |
|---|---|
| `tier_clamp_rejects_values_above_three` | Writing tier 10 results in stored value 3, not 10 |
| `tier_clamp_rejects_negative_values` | Writing tier -2 results in stored value 0 |
| `unhandled_case_throws_not_returns_default` | Only if a fallback was found and fixed — confirms it now throws |

Target floor: real current floor from the STOP rule, plus these new
anchors, reported as X passed, 0 failed, 0 skipped — raw output.

---

## §4 Completion Criteria

- [ ] Real pre-flight test floor reported before any change
- [ ] Tier clamp added/fixed, call-site count reported
- [ ] Silent-fallback finding reported (present-and-fixed, or not present) — not assumed either way
- [ ] Yield formula reported as additive or multiplicative, with the actual code pasted
- [ ] `Settlement`/`GameLogEvent`/`current_tick`/`logs` untouched — confirmed via diff
- [ ] `src/planetforge/gameLogic.ts` and its test untouched — confirmed via diff
- [ ] UI components checked for hardcoded 0-10 assumptions, findings reported, not silently patched
- [ ] Final test floor reported, raw output pasted

---

## §5 Quick Reference

| Item | Value |
|---|---|
| Real engine (unchanged this phase) | `src/engine/slimeEngine.ts` |
| Dead code (unchanged this phase) | `src/planetforge/gameLogic.ts` |
| Correct tier range | [0, 3] — was [0, 10] |
| Retroactively accepted, not in scope | Settlement / GameLogEvent / logs / current_tick |
| Two unresolved findings from original review, status unknown until checked | Silent `default:` fallback; multiplicative vs additive yield formula |

---

*PlanetForge | Phase 2 | Correction in place | RFDGameStudio*
*Not this phase: reconciling gameLogic.ts with the live engine, cosmetic naming alignment, UI rewrite.*
