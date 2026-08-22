# RFDGameStudio — External Tooling & Package Catalog

*August 2026 | Living reference document — add to this before adopting any external library. Companion to `RFDGameStudio_EngineExpansionMap.md` (internal Lua primitive/system gaps) — this document covers external, non-Lua tooling: JS/TS packages, presentation libraries, and cross-language options worth exploring in past or future demos.*

---

## Philosophy — read this before adding anything below

This studio's canonical game logic lives in Lua, executed by two real,
separate runtimes: `lupa` (Python, via `renderers/pygame/`) and
`fengari-web` (JS/TS, via the React/Vite arcade). `pyproject.toml`
describes the project plainly: "a game definition format and
multi-runtime contract."

**This means every external library on this page must be evaluated as
a presentation adapter or a tool, never as an engine.** A library that
wants to own game state, run its own update loop, or manage entity
lifecycle competes with the Lua contract instead of serving it. That
is disqualifying regardless of how good the library otherwise is.
Libraries that consume a state snapshot and render it, or that provide
narrow, stateless utility functions (noise generation, seeded random,
SVG path math), are fair game.

**The real, confirmed contract new presentation tooling must target**
(verified directly against `renderers/pygame/shared/render_adapter.py`
and `pygame_renderer.py`, Aug 22 2026 — not inferred):

- Four fixed, Z-ordered layers: `background → midground → foreground → hud`
- Entities are plain dicts: `{"type": "rect"|"circle"|"triangle"|"line"|"arc"|"ellipse"|"text"|"sprite", ...}`
- Colors are plain `(R, G, B)` tuples — no PyGame-specific types leak through the abstract interface
- **Real observed entity volume: ~30-80 per frame** (horse_racing, the
  one game that fully uses this pipeline). This number matters — it
  rules out needing GPU-batched rendering for anything following this
  same pattern. Confirm real volume for any new game before assuming
  otherwise.
- `slither_rogue` does **not** use this pipeline at all — it draws
  directly via PyGame primitives with no intermediate data format.
  Treat it as a special case, not a second example of the shared
  contract.

---

## Category: Raster / Sprite Presentation

| Package | Real fit assessment | Priority |
|---|---|---|
| Plain Canvas 2D API | Matches the confirmed ~30-80 entity/frame volume with zero dependencies. The entity-dict → draw-call translation is mechanical (see EngineExpansionMap-adjacent finding from the Devin presentation-parity investigation, Aug 22). | **High — default choice** |
| PixiJS | Only justified if a future game's real, measured entity count is an order of magnitude higher than horse_racing's. Do not adopt speculatively — this was an earlier research pass's overclaim, corrected once the real data was checked. | Low, pending real evidence from a specific game |
| Phaser / Excalibur.js | Full engines — own their own game loop and state. Structurally competes with the Lua contract. | **Archived — do not adopt** |

## Category: Vector / SVG Presentation

Real gap: zero SVG rendering infrastructure exists anywhere in the
studio (confirmed by direct inspection of `PlanetMap.tsx`, the most
visually complex existing shared component — plain divs, no SVG).
This is genuine greenfield work, not an extension of something
half-built.

| Package | Real fit assessment | Priority |
|---|---|---|
| Native React SVG (no library) | Pure geometry → `<svg>` elements. Matches the "primitive-first data schema" principle already used everywhere else in this codebase. Try this first before adding a dependency. | **High — default choice** |
| `svg.js` (svgdotjs) | Lightweight (confirmed via direct research, Aug 22), manipulation/animation focused. Worth it only if native SVG + React state proves clunky for animation specifically. | Medium, real trial needed |
| D3 | Powerful but heavyweight for what this studio needs (no data-viz use case exists in the catalog). | Low |

**Best-fit candidate games for a first real SVG prototype:** Succession
(figure relationships, court map), Planet of Greed / any wheel-topology
game (`wheelRelation.ts` already exists as the math primitive — an SVG
renderer would be the natural presentation partner for it).

## Category: Procedural Generation

Real, direct connection to an already-parked studio idea
(`technical:generator_tools_pivot_and_repo_snapshot_aug2026` in prior
research — the Watabou/seed-driven-generator parallel). The studio
already has `seededRandom.ts` in `engine/shared/` — everything below
extends that primitive, doesn't replace it.

