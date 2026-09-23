# SHOAL 2.0 — Design.md

*(Supersedes the original grid-based SHOAL_Design.md — this is a genuine redesign, not a porting pass over the existing build.)*

**July 2026 | Target: RFDGameStudio Lua-engine port, TS-only, no PyGame renderer required.**

---

## Vision, Restated

The player watches a living water column — fish grazing, sharks hunting, algae rising and sinking with how heavily it's been fed on — rendered with fully continuous, steering-based motion. No grid, anywhere, at any layer the player can see or feel. The nudge-and-observe philosophy from the original design is unchanged; the movement model underneath it is not.

---

## What Changed From the Original Shoal, and Why

| Original (Wa-Tor grid) | Shoal 2.0 |
|---|---|
| Top-down toroidal grid, discrete cells | Side-view water column, continuous position |
| Fish/sharks snap between cells each tick | Steering behaviors — seek, flee, wander, separate — velocity integrates every frame |
| Toroidal wrap on both axes | Horizontal wraps (toroidal); vertical is bounded — real surface, real floor |
| Algae: hub-and-spoke, fixed grid cell, extinct-or-not | Algae Core: permanent base, continuous depth driven by live nodule count |
| Two-layer cell model (terrain + occupant) resolved same-space conflicts | Not needed — continuous position has no "same cell" problem; soft separation force replaces it |
| Uniform lighting/danger | Five real oceanic depth bands, invisible to movement, driving Exposure and light gradient |

---

## Movement Model — Steering Behaviors

Every fish and shark has continuous `(x, depth)` position and `(vx, vd)` velocity — never a cell index, ever.

**Fish, each frame:**

- **Seek** the nearest Algae Core with live nodules.
- **Flee** the nearest shark within a fright radius — weighted stronger than seek; fear beats hunger.
- **Wander** — a light, low-weight random force so idle fish don't move mechanically.
- **Separate** from nearby same-species fish, soft repulsion only.

**Sharks, each frame:**

- **Seek** the nearest fish within hunting range.
- If no fish in range, **seek** the nearest unconsumed Flesh Chunk.
- **Wander** otherwise.
- **Exposure** accumulates continuously based on current depth. No fish-seeking override; a shark chasing prey into shallow water still pays the cost.

**Depth bias (fear-of-the-dark):** Fish carry a mild, low-weight pull toward shallower water at all times. It is easily overridden by an active flee force from a nearby shark. A cornered fish will still dive into Bathypelagic/Abyss if that's the only way out.

**Consequential events resolve on a separate, coarser tick** — grazing a nodule, a kill, a breeding threshold — evaluated a few times per second, not every render frame. Movement is continuous and constant; state changes are periodic and deliberate.

---

## Chosen Steering Force Weights

These are the values that will be baked into `data.yaml` and used for the first build. They are easy to tune once the simulation is observable.

| Force | Weight | Notes |
|---|---|---|
| Fish seek algae | 1.0 | Primary food drive |
| Fish flee shark | 2.5 | Fear beats hunger |
| Fish separate | 1.0 | Soft same-species repulsion |
| Fish wander | 0.4 | Prevents mechanical clumping |
| Fish depth bias (shallower) | 0.2 | Mild, overridable |
| Shark seek fish | 1.5 | Primary hunting drive |
| Shark seek flesh chunk | 1.0 | Fallback when no fish are near |
| Shark wander | 0.3 | Idle patrolling |

All forces are normalized, then summed and clamped to the creature's `max_force` before integrating velocity. `max_speed` is the hard cap; `max_force` is the steering authority per second.

---

## World & Timing Constants

| Constant | Value |
|---|---|
| World width | 1200 px |
| World depth | 800 px |
| Horizontal wrap | Yes |
| Vertical wrap | No — `0` is surface, `800` is floor |
| Discrete event tick | 0.25 s (every 15 frames at 60fps) |
| Fish max speed | 120 px/s |
| Fish max force | 80 px/s² |
| Shark max speed | 150 px/s |
| Shark max force | 90 px/s² |
| Fish radius | 4 px |
| Shark radius | 7 px |
| Fish breed age | 5 s |
| Shark breed age | 15 s |
| Shark starve limit | 10 s |
| Chunk decay | 8 s |
| Algae regrow cooldown | 3 s |

---

## Depth Bands — Backend Resolution Only

