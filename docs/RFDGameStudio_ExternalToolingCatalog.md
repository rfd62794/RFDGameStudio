# RFDGameStudio — External Tooling & Package Catalog

*v0.5 — supersedes v0.4 (same week) | August 2026 | Living reference — add to this before adopting any external library. Companion to `RFDGameStudio_EngineExpansionMap.md` (internal Lua primitive/system gaps).*

*Change from v0.4: a real, systemic correction, not an addition. Every prior version quietly treated the Lua multi-runtime contract as a universal filter — "does this compete with Lua" — applied to every tool regardless of which game it might actually serve. That's wrong. Lua is one real pattern this studio uses for some games (the ones tagged "Lua-backed": Chimera Wilds, ScrapCrawl, Slime Coin, Horse Racing, Slither Rogue). Several other real, live, shipped games in this same catalog are TS-native with no Lua involvement at all — Succession, Planet of Greed, Gladiator Arena, Mutant Battle Ball, VoidDrift Redux — and VoidDrift Redux specifically is this studio's current real investment priority. Treating "competes with Lua" as a reason to downgrade a tool was applying a per-project fact as if it were a studio-wide law. This version removes that bias throughout and re-frames fit as a per-game question, decided when a specific game actually needs the tool — never a blanket filter applied in advance.*

---

## How to read this document

Every entry is real — found via direct research, not inferred. Fit is
now recorded honestly as: **what is this actually good at, and which
kind of game in this studio's real catalog (Lua-backed, TS-native, or
Firebase-backed — all three patterns are real and already in use)
would it genuinely serve.** A tool is never marked down just for
owning its own game loop or state — that's only a real problem for a
game that specifically has chosen the Lua contract, and most of this
studio's real games haven't. Where research found nothing real, that's
recorded plainly (§8, §17) — an honest gap is a real finding, not a
failure.

---

## 1. Graphics (techniques beyond rendering choice)

| Item | Real details | Fit |
|---|---|---|
| Sprite/pixel-art pipeline | No mature "import Aseprite directly" JS package found — most projects hand-roll a spritesheet-JSON loader (Aseprite exports JSON natively). | Real gap for any game wanting pixel art; budget a small custom loader, not a library search. |
| `regl` / `ogl` | Lightweight, lower-level WebGL wrappers — middle ground between raw WebGL and a full engine. | No current shader/GPU-effect need in the catalog, for any game pattern. |

## 2. Full 2D Engines and Renderers

*Corrected in v0.5 — previously archived wholesale as "competing with the Lua contract," which only applies to Lua-backed games. A TS-native game (several already real and shipped in this catalog) has no such conflict.*

| Package | Real details | Fit |
|---|---|---|
| **Phaser** | Most popular HTML5 game framework. Phaser 4 ("Caladan," April 2026) — rewritten renderer, same API. Ships scene manager, Arcade + Matter.js physics, tweening, input, audio, tilemap, particles. Largest plugin/tutorial ecosystem. | Real option for a future TS-native game — owning its own game loop is only a real conflict for a Lua-backed title. Worth deliberately weighing against this studio's existing pattern of hand-rolled TS logic (Succession, Time Served) before adopting — a real choice either way, not a default no. |
| **PixiJS** | Fast, lightweight 2D WebGL/WebGPU renderer, not a full engine (no physics/scene graph). | Real option for a TS-native game; current studio entity volumes (~30-80/frame observed) don't demand it yet, but that's a real-need question, not an architecture veto. |
| **melonJS** | Lightweight, actively maintained, physics + Tiled tilemap integration + entity/component structure. | Same as Phaser — real option for a TS-native title. |
| **Kaplay** (Kaboom.js successor) | Declarative, approachable API, built for fast prototyping, zero-build. | Real option, particularly interesting for fast TS-native prototyping outside the AI-Studio pipeline. |
| **Excalibur.js** | TypeScript-first, actor/scene model, strong typing. | Real option — arguably the most natural fit of this group for a TS-native game given the studio's existing type-first discipline. |
| Plain Canvas 2D API | Zero dependencies, matches real observed entity volume for the Lua-driven presentation-adapter path specifically. | High fit **specifically for a Lua-backed game's presentation layer** (see the confirmed `render_adapter.py` contract) — not a universal default for every game. |

