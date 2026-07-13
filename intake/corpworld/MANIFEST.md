# Corpworld — Intake History

Current version: 0.1.0R5
Status: prototyping

## Version History

### 0.1.0R5 — 2026-07-12T22:55:04
- Hash: a87e3cf1cf49d9a275c7c16548a0c5e42811005b8b78579502461cd8b7d15b57
- Source file: corpworld_v0.1.0R5.zip
- Note: Phase 4 (Multi-Action Orders & Civic Directive), verified against source before intake — strongest submission of the session, everything checked out. playerOrders correctly restructured to array-per-cell (types.ts:107). Save-time validation exceeds the directive's minimum bar: WeeklyOrdersPanel.tsx implements defense-in-depth — a hard-capped stepper UI that structurally cannot input more than unallocated units, PLUS an independent cumulative check with a real rejection message ('Cannot authorize deployment: combined troop allocation exceeds garrison units.') before the order is constructed. Civic Directive confirmed genuinely independent of unit orders (civic filtered separately in handleAddExpandOrder/handleRemoveOrderAt). Both focus effects verified numerically correct: defense = $10,000 cost + 1 Fortification (capped at 3, matching existing max); production = productionProgress += 2 instead of 1 when hasProductionCivic, correctly halving the production cycle as specified. Unrest focus confirmed genuinely inert: real disabled HTML attribute, greyed styling, cursor-not-allowed, clear tooltip - not clickable, does nothing. combat.ts and mapGenerator.ts confirmed byte-identical via diff, zero scope creep. One process gap: the agent's own completion summary included none of the pasted verification the directive required (no screenshots, no over-allocation trace, no diff confirmation) - everything happened to be true this time when independently checked, but the summary alone provided no way to know that without doing the verification pass ourselves.

### 0.1.0R4 — 2026-07-12T22:17:59
- Hash: 347cf79ac20f706be41a9f1abfd75629a048dc7f14b8f6b93830e5626d4b35f5
- Source file: corpworld_v0.1.0R4.zip
- Note: Phase 3 UI redesign, verified against source before intake — the most accurate agent self-report of the whole session, no fabricated claims found. §2.0 log panel scroll bug: genuinely fixed (h-[580px] overflow-hidden on the section, no lg:h-auto override anywhere). §2.2 AlertQueue.tsx: real new component, correctly wired to live derived state (pendingOrdersCount = owned cells filtered by !playerOrders[c.id], gated on isPlanningPhase; hasPendingEvent and activeCombatsCount both read directly from gameState), correct red/amber/cyan traffic-light coding, correctly clears since props recompute from real state each render. §2.3 on-map indicators: real garrison/fortification rendering confirmed, plus a genuine functional toggle (alwaysShowGarrison state, defaults true/Always-On) — note: directive asked for a tested density recommendation, agent shipped a live player toggle instead, which is a reasonable substitution but not literally what was asked. §2.4 combat mode-shift: real AnimatePresence mode=\"wait\" transition, opposing scale/fade on entry and exit, genuine zoom-cut feel, not a bare panel swap. Read-only files (combat.ts, mapGenerator.ts, types.ts) confirmed byte-identical via diff — zero scope creep into logic.

### 0.1.0R3 — 2026-07-12T21:27:00
- Hash: d2f7c3c797bd042abe82946c7aceb47cb9bfc288e07c756e577865d2a6d38aa4
- Source file: corpworld_v0.1.0R3.zip
- Note: Phase 2b patch, verified against source before intake (not just agent summary). Combat damage now correctly scales with attacker's current round-adjusted strength (attackerCurrentStrength = finalUnits - roundDamage, floored at 0, feeds into attackerEffective before the damage ratio). Confirmed via direct diff: SHAPE_MATRIX, greedy best-counter target selection, and fortification absorption all unchanged. Fix 1 (instant neutral capture) and Fix 2 (save/reload crash) still intact from R2, no regression — all 4 event templates and 4 AI corps present. This resolves the last known issue from R2's note. Ready to promote to examples/ and the local arcade as the current canonical build.

### 0.1.0R2 — 2026-07-12T21:08:07
- Hash: 0d3f48daedf54a9e670e33c0c8f6527b145b1efd8798aa9b3a8d2149779ea9c3
- Source file: corpworld_v0.1.0R2.zip
- Note: Phase 2 fixes verified against source, not just summary. Fix 1 (instant neutral-cell capture) and Fix 2 (save/reload crash) confirmed correctly implemented — arrivingCorpIds logic present, currentActiveEvent excluded from localStorage save, all 4 event templates and 4 AI corps intact (no regression). Fix 3 (combat determinism) is deterministic as required (zero Math.random() calls) but is NOT actually the Trinity Siege formula despite being described that way — damage is a fixed value per matchup type (attackerMultiplier/defenderMultiplier), never scaled by either unit's current remaining strength. Trinity Siege's real model has wounded units hit softer on subsequent attacks (attacker_eff = current_strength × mult); this build's units hit at full force regardless of wounds, right up until they die outright. Known, logged issue — see Phase 2b directive for the fix. Not blocking this version, but real and should not be mistaken for a completed port.

### 0.1.0R1 — 2026-07-12T20:46:26
- Hash: 7477a05aa8fc974fb998c78d4fc9d229fd0a94957974995458efbc1ce892283b
- Source file: corpworld_v0.1.0R1.zip
- Note: First AI Studio draft. Rough MVP per Design.md v2 — territory/combat loop plays but has a known neutral-cell capture delay bug (waits for Month-end instead of instant capture), a save/reload crash risk (event choice functions dropped by localStorage JSON serialization), and combat resolver uses probabilistic dice-roll resolution rather than the deterministic Trinity Siege model — not yet confirmed as intended. Not treated as a finished game; first checkpoint only.
