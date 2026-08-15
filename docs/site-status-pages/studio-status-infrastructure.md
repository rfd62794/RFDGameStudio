---
title: "Studio Infrastructure — Studio Status"
category: Games/Engines/Systems
date: 2026-08-15
tagline: "The shared engine, compliance audits, and cross-game duplication resolution that underpins everything else"
type: system
consulting: false
problem: "A multi-game studio with games in two runtimes (Lua and TypeScript) needs shared infrastructure that doesn't duplicate across games. The challenge is establishing shared engine modules as the default, not the exception, and keeping every game in compliance with the studio's shell and UI standards."
approach:
  - "ADR-013: TS-native default locked, Lua retired as mandatory"
  - "Studio-wide GameShell/TitleScreen compliance audit"
  - "TS-Native Cross-Game Duplication Audit"
  - "ChimeraLab investigation with 8 portable patterns ported"
highlights:
  - "ADR-013: TS-native is the default, Lua retired as mandatory"
  - "GameShell compliance: 6 games fixed, 833/833 confirmed clean"
  - "CorpWorld/Planet of Greed 7-of-12-byte-identical fork resolved"
  - "ts/src/engine/shared/ established as first-class shared logic layer"
  - "8 ChimeraLab patterns ported into Mutant Battle Ball"
stack: ["TypeScript", "Lua", "Python"]
---

## Current State: Complete

Studio infrastructure is complete. The shared engine, compliance audits, and cross-game duplication resolution are all done.

## ADR-013: TS-Native Default Locked

ADR-013 formalized what the Shoal performance investigation proved: TypeScript-native is the studio default. Lua is retired as a **mandatory** runtime — it remains supported for games with genuine cross-language portability requirements (VoidDrift, TurboShells), but it is no longer the default contract for new games.

This was driven by hard measured data (Shoal's 151.7x speedup), not preference.

## GameShell/TitleScreen Compliance Audit

A studio-wide compliance audit verified that every registered game uses the shared GameShell and TitleScreen components correctly:

- **6 games fixed** — real compliance misses caught and corrected
- **833/833 tests confirmed clean** — the full test suite passes with zero shell-related failures

This audit caught a real GameShell miss in Planet of Greed during the Shell Compliance pass — the kind of bug that's invisible without a systematic audit.

## TS-Native Cross-Game Duplication Audit

A cross-game duplication audit found that CorpWorld and Planet of Greed had **7 of 12 bytes identical** — a real fork, not just similar code. This was resolved by:

- Establishing `ts/src/engine/shared/` as the first-class shared logic layer
- Moving genuinely shared code into the shared layer
- Both games now consume from the shared layer rather than maintaining parallel copies

This directly drove ADR-014: shared engine modules are the **default posture**, not a demand-gated exception.

## ChimeraLab Investigation

The ChimeraLab investigation identified **8 real portable patterns** from the ChimeraLab visual system. These were ported into Mutant Battle Ball's Paper Doll module:

- 8 patterns ported
- Each pattern is a real, reusable visual technique
- The porting process validated that the patterns are genuinely portable, not just superficially similar

This is a concrete example of the shared-engine default in action: patterns recognized as general were extracted and reused, not duplicated.

---

[&larr; Back to Studio Status](/projects/studio-status/) · [Back to Projects](/projects/)*