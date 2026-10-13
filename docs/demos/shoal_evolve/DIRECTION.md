# Direction: Shoal: Evolve

## Purpose

A calm ecological survival sequel to Shoal in which the player becomes one ordinary fish inside the living reef, competes with AI fish for food, grows, and eventually follows visible evolutionary paths.

## Product boundary

Shoal and Shoal: Evolve are two independently shippable arcade entries over one shared simulation core. Shoal remains the ambient Aquarium. Shoal: Evolve owns player control, growth, traits, sequel UI, sequel persistence, and sequel presentation.

The first playable slice proves that the product boundary works without damaging the original: select a fish, steer with pointer or touch, eat algae while AI fish compete for the same food, grow visibly by one stage, and suffer a gentle setback when eaten.

## Engineering direction

- Reuse `ts/src/games/shoal/simulation/shoalSimulation.ts`; never fork it.
- Add small, pure sequel modules for player control, growth stages, and sequel mode state.
- Keep sequel wiring out of Shoal's already-large `App.tsx` and simulation implementation.
- Extract shared APIs only at demonstrated second-use seams.
- Preserve pure game logic and deterministic headless verification.
- Shared simulation changes must run both Shoal and Shoal: Evolve suites.
- Prefer reversible slices and behavior tests over source-text assertions.

## Not in the foundation slice

No trait tree, multiplayer, leaderboard, camera rewrite, new habitats, whales/orcas, accounts, cross-title progression, publishing, or broad simulation refactor.

```yaml direction
version: 1
answered: 2026-10-11 robert
purpose: A calm ecological survival sequel where the player controls one fish in Shoal's living reef, competes for food, grows, and evolves along visible paths.
done_when:
- Shoal and Shoal: Evolve ship as separate entries over one shared simulation core
- A player can steer one fish, compete with AI fish for algae, and grow visibly by one stage
- Predation applies a gentle setback while the original ambient Shoal remains behaviorally unchanged
- Shared simulation changes are protected by deterministic tests for both entries
do_not:
- Do not fork or duplicate the Shoal simulation
- Do not break or gate the original ambient Shoal experience
- Do not add multiplayer, accounts, leaderboards, new habitats, or broad content in the foundation slice
- Do not grow the existing Shoal App.tsx or shoalSimulation.ts with sequel-specific responsibilities
audience: players
hours_per_week: 1-3
stakes: medium
```
