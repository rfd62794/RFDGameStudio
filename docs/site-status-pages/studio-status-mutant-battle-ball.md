---
title: "Mutant Battle Ball — Studio Status"
category: Games/Engines/Systems
date: 2026-08-15
tagline: "Mutant sports combat game mid major creative overhaul — Neo Battlopolis, six-Brand Trinity, Body Part Synergy"
type: system
consulting: false
problem: "A mutant sports combat game with real engine work done but a major creative overhaul in progress. The challenge is that the creative direction (Neo Battlopolis, six-Brand Trinity) and the technical work (Paper Doll, Character Viewer, ChimeraLab patterns) are both substantial and both ongoing."
approach:
  - "Match engine investigation: 2 real bugs found and fixed"
  - "TS-native migration + real steering movement"
  - "Balanced-speed zero-score scare investigated and closed as a false alarm"
  - "Minimal Real Game Loop built (Shop/Workshop were confirmed inert stubs, now real)"
  - "Paper Doll module: 8 ChimeraLab patterns ported, Character Viewer built, Recognizable Primitives fix"
  - "Full 10-technique comparison → stroke-skeleton + SDF joint blending identified as the winner"
highlights:
  - "Match engine bugs fixed: stale-carrier self-tackle, stunned-team ball-loss"
  - "3 of 4 tabs wired with real currency/persistence"
  - "8 ChimeraLab patterns ported into Paper Doll module"
  - "Character Viewer built and fixed through 3 real bug passes"
  - "Recognizable Primitives fix: sigmoid limbs, real ellipse primitive, real anatomical proportions"
  - "10-technique comparison completed — stroke-skeleton + SDF joint blending is the production winner"
  - "Chimera Hybrid Studio investigated: hand-authored deterministic SVG paths per Brand×slot"
stack: ["TypeScript", "React", "Vite", "Tailwind"]
---

## Current State: In Progress

Mutant Battle Ball is not deployed. It is genuinely mid-build — real engine work done, major creative overhaul in progress, not close to done.

## Match Engine Investigation

Two real bugs were found and fixed in the match engine:

1. **Stale-carrier self-tackle** — a carrier that was no longer the carrier could tackle themselves
2. **Stunned-team ball-loss** — a stunned team could lose the ball when they shouldn't

A balanced-speed zero-score scare was investigated and closed as a **false alarm** — the test fixture wasn't actually balanced, so the zero-score result was a fixture artifact, not a real engine bug.

## Minimal Real Game Loop

The Shop and Workshop tabs were confirmed to be **inert stubs** — they looked like real UI but did nothing. They've been rebuilt as real, functional tabs. 3 of 4 tabs are now wired with real currency/persistence.

## Paper Doll Module and Visual Thread

A long, real visual thread:

- **Paper Doll module built** — 8 ChimeraLab patterns ported
- **Character Viewer built** — fixed through 3 real bug passes
- **Recognizable Primitives fix** — sigmoid limbs (not teardrop fins), real ellipse primitive (not 6-vertex polygon), real anatomical proportions
- **Full 10-technique comparison** — 10 different visual techniques evaluated. **Stroke-skeleton + SDF joint blending** identified as the real winner. A production directive was sent; completion not yet independently confirmed.

## Chimera Hybrid Studio Investigation

An external AI Studio app (Chimera Hybrid Studio) was investigated. Real, valuable find: it uses **hand-authored, deterministic, zero-runtime-cost SVG paths per Brand×slot**. Not yet ported to production. Real known gap: no shared connection-point contract across Brands (each Brand's parts connect differently).

## Designed-Not-Built Game Systems

Real, designed but not yet built:

- **Brand/Trinity naming** — Trueflame, Icevault, Quicksilver, Prismworks, Mirefaith, Tidalcapital
- **OEM Quality tiers** — quality grading system for parts
- **Cyber/Organic lean** — aesthetic and functional alignment system
- **Frame/chassis + Forge economy** — the economic loop around part crafting
- **Gravekeeper** — a real game system, designed not built
- **Tournament/season structure** — real fork undecided (multiple valid structures)
- **Reputation-as-standing** — reputation system tied to competitive standing

## The Roster-Meaning Question

The actual roster-meaning question — what does it mean for a mutant to be "on a roster" — is **explicitly, deliberately left open** per Robert's own words. Not resolved, not meant to be forced. This is a design decision, not a gap.

---

[&larr; Back to Studio Status](/projects/studio-status/) · [Back to Projects](/projects/)*