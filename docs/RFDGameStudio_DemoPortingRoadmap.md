# RFDGameStudio — Full Demo Porting Roadmap

*v0.1 | August 2026 | Living reference — every real demo found across this session's discovery work, tracked as a real, long-term backlog. Nothing here gets dropped for being harder — that's the explicit point of this document. Companion to `RFDGameStudio_EngineExpansionMap.md` and `RFDGameStudio_ExternalToolingCatalog.md`.*

---

## How to read this

Every entry below is real, found via direct investigation this session
— repo-wide discovery plus a real local Downloads batch. Tiers reflect
real, evidenced porting difficulty, not preference. Tier 3 exists
specifically so the hard ones stay visible and planned, not silently
dropped.

---

## Already Real, Already Registered (confirmed live in `registry.ts`)

| Demo | Status | Real note |
|---|---|---|
| AntSim Redux | `external` | Real pheromone-grid AI, tunnel pathfinding, Lanchester-square combat — the most AI-rich external demo found |
| Facility Escape | `external` | Real BFS guard pathfinding, real A* level solver (24KB, priority queue) |
| 7 Days to Fry | `external` | Real two-layer AI (utility scoring + steering) — most directly relevant to the `aiBehavior` adapter work |
| Factory Idle: Precision Armory | `external` | One real, evolving project across 5 phases (originally "Armory: Storefront & Spindle") — confirmed via direct diff, phases 2-5 byte-identical |
| PlanetForge | `external` | 32-tile ring-world god-game, real test suite already exists |

---

## Tier 1 — Real, Straightforward, TS/React, No Unresolved Blockers

Standard AI-Studio export shape, no exotic backend or cross-language dependency. Real, low-friction porting candidates whenever picked up.

| Demo | Real state | What it is |
|---|---|---|
| SlimeGarden | Deployed as external embed, large (79KB gameLogic, 57KB App.tsx) | Breeding/lab management, corporate contracts, exploration — no spatial AI |
| Coin Pusher Arcade | Archived, not deployed | Physics-based arcade, no AI agents |
| SlimeBreeder | Deployed as external embed | Small, lightweight PWA |
| CorpWorld | Retired, deployed as external | Turn-based strategy AI (4 named opponents) — superseded by Planet of Greed, real historical value only |
| Kingmaker Squads | Retired, deployed as external | Auto-battler frame-based combat — superseded by Planet of Greed, real historical value only |
| Brewfield | Has both a real Lua-backed version and a separate TS prototype | Card/deckbuilding, element wheel — already has a real, live path via Lua |

---

## Tier 2 — Real, Genuinely Distinct Projects, Investigation Confirmed Separate

**The Sandustry family — three real, architecturally distinct projects, not one evolving concept** (a real, direct correction to an earlier assumption — confirmed via completely different type systems in each):

| Project | Real name found in source | Core mechanics | Key types |
|---|---|---|---|
| `voiddrift_redux_1` | "VoidDrift Core Loop" | FSM drone dispatch (Scout/Mining/Hauler), orbital fragments, resource conversion | `MiningFSMState`, `HaulerFSMState`, `DroneRole`, `Fragment` |
| `space_mining_sandustry` | "VoidRift Redux" | Station module construction, chemical compounds (gas/liquid/solid), container integrity | `Compound`, `ContainerSlot`, `ModuleType`, `ModuleBlueprint` |
| `particle_void` | "VoidRift Redux" | Cellular-automata sandbox, 12 `MaterialType`s with physical properties | `MaterialType` enum, `MaterialDef`, `buildingDefs` |

All three preserved in `examples/`, none registered yet — real recommendation on record: three separate registry entries when picked up, not one. `voiddrift_redux_1` is the one matching the earlier "scout proximity detection, FSM drone cycles" description specifically.

---

## Tier 3 — Real, Genuinely Harder, Explicitly Kept On the Roadmap

*This tier exists because these are real and worth porting eventually — not dropped for being harder, tracked more carefully because of it.*

### TurboShells

**Real, confirmed architecture:** Rust core (PyO3 bindings) → Python game logic (real files: 24KB `main.py`, 26KB `game_state_interface.py`, 20KB `save_protection.py`) → React/TS frontend → **live Supabase database** (real, active schema: `game_state`, `turtles` with full genome/breeding lineage, `race_results`). RLS enabled but currently **no auth — anon key gets full CRUD**, a real, live security gap worth knowing about independent of any porting decision.

**Why it's Tier 3, not Tier 1:** a standard external-embed import genuinely does not work here — the game depends on a live external database and a Python backend service, not just a static bundle. Real porting path, when picked up, needs its own dedicated investigation into how much of the Rust/Python stack gets kept vs. re-implemented, not a simple registry entry.

### VoidDrift (native + real TS web renderer)

**Real, confirmed architecture, resolving a discrepancy flagged two directives ago:** the archive contains a genuine hybrid — a native Rust/Bevy core (frozen per this studio's own earlier decision) **and** a real, actively-developed TypeScript web renderer nested in the same repo's `web/src/` directory (`main.ts`, `renderer.ts`, `state.ts`, `hud.ts`, `save.ts`, `systems/{asteroids,drones,production}.ts` — confirmed present directly, not assumed). Real git history shows active, ongoing commits to this web renderer ("Refactor web renderer logic," "Update vite configuration").

**Why it's Tier 3:** the native Rust core is already frozen by prior decision — no action needed there. The real, live opportunity is specifically the `web/` TypeScript renderer, which is a genuine, separate, complete game implementation (drone FSM, asteroid mining, resource processing, station building, its own save system) that could be evaluated on its own terms, independent of the frozen Rust side. Real next step, not yet done: a dedicated look at whether `web/` is a real, standalone-portable candidate or still genuinely coupled to the Rust core's data.

### AntSim Redux (noted here too, despite already being registered)

Registered as `external` today, but its real AI complexity (pheromone grids, multi-colony dynamics, Lanchester combat, tunnel pathfinding) means a genuine TS-native port — not just an embed — is real, substantial future work, not a quick lift. Worth remembering this is currently only at the "playable via iframe" stage, not "integrated into the shared engine" stage.

---

## Explicitly Not on This Roadmap

- **Time Served** — confirmed, directly, to be the real canonical AI-Studio source behind this session's own in-repo work, not a port target.
- **Kaggriculture** — confirmed to be a real Python-based Kaggle agent-competition framework, not a game in any portable format. Tracked separately as its own research thread (`personal:kaggle_agentic_logic_study_aug22`), not part of this roadmap.
- **Dissonance prototype** (`tmp/dissonance-src/`) — already ported; the live TS-native Dissonance Depths is the completed result.

---

## Changelog

| Version | Change |
|---|---|
| v0.1 | Initial. Full real inventory across repo-wide discovery and a real local Downloads batch. Three tiers by real, evidenced difficulty — nothing dropped, Tier 3 exists specifically to keep the harder items visible and planned rather than silently deprioritized. |

---

*RFDGameStudio | August 22 2026*
*Every real demo found gets a real place on this list — difficulty changes the tier, not whether it's tracked.*
