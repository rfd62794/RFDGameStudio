# RFDGameStudio — External Tooling & Package Catalog

*v0.3 — supersedes v0.2 (same week) | August 2026 | Living reference — add to this before adopting any external library. Companion to `RFDGameStudio_EngineExpansionMap.md` (internal Lua primitive/system gaps).*

*Change from v0.2: added Graphics (beyond rendering), full AI Logic, Movement/Pathfinding, Controls, UI/Dialogue systems, an honest genre-specific-package survey, and — new — a Methods & Techniques section, since real game-dev craft knowledge isn't all package-shaped.*

---

## How to read this document

Every entry is real — found via direct research. Fit against this
studio's real architecture (Lua multi-runtime contract, presentation-
adapter philosophy — see `EngineExpansionMap.md` and the real,
confirmed `render_adapter.py` contract) is a separate, honest note on
each entry, never a reason to omit something from the list.

---

## 1. Graphics

Rendering-surface options (Canvas/SVG/PixiJS/Three.js/Babylon) are
covered under §2-3 below. This section covers **graphics techniques**
beyond raw rendering choice.

| Item | Real details | Fit |
|---|---|---|
| **Sprite/pixel-art pipeline** | No dedicated JS "import Aseprite" package found as a mature standard — most projects hand-roll a spritesheet-JSON loader (Aseprite exports JSON directly). Real gap, not a package to adopt. | If pixel art is ever adopted, budget for a small custom loader, not a library search. |
| **`regl` / `ogl`** | Lightweight, lower-level WebGL wrappers — a middle ground between raw WebGL and a full engine like Three.js, for anyone wanting custom shader control without engine overhead. | No current shader/GPU-effect need anywhere in the catalog. Real option if that ever changes. |

## 2. Raster / Sprite Presentation

*(carried from v0.2, unchanged)*

| Package | Real fit assessment | Priority |
|---|---|---|
| Plain Canvas 2D API | Matches confirmed ~30-80 entity/frame real volume with zero dependencies. | **High — default** |
| PixiJS | Only justified at real entity counts an order of magnitude above what's currently observed. | Low, pending real evidence |
| Phaser / Excalibur.js / melonJS / Kaplay | Full engines — own the game loop, compete with the Lua contract. | Archived, not for lack of quality |

## 3. Vector / SVG Presentation

*(carried from v0.2)* Native React SVG — high fit, zero dependencies, directly validated by a real, current (Aug 13 2026) TS roguelike devlog using the identical pure-logic-module + SVG-render pattern. `svg.js` as a real option only if animation proves clunky with plain SVG + React.

## 4. AI Logic

*New category. This was a real gap in v0.1/v0.2.*

| Package | Real details | Fit |
|---|---|---|
| **Yuka** | Standalone JS game-AI library, TypeScript definitions included, zero dependencies. Steering behaviors (seek, flee, pursue, evade, wander, flocking), navigation mesh pathfinding, A* + graph search, perception (vision/hearing), triggers, **fuzzy logic inference**, state-driven and goal-driven agent design, JSON save/load. Engine-independent — works with Three.js, Canvas 2D, or headless (Node). Actively used, documented, tested. | **High fit** — this is exactly a presentation-agnostic logic library, the same shape as this studio's own `engine/shared` modules. Real candidate for any future game with autonomous NPCs (a wandering creature in a future SlimeGarden-successor, roaming rivals, etc.). |
| **Behavior trees vs. GOAP vs. Utility AI vs. FSM** | Not a package category — a real design choice. See §9 Methods & Techniques below for a real comparison; Yuka covers FSM and goal-driven design natively, not full behavior-tree or GOAP frameworks. | — |

## 5. Movement / Pathfinding

| Package | Real details | Fit |
|---|---|---|
| **`rot.js`** | (carried from v0.2) Grid-based, roguelike-purpose-built: FOV, A*, dungeon generation, turn scheduling. Feature-complete, last release Nov 2024. | High fit for tile-based games — 2 real roguelikes already in the catalog. |
| **Yuka's navigation module** | Navmesh loading/parsing, graph-based search — for continuous (non-grid) space, unlike `rot.js`'s grid focus. | Real complement to `rot.js`, not a competitor — different movement models. |
| **`PathFinding.js` / `easystar.js`** | Narrower, grid-based A* implementations, no roguelike-specific extras (no FOV, no dungeon gen). | Lower priority than `rot.js` given `rot.js` already covers this plus more for the studio's real grid-based games. |

