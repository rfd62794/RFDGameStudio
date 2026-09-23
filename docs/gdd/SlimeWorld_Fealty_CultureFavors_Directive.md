# SlimeWorld — Directive: Fealty + Culture Favors (MVP)

*August 2 2026 | Read `docs/gdd/SlimeWorld_Design_Rev2.md` in FULL before executing anything — it is the authoritative, confirmed-real design source. This directive implements Rev 2's own recommended next slice, per its Recommended Build Order section.*

---

> ⛔ **STOP:** Run the full RFDGameStudio suite before touching anything.
> Must report **563 passing, 0 failing, 0 skipped** (Python) and
> **251 passing, 0 failing, 0 skipped** (TypeScript, `cd ts && npx vitest run`).
> If the count differs, stop and report — do not proceed.
>
> ⚠️ RULE (project-standing, not new): Real TS→Lua→TS bridge tests only,
> never Lua-only. This project shipped a real mission-serialization bug
> once from skipping this — Stage-Make-Real's own directive enforced it
> explicitly, and it applies here too.

---

## §0 Context

Rev 2's core thesis: the player is tending something small in the wake of
a catastrophe, uncertain whether care matters more than conquest, until it
turns out — mechanically, not just narratively — that it did. Conquest is
already real and fully built (fast, loud, permanently re-fogs the map on
first claim). **Fealty is the other half of that thesis, and it does not
exist yet.** At 100% relationship with a culture, that culture's future
territory becomes the player's automatically and its nodes exit the
pressure simulation permanently — the one system in the whole design that
produces something that *stays* true once it's true. Culture Favors are
the on-ramp to Fealty.

**Real technical grounding, confirmed via direct source read this
session (August 2, 2026) — read this before assuming anything from Rev 2's
own prose is a complete technical spec:**

