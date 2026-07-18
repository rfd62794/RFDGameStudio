# RFDGameStudio — Directive: Fix Splicing Roster Bloat + SlimeDex Discovery

*July 18 2026 | Read fully before executing. Two real, confirmed,
distinct bugs, both verified by direct code read — grouped together
because both are small, mechanical React state-management fixes in the
same file, not because they're related in cause.*

---

> ⛔ **STOP:** Run `.venv\Scripts\python.exe -m pytest -q --tb=no` AND
> `cd ts && npx vitest run`. Report the real current floor for both.

---

## §0 Context

**Bug 1 — real, confirmed, roster bloat:** `initiate_breeding` in Lua
correctly removes the consumed parent from `state.slimes` and returns
`child.consumed_slime_id`. `handleInitiateBreeding` in `App.tsx` (line
108) does `slimes: [...previous.slimes, child]` — appends the child but
never filters the consumed parent out of `previous.slimes`. Confirmed via
direct read: the Lua mutation is real but discarded, since React rebuilds
state from `previous`, not from Lua's own mutated copy. Every breed
silently leaves a dead specimen in the roster forever — this is the real
mechanism behind "Splicing is broken."

**Bug 2 — real, confirmed, SlimeDex never populates:** `colorCodex` and
`patternCodex` — confirmed via direct search, zero matches anywhere in
`App.tsx` — are never initialized in `initialState()` and never updated
on breeding. `colorTargetCodex`/`shapeTargetCodex` (the *target*
discovery codices, a different real system built earlier tonight) do get
updated correctly — this bug is specifically about the base "have I ever
seen this color/pattern at all" discovery tracking, a real, separate,
older system that was simply never wired.

**NOT in scope, deferred explicitly:**
- The visual rendering gap (`vertexCount`/`irregularity`/`accentHue`
  never used) — real, separate, larger scope, its own directive
- Any change to the actual breeding formulas — untouched, this is pure
  state-management plumbing

---

## §1 Scope Statement

| File | Status | Action |
|---|---|---|
| `ts/src/games/slimeworld/App.tsx` | Modify | Fix `handleInitiateBreeding`'s roster update; initialize and update `colorCodex`/`patternCodex` |
| `ts/tests/test_splicing_and_dex.tsx` | New | Anchors below |

**Read-only — do not touch:** `initiate_breeding` in `logic.lua` (already
correct — the bug is entirely on the TS side), `colorTargetCodex`/
`shapeTargetCodex` handling (already correct, different system).

---

## §2 Implementation

### Bug 1 fix — real roster filtering

```tsx
setState(previous => {
  const filteredSlimes = child.consumedSlimeId
    ? previous.slimes.filter(s => s.id !== child.consumedSlimeId)
    : previous.slimes;
  // ... existing colorTargetCodex/shapeTargetCodex logic unchanged ...
  return {
    ...previous,
    credits: Math.max(0, previous.credits - 10),
    slimes: [...filteredSlimes, child],
    // ...
  };
});
```

> ⚠️ RULE: verify the real, exact field name on the TS `child` object —
> confirmed as `consumedSlimeId` (camelCase, via `luaSlimeToTs`) at this
> call site, not the raw Lua `consumed_slime_id` — don't mix conventions.

### Bug 2 fix — real codex initialization and update

```tsx
// initialState(): derive from the real starter roster
colorCodex: buildInitialColorCodex(starterSlimes), // { Red: true, Blue: true, ... } from actual starting colors
patternCodex: buildInitialPatternCodex(starterSlimes),
```

In `handleInitiateBreeding`, alongside the existing
`colorTargetCodex`/`shapeTargetCodex` updates:

```tsx
const newColorCodex = { ...(previous.colorCodex ?? {}), [child.color]: true };
const newPatternCodex = { ...(previous.patternCodex ?? {}), [child.pattern]: true };
```

> ⚠️ RULE: confirm the real, current SlimeDexTab.tsx rendering logic
> actually reads `colorCodex`/`patternCodex` (not some other, differently
> -named field) before assuming this fix alone closes the loop — if the
> UI component reads a different field name, report that explicitly and
> reconcile rather than silently adding a second, parallel state field.

---

## §3 Test Anchors

| Test | Target |
|---|---|
| `test_breeding_removes_consumed_parent_from_roster` | **The real, load-bearing test for Bug 1** — real breed call, confirm the consumed parent's ID is genuinely absent from the resulting roster, not just that the child is present |
| `test_breeding_without_consumption_keeps_both_parents` | Real, distinct case — confirms the filter doesn't over-trigger when `consumedSlimeId` is null |
| `test_roster_cap_enforced_correctly_after_fix` | Real, practical confirmation — breeding repeatedly no longer silently exceeds the real roster cap the way the bug allowed |
| `test_initial_color_codex_reflects_starter_slimes` | Real, direct check on `initialState()`'s output |
| `test_breeding_new_color_updates_color_codex` | **The real, load-bearing test for Bug 2** — breed a color combination producing a genuinely new color, confirm `colorCodex` reflects discovery |
| `test_breeding_repeat_color_does_not_duplicate_or_error` | Real, distinct case — rediscovering an already-known color is a safe no-op |
| `test_slimedex_ui_reads_the_correct_real_field` | Confirms the fix actually reaches the UI component, not just internal state |

**Target: report the real number.**

---

## §4 Completion Criteria

- [ ] Real pre-flight floor confirmed for both suites
- [ ] Real, live confirmation: breed a slime, verify the consumed parent's row genuinely disappears from the roster UI, not just internal state
- [ ] Real, live confirmation: breed a genuinely new color, verify SlimeDex shows it as discovered
- [ ] `.venv\Scripts\python.exe -m pytest -q` AND `cd ts && npx vitest run` → raw output pasted for both, real final floors reported
- [ ] `docs/state/current.md` updated with both real fixes noted

---

## §5 Quick Reference

| Fact | Value |
|---|---|
| Bug 1 real cause | `App.tsx:108` never filters `consumedSlimeId` out of the roster |
| Bug 2 real cause | `colorCodex`/`patternCodex` never initialized or updated anywhere |
| Real, unaffected systems | `colorTargetCodex`/`shapeTargetCodex` — already correct, different system |
| Pre-flight floor | Report actual current numbers before starting |

---

*Director: Claude | Two real, confirmed, small fixes closing two of tonight's three visible complaints, 2026-07-18*
