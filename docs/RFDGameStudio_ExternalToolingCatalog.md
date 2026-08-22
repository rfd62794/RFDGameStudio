# RFDGameStudio — External Tooling & Package Catalog

*v0.4 — supersedes v0.3 (same week) | August 2026 | Living reference — add to this before adopting any external library. Companion to `RFDGameStudio_EngineExpansionMap.md` (internal Lua primitive/system gaps).*

*Change from v0.3: closed remaining gaps per explicit request for full breadth — Math/Color utilities, Save/Serialization, Localization, and Netcode/Replay techniques. This version consolidates every finding from both research passes into one organized reference.*

---

## How to read this document

Every entry is real — found via direct research, not inferred. Fit
against this studio's real architecture (the confirmed Lua
multi-runtime contract — `lupa`/`fengari-web`, presentation-adapter
philosophy, real `render_adapter.py` entity-dict contract) is a
separate, honest note on each entry — never a reason to omit
something. Where genuine research turned up nothing real, that's
recorded plainly too (see §8, §13) — an honest gap is a real finding,
not a failure.

---

## 1. Graphics (techniques beyond rendering choice)

| Item | Real details | Fit |
|---|---|---|
| Sprite/pixel-art pipeline | No mature "import Aseprite directly" JS package found — most projects hand-roll a spritesheet-JSON loader (Aseprite exports JSON natively). | Real gap; budget a small custom loader if pixel art is ever adopted, not a library search. |
| `regl` / `ogl` | Lightweight, lower-level WebGL wrappers — middle ground between raw WebGL and a full engine. | No current shader/GPU-effect need in the catalog. |

## 2. Raster / Sprite Presentation

| Package | Fit |
|---|---|
| Plain Canvas 2D API | **High — default.** Matches confirmed ~30-80 entity/frame real volume, zero dependencies. |
| PixiJS | Low, pending real evidence of an order-of-magnitude-higher entity count in a specific game. |
| Phaser / Excalibur.js / melonJS / Kaplay / GameJs | Full engines — own the game loop, compete with the Lua contract. Archived, not for lack of quality. |

## 3. Vector / SVG Presentation

Native React SVG — high fit, zero dependencies, directly validated by a real, current (Aug 13 2026) TS roguelike devlog using the identical pure-logic-module + SVG-render pattern this studio already follows. `svg.js` as a fallback only if animation proves clunky with plain SVG + React.

## 4. AI Logic

| Package | Real details | Fit |
|---|---|---|
| **Yuka** | Standalone, TS-typed, zero-dependency game-AI library. Steering behaviors (seek/flee/pursue/evade/wander/flocking), navmesh pathfinding, A*/graph search, perception (vision/hearing), triggers, fuzzy logic, state- and goal-driven agent design, JSON save/load. Engine-independent. | **High fit** — presentation-agnostic logic, the same shape as this studio's own `engine/shared` modules. Real candidate for any future autonomous-NPC need. |

## 5. Movement / Pathfinding

| Package | Real details | Fit |
|---|---|---|
| `rot.js` | Grid-based, roguelike-purpose-built: FOV, A*, dungeon generation, turn scheduling. Feature-complete, stable since Nov 2024. | High fit — 2 real roguelikes already in the catalog. |
| Yuka's navigation module | Navmesh for continuous (non-grid) space — complements `rot.js`, doesn't compete with it. | Real complement, different movement model. |
| `PathFinding.js` / `easystar.js` | Narrower grid-A* only, no roguelike extras. | Lower priority than `rot.js` given the overlap. |

## 6. Controls / Input

| Package | Real details | Fit |
|---|---|---|
| Native Gamepad API | Browser-native foundation everything below wraps. | Starting point. |
| `gamecontroller.js` / `joypad.js` | Event-based wrappers, normalize the real, documented cross-browser button-mapping inconsistency in the raw API. | Real, low-risk once any game needs gamepad support. |
| `nipplejs` / `VirtualJoystick.js` | Touch virtual joystick for mobile web. | Real option for a future mobile-first game. |

## 7. UI / Dialogue-Narrative Systems

General UI is already served by the real, live React + Tailwind stack. Branching dialogue is a distinct, real category:

| Tool | Real details | Fit |
|---|---|---|
| **`inkjs`** | Direct JS/TS port of Inkle's Ink language (80 Days, Heaven's Vault) — no engine dependency. | **Higher web-fit than Yarn Spinner** for this studio's stack specifically. |
| Yarn Spinner | Real, proven shipped pedigree (Night in the Woods, A Short Hike, Dredge). Primary integration path is Unity/Godot/Unreal; web support exists via community projects but is less first-class. | Real option, real trial needed before assuming a smooth web path. A real, current tutorial confirms i18next + ExcaliburJS + Twine/dialogue integration works together in practice. |
| Twine | Browser-native, simplest, visual passage-linking. | Real fit for early prototyping only, weaker for deep state integration. |

