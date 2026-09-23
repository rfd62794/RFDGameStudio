# ADR-019: Paper Doll as Shared Composition Layer

**Status:** Accepted
**Date:** August 2026
**Related:** ADR-005 (named patterns, not shared binaries — superseded
by ADR-014 for this scope), ADR-014 (shared engine modules default),
ADR-009 (shared utilities).

## Context

Two real, already-proven consumers (Mutant Battle Ball and Chimera
Wilds) shared the exact same six-slot Part/PartSlot system for
character rendering. Both had independent, duplicated rendering logic
that produced visually inconsistent results. A design review of the
original plan found two false claims:

1. The plan claimed to extend `artGen`'s "existing
   `resolveColor(semanticKey, configMap)` resolver" — `artGen` has no
   semantic-key resolver (it uses `ArtGenConfig<TEntity>` callbacks).
2. The plan claimed to plug into "tonight's real Brand/Cyber-Organic/
   Quality design" — no such system exists anywhere in the repo.

## Decision

Build the composition layer first against real infrastructure
(`artGen` shape primitives, shared `Part`/`PartSlot` types, `mulberry32`
seeded RNG), defer the Brand/Cyber-Organic/Quality styling to a
separate directive once that system's Design.md exists.

### Architecture

**Attachment Graph (not a fixed rig):** Each body-part slot is a node
in a parent-child graph with a data-defined offset and angle relative
to its parent. One root slot (chest) anchors the figure; every other
slot's position is computed from its parent. Different `BodyPlan` data
entries wire the same slots into different arrangements without
changing the resolution logic.

**Explicit z-order:** Layer order is a named property of the Body Plan
(`renderOrder: PartSlot[]`), not inferred from slot order.

**Body Plans as data:** New body plans are authored as data entries
(`BodyPlan` objects), not engineered as code. The two real presets
(`humanoidBilateral`, `chimeraAsymmetric`) demonstrate the pattern.

### What was consumed (not duplicated)

- `artGen` shape primitives: `renderPolygonPoints`, `renderTeardropFin`,
  `renderRadialBurst`, `renderIrregularFragment` — imported directly
- `artGen`'s `mulberry32` re-export pattern
- Shared `PartSlot` type from `../shared/partSlots`

### What was deferred

- **Brand/Cyber-Organic/Quality styling** — waits for the Brand
  system's own Design.md and directive.
- **Animation** — static composition only, not rigged/animated.
- **Body plans beyond the two real consumers' needs** — quadruped,
  insectoid, etc. are future data entries.

## Consequences

- **Two consumers share one composition layer** — MBB and Chimera
  Wilds both import `PaperDoll` with their respective body plans.
- **The module is engine-level** — no cross-game imports, no game-
  specific vocabulary in the module itself.
- **ChimeraLab patterns were ported as math, not code** — eight
  portable patterns (FK rotation, hierarchical color, painter's
  algorithm, biological scaling, sigmoid bulge, posture blend, etc.)
  were ported from the reference repo as patterns and formulas, with
  the Rust/Python source remaining read-only reference.
- **The Character Viewer is a real consumer** — promoted from dev-only
  to a real arcade entry (see ADR-020), consuming the same Paper Doll
  module for live shape iteration.
