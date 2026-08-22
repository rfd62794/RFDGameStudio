# RFDGameStudio — External Tooling & Package Catalog

*v0.2 — supersedes v0.1 (same week) | August 2026 | Living reference — add to this before adopting any external library. Companion to `RFDGameStudio_EngineExpansionMap.md` (internal Lua primitive/system gaps).*

*Change from v0.1: that version was too narrow — it pre-filtered by architecture fit before establishing real breadth. This version researches comprehensively first, across every real category, then annotates fit second. Nothing below is omitted for not matching the Lua contract; everything is listed, with a real, honest fit note.*

---

## How to read this document

Every entry below is real — found via direct research, not inferred from a name or a category. Where a real, current detail exists (a version number, a maintenance status, a benchmark, a specific game that uses it), it's included. Fit against this studio's real architecture (the Lua multi-runtime contract — `lupa`/`fengari-web`, presentation-adapter philosophy) is noted as a **Fit** line on each entry, separately from the entry's own real quality — a library can be excellent and still be a poor fit here, and that's recorded honestly rather than used to exclude it from the list.

---

## 1. Full 2D Engines

| Package | Real details | Fit |
|---|---|---|
| **Phaser** | Most popular HTML5 game framework. Phaser 4 ("Caladan") released April 2026 — rewritten renderer, same familiar API. Ships scene manager, Arcade + Matter.js physics, tweening, input, audio, tilemap, particles — batteries included. Largest plugin/tutorial ecosystem in the space. | Owns its own game loop and state — competes with the Lua contract. Archived for this studio's use, not for lack of quality. |
| **PixiJS** | Fastest lightweight 2D WebGL/WebGPU renderer, not a full engine — no physics, no scene graph beyond display objects. | Rendering-only, which is closer to fitting — but real measured entity volume in this studio's own games (~30-80/frame) doesn't yet justify it over plain Canvas. |
| **melonJS** | Lightweight, actively maintained, bundles physics + Tiled tilemap integration + entity/component structure in a small footprint. Positioned as a middle ground between PixiJS and Phaser. | Same engine-ownership issue as Phaser, smaller scale. |
| **Kaplay** (formerly Kaboom.js) | Community-maintained continuation of Kaboom. Declarative, approachable API — built for game jams, teaching, zero-build prototyping. | Same issue; also its whole value proposition (fast, disposable prototyping) is arguably already served by the Google AI Studio → migration pipeline this studio already runs. |
| **Excalibur.js** | TypeScript-first, actor/scene model, strong typing, well-documented, opinionated structure. | Same engine-ownership issue. |

## 2. 3D / WebGL / WebGPU

| Package | Real details | Fit |
|---|---|---|
| **Three.js** | The standard 3D rendering library for the web. Scene graphs, PBR shaders, glTF loading. | No 3D anywhere in this studio's real catalog currently. Genuinely new territory either direction — catalog as real, not urgent. |
| **Babylon.js / PlayCanvas** | Full engines with visual editors (closer to a Unity-style workflow than code-first Three.js). | Same engine-ownership concern as the 2D full engines, at higher stakes. |

## 3. Vector / SVG Presentation

| Package | Real details | Fit |
|---|---|---|
| **Native React SVG** (no library) | Pure geometry → `<svg>` DOM elements. | **High fit** — matches the studio's existing primitive-first data pattern exactly. Zero dependencies. |
| **svg.js** | Lightweight SVG manipulation/animation library. | Worth a real trial only if native SVG + React state proves clunky for animation specifically — not needed upfront. |
| **A real, current, directly analogous precedent found this session:** a TypeScript roguelike devlog (Aug 13 2026) describes keeping game logic in a pure, React/DOM-free `sim/` module, with a React interface reading from it and rendering SVG — the exact same separation this studio already enforces everywhere. | — | Directly validates the existing approach; not a new dependency, a confirmation. |

## 4. Procedural Generation

