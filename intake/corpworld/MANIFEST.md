# Corpworld — Intake History

Current version: 0.1.0R3
Status: prototyping

## Version History

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
