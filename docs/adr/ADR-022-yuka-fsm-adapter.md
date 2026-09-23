# ADR-022: Yuka FSM Adapter for Behavioral States

**Date:** August 22, 2026
**Status:** Accepted
**Supersedes:** None
**Related:** ADR-014 (shared engine modules default), ADR-018 (Shoal TS-native migration)

## Context

Shoal's steering forces (`forceSeek`, `forceFlee`, `forceSeparate`,
`forceAlign`, `forceCohere`, `forceAvoid`) were extracted into
`engine/shared/aiBehavior/steering.ts` in Phase 1, with a
byte-identical behavioral-equivalence proof. The extraction is proven
and closed.

However, Shoal's entity behavior remains a flat, always-on weighted sum
of all steering forces every tick. There is no real decision-making
layer — every fish and shark runs the same force blend regardless of
its current situation. This limits behavioral richness and life-like
variety, which matters specifically for the upcoming Y8 deployment.

## Decision

Add [Yuka](https://mugen87.github.io/yuka/) (v0.7.8, published
2022-09-17) as a real, new npm dependency — the first external
gamedev-specific package added studio-wide. Use Yuka exclusively for
its `StateMachine`/`State` FSM classes to add a real behavioral state
layer on top of Shoal's existing, unmodified steering forces.

### What Yuka provides

A real State Machine / goal-driven agent design layer — a capability
Shoal has never had. Each entity (fish, shark) gains a behavioral state
(`Schooling`, `Foraging`, `Fleeing` for fish; `Hunting`, `Resting`,
`Fleeing` for shark). Each state's `execute()` selects which of Shoal's
existing steering forces apply this tick and at what weight multiplier.

### What Yuka does NOT provide (in this studio)

Yuka ships its own steering-behavior classes (seek, flee, separation,
alignment, cohesion, wander, etc.). **These are never imported, used,
or referenced.** Using them would recreate the exact
redundant-dependency problem already correctly identified and avoided
in Phase 1. The force computation lives in `steering.ts`, extracted
from Shoal's proven implementation. Yuka is used exclusively for its
FSM layer.

### Why an external dependency is warranted

1. **Real, proven FSM implementation** — Yuka's StateMachine/State is
   a well-tested, purpose-built FSM library. Writing a custom FSM from
   scratch would be speculative wheel-reinvention.
2. **Genuine new capability** — Shoal has never had behavioral states.
   This is additive, not a replacement.
3. **Stable, vetted version** — v0.7.8 published Sep 2022, well over
   the 7-day minimum age threshold. No breaking changes expected.
4. **Minimal surface area** — only `State` and `StateMachine` are
   imported. A custom type declaration file (`yuka.d.ts`) declares only
   these two classes, enforcing the boundary at the type level.

### Behavioral states designed from real simulation values

States are grounded in Shoal's actual existing entity fields:
- **Fish:** `hunger`, `coldExposure`, proximity to sharks/algae
- **Shark:** `hunger`, `exposure`, `inRetreat`, proximity to fish/chunks

No new tracked values were invented. State transitions use these
existing fields against config thresholds
(`behavioral_states.fish.foraging_hunger_threshold`,
`behavioral_states.shark.hunting_hunger_threshold`).

## Consequences

- Shoal's behavior genuinely changes — fish now school, forage, and flee
  context-dependently; sharks hunt, rest, and retreat. This is the
  intended upgrade for Y8.
- The force math itself is unmodified — proven by the fixed-state
  equivalence test (FSMs disabled → byte-identical to pre-Yuka output).
- Yuka's own steering classes are grep-verified absent from all Shoal
  and aiBehavior source files.
- The `yuka` dependency adds ~100KB to the bundle. Acceptable for the
  behavioral richness gained.
- Future games can use the same `BehavioralStateMachine`/
  `BehavioralState` wrapper for their own state-driven AI.