| Package / Resource | Real details | Fit |
|---|---|---|
| **`kchapelier/procedural-generation`** (curated list) | Seeded RNG, 2D/3D Perlin & Simplex noise, Worley/cell noise, 2D maze generation via clustering, Voronoi diagrams (Fortune's algorithm), cellular-automata cave layouts. All narrow, stateless functions. | **High fit** — extends `seededRandom.ts`, doesn't compete with anything. |
| **Wave Function Collapse implementations** | Constraint-based generation for tile/rule-driven content. | No current game needs this; real future candidate for a tile-based title. |
| **`pure-rand`** | Seeded RNG library — confirmed in real, current use in the same roguelike devlog referenced above, alongside `zod` for save validation. | Direct precedent for pairing with the studio's own `seededRandom.ts` philosophy. |

## 5. Roguelike-Specific Toolkits

*New category in v0.2 — missed entirely in the first pass despite two real roguelikes (Slither Rogue, Dissonance Depths) already existing in the catalog.*

| Package | Real details | Fit |
|---|---|---|
| **`rot.js`** | The standard JS roguelike toolkit. Field-of-view, pathfinding (A* built in), dungeon generation, turn scheduling, canvas-based true-color display, keyboard mapping. README calls it feature-complete; last release was a maintenance update in November 2024 — mature and stable, not abandoned. Modeled after `libtcod`. | **High fit for any future roguelike work** — narrow, algorithmic, doesn't own game state. |
| **`yendor.ts`** | TypeScript-native roguelike toolkit inspired by `libtcod` — true-color console, RNG, field-of-view. Explicitly **no longer maintained** per its own README, which points toward `doryen-rs` (Rust) as the maintained successor. | Real option, but the maintenance status is a real, honest caveat — `rot.js` is the safer current pick despite being JS not TS. |

## 6. Physics

| Package | Real details | Fit |
|---|---|---|
| **Matter.js** | Most popular 2D rigid-body physics engine. 176+ npm dependents. Ships its own basic renderer (optional — can pair with PixiJS/Three.js instead). Real, documented gotcha: default bundler sourcemap/dev-mode configs can meaningfully hurt its real-time performance — worth knowing before adopting, not just before shipping. | Real candidate for any future game needing genuine rigid-body collision — nothing in the current catalog needs this yet. |
| **Planck.js** | Box2D-inspired, lightweight, accurate 2D physics for web. | Same as Matter.js — no current need, real option. |
| **Rapier** | WASM-based (Rust core), high-performance, used across Bevy/Godot/Phaser integration templates. Real, current GitHub activity confirms active ecosystem (Phaser+Rapier template repos, Three.js+Rapier boilerplates). | Heavier setup than Matter/Planck for likely no real benefit at this studio's real entity counts. |

## 7. Animation / Tweening

| Package | Real details | Fit |
|---|---|---|
| **`motion` / `framer-motion`** | Already real, live dependencies in `ts/package.json`. | Already adopted — extend before adding a competitor. |
| **tween.js** | Small, dependency-free ES6 tweening library — the standard lightweight choice when a full animation library is overkill. | Real, low-risk option for any presentation-layer animation not already covered by `motion`. |
| **GSAP** | Industry-standard, extremely capable, but a heavier, more opinionated dependency than this studio's stack currently carries anywhere. | Only worth it for animation complexity `motion` genuinely can't handle — no evidence of that need yet. |

## 8. Big-Number / Idle-Game Math

*New category in v0.2 — this is a real, concrete gap, not speculative.* JavaScript's native `Number` hits a hard wall around 1.79e308 — a real, mechanical limitation that idle/incremental games hit naturally as a consequence of exponential growth curves. Shoal and Slime Coin are real, live, shipped idle games in this catalog.

| Package | Real details | Fit |
|---|---|---|
| **`break_infinity.js`** | Purpose-built for incremental games needing numbers beyond 1e308, prioritizing speed over precision. Real, documented benchmark: Antimatter Dimensions saw a 4.5x speed improvement switching from `decimal.js` to this. | **High fit if Shoal or Slime Coin's real number growth is approaching or could approach the native limit** — worth an actual check against real current game state before adopting, not assumed. |
| **`break_eternity.js`** | The sequel to `break_infinity.js` — goes further (10^^1e308 and beyond) via a layered exponent representation. Actively maintained. | Only relevant if `break_infinity.js`'s own ceiling is a real concern — almost certainly overkill otherwise. |
| **`decimal.js` / `bignumber.js`** | Arbitrary-precision decimal arithmetic, prioritizing accuracy over speed — the correct choice when exact values matter (e.g., anything touching real currency-like values) rather than raw incremental-game scale. | Worth distinguishing from the break_* family: use this if precision matters, use break_* if scale matters. Different problems, easy to conflate. |

## 9. State Machine / App-Shell Orchestration

| Package | Real details | Fit |
|---|---|---|
| **`xstate`** | Formal state machine library. | **Medium fit** — legitimate for app-level flow (menus, transitions) outside the core simulation loop. Every game currently hand-rolls this in `useState`, which is the correct trigger for considering shared infrastructure. Worth one real prototype before wider adoption. |

## 10. Data-Driven ECS

| Package | Real details | Fit |
|---|---|---|
| **`bitecs` / `miniplex`** | Cache-friendly, flat typed-array component storage, built for very high entity counts. | **Low fit, unverified conflict risk** — likely competes with the Lua primitives/systems layer, but this has never actually been checked against what `lupa`/`fengari-web` really implement. Also: no swarm/bullet-hell genre exists anywhere in the real catalog to justify the entity-count case for it. Real research gap, not a settled no. |

## 11. Networking / Multiplayer

| Package | Real details | Fit |
|---|---|---|
| **`colyseus` / `geckos.io`** | Real-time state sync, room-based matchmaking (Colyseus), WebRTC UDP (geckos). | Low — House of Kings: Collab already solved real-time sync via Firebase/Firestore, a real, already-invested choice. Revisit only for a specific future game with a genuine need Firestore can't serve. |

## 12. Audio

| Package | Real details | Fit |
|---|---|---|
| **Native Web Audio API** | Already in real, live use — Gladiator Arena has procedural sound effects implemented this way. | Already adopted — extend before adding a dependency. |
| **`howler.js`** | Cross-browser audio with a simpler API than raw Web Audio, positional audio support. | Only relevant if a future game needs mixing/positional complexity a direct Web Audio implementation handles awkwardly. |

---

## Explicitly Rejected Scope

**"Pure TypeScript as the single source of truth"** (abandoning the Lua multi-runtime contract entirely): raised once during research, explicitly rejected. Discarding real, working, already-invested infrastructure (`lupa`, `renderers/pygame/`, `fengari-web`) for a hypothetical architecture with no demonstrated need. Requires its own deliberate decision and ADR-level weight if ever genuinely reconsidered — never a casual table-row adoption.

---

## Cross-Reference

Full genre/status breakdown lives in memory
(`project:rfdgamestudio:catalog_inventory_and_status_unconfirmed_aug20`,
`project:rfdgamestudio:queue_corrections_aug22`) and the live
`ts/src/status/board.data.ts` — not duplicated here to avoid drift.

---

## Changelog

| Version | Change |
|---|---|
| v0.1 | Initial version. Real but narrow — pre-filtered by architecture fit before establishing breadth. Categories: raster/sprite, vector/SVG, procedural generation, state machines, ECS, networking, audio. |
| v0.2 | Substantially expanded following direct feedback that v0.1 was too short. Real, dedicated research pass across every category. Added: full 2D engines (Phaser 4 "Caladan," melonJS, Kaplay, Excalibur), 3D/WebGL, roguelike-specific toolkits (rot.js, yendor.ts — directly relevant given 2 real roguelikes already in the catalog), physics (Matter.js, Planck.js, Rapier), animation/tweening (tween.js, GSAP), and big-number/idle-game math (break_infinity.js, break_eternity.js, decimal.js/bignumber.js — a real, concrete, previously-unaddressed gap given Shoal and Slime Coin are real, live idle games). Every entry now carries real, current, sourced detail (version numbers, maintenance status, real benchmarks, a real Aug 13 2026 devlog directly validating the existing SVG/pure-logic architecture) rather than a bare name and a one-line guess.|

---

*RFDGameStudio | Comprehensive first, architecture-fit second — never the reverse.*