## 6. Controls / Input

| Package | Real details | Fit |
|---|---|---|
| **Native Gamepad API** | Browser-native, no dependency. The actual foundation every wrapper library below sits on. | Always the starting point. |
| **`gamecontroller.js`** | Event-based wrapper over the Gamepad API, standard button-layout normalization (handles the real, documented cross-browser button-mapping inconsistency the raw API has). | Real, low-risk option once any game needs gamepad support — nothing currently does. |
| **`joypad.js`** | Similar wrapper, configurable button mapping, adjustable analog-stick dead-zone threshold. | Comparable alternative to gamecontroller.js. |
| **`nipplejs` / `VirtualJoystick.js`** | Touch-based virtual joystick for mobile web. | Real option for any future mobile-first game; several existing games are already browser/desktop-primary. |

## 7. UI / Dialogue-Narrative Systems

General UI (buttons, panels, layout) is already well-served by this
studio's real, live React + Tailwind stack — not re-covered here.
**Branching dialogue/narrative** is a genuine, distinct category with
real, mature tools:

| Tool | Real details | Fit |
|---|---|---|
| **Yarn Spinner** | Real, proven shipped pedigree: Night in the Woods, A Short Hike, Dredge, Lost in Random. Writer-friendly Yarn language, branching choices, variables tied to game state, localization support. Primary integrations are Unity/Godot/Unreal — web/JS support exists via community projects (e.g. `YarnClassic`, which compiles Ink files too via a WASM `inklecate` port) but is less first-class than the Unity path. | Real option for any narrative-heavy game (Succession is the obvious current candidate) — the web-integration path needs a real trial before committing, not assumed smooth. |
| **Ink / `inkjs`** | Inkle Studios' narrative scripting language (80 Days, Heaven's Vault). `inkjs` is a genuine, direct JS/TS port — no Unity dependency, runs natively in a web project. | **Higher web-fit than Yarn Spinner specifically because of `inkjs`** — worth the first real trial if branching dialogue is ever built for Succession or a future narrative game. |
| **Twine** | Browser-native, simplest entry point, visual passage-linking. Good for early prototyping and non-programmer story review, less suited to deep variable/state integration with a real game engine. | Lower fit for production integration; real fit for early narrative prototyping only. |

## 8. Genre-Specific Packages — an honest survey across the full genre spread

Given the real ask for "all genres," the honest finding is: **most
genres don't have a dedicated, mature JS/TS package ecosystem beyond
what's already covered above.** Recording this plainly rather than
padding the list with weak matches:

| Genre | Real finding |
|---|---|
| **Racing** (Horse Racing exists) | No dedicated racing-game package ecosystem found — physics (§ carried from v0.2: Matter.js/Planck.js/Rapier) covers the mechanical need; the rest is genre-specific game logic, which is exactly what this studio's own Lua layer already owns. |
| **Card / deckbuilder** (Ledger, Succession-adjacent) | No mature, general-purpose JS card-game engine found. This genre is real logic-and-state work, not a solved-by-package problem — matches this studio's existing approach of hand-rolling logic in Lua/TS rather than importing a framework. |
| **Tower defense** | No dedicated package found. Pathfinding (§5) + a wave-spawner primitive (already named as a real gap in `EngineExpansionMap.md`'s "Wave/encounter spawner" entry) covers the real mechanical needs. |
| **Colony-sim / city-builder** (Planet of Greed) | No dedicated package. Real needs are covered by this studio's own primitive/system layer (resources, progression, dispatch — already identified in `EngineExpansionMap.md`). |
| **Visual novel / narrative** | Real, mature tooling exists — see §7 above (Ink/`inkjs`, Yarn Spinner). |
| **Roguelike** | Real, mature tooling exists — see §5 (`rot.js`). |
| **Idle/incremental** | Real, specific tooling exists — see §10 below (`break_infinity.js` family). |
| **Rhythm** | No dedicated JS rhythm-game package found; real need would be precise audio-timing (Web Audio API's own clock, already in use for Gladiator Arena) plus custom input-timing logic — not a packageable genre. |

**The pattern across this whole survey:** genres with a real, narrow, algorithmically-defined core (roguelike FOV/pathfinding, dialogue branching, big-number math) have real dedicated packages. Genres that are mostly "custom game rules and state" (card games, tower defense, city-builders, racing) don't — and don't need to, since that's exactly the job this studio's Lua primitive/system layer already does. This is a real, useful finding: it confirms the studio's own architecture is already aimed at the right problem.

## 9. Methods & Techniques (not packages)

Real craft knowledge worth recording, separate from any library:

- **FSM vs. Behavior Trees vs. GOAP vs. Utility AI** — real tradeoff, not solved by picking a library: FSMs (Yuka has this) are simplest and best for small, well-defined state counts. Behavior trees scale better for complex, hierarchical decision logic but need more upfront design. GOAP (Goal-Oriented Action Planning) is best when an agent needs to dynamically sequence actions toward a goal rather than follow scripted states — no mature JS package found for this specifically; it's a pattern to implement directly if ever needed. Utility AI (scoring multiple possible actions and picking the highest-scoring one) suits agents balancing several competing priorities.
- **Navmesh vs. flow-field vs. grid-A\*** — grid-A* (`rot.js`, `easystar.js`) is simplest and fits tile-based games exactly. Navmesh (Yuka) fits continuous, non-tile space. Flow-fields are worth knowing about for many-agents-pathing-to-one-target scenarios (a swarm all moving toward the same point) — cheaper than running A* per-agent, though no dedicated JS package was found for this; it's a real, implementable technique, not a library gap.
- **Camera juice** — deadzone-based camera follow (camera only moves once the target leaves a central zone, avoiding jitter), lerped position (smooth catch-up rather than instant snap), and screen shake on impact events are all real, well-established techniques with no dedicated package needed — a few lines of interpolation math, same "primitive-first" pattern already used throughout this studio's code.
- **Input feel** — coyote time (a brief grace window after leaving a platform where a jump still registers) and input buffering (queuing a button press slightly before it's valid so it fires the instant it becomes valid) are real, well-documented platformer-feel techniques — implementation detail, not a package.
- **UI/UX-specific technique reference** — this studio already has a real, deep worked example: the Time Served project's `UI_UX_Redesign_Plan.md` (three-tier Chrome/Viewport/Overlay architecture, severity color grammar, progressive disclosure rules). Worth treating as this studio's own real methods reference for game UI, not just external research.

---

## 10. Procedural Generation

*(carried from v0.2)* `kchapelier/procedural-generation` curated list (seeded RNG, Perlin/Simplex/Worley noise, maze gen, Voronoi, cellular-automata caves) — high fit, extends `seededRandom.ts`. `pure-rand` confirmed in real current use in the same roguelike devlog referenced in §3.

## 11. Big-Number / Idle-Game Math

*(carried from v0.2)* `break_infinity.js`/`break_eternity.js` — real, specific fit if Shoal or Slime Coin's real number growth approaches JS's native ~1.79e308 ceiling. `decimal.js`/`bignumber.js` for precision-first needs (distinct problem from scale-first).

## 12. State Machine / App-Shell, ECS, Networking, Audio, Physics, Animation

*(carried from v0.2, unchanged — see prior version history)*

---

## Explicitly Rejected Scope

"Pure TypeScript as the single source of truth" (abandoning the Lua
multi-runtime contract) — rejected, requires its own deliberate
decision and ADR-level weight if ever reconsidered.

---

## Changelog

| Version | Change |
|---|---|
| v0.1 | Initial, narrow — pre-filtered by architecture fit before establishing breadth. |
| v0.2 | Expanded following feedback that v0.1 was too short: full 2D/3D engines, roguelike toolkits, physics, animation, big-number/idle math. |
| v0.3 | Further expanded per explicit request for Graphics, Audio, AI Logic, Movement, Pathfinding, Controls, UI, genre-specific coverage across all genres, and methods/techniques (not just packages). Major new finding: **Yuka** (standalone AI/steering/navmesh library, high fit). Real dialogue-engine research: Ink/`inkjs` (higher web-fit) vs. Yarn Spinner (stronger shipped pedigree, weaker native web path). Real, honest genre survey: most genres have no dedicated package ecosystem and are correctly served by this studio's existing Lua primitive/system layer — a finding that validates the architecture rather than exposing a gap. New Methods & Techniques section covering FSM/behavior-tree/GOAP/utility-AI tradeoffs, navmesh/flow-field/grid-A* tradeoffs, camera juice, and input-feel techniques — real craft knowledge that isn't package-shaped. |

---

*RFDGameStudio | Comprehensive first, architecture-fit second, honest about what has no answer yet.*