## 3. Vector / SVG Presentation

Native React SVG — zero dependencies, directly validated by a real, current (Aug 13 2026) TS roguelike devlog using a pure-logic-module + SVG-render pattern. Real, strong fit either for a Lua-backed presentation layer or a TS-native game's own logic — this pattern doesn't depend on which one a given game chose. `svg.js` as a fallback if animation proves clunky with plain SVG + React.

## 4. AI Logic

| Package | Real details | Fit |
|---|---|---|
| **Yuka** | Standalone, TS-typed, zero-dependency game-AI library. Steering behaviors, navmesh pathfinding, A*/graph search, perception, triggers, fuzzy logic, state- and goal-driven agent design, JSON save/load. Engine-independent. | High fit regardless of which architecture pattern a game uses — genuinely presentation- and logic-agnostic. Real candidate for any future autonomous-NPC need. |

## 5. Movement / Pathfinding

| Package | Real details | Fit |
|---|---|---|
| `rot.js` | Grid-based, roguelike-purpose-built: FOV, A*, dungeon generation, turn scheduling. Feature-complete, stable since Nov 2024. | High fit — 2 real roguelikes already in the catalog, regardless of Lua vs. TS-native. |
| Yuka's navigation module | Navmesh for continuous space. | Real complement to `rot.js`, different movement model. |
| `PathFinding.js` / `easystar.js` | Narrower grid-A* only. | Lower priority given the overlap with `rot.js`. |

## 6. Controls / Input

| Package | Real details | Fit |
|---|---|---|
| Native Gamepad API | Browser-native foundation. | Starting point regardless of architecture. |
| `gamecontroller.js` / `joypad.js` | Event-based wrappers, normalize real cross-browser button-mapping inconsistency. | Real, low-risk once any game needs gamepad support. |
| `nipplejs` / `VirtualJoystick.js` | Touch virtual joystick for mobile web. | Real option for a future mobile-first game. |

## 7. UI / Dialogue-Narrative Systems

| Tool | Real details | Fit |
|---|---|---|
| **`inkjs`** | Direct JS/TS port of Inkle's Ink language (80 Days, Heaven's Vault) — no engine dependency. | Higher web-fit than Yarn Spinner for this studio's real, live React/TS stack. |
| Yarn Spinner | Real, proven shipped pedigree (Night in the Woods, A Short Hike, Dredge). Primary integration is Unity/Godot/Unreal; web support exists via community projects. | Real option, needs a real trial before assuming a smooth web path. |
| Twine | Browser-native, simplest, visual passage-linking. | Real fit for early prototyping, weaker for deep state integration. |

## 8. Genre-Specific Packages — honest survey across all genres

| Genre | Real finding |
|---|---|
| Racing (Horse Racing) | No dedicated package ecosystem; physics (§12) covers the mechanical need, rest is game logic. |
| Card / deckbuilder (Ledger, Succession-adjacent) | No mature general-purpose JS card engine found — real custom logic-and-state work either way. |
| Tower defense | No dedicated package. Pathfinding (§5) + a wave-spawner primitive (already a real, named gap in `EngineExpansionMap.md`) covers it. |
| Colony-sim / city-builder (Planet of Greed) | No dedicated package. |
| Visual novel / narrative | Real, mature tooling — see §7. |
| Roguelike | Real, mature tooling — see §5. |
| Idle/incremental | Real, specific tooling — see §11. |
| Rhythm | No dedicated package; real need is a precise audio clock plus custom input-timing logic. |

**The real pattern, corrected framing:** genres with a narrow, algorithmically-defined core (roguelike FOV/pathfinding, dialogue branching, big-number math) have real dedicated packages, independent of which architecture a given game uses. Genres that are mostly custom rules and state (card games, tower defense, city-builders, racing) don't have a package answer — that's real, custom work regardless of whether it's written in Lua or TS.

