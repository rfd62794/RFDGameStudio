---
title: "Planet of Greed — Studio Status"
category: Games/Engines/Systems
date: 2026-08-15
tagline: "Dark-corporate boardroom strategy game — the fusion of CorpWorld, KingMaker Squads, and Genesis Ore narrative"
type: system
consulting: false
problem: "Two separate game prototypes (CorpWorld and KingMaker Squads) explored adjacent corporate-strategy territory without converging. The challenge was blending them into a single, canonically-locked game with real narrative weight."
approach:
  - "Full blend design: CorpWorld scaffold + KingMaker wheel topology + Genesis Ore/Signal/House Arrest narrative"
  - "Phase 1 Engine Directive → conversion from examples/ to the live catalog"
  - "CorpWorld and KingMaker Squads retired (source preserved, not deleted)"
  - "Merge & Polish v2: guided walkthrough, flavor text, dark-corporate visual identity"
  - "Shell Compliance + Opening Sequence (real GameShell miss caught and fixed)"
highlights:
  - "Five-chapter canon locked"
  - "CorpWorld and KingMaker Squads both retired, source preserved read-only"
  - "Live on itch.io + rfditservices.com arcade"
  - "Devlog posted"
  - "Real GameShell miss caught during Shell Compliance pass and fixed"
  - "Attack Capability fix and Boardroom softlock fix (double-charge bug) shipped"
stack: ["TypeScript", "React", "Vite", "Tailwind"]
---

## Current State: Live

Planet of Greed is live on itch.io (Published) and the rfditservices.com arcade. Five-chapter canon locked. Devlog posted.

## The Blend

Planet of Greed is the fusion of three separate threads:

- **CorpWorld** — provided the scaffold (corporate entity management, resource economy)
- **KingMaker Squads** — provided the wheel topology (faction-based territorial control)
- **Genesis Ore / Signal / House Arrest** — provided the narrative canon (five chapters of dark-corporate story)

Both CorpWorld and KingMaker Squads were retired when Planet of Greed went live. Their source is preserved read-only in the repo — never silently deleted — and explicitly removed from `games/registry.ts`. This established the retirement pattern that subsequent retirements follow.

## The Conversion Pipeline

Planet of Greed went through the real conversion pipeline (ADR-012): starting as a prototype in `examples/`, it was scaffolded, converted (including warranted shared-code extraction per ADR-005/ADR-014), and verified before entering the live registered catalog.

## Polish and Fixes

After the initial conversion, several real polish and fix passes occurred:

- **Merge & Polish v2** — guided walkthrough, flavor text, dark-corporate visual identity
- **Shell Compliance** — a real GameShell miss was caught during this pass and fixed
- **Opening Sequence** — the real opening sequence was wired correctly
- **Attack Capability fix** — a real bug in attack capabilities was fixed
- **Softlock fix** — a double-charge bug causing a Boardroom softlock was fixed

## Explicitly Deferred

Two items are real, explicitly deferred — not forgotten, not stalled, deliberately left for later:

1. **Culture stat asymmetry (3x)** — real balance/exploit risk that needs playtesting to resolve, not a quick fix
2. **Signal's authored Boardroom Event content** — the narrative content for Signal's Boardroom Events is designed but not yet authored

---

[&larr; Back to Studio Status](/projects/studio-status/) · [Back to Projects](/projects/)*