## 8. Genre-Specific Packages — honest survey across all genres

| Genre | Real finding |
|---|---|
| Racing (Horse Racing) | No dedicated package ecosystem; physics (§12) covers the mechanical need, rest is game logic. |
| Card / deckbuilder (Ledger, Succession-adjacent) | No mature general-purpose JS card engine found. Real logic-and-state work — matches this studio's existing hand-rolled approach. |
| Tower defense | No dedicated package. Pathfinding (§5) + a wave-spawner primitive (already a real, named gap in `EngineExpansionMap.md`) covers it. |
| Colony-sim / city-builder (Planet of Greed) | No dedicated package — served by this studio's own primitive/system layer (resources, progression, dispatch). |
| Visual novel / narrative | Real, mature tooling — see §7. |
| Roguelike | Real, mature tooling — see §5. |
| Idle/incremental | Real, specific tooling — see §11. |
| Rhythm | No dedicated package; real need is Web Audio's own precise clock (already in use) plus custom input-timing logic. |

**The pattern:** genres with a narrow, algorithmically-defined core (roguelike FOV/pathfinding, dialogue branching, big-number math) have real dedicated packages. Genres that are mostly custom rules and state (card games, tower defense, city-builders, racing) don't — and don't need to, since that's exactly the job this studio's Lua primitive/system layer already does. This validates the existing architecture rather than exposing a gap.

## 9. Save / Serialization / Data Validation

*New in v0.4 — a real, previously-uncatalogued category, and it directly answers an already-named internal gap.*

| Package | Real details | Fit |
|---|---|---|
| **Zod** | TypeScript-first schema validation with static type inference. Zero dependencies, ~4kB minified+gzipped. Define a schema once, get runtime validation and a compile-time type together — eliminates duplicate type declarations. Real, current detail: a recent `z.compile()` feature adds ahead-of-time compilation for hot validation paths (2.4x median speedup across a 55-schema benchmark, up to ~9x for large arrays/objects). | **High fit, and directly closes a real, already-named gap:** `EngineExpansionMap.md` states plainly "the Lua layer has no save primitive... games that need persistence have to solve it themselves." Zod is the natural validation layer for a real save/load contract — confirmed in independent real use for exactly this (the Aug 13 2026 roguelike devlog uses Zod specifically "to validate an imported save string"). |

## 10. Math / Color Utilities

*New in v0.4.*

| Package | Real details | Fit |
|---|---|---|
| **`chroma.js`** | Small (13.5kB), zero-dependency color manipulation and scale/palette generation — conversions, gradients, class-break computation (equidistant/quantile/logarithmic/k-means). | Real, direct fit for extending the severity-color-grammar work already built for Time Served (`severityGrammar.ts`) — a proven, real internal pattern this could formalize rather than a speculative addition. |
| **`gl-matrix`** | High-performance vector/matrix math for WebGL/WebGPU. Mature (1,173+ npm dependents), hand-tuned for real-time 3D. | Only relevant if 3D or GPU shader work is ever adopted — no current need given the studio's real, confirmed 2D-only usage. |

## 11. Big-Number / Idle-Game Math

`break_infinity.js`/`break_eternity.js` — real, specific fit if Shoal or Slime Coin's real number growth approaches JS's native ~1.79e308 ceiling; worth an actual check against real current game state before adopting. `decimal.js`/`bignumber.js` for precision-first needs — a distinct problem from scale-first, easy to conflate.

## 12. Physics, Animation, State Machines, ECS

*(carried unchanged from v0.2/v0.3)* Matter.js/Planck.js/Rapier (physics, no current need); `motion`/`framer-motion` (already live), tween.js, GSAP (animation); `xstate` (medium fit, app-shell flow only); `bitecs`/`miniplex` (low fit, unverified conflict with the Lua systems layer, no genre need in the catalog to justify it).

## 13. Localization

*New in v0.4.*

| Package | Real details | Fit |
|---|---|---|
| **`i18next`** | The most-used JS i18n framework — 14+ years old, weekly downloads in the millions. Framework-agnostic bindings (React, Vue, Node, vanilla). ICU formatting, plurals, backends for lazy-loading translation files. | Real, low-risk option whenever the studio's catalog needs a second language — nothing currently does, but this is mature, boring, well-proven infrastructure, not a speculative bet. A real, current tutorial confirms it integrates cleanly alongside ExcaliburJS + Twine dialogue in practice. |

## 14. Networking / Multiplayer / Netcode