| Package / Resource | What it actually provides | Priority |
|---|---|---|
| `kchapelier/procedural-generation` (curated list) | Seeded RNG, 2D/3D Perlin & Simplex noise, Worley/cell noise, 2D maze generation, Voronoi diagrams (Fortune's algorithm), cellular-automata cave layouts. All narrow, stateless, framework-agnostic. | **High — real, verified resource** |
| Wave Function Collapse implementations | Constraint-based generation, good for tile-based or rule-driven content. Relevant to any future dungeon/level-based game. | Medium — no current game needs this yet |
| `svg-procedural-strings` | Procedural SVG shape generation. Pairs directly with the SVG presentation category above. | Medium |

**Best-fit candidate games:** any future roguelike-adjacent title
(Trinity Siege, if revived), TurboShells if rebuilt in TS (terrain
generation was part of its original design per prior research), a
revived SlimeGarden if it's ever unfrozen (zone/terrain system was
already identified as a real gap in `EngineExpansionMap.md`).

## Category: State Machine / App-Shell Orchestration

| Package | Real fit assessment | Priority |
|---|---|---|
| `xstate` | Legitimate candidate specifically for **app-level flow** (menus, scene transitions, network handshakes) — explicitly outside the core Lua simulation loop. Every game currently hand-rolls this in `useState`. This would formalize an already-repeated pattern, which is the correct trigger for shared infrastructure per this studio's own evidence standard. | **Medium — worth a single real prototype on one existing game's screen flow before wider adoption** |

## Category: Data-Driven ECS

| Package | Real fit assessment | Priority |
|---|---|---|
| `bitecs`, `miniplex` | Likely conflicts with the Lua primitives/systems layer that already serves this role — but this has **not been independently verified** (neither Claude's nor Gemini's research has actually read what `lupa`/`fengari-web` implement as a systems layer in depth). Also: no swarm/bullet-hell genre exists anywhere in the real 22-game catalog, so there's no proven need driving this. | **Archived pending real evidence — do not adopt speculatively** |

## Category: Networking

| Package | Real fit assessment | Priority |
|---|---|---|
| `colyseus`, `geckos.io` | House of Kings: Collab already solved real-time sync with Firebase/Firestore — a real, already-invested decision. A second networking stack for a hypothetical future multiplayer game is premature infrastructure. | Low — revisit only when a specific future game genuinely needs it |

## Category: Audio

| Package | Real fit assessment | Priority |
|---|---|---|
| Native Web Audio API | Already in real, live use — Gladiator Arena has procedural sound effects implemented this way (confirmed via the studio status board, Aug 16). | Already adopted — extend, don't replace |
| `howler.js` | Only relevant if a future game needs positional audio or complex mixing beyond what a direct Web Audio API implementation handles cleanly. | Low, no current unmet need |

---

## Explicitly Rejected Scope

**"Pure TypeScript as the single source of truth" (abandoning the Lua
multi-runtime contract):** raised once during external research (Aug
22 2026) and explicitly rejected. This would mean discarding real,
working, already-invested infrastructure (`lupa`, `renderers/pygame/`,
`fengari-web`) for a hypothetical architecture with no demonstrated
need. If this is ever genuinely reconsidered, it requires its own
deliberate decision and ADR-level weight — never a casual adoption via
a library comparison table.

---

## Cross-Reference: Real Studio Catalog, for context on where any of this could actually land

Full genre/status breakdown lives in memory
(`project:rfdgamestudio:catalog_inventory_and_status_unconfirmed_aug20`,
`project:rfdgamestudio:queue_corrections_aug22`) — not duplicated here
to avoid drift between two copies of the same fast-changing list. Check
those, or the live `ts/src/status/board.data.ts`, for current per-game
status before assuming this document's game references are still
accurate.

---

## Changelog

| Date | Change |
|---|---|
| 2026-08-22 | Initial version. Built after a real, evidence-corrected research pass — an earlier informal pass overclaimed PixiJS and bitecs as "high priority" based on file names and generic genre assumptions before the real `render_adapter.py` contract and real entity-volume data were checked directly. This document reflects the corrected, evidence-based version only. |

---

*RFDGameStudio | Add to this before adopting any external library. Presentation adapters, never engines.*
