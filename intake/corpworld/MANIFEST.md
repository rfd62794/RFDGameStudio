# Corpworld — Intake History

Current version: 0.1.0R2
Status: prototyping

## Version History

### 0.1.0R2 — 2026-07-12T21:08:07
- Hash: 0d3f48daedf54a9e670e33c0c8f6527b145b1efd8798aa9b3a8d2149779ea9c3
- Source file: corpworld_v0.1.0R2.zip
- Note: Phase 2 fixes verified against source, not just summary. Fix 1 (instant neutral-cell capture) and Fix 2 (save/reload crash) confirmed correctly implemented — arrivingCorpIds logic present, currentActiveEvent excluded from localStorage save, all 4 event templates and 4 AI corps intact (no regression). Fix 3 (combat determinism) is deterministic as required (zero Math.random() calls) but is NOT actually the Trinity Siege formula despite being described that way — damage is a fixed value per matchup type (attackerMultiplier/defenderMultiplier), never scaled by either unit's current remaining strength. Trinity Siege's real model has wounded units hit softer on subsequent attacks (attacker_eff = current_strength × mult); this build's units hit at full force regardless of wounds, right up until they die outright. Known, logged issue — see Phase 2b directive for the fix. Not blocking this version, but real and should not be mistaken for a completed port.

### 0.1.0R1 — 2026-07-12T20:46:26
- Hash: 7477a05aa8fc974fb998c78d4fc9d229fd0a94957974995458efbc1ce892283b
- Source file: corpworld_v0.1.0R1.zip
- Note: First AI Studio draft. Rough MVP per Design.md v2 — territory/combat loop plays but has a known neutral-cell capture delay bug (waits for Month-end instead of instant capture), a save/reload crash risk (event choice functions dropped by localStorage JSON serialization), and combat resolver uses probabilistic dice-roll resolution rather than the deterministic Trinity Siege model — not yet confirmed as intended. Not treated as a finished game; first checkpoint only.