| Package | Real details | Fit |
|---|---|---|
| Colyseus / geckos.io | Server-authoritative real-time sync, room-based matchmaking. | Low — Firebase/Firestore already solved this for House of Kings: Collab. |
| **`netplayjs`** | Real P2P browser multiplayer — no server hosting required. Rollback netcode (predictive) over WebRTC by default; falls back to Lockstep if game state can't be serialized, and games must be explicitly marked deterministic for full rollback benefits. | New, real, distinct option — this is peer-to-peer, not server-authoritative, a genuinely different tradeoff than the Firebase path. No current game needs this, but it's the right answer specifically if a future game wants multiplayer *without* standing up backend infrastructure. |

## 15. Audio

Native Web Audio API — already in real, live use (Gladiator Arena's procedural sound effects). `howler.js` — only relevant for positional/mixing complexity beyond what a direct implementation handles cleanly.

## 16. Methods & Techniques (not packages)

- **FSM vs. Behavior Trees vs. GOAP vs. Utility AI** — real tradeoff. FSMs (Yuka has this) suit small, well-defined state counts. Behavior trees scale to complex hierarchical decisions at more upfront design cost. GOAP suits agents that need to dynamically sequence actions toward a goal — no mature JS package found; a real pattern to implement directly if ever needed. Utility AI suits agents balancing several competing priorities via scoring.
- **Navmesh vs. flow-field vs. grid-A\*** — grid-A* (`rot.js`) fits tile-based games. Navmesh (Yuka) fits continuous space. Flow-fields suit many-agents-to-one-target scenarios, cheaper than per-agent A* — no dedicated package found, a real implementable technique.
- **Deterministic Lockstep vs. Rollback netcode** — new in v0.4. Lockstep sends player *inputs*, not state, and every client simulates identically — requires true determinism and can stall waiting for the slowest peer's input each tick, historically the standard for RTS games with huge unit counts. Rollback (used by `netplayjs`'s default mode) predicts ahead locally and re-simulates ("rolls back") when a late input contradicts the prediction — lower perceived latency, more complex to implement correctly. Real, honest note: whether JavaScript operations are reliably cross-platform-deterministic (float math consistency across browsers/devices) is a genuinely open question worth testing directly before betting a design on it, not assuming.
- **Camera juice** — deadzone-based follow, lerped position, screen shake on impact. No package needed — a few lines of interpolation math, matching this studio's own primitive-first pattern.
- **Input feel** — coyote time (grace window after leaving a platform), input buffering (queue a press slightly early, fire the instant it's valid). Implementation detail, not a package.
- **UI/UX technique reference** — this studio already has a real, deep worked example: Time Served's `UI_UX_Redesign_Plan.md` (three-tier Chrome/Viewport/Overlay architecture, severity color grammar, progressive disclosure). Treat as this studio's own methods reference for game UI, not just external research.

## 17. Level Editors / Tilemap Loading

*New in v0.4, and an honest negative result worth recording.* Real research found mature Tiled (TMX) loaders for C++ (`tmxlite`, `tinytmx`), Python (`pytiled-parser`, `PyTMX` — directly relevant to `renderers/pygame/`), and Lua (`AdvTiledLoader`), but **no standout standalone JS/TS TMX loader** — JS-side Tiled support is typically bundled inside a full engine (melonJS, Phaser) rather than existing as its own package. If tile-based level design is ever needed on the TS side without adopting a full engine, this is a real, confirmed gap requiring a small custom loader — not an oversight in this research.

---

## Explicitly Rejected Scope

"Pure TypeScript as the single source of truth" (abandoning the Lua multi-runtime contract) — rejected. Requires its own deliberate decision and ADR-level weight if ever genuinely reconsidered.

---

## Changelog

| Version | Change |
|---|---|
| v0.1 | Initial, narrow — pre-filtered by architecture fit before establishing breadth. |
| v0.2 | Expanded: full 2D/3D engines, roguelike toolkits, physics, animation, big-number/idle math. |
| v0.3 | Expanded further: Graphics, AI Logic (Yuka), Movement/Pathfinding, Controls, UI/Dialogue (Ink vs. Yarn Spinner), honest genre-specific survey, Methods & Techniques section. |
| v0.4 | Closed remaining real gaps: Save/Serialization (Zod — directly answers `EngineExpansionMap.md`'s named "no save primitive" gap), Math/Color utilities (chroma.js, gl-matrix), Localization (i18next), Netcode/Replay (netplayjs, Lockstep vs. Rollback as a real technique comparison), Level Editor/Tilemap survey (honest negative result — no standalone JS TMX loader exists, bundled-in-engine only). This version consolidates every finding across both research passes into one organized reference. |

---

*RFDGameStudio | Comprehensive first, architecture-fit second, honest about what has no answer yet.*
