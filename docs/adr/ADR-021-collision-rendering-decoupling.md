# ADR-021: Collision/Rendering Decoupling

**Date:** August 15, 2026
**Status:** Accepted
**Supersedes:** None
**Related:** ADR-019 (Paper Doll as shared composition layer)

## Context

Mutant Battle Ball's production rendering was replaced with Chimera
Paper Doll Studio's hand-authored, socket-contracted, facing-aware SVG
system (ADR-019's shared composition layer is now realized through this
port). The new rendering system is substantially more visually complex
than the procedural composer it replaces — per-Brand hand-authored SVG
shapes, facing-aware geometry (front/back/side_left/side_right), quality
tier overlays (weld seams, spark arcs, sheen highlights), and a brand-
specific animation engine with distinct motion signatures.

This visual complexity raises a real architectural question: should the
match engine's collision/contact detection respond to the new visual
system's shape geometry, or should it remain on simple abstract
geometry (position + radius)?

The directive that authorized the port explicitly required this decision
to be confirmed by reading the real current collision code, not assumed,
and then locked via an ADR so a future directive can't silently violate
it.

## Decision

**Collision and rendering are deliberately decoupled.** The match
engine's tackle/block/contact detection operates exclusively on simple
abstract geometry — agent position (x, y) and a fixed radius. The
rendering system's shape complexity (Brand-specific limb geometry,
facing-aware occlusion, quality tier visual overlays, animation poses)
has zero influence on collision detection.

This is the correct decision for three reasons:

1. **Protects the Brand stat-modifier system.** A Brand's mechanical
   identity comes from its real, intended stat modifier
   (`brandModifiers.ts`: Trueflame=+15% power, Icevault=+15% endurance,
   etc.). If collision responded to visual geometry, a Brand whose
   hand-authored SVG happened to have a longer reach would get an
   accidental gameplay advantage unrelated to its stat modifier. This
   would silently undermine the stat system shipped in the previous
   directive.

2. **Keeps the simulation deterministic and testable.** The match
   engine runs in `mbbSimulation.ts` as pure functions on position/radius
   data. Tying collision to rendered SVG would require the simulation
   to depend on React rendering output, breaking the logic-purity
   discipline (ADR-010) and making matches non-reproducible.

3. **Matches the existing code's real architecture.** Confirmed by
   direct code read: `resolveTackle` uses `distance(ag.x, ag.y,
   carrier.x, carrier.y)` compared to `tackleR` (6.0). `resolveBlock`
   uses `distance(ag.x, ag.y, tackler.x, tackler.y)` compared to
   `blockR` (7.0). No rendered shape data feeds into these checks. The
   decoupling is not a new decision — it's an explicit confirmation of
   the existing architecture, locked so it stays that way.

## Consequences

- The rendering system can evolve freely (new Brands, new archetypes,
  new animation types, new quality tier overlays) without any risk of
  changing gameplay collision behavior.
- The match engine can be tested and run without the rendering system
  present — it only needs position/radius data.
- If a future directive wants collision to respond to visual geometry
  (e.g., a "reach" mechanic based on limb length), it must explicitly
  supersede this ADR and explain why the stat-modifier system's
  integrity is preserved.
- The `brandModifiers.ts` stat pipeline remains the single source of
  truth for a Brand's mechanical identity. Visual identity is
  rendering-only.

## Confirmation

Read fresh on August 15, 2026:

- `mbbSimulation.ts` `resolveTackle()`: `if (dist < tackleR)` where
  `tackleR = 6.0` — pure position/radius, no shape data.
- `mbbSimulation.ts` `resolveBlock()`: `if (dist < blockR)` where
  `blockR = 7.0` — pure position/radius, no shape data.
- `mbbSimulation.ts` movement: `ag.x += vx * drag; ag.y += vy * drag`
  — position-based, no shape data.
- No import of `paperDoll` or any rendering module exists in
  `mbbSimulation.ts`.

The collision/rendering decoupling is real, confirmed, and locked.
