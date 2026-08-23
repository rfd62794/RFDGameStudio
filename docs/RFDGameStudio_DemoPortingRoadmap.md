# RFDGameStudio — Full Demo Porting Roadmap

*v0.2 — supersedes v0.1 (same week) | August 2026 | Living reference — every real demo found across this session's discovery work, tracked as a real, long-term backlog. Nothing here gets dropped for being harder — that's the explicit point of this document. Companion to `RFDGameStudio_EngineExpansionMap.md` and `RFDGameStudio_ExternalToolingCatalog.md`.*

*Change from v0.1: a real, direct correction — SlimeGarden and SlimeBreeder were not two ordinary Tier 1 candidates, they were merged to become SlimeWorld. That's a genuinely different category from "port this as a new external game," and it applies to more than just those two. This version introduces **Legacy/Origin Projects** as a real, distinct Type, connecting directly to the earlier Type/Genre/Date arcade-structure work — Type isn't just Game/Tool/External anymore.*

*Change from v0.2 (Aug 23 2026, same day): all five Legacy/Origin Projects are now real, registered `GAME_REGISTRY` entries — see ADR-023 (`docs/adr/ADR-023-legacy-origin-projects-type.md`). The open registry-infrastructure question below is resolved: `status: 'external'` is reused, with honest "(Origin)" labeling and a "became/merged into/superseded by" sentence naming the real successor game in the description. No new `GameStatus` value was added — the real investigation found no grouping UI exists in `GameSelector.tsx` today to justify one; that work stays deferred until a genuine grouping UI is built.*

---

## How to read this

Every entry below is real, found via direct investigation this session
— repo-wide discovery plus a real local Downloads batch. Tiers reflect
real, evidenced porting difficulty, not preference. Tier 3 exists
specifically so the hard ones stay visible and planned, not silently
dropped. **Legacy/Origin Projects is not a difficulty tier — it's a
real, separate Type**, for material that predates and became a
currently-live game, ported and preserved *as that history*, not as a
new, competing entry.

---

## Legacy / Origin Projects — a real, distinct Type

**Status: done.** All five entries below are registered, live in
`GAME_REGISTRY` (`ts/src/games/registry.ts`), as of Aug 23 2026. See
ADR-023 for the full real reasoning.

**The real, defining test:** does a currently-live game already exist
that this project's real work became, was merged into, or was directly
superseded by? If yes, it belongs here, not in the difficulty tiers
below — porting it means preserving and presenting real origin
material, not adding a new catalog entry competing with the game it
led to.

| Project | gameId | Real relationship | Became / merged into |
|---|---|---|---|
| **SlimeGarden** | `slimegarden` | Real, confirmed origin material — merged with SlimeBreeder to form the current, live SlimeWorld | SlimeWorld (`ts/src/games/slimeworld/`) |
| **SlimeBreeder** | `slimebreeder` | Real, confirmed origin material — same merge as SlimeGarden | SlimeWorld |
| **CorpWorld** | `corpworld` | Previously retired from the registry — confirmed via registry.ts's own comment ("Planet of Greed's fork ancestor"), now re-registered honestly as origin history | Planet of Greed |
| **Kingmaker Squads** | `kingmaker_squads` | Previously retired from the registry — confirmed via registry.ts's own comment ("Wheel/culture-identity design source"), now re-registered honestly as origin history | Planet of Greed |
| **Dissonance prototype** (`tmp/dissonance-src/`) | `dissonance_prototype` | The original AI Studio (Gemini API) source; already noted as "already ported" in v0.1, correctly belongs here as the formal Type rather than a footnote | Dissonance Depths |

**Real porting shape used for this Type, distinct from the tiers
below:** not a standard `status: 'external'` embed competing for
attention with the live game — a real, clearly-labeled "(Origin)"
presentation (in both `label` and `description`), honest about what it
is and what it became. **The registry-infrastructure question is
resolved (ADR-023):** `status: 'external'` is reused rather than adding
a new `GameStatus` value — direct investigation of `GameSelector.tsx`
found no real grouping UI exists today to justify new infrastructure
ahead of need. Revisit if a genuine Type/Genre/Date grouping UI is ever
built.

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

*Corrected in v0.2 — SlimeGarden and SlimeBreeder removed from this tier, moved to Legacy/Origin Projects above.*

| Demo | Real state | What it is |
|---|---|---|
| Coin Pusher Arcade | Archived, not deployed | Physics-based arcade, no AI agents |

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

---

## Changelog

| Version | Change |
|---|---|
| v0.1 | Initial. Full real inventory across repo-wide discovery and a real local Downloads batch. Three tiers by real, evidenced difficulty. |
| v0.2 | Real, direct correction: SlimeGarden and SlimeBreeder are confirmed to have merged into the current, live SlimeWorld — not ordinary Tier 1 candidates. Introduced **Legacy/Origin Projects** as a real, distinct Type (not a difficulty tier), connecting directly to the earlier arcade Type/Genre/Date research. CorpWorld, Kingmaker Squads, and the Dissonance prototype — already correctly flagged as retired/superseded in v0.1 — moved into this same, now-properly-named category. Real, open question flagged: whether this Type needs new registry infrastructure or can reuse `status: 'external'` with clear labeling. |

---

*RFDGameStudio | August 22 2026*
*Every real demo found gets a real place on this list — difficulty changes the tier, being someone's real origin changes the Type entirely.*