## 9. Save / Serialization / Data Validation

| Package | Real details | Fit |
|---|---|---|
| **Zod** | TypeScript-first schema validation, static type inference, ~4kB, zero dependencies. Real, current `z.compile()` feature adds AOT compilation for hot paths (2.4x median speedup, up to ~9x for large structures). | High fit — directly answers `EngineExpansionMap.md`'s own named gap ("the Lua layer has no save primitive"). Real, independent confirmed use for exactly this purpose in the referenced roguelike devlog. Fits any TS-side game regardless of whether its core logic is Lua or TS-native. |

## 10. Math / Color Utilities

| Package | Real details | Fit |
|---|---|---|
| **`chroma.js`** | Small (13.5kB), zero-dependency color manipulation and palette/scale generation. | Real, direct extension candidate for the severity-color-grammar work already shipped in Time Served (`severityGrammar.ts`). |
| **`gl-matrix`** | High-performance vector/matrix math for WebGL/WebGPU, mature (1,173+ npm dependents). | Only relevant if 3D or GPU shader work is ever adopted — no current catalog need. |

## 11. Big-Number / Idle-Game Math

`break_infinity.js`/`break_eternity.js` — real, specific fit if Shoal or Slime Coin's real number growth approaches JS's ~1.79e308 ceiling; worth checking real current state before adopting. `decimal.js`/`bignumber.js` for precision-first needs, a distinct problem from scale-first.

## 12. Physics, Animation, State Machines, ECS

*Corrected in v0.5 — ECS's fit note previously cited an unverified "conflict with the Lua systems layer" as if that applied universally. It only applies to a Lua-backed game.*

| Category | Real details | Fit |
|---|---|---|
| Physics: Matter.js / Planck.js / Rapier | Real, mature options — see prior versions for detail. | No current game genre demands rigid-body physics; real option whenever one does, for either architecture pattern. |
| Animation: `motion`/`framer-motion` (already live), tween.js, GSAP | — | Already adopted; extend before adding a competitor. |
| `xstate` | Formal state machine library. | Real candidate for app-shell flow (menus, transitions) in any game; every game currently hand-rolls this in `useState`, which is the real trigger for considering shared infrastructure. |
| **`bitecs` / `miniplex`** | Cache-friendly, flat typed-array ECS, built for very high entity counts. | **Real option specifically for a TS-native game with a genuinely high-entity-count genre** (a future swarm/bullet-hell title, for instance — none exists in the catalog yet, so this is a real future candidate, not a current need). For a Lua-backed game specifically, this would sit alongside the existing Lua systems layer rather than replacing it — worth a real check against what `lupa`/`fengari-web` actually implement before combining the two, not assumed to conflict. |

## 13. Localization

**`i18next`** — the most-used JS i18n framework, 14+ years old, millions of weekly downloads, framework-agnostic. Real, low-risk option whenever any game in the catalog needs a second language — mature, boring, well-proven infrastructure.

## 14. Networking / Multiplayer / Netcode

| Package | Real details | Fit |
|---|---|---|
| Colyseus / geckos.io | Server-authoritative real-time sync. | Firebase/Firestore already solved this for House of Kings: Collab — real option for a different future game with a genuine need Firestore doesn't serve. |
| **`netplayjs`** | Real P2P browser multiplayer, no server hosting required. Rollback netcode by default, falls back to Lockstep if state isn't serializable. | Genuinely distinct tradeoff from the Firebase path — the right answer specifically for a future game wanting multiplayer without standing up backend infrastructure. |

## 15. Audio

Native Web Audio API — already in real, live use (Gladiator Arena). `howler.js` for positional/mixing complexity beyond what a direct implementation handles cleanly.

## 16. Methods & Techniques (not packages)