Five real oceanic zones, used purely for (a) spatial-hash neighbor lookup buckets and (b) interpolating the light/Exposure gradient. The rendered depth value is continuous; bands are invisible bookkeeping.

| Band | Depth Range | Exposure Rate (per s) | Feel |
|---|---|---|---|
| Epipelagic (Sunlight) | 0–120 | 0 | Bright, safe |
| Mesopelagic (Twilight) | 120–280 | 2 | Dimming |
| Bathypelagic (Midnight) | 280–480 | 5 | True dark |
| Abyssopelagic (Abyss) | 480–680 | 12 | Heavy pressure |
| Hadopelagic (Trench) | 680–800 | 25 | Reserved, undesigned |

Exposure accumulates continuously as a function of depth value, not a step function per band. The rate is linearly interpolated between the two bracketing bands. The Exposure cap is 100. At 100, the shark takes continuous damage until it descends or dies.

---

## Spatial Hash

A lightweight bucket structure sized to the band system, used only to answer "what's near this creature right now" cheaply for the seek/flee/separate forces. Never touches rendering, never touches movement, never visible to the player, never snaps anything to a bucket boundary.

- Bucket size in depth: 80 px (10 rows across the 800 px column).
- Bucket size in x: 120 px (10 columns across the 1200 px width).
- Horizontal wrap is handled by modulo on bucket index.
- Rebuild every frame by iterating all creatures and inserting by their center position.

---

## Algae Core

- **Permanent base** — cannot die from grazing, only from a deliberate player Cull.
- **Radial spoke-hub structure preserved** — nodules regrow outward from the core when ungrazed.
- **Depth is a continuous function of live nodule count** — heavily grazed sinks the whole organism toward Mesopelagic/Bathypelagic, into sharks' territory; thriving floats it back toward Epipelagic.
- A fully stripped core doesn't vanish — it sits at its sunk depth, dormant, regenerating nodules until it's worth grazing again.

### Nodule Layout

A core has 9 nodules total:
- 1 central hub.
- 4 cardinal spokes, each 2 nodules long (distance 24 and 48 px from hub).

Nodules are consumed when a fish overlaps them. A consumed nodule is dormant and begins a cooldown timer. When the cooldown completes, it regrows. The central hub is never consumed; it anchors the core.

### Core Depth Function

```
core_depth = lerp(sunk_depth, surface_depth, live_ratio)
```

Where `live_ratio = live_nodules / max_nodules`. `sunk_depth` is 600 px (Abyssopelagic-ish). `surface_depth` is 80 px (Epipelagic). The actual depth moves toward `core_depth` at a constant speed of 20 px/s.

---

## Flesh Chunks

Any creature death (predation, starvation, Cull) bursts 1–3 chunks. Chunks are consumed by any shark. They are a real steering target (seek, per the movement model) rather than a BFS-pathfind target. Decay after 8 seconds.

---

## Lineage Tagging & Age-Visible Rendering

Both carry forward exactly as designed originally — tap a creature to tag its lineage, descendants inherit tint; size/color shift toward maturity. Neither depended on the grid; neither needs redesigning.

---

## Explicitly Parked — Not This Pass

**Jellyfish, as a hazard.** Named directly as a future idea, not designed now.

**Hadopelagic's "something down there."** Reserved on purpose, undesigned on purpose.

---

## Open Before Port Begins — Resolved

1. **Fear-of-the-dark bias** — Confirmed: mild, overridable, weight 0.2 upward pull on fish.
2. **Exact seek/flee/wander/separate force weights** — Confirmed and listed in the "Chosen Steering Force Weights" table above.

---

## Implementation Plan

1. `games/shoal/` Lua engine files: `data.yaml`, `systems.yaml`, `ui.yaml`, `utils.lua`, `state.lua`, `entities.lua`, `steering.lua`, `logic.lua`.
2. `ts/src/games/shoal/` TS renderer: `config.ts`, `App.tsx`, `types.ts`, `gameLogic.ts`, `components/ShoalCanvas.tsx`.
3. Update `ts/src/games/shoal/config.ts` to in-engine component; remove `embedUrl`.
4. Remove `shoal` from `studio_mcp/tools.py` `_EXAMPLE_DEMOS` so the deploy no longer copies the stale `examples/shoal/dist`.
5. Validate with `studio_validate_game(shoal)` and build with `studio_build`.
6. Verify visually and with the verification harness.