- `culture_relationships` is a real, currently dead field. It is read via
  `state.culture_relationships or {}` in `resolve_convert_claim()`
  (`games/slimeworld/territory.lua:89`, called from `territory.lua:196`;
  the older `logic_original.lua:467/571` copy is legacy, not live).
  Bridged both directions in TypeScript
  (`ts/src/games/slimeworld/App.tsx:67`, `types.ts`'s `stateToLua()`).
  Confirmed via fresh grep: it is **never written anywhere** in the real
  codebase, Lua or TypeScript. This directive's core job is giving it a
  real write path.

- **Real correction to Rev 2's own wording:** Rev 2 describes Favor
  fulfillment as happening "via Dispatch (reduce pressure) or Disposal."
  Confirmed via direct source read: this does not match real source as
  written. `launch_dispatch`/dispatch resolution
  (`games/slimeworld/logic.lua:252-309`) operates against `zone_id` /
  `state.zones` — a system distinct from planet-territory nodes — and
  touches neither `node.pressure` nor `culture_relationships`. The
  resolver that actually operates on territory nodes is **Mediation**
  (`launch_mediation`, resolved at `logic.lua:210-249`), but its real
  effect is limited to `node.strength` — never `node.pressure`, never
  `culture_relationships`. **Disposal does not exist anywhere in real
  source** — it is wholly new work, not a rename of an existing mechanic.
  Do not build on the assumption that Dispatch or Mediation already do
  this — see §2c for the real design choice this leaves open.

- `node.pressure` (per-color numeric, Lua) and `node.is_supplied` /
  `isSupplied` (boolean, bridged) are both real, live, actively-used
  fields — confirmed in `territory.lua`, `codex.lua`'s supply-cascade
  logic, `ts/src/games/slimeworld/planetRegion.ts`, and `types.ts`. Safe,
  real ground to build Favor generation against.

**Not in scope, deferred to later directives per Rev 2's own build
order:** Loyalty, Lab Level, Season/Culture rotation — all real, locked
systems, but not this slice. **Explicitly cut, do not resurrect:** Squad
Leaders, Training-as-a-separate-system, a second real-time clock (all
named and reasoned in Rev 2). Rev 2's own real, unresolved fail-state
question is not this directive's job to resolve — flag if it becomes
genuinely blocking, do not silently decide it.

---

## §1 Scope Statement

| File | Status | Action |
|---|---|---|
| games/slimeworld/territory.lua | Modify | Favor generation + fulfillment resolution; real write path for `node.pressure` and `culture_relationships` |
| games/slimeworld/logic.lua | Modify (narrow) | Wire Favor resolution into the real per-cycle resolution pass — confirm real trigger model first, see §2b |
| games/slimeworld/favors.lua (or Devin's confirmed real equivalent location) | New | Favor generation logic, Disposal resolution — confirm real, sensible file placement before creating, report choice |
| ts/src/games/slimeworld/types.ts | Modify | Bridge new Favor type + Disposal action; real write-path for `culture_relationships` (read-side already real) |
| ts/src/games/slimeworld/App.tsx | Modify (narrow) | Functional hookup for the Disposal action only — not new UI/screen design; confirm real scope boundary with Robert if a genuinely new UI surface seems required |
| tests/*, ts/tests/* | Modify | New anchors per §3 |

**Read-only — do not touch:** `compute_stage()` / `STAGE_THRESHOLDS`
(logic.lua — certified complete, Stage-Make-Real's scope, not this
directive's); Legacy Slime spec/logic (already correct per Rev 1); Elder
breeding tax in `territory.lua`'s `initiate_breeding`; anything under
Loyalty / Lab Level / Season rotation (not started, separate directives).

---

## §2 Implementation

### §2a — `culture_relationships` write path

On real Favor fulfillment success, increment `culture_relationships[color]`
toward 100%. Exact increment curve/values are a real, un-prespecified
design choice — propose and report, same pattern this project already used
for Stage-Make-Real's Elder breeding-tax target.

> ⚠️ RULE: At 100% for a given culture, per Rev 2's real locked spec, that
> culture's future territory becomes the player's automatically and its
> existing nodes exit the pressure simulation entirely. Implement this as
> a real, testable state transition — nodes in Fealty should stop
> participating in `codex.lua`'s supply-cascade/pressure logic, not just
> display differently in UI.

> ⚠️ RULE: This is the one mechanic in the whole design meant to be
> permanent and irreversible. No code path may decrement a
> 100%-reached `culture_relationships` value back down. If a real bug or
> edge case seems to require it, stop and report — do not implement a
> workaround that silently violates the locked spec.

### §2b — Favor generation

Procedural, generated from real per-node `pressure` / `is_supplied` state,
per Rev 2. Exact generation cadence is not pre-specified — propose and
report, but it must hook into the real per-cycle resolution pass already
in `logic.lua`, not a separate polling system invented for this.

### §2c — The Dispatch/Mediation gap (real design choice, not pre-decided)

Per §0's finding, neither existing resolver currently does what Rev 2's
prose assumes. Two real options:

(a) Extend Mediation's existing resolution to also move `node.pressure`
    and `culture_relationships` on success — smaller change, reuses
    working, tested code.
(b) Build genuinely new resolution logic for Favor fulfillment.

RULE: (a) is the recommended default, matching this project's own
"smallest real slice" pattern from Stage-Make-Real and Pipeline Stage
Tracking. But confirm first whether Mediation's real target-node/party
semantics still make sense for Favor fulfillment — a Favor may not always
map 1:1 onto a single node the way Mediation currently assumes. Report
which path was chosen and why.

### §2d — Disposal

New, real mechanic: permanently surrender a slime (real removal from
`state.slimes`, not cosmetic) for a stronger Favor-fulfillment effect than
the Mediation-adjacent path. Exact effect magnitude is a real,
un-prespecified design choice — propose and report.

> ⚠️ RULE: Disposal permanently removes a real slime from the roster. Gate
> it behind explicit player confirmation in the UI layer — reuse this
> project's own existing 2-step-confirm-before-permanent-loss pattern
> (precedent: KingMaker Squads' Sovereign Protection flow — different
> project, same real principle worth reusing rather than reinventing).

---

## §3 Test Anchors

| Test name | Target | Behaviour |
|---|---|---|
| test_culture_relationships_dead_before_directive | territory.lua/logic.lua | Baseline regression guard confirming the real pre-directive dead-field state |
| test_favor_fulfillment_increments_culture_relationships | Favor resolution | Real fulfillment → real relationship increment, bridge-tested TS→Lua→TS |
| test_culture_relationships_100_exits_pressure_simulation | codex.lua cascade logic | A culture at 100% relationship → its nodes real-confirmed excluded from cascade-collapse/pressure logic |
| test_culture_relationships_100_is_permanent | Fealty state | No code path decrements a 100%-reached relationship (guards the locked permanence spec) |
| test_disposal_removes_slime_from_roster | Disposal resolution | Real slime removed from `state.slimes` on confirmed Disposal |
| test_disposal_requires_confirmation | App.tsx | Disposal is not triggerable without the real 2-step confirm path |

Target: **X passing, 0 failing, 0 skipped**, X = 563 + 251 pre-flight floor
plus new anchors above — Devin reports the real actual count.

---

## §4 Completion Criteria

- [ ] `culture_relationships` confirmed real, writable, tested via full
      TS→Lua→TS bridge (never Lua-only)
- [ ] 100%-relationship Fealty exit-from-pressure-simulation confirmed via
      a real test, not code inspection alone
- [ ] 100%-relationship state confirmed permanent — explicit test, not
      assumption
- [ ] Disposal confirmed real, gated behind explicit confirmation, removes
      a real slime
- [ ] §2c's design choice (extend Mediation vs. new resolver) reported
      explicitly with reasoning
- [ ] Full RFDGameStudio suite still green: real floor reported, Python +
      TypeScript
- [ ] `docs/state/current.md` (or SlimeWorld's real equivalent) updated
      with the real new floor and phase name
- [ ] Rev 2's own six Stage thresholds and Legacy Slime spec confirmed
      untouched (`git diff --stat` check)

---

## §5 Quick Reference

| Fact | Value |
|---|---|
| Dead field this directive makes real | `culture_relationships` — read since at least Rev-1-era code, never written |
| Real correction to Rev 2's own wording | Dispatch never touches pressure/`culture_relationships`; Mediation touches `node.strength` only; Disposal doesn't exist yet |
| Real fields to build Favor generation against | `node.pressure` (per-color), `node.is_supplied` / `isSupplied` |
| Permanent-state UX precedent to reuse | KingMaker Squads' 2-step Sovereign Protection confirm pattern |
| Explicitly deferred to later directives | Loyalty, Lab Level, Season/Culture rotation |
| Explicitly cut, do not resurrect | Squad Leaders, Training-as-system, second real-time clock |