- **FSM vs. Behavior Trees vs. GOAP vs. Utility AI** — real tradeoff, independent of architecture. FSMs (Yuka) suit small state counts. Behavior trees scale to complex hierarchies. GOAP suits dynamic action-sequencing toward a goal — no mature JS package, real pattern to implement directly. Utility AI suits scoring competing priorities.
- **Navmesh vs. flow-field vs. grid-A\*** — grid-A* (`rot.js`) for tile-based games, navmesh (Yuka) for continuous space, flow-fields for many-agents-to-one-target (cheaper than per-agent A*, no dedicated package, real implementable technique).
- **Deterministic Lockstep vs. Rollback netcode** — Lockstep sends inputs, every client simulates identically, can stall on the slowest peer. Rollback predicts ahead and re-simulates on contradiction — lower perceived latency, more complex. Real open question worth testing directly: JS float-math determinism across browsers/devices isn't guaranteed.
- **Camera juice** — deadzone-based follow, lerped position, screen shake. No package needed.
- **Input feel** — coyote time, input buffering. Implementation detail, not a package.
- **UI/UX technique reference** — Time Served's `UI_UX_Redesign_Plan.md` (three-tier Chrome/Viewport/Overlay, severity color grammar, progressive disclosure) is this studio's own real methods reference for game UI.

## 17. Level Editors / Tilemap Loading

Real research found mature Tiled (TMX) loaders for C++, Python (`pytiled-parser`, `PyTMX` — directly usable on the `renderers/pygame/` side), and Lua, but no standout standalone JS/TS TMX loader — JS-side Tiled support is typically bundled inside a full engine (melonJS, Phaser — both real options per §2 now). A real, confirmed gap if tile-based TS-native level design is wanted without adopting a full engine.

---

## On the Lua Contract Specifically

*Rewritten in v0.5.* Lua (via `lupa` on the Python side, `fengari-web`
on the TS side) is a real, deliberate, working pattern this studio
uses for a real subset of its catalog — the "Lua-backed" games. It is
**not** a mandatory architecture every game or every tool decision must
answer to. Plenty of this studio's real, live, shipped games are
TS-native with no Lua involvement, and that's an equally legitimate,
already-proven pattern, not an exception.

**What remains a real, separate, weightier decision:** converting an
*already Lua-backed* game away from Lua — abandoning working,
already-invested infrastructure for an existing title. That's still
worth real deliberation and ADR-level weight if it ever comes up for a
specific game, the same way any real architectural change to a shipped
system would be. But choosing TS-native (with or without a full
engine, with or without ECS) for a *new* game, or for a game that was
never Lua-backed to begin with, is not that decision — it's simply
picking from among this studio's own already-proven patterns, and
should never have been filtered out by default.

---

## Changelog

| Version | Change |
|---|---|
| v0.1 | Initial, narrow — pre-filtered by architecture fit before establishing breadth. |
| v0.2 | Expanded: full 2D/3D engines, roguelike toolkits, physics, animation, big-number/idle math. |
| v0.3 | Expanded further: Graphics, AI Logic (Yuka), Movement/Pathfinding, Controls, UI/Dialogue, genre survey, Methods & Techniques. |
| v0.4 | Closed remaining gaps: Save/Serialization (Zod), Math/Color (chroma.js, gl-matrix), Localization (i18next), Netcode (netplayjs), Level Editor survey. |
| v0.5 | **Real, systemic correction, not an addition.** Every prior version treated "competes with the Lua contract" as a universal filter, applied even to tools evaluated for TS-native games that never had Lua in the picture — several of which (Succession, Planet of Greed, Gladiator Arena, Mutant Battle Ball, VoidDrift Redux) are real, live, shipped titles in this exact catalog. Full 2D engines (Phaser, melonJS, Kaplay, Excalibur) and ECS (`bitecs`/`miniplex`) un-archived and reframed as real, per-game options rather than blanket exclusions. Added an explicit "On the Lua Contract Specifically" section distinguishing the real, weightier question (converting an *already Lua-backed* game away from Lua) from the one this document had been wrongly treating the same way (choosing TS-native for a game that was never Lua-backed, which is not a special decision at all). |

---

*RFDGameStudio | Comprehensive first. Fit decided per real game, never by a universal filter.*
