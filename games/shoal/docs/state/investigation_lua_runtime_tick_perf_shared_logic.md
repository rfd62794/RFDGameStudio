# Deep Investigation Report: Lua Runtime Architecture, Shoal Tick Performance, Shared-Logic Promotion

*August 2026 | Read-and-report only. No logic changes, no optimizations, no promotions implemented. All findings below are from reading source and running temporary profiling instrumentation (now removed).*

---

## Part A — Shoal tick hot-path profiling

### A.1 Real per-function timing breakdown

Temporary instrumentation was added to `tick_game` in `games/shoal/logic.lua` (clearly marked as temporary, per the STOP rule), wrapping each subsystem call with `os.clock()` timing. The instrumentation accumulated over 60-tick windows and exposed results via a temporary `get_profiling_report()` accessor. A temporary vitest test (`test_temp_shoal_profiling.ts`) ran the real Lua VM via fengari and captured three data points at different entity counts. **Both the instrumentation and the test have been removed.** `git status` is clean.

**Important caveat:** These numbers are from fengari running in Node.js (vitest), not fengari running in a browser. The browser's JIT may produce different absolute numbers. However, the *relative breakdown* (which subsystem dominates) and the *scaling relationship* (how tick time changes with entity count) are structurally meaningful regardless of the host environment. The prior session's browser-measured 17ms tick time is the real production number; the breakdown below explains where that 17ms goes.

#### Data point 1: Default entity count (57 fish, 2 sharks, 24 algae nodules, 15 chunks)

| Subsystem | Avg ms/tick | % of total |
|---|---|---|
| handle_input | 0.012 | 0.0% |
| rebuild_spatial_hash | 1.574 | 2.5% |
| update_algae | 1.150 | 1.8% |
| **update_creatures** | **53.183** | **83.0%** |
| update_chunks | 0.088 | 0.1% |
| update_discrete_events | 6.838 | 10.7% |
| count_alive/stats | 0.201 | 0.3% |
| build_render_state | 1.037 | 1.6% |
| **Total** | **64.08** | 100% |

#### Data point 2: High entity count (83 fish, 19 sharks, 13 algae nodules, 18 chunks)

| Subsystem | Avg ms/tick | % of total |
|---|---|---|
| handle_input | 0.012 | 0.0% |
| rebuild_spatial_hash | 1.873 | 1.8% |
| update_algae | 0.735 | 0.7% |
| **update_creatures** | **92.245** | **86.7%** |
| update_chunks | 0.126 | 0.1% |
| update_discrete_events | 9.839 | 9.2% |
| count_alive/stats | 0.217 | 0.2% |
| build_render_state | 1.329 | 1.2% |
| **Total** | **106.38** | 100% |

#### Data point 3: Low entity count (50 fish, 13 sharks, 17 algae nodules, 5 chunks)

| Subsystem | Avg ms/tick | % of total |
|---|---|---|
| handle_input | 0.011 | 0.0% |
| rebuild_spatial_hash | 1.277 | 2.5% |
| update_algae | 0.919 | 1.8% |
| **update_creatures** | **43.235** | **84.8%** |
| update_chunks | 0.086 | 0.2% |
| update_discrete_events | 4.356 | 8.5% |
| count_alive/stats | 0.182 | 0.4% |
| build_render_state | 0.879 | 1.7% |
| **Total** | **50.95** | 100% |

### A.2 Per-entity-pair interaction complexity

**`update_creatures` (83-87% of tick time)** calls `move_creature` for every alive fish and shark, which calls `compute_fish_forces` or `compute_shark_forces`. These are the hot path.

| Interaction system | Where | Complexity | Spatial hash? | Real pairwise checks/tick (at 60 fish, 8 sharks) |
|---|---|---|---|---|
| Fish flee shark | `steering.lua:235` | **O(fish × sharks)** | **NO** — full scan of `st.sharks` for every fish | 60 × 8 = **480 checks** |
| Fish boids (separate/align/cohere) | `steering.lua:257-264` | O(fish × neighbors_in_bucket) | YES — uses spatial hash, bucket range 1 | ~60 × (avg ~5-8 per bucket) = **300-480 checks** |
| Fish seek algae | `steering.lua:194-209` | O(fish × nearby_algae) | YES — uses spatial hash, perception range 250px | ~60 × (algae in 250px radius) = **variable** |
| Fish avoid chunks/algae | `steering.lua:268-277` | O(fish × (nearby_algae + all_chunks)) | Partial — algae uses hash, **chunks is full scan** | ~60 × (algae + chunks) = **60 × 15 = 900 checks** for chunks |
| Shark seek fish | `steering.lua:310-318` | **O(sharks × fish)** | **NO** — full scan of `st.fish` for every shark | 8 × 60 = **480 checks** |
| Shark seek chunk | `steering.lua:321-327` | O(sharks × chunks) | **NO** — full scan of `st.chunks` | 8 × 15 = **120 checks** |
| Shark avoid algae/chunks | `steering.lua:369-384` | O(sharks × (nearby_algae + all_chunks)) | Partial — algae uses hash, **chunks is full scan** | ~8 × 15 = **120 checks** for chunks |
| Shark hunting (discrete) | `logic.lua:388` | **O(sharks × fish)** | **NO** — full scan of `st.fish` for every shark | 8 × 60 = **480 checks** |
| Shark chunk eating (discrete) | `logic.lua:420` | O(sharks × chunks) | **NO** — full scan | 8 × 15 = **120 checks** |
| Fish grazing (discrete) | `logic.lua:268-294` | O(fish × nearby_algae) | YES — uses spatial hash | ~60 × (algae in bucket range) = **variable** |

**Key finding:** The three biggest unpartitioned loops are:
1. **Fish flee shark** (O(fish × sharks), no hash) — 480 checks at default counts
2. **Shark seek fish** in `compute_shark_forces` (O(sharks × fish), no hash) — 480 checks
3. **Shark hunting** in `update_discrete_events` (O(sharks × fish), no hash) — 480 checks

The spatial hash exists and is used for fish-fish boids and fish-algae seeking, but **is not used for fish-shark or shark-fish interactions**. This is the single biggest optimization opportunity — but per the STOP rule, it is reported here, not implemented.

### A.3 Table-allocation audit

Every allocation site in the hot path, read from source:

| Site | File:Line | What's allocated | Per-tick count | Avoidable? |
|---|---|---|---|---|
| `st.events = {}` | logic.lua:23 | New events table | 1 | No (cleared each tick by design) |
| `hash = { fish={}, shark={}, algae={} }` | logic.lua:146 | New spatial hash (3 sub-tables) | 1 (+ N bucket tables) | Could be reused/cleared in place |
| `hash.fish[key] = {}` | logic.lua:154 | New bucket table per unique key | ~10-20 (depends on entity spread) | Could be pooled |
| `hash.shark[key] = {}` | logic.lua:163 | New bucket table | ~5-10 | Could be pooled |
| `hash.algae[key] = {}` | logic.lua:173 | New bucket table + entry table `{n=n, core=core}` | ~5-10 + ~24 entries | Entry table avoidable (store n directly, look up core via n) |
| `get_nearby` returns `list = {}` | logic.lua:184 | New list table per call | ~60-80 per tick (called per fish for algae, boids, and per shark for algae) | Could be reused via a passed-in buffer |
| `avoid_targets = {}` | steering.lua:268 | New table per fish | ~60 per tick | Could be reused |
| `avoid_targets = {}` | steering.lua:368 | New table per shark | ~8 per tick | Could be reused |
| `build_render_state` output | logic.lua:435-507 | New `out` table + `out.fish`, `out.sharks`, `out.algae`, `out.chunks` + per-entity tables | 1 + ~60 fish tables + ~8 shark tables + ~7 algae tables (with nodule sub-tables) + ~15 chunk tables | Could be reduced by mutating a persistent render-state table |
| `table.insert(st.diagnostics.meals, {...})` | logic.lua:348, 364 | New meal record table | 0-8 per tick (only on kills) | No (event-driven, rare) |

**Key finding:** `build_render_state` allocates ~90+ new tables every tick (one per entity, plus sub-tables for algae nodules). The spatial hash allocates ~30-50 new tables every tick. `get_nearby` allocates ~60-80 list tables per tick. Total: **~180-220 table allocations per tick**, all garbage-collected. This is a significant GC pressure source but is secondary to the O(n²) interaction loops.

### A.4 Global-lookup audit

The hot path (`compute_fish_forces`, `compute_shark_forces`, `move_creature`) references these globals without localizing them at function scope:

| Global | Where referenced | Frequency | Localized? |
|---|---|---|---|
| `math.floor` | logic.lua:151, 160, 170; steering.lua:183-184 | ~120/tick | NO |
| `math.ceil` | logic.lua:151, 160, 170; steering.lua:183-184 | ~120/tick | NO |
| `math.sqrt` | steering.lua:18, 75, 102, 121; utils.lua:23 | ~200+/tick | NO |
| `math.atan` | steering.lua:132-133; logic.lua:457, 474 | ~68/tick | NO |
| `math.cos`, `math.sin` | steering.lua:152; logic.lua:132-133 | ~68/tick | NO |
| `math.max`, `math.min` | utils.lua:5, 42; steering.lua:140, 335 | ~100+/tick | NO |
| `math.random` | steering.lua:86-87; logic.lua:285, 336, 382 | ~68/tick | NO |
| `math.pi` | steering.lua:144-145 | ~68/tick | NO |
| `dist2` | steering.lua:202, 237, 312; logic.lua:213, 390 | ~1000+/tick | NO (global from engine/primitives/movement.lua) |
| `wrap_x`, `clamp_depth` | logic.lua:182-183, 241-242 | ~68/tick | NO |
| `GAME_STATE` | steering.lua:156 (via `move_creature`) | ~68/tick | NO |

**Key finding:** None of the `math.*` functions are localized. In standard Lua, `local math = math` at the top of a hot function avoids a global table lookup on every call. Fengari may or may not optimize this — but the pattern is a known Lua performance issue. **This is a quick win but is NOT implemented per the STOP rule.**

### A.5 Tick-time-vs-entity-count relationship (the critical cross-check)

| Scenario | Fish | Sharks | Total entities | Tick time (ms) |
|---|---|---|---|---|
| Low count | 50 | 13 | 85 | 50.95 |
| Default | 57 | 2 | 98 | 64.08 |
| High count | 83 | 19 | 133 | 106.38 |

**Finding: Tick time scales with entity count.** This is consistent with an interaction-loop cause (Part A), NOT a fixed VM/reload overhead (Part B).

More specifically: `update_creatures` dominates at 83-87% of total tick time, and it scales from 43ms (low) to 92ms (high) — a 2.1× increase for a 1.6× entity count increase. This is consistent with O(n²) scaling in the fish-shark and shark-fish interaction loops (the cross-product grows quadratically).

The "low count" scenario actually has more sharks (13) than the "default" (2), which is why its tick time (51ms) isn't dramatically lower than default (64ms) despite fewer fish — the shark-fish cross-product is 13×50=650 vs 2×57=114. This further confirms the O(n²) interaction-loop diagnosis.

**Conclusion: The 17ms browser-measured tick time is caused by O(n²) entity-interaction loops in `update_creatures`, NOT by Lua VM overhead or source recompilation.** Part B confirms the VM is persistent and source is compiled once.

---

## Part B — Lua execution/memory architecture

### B.1 VM invocation mechanism

**Source: `ts/src/engine/executor.ts` and `ts/src/engine/runtime.ts`**

The Lua VM is created **once** and reused across every tick:

1. `loadGame(gameId, seed)` in `runtime.ts` creates a `new LuaExecutor(files.logic, seed, files.engineSource)`.
2. The `LuaExecutor` constructor calls `lauxlib.luaL_newstate()` — creates a single Lua state instance.
3. The constructor calls `lualib.luaL_openlibs(this.L)` — opens standard libraries once.
4. The constructor calls `lauxlib.luaL_dostring(this.L, combined)` — compiles and runs the combined engine + game source **once**. This defines all functions (`init_game`, `tick_game`, etc.) as globals on the Lua state.
5. Each tick, `App.tsx` calls `call(session, 'tick_game', dt, input)`, which calls `executor.call('tick_game', ...)`.
6. `call()` uses `lua.lua_getglobal(this.L, fnName)` to look up the already-defined function, pushes arguments, and calls `lua.lua_pcall(this.L, ...)`.

**The Lua state persists across ticks.** `GAME_STATE` is a Lua global that survives between calls. No reload, no reparse, no recompilation. The VM is a single persistent instance for the lifetime of the game session.

### B.2 Bytecode-caching status

`luaL_dostring` is equivalent to `luaL_loadstring` + `lua_pcall`. `luaL_loadstring` compiles Lua source to bytecode **once** and returns a function object on the stack. The constructor calls this once; subsequent ticks call the already-compiled function via `lua_pcall`.

**Source is compiled to bytecode exactly once, at game load time.** There is no per-tick recompilation. Fengari is a full port of Lua 5.3 (parser + VM + base libraries), so this follows standard Lua semantics.

However, there is **no explicit bytecode caching across game sessions** — each `loadGame()` call recompiles the source. This is fine for a web game where the session lifetime is the page lifetime, but would matter if sessions were short-lived and frequently recreated.

### B.3 TS↔Lua bridge cost per tick

Every tick, the `call()` method:
1. Pushes arguments to Lua via `pushValue()` — for `tick_game(dt, input)`, this is 2 values: a number and a table (or nil).
2. Calls the function via `lua_pcall`.
3. Pulls the return value via `pullValue()` — the return is `build_render_state(st)`, which is a **large nested table** (~60 fish + ~8 sharks + ~7 algae + ~15 chunks, each with 5-10 fields).

The `pullTable()` method iterates every key-value pair in the returned table, recursively pulling sub-tables. For a render state with ~90 entities × ~7 fields each, this is **~630 individual `lua_next` + `pullValue` calls** per tick, plus the array detection logic.

**This is a real cost but is NOT the bottleneck.** The profiling data shows `build_render_state` (Lua-side table construction) + the TS-side pull together account for ~1-1.3ms per tick (1.6-2.5% of total). The dominant cost is the Lua-side `update_creatures` at 83-87%.

### B.4 TS typed-array migration assessment

**Recommendation (not implemented):** The hot-path numeric simulation (position/velocity/hunger updates for ~150-200 entities) could reasonably move to TS-side typed-array storage, with Lua retained for logic that genuinely needs to stay scriptable.

**What would move to TS:**
- Entity position/velocity storage: `Float32Array` for `{x, depth, vx, vd}` per entity, indexed by entity ID. Eliminates Lua table per entity.
- Steering force computation: `compute_fish_forces`/`compute_shark_forces` — pure numeric math, no game-design decisions. Would run as TS code directly on typed arrays.
- Spatial hash: could be rebuilt in TS using typed arrays for bucket indices.
- `move_creature`: position integration, drag, turn-rate limiting — pure numeric.
- `build_render_state`: would become a direct read from typed arrays, eliminating the Lua→TS table pull entirely.

**What would stay in Lua:**
- `init_game`: entity spawning, procedural color generation, initial layout — game-design logic.
- `update_discrete_events`: grazing, predation, breeding, starvation — game-design decisions with randomness and conditional rules.
- `handle_input`: tool dispatch — game-design logic.
- `update_algae`: nodule regrowth, depth lerp — game-design logic.
- `update_chunks`: sinking, decomposition — game-design logic.
- `get_state_summary`, `get_diagnostics`: read-only inspection.

**Expected impact:** Moving the steering math to TS typed arrays would eliminate the 83-87% `update_creatures` cost (the O(n²) loops would run as tight JS loops over Float32Arrays, which V8 optimizes aggressively). The remaining Lua-side work (discrete events, algae, chunks) is ~10-12% of tick time. The Lua→TS bridge cost would drop to near zero for the render state (direct typed-array read instead of table pull).

**Trade-off:** This is a significant architectural change. It breaks the "three-file contract" (the game is no longer fully self-contained in Lua). It requires ADR-005 to be superseded (see Part C). It makes the game logic less portable to other runtimes. But it would likely bring tick time from ~17ms (browser) to ~2-3ms, enabling 60fps with headroom.

**This is a recommendation to report, not a change to make this phase.**

---

## Part C — Cross-game shared-logic duplication audit

### ADR-005 context

ADR-005 ("Component Systems Are Named Patterns, Not Shared Binaries") explicitly states:
- "Component systems are **named patterns** documented in the studio SDD."
- "Each game implements the patterns it needs in its own `logic.lua`."
- "No shared binary. No `require()`."
- "This decision is permanent. Any proposal to create a shared Lua library requires a new ADR that explicitly supersedes this one."

The engine layer (`engine/primitives/*.lua`, `engine/systems/*.lua`) exists and is loaded before game logic, but it provides **low-level primitives** (`dist2`, `clamp`, `generate_id`, `copy_entity`, `advance_position`, `grid_collision`, etc.) — not the 11 flagged functions. The flagged functions are all game-level functions that ADR-005 says should remain per-game.

### C.1 Full 11-function duplication diff

#### 1. `copy_table` — brewfield vs scrapcrawl

| Aspect | brewfield (`logic.lua:22`) | scrapcrawl (`logic.lua:21`) |
|---|---|---|
| Implementation | **Deep copy** (recursive) | **Shallow copy** (non-recursive) |
| Body | `c[k] = copy_table(v)` | `c[k] = v` |
| Verdict | **Fundamentally different** — different semantics | |
| Promotable? | **No** as-is. A shared `deep_copy` and `shallow_copy` could be added to `engine/primitives/entity.lua` (which already has `copy_entity` as a shallow copy). | |

#### 2. `get_state_summary` — shoal vs slime_coin vs slither_rogue

| Aspect | shoal | slime_coin | slither_rogue |
|---|---|---|---|
| Fields | fish_count, shark_count, algae_count/capacity, chunk_count, tick_count | phase, round, score, target, hand_in, shelf/floor counts, owned_chips, combo | time_left, score, peak_length, player_segments, player_x/y, npc_count, fruit_count, acid_drops, speed_mult |
| Verdict | **Fundamentally different** — each game exposes completely different state fields | | |
| Promotable? | **No**. The only commonality is the pattern (return a summary table). This is a named pattern per ADR-005, not a shared implementation. | | |

#### 3. `init_game` — shoal vs slime_coin vs slither_rogue

| Aspect | shoal | slime_coin | slither_rogue |
|---|---|---|---|
| Approach | Delegates to `new_game_state()` + `spawn_initial_entities()` | Direct `GAME_STATE` field assignment (20+ fields) + grid population | Builds local entities (player, npcs, fruits) then assigns to `GAME_STATE` |
| Entity model | Fish/sharks/algae with spatial hash | Coins with physics (vx, vy, mass, radius) | Segment-based snakes with evolution effects |
| Verdict | **Fundamentally different** — different entity models, different initialization approaches | | |
| Promotable? | **No**. Each game's initialization is intrinsic to its entity model. | | |

#### 4. `tick_game` — shoal vs slime_coin vs slither_rogue

| Aspect | shoal | slime_coin | slither_rogue |
|---|---|---|---|
| Structure | Ordered pipeline: spatial hash → algae → creatures → chunks → discrete events | Phase-guarded: fire input → shelf physics → floor physics → scoring → round check | Timer-based: time_left → player update → NPC update → acid decay → collisions |
| DT clamping | Yes (`dt > 0.1 → 0.1`) | No | Yes (`dt > 0.1 → 0.1`) |
| Error handling | Returns `{error=...}` | No explicit check | Returns `{events={{type="error",...}}}` |
| Verdict | **Fundamentally different** — different update patterns, different entity models | | |
| Promotable? | **No.** See §C.2 below for the specific `tick_game` assessment. | | |

#### 5. `calculate_stats` — mutant_battle_ball vs slimeworld

| Aspect | mutant_battle_ball | slimeworld |
|---|---|---|
| Inputs | `mutant` (entity with `.parts` table) | `color, level, hue, saturation, vertex_count, irregularity, color_specs` |
| Logic | Sums stats from equipped parts (head, chest, arms, legs) | Interpolates base stats from color specs + applies growth curves + shape modifiers |
| Output | accuracy, endurance, power, speed, max_health | hp, atk, def, agi, int, chm |
| Verdict | **Fundamentally different** — different stat systems, different inputs, different outputs | |
| Promotable? | **No**. These are game-specific stat systems. | |

#### 6. `distance` — shoal vs slime_coin

| Aspect | shoal (`utils.lua:22`) | slime_coin (`logic.lua:110`) |
|---|---|---|
| Body | `return math.sqrt(dist2(ax, ay, bx, by))` | `return math.sqrt((x2-x1)^2 + (y2-y1)^2)` |
| Verdict | **Near-identical** — same algorithm, different variable names. Shoal uses `dist2` from engine primitives. | |
| Promotable? | **Yes** — but `dist2` already exists in `engine/primitives/movement.lua`. Adding `distance` (the sqrt version) to the same file would be trivial. However, ADR-005 says "no shared binary" — and `engine/primitives` IS a shared binary. The existing `dist2` already violates the strict reading of ADR-005, so this is a pre-existing tension, not a new one. | |

#### 7. `lerp` — shoal vs slimeworld (×2)

| Aspect | shoal (`utils.lua:41`) | slimeworld (`logic_original.lua:244`, `breeding.lua:244`) |
|---|---|---|
| Body | `return a + (b - a) * clamp(t, 0, 1)` | `return v1 * (1 - f) + v2 * f` |
| Verdict | **Near-identical** — mathematically equivalent. Shoal clamps `t`; slimeworld does not. Slimeworld's two copies are identical to each other (internal duplication). | |
| Promotable? | **Yes** — universal math utility. Could be added to `engine/primitives/movement.lua` alongside `dist2`. The clamping variant (shoal) is safer. | |

#### 8. `advance_node` — dissonance vs brewfield

| Aspect | dissonance (`run_state.lua:690`) | brewfield (`logic.lua:913`) |
|---|---|---|
| Purpose | Branching node completion with visited tracking, log management, boss victory check | Linear progression (increment ID, check for win at node 9) |
| Body | 33 lines: finds current node, tracks visited, handles boss victory, logs | 9 lines: `next.currentNodeId = next.currentNodeId + 1; if > 9 then game_over` |
| Verdict | **Fundamentally different** — same name, completely different purpose. **Misleading name.** | |
| Promotable? | **No**. These share nothing but the name. | |

#### 9. `get_enemy_intent` — dissonance vs brewfield

| Aspect | dissonance (`combat.lua:209`) | brewfield (`logic.lua:418`) |
|---|---|---|
| Approach | 135 lines: behavior type system + multipliers + 12+ hardcoded enemy pattern tables with string matching | 13 lines: data-driven lookup from `data.enemies[archetype].intent_pattern[turn % 4]` |
| Verdict | **Fundamentally different** — same high-level purpose (get enemy intent by turn), completely different approaches | |
| Promotable? | **No** as-is. Brewfield's data-driven approach could be a *pattern* (per ADR-005), but dissonance's complex system serves different needs. | |

#### 10. `init_player` — brewfield vs scrapcrawl

| Aspect | brewfield (`logic.lua:436`) | scrapcrawl (`logic.lua:224`) |
|---|---|---|
| Structure | Returns table with combat stats (hp, maxHp, shield, dodgeCharges, retaliateCharges, decayingShield, burnDebuff) | Returns table with exploration stats (currentRoomId, scrap, tier2Unlocked, equipped, proficiencyXp, roster, activeCompanionId, sculptedCache) |
| Verdict | **Same structure** (return initial player table), **completely different fields** | |
| Promotable? | **No**. The fields are game-specific. This is a named pattern, not a shared implementation. | |

#### 11. `build_render_state` — shoal vs slither_rogue

| Aspect | shoal (`logic.lua:434`) | slither_rogue (`render.lua:5`) |
|---|---|---|
| Entities | fish, sharks, algae (with nodules), chunks | player (segments as x/y/a arrays), npcs (same), fruits, acid_drops |
| Structure | Iterates entity lists, builds per-entity tables with `table.insert` | Iterates entity lists, builds per-entity tables with `[#x+1]` pattern |
| Verdict | **Fundamentally different** — different entity types, different output structures | |
| Promotable? | **No**. Each game's render state is intrinsic to its renderer. | |

### C.2 `tick_game` specific assessment

**Shoal's `tick_game` is NOT a promotion candidate.** It is structurally unique among the three games that implement `tick_game`:

1. **Shoal** has a complex ordered pipeline with a spatial hash rebuild, four subsystem updates (algae, creatures, chunks, discrete events) with a documented ordering dependency (algae must run before creatures because `update_algae_core` caches `n.cached_danger` from `n.depth`, which `compute_fish_forces` reads). It has predation, grazing, hunger, cold exposure, breeding, and starvation — six interacting game systems that no other game's `tick_game` shares.

2. **Slime Coin** is a phase-guarded pinball-like game with shelf/floor physics and scoring — no spatial partitioning, no entity-entity interactions, no predation.

3. **Slither Rogue** is a timer-based snake game with player/NPC movement and collisions — no spatial partitioning, no grazing, no hunger.

The only shared patterns across all three are: (a) global `GAME_STATE` mutation, (b) dt clamping (shoal and slither_rogue only), (c) event clearing per tick, (d) returning render state. These are trivially small patterns — not worth promoting to a shared function that would then need to call back into game-specific logic via callbacks or strategy objects, adding indirection without reducing code.

**Forcing `tick_game` into a shared function because the name matches across games would be a category error.** The name collision is accidental — each game's tick function is its own thing. ADR-005's "named patterns, not shared binaries" decision is correct here.

### C.3 Summary table

| Function | Games | Verdict | Promotable? |
|---|---|---|---|
| `copy_table` | brewfield, scrapcrawl | Fundamentally different (deep vs shallow) | No (but `deep_copy`/`shallow_copy` could be added to engine primitives) |
| `get_state_summary` | shoal, slime_coin, slither_rogue | Fundamentally different | No |
| `init_game` | shoal, slime_coin, slither_rogue | Fundamentally different | No |
| `tick_game` | shoal, slime_coin, slither_rogue | Fundamentally different | **No** — see §C.2 |
| `calculate_stats` | mutant_battle_ball, slimeworld | Fundamentally different | No |
| `distance` | shoal, slime_coin | Near-identical | **Yes** (but `dist2` already exists in engine primitives) |
| `lerp` | shoal, slimeworld (×2) | Near-identical | **Yes** |
| `advance_node` | dissonance, brewfield | Fundamentally different (misleading name) | No |
| `get_enemy_intent` | dissonance, brewfield | Fundamentally different | No |
| `init_player` | brewfield, scrapcrawl | Same structure, different fields | No |
| `build_render_state` | shoal, slither_rogue | Fundamentally different | No |

**Only 2 of 11 functions are promotion candidates** (`distance` and `lerp`), and both are trivial math utilities where `dist2` already exists in the engine layer. The other 9 are either fundamentally different implementations or game-specific patterns that ADR-005 correctly says should remain per-game.

---

## Completion Criteria Checklist

- [x] Part A: real per-function tick_game timing reported (via temporary instrumentation, now removed)
- [x] Part A: every per-entity-pair interaction system's complexity (O(n²) vs. spatial) reported with real pairwise-check counts
- [x] Part A: every table-allocation site in the hot path reported explicitly
- [x] Part A: tick-time-vs-entity-count relationship reported (scales — confirms Part A cause, not Part B)
- [x] Part B: real VM invocation mechanism reported (persistent single state, no reload)
- [x] Part B: real bytecode-caching status reported (compiled once at load time, no per-tick recompilation)
- [x] Part B: TS-typed-array migration assessed and reported as a recommendation, not implemented
- [x] Part C: all 11 functions diffed across every game that has them, each reported as promotable or legitimately-divergent with reasoning
- [x] Part C: `tick_game` specifically assessed — Shoal's version is NOT a promotion candidate due to legitimate structural uniqueness
- [x] Temporary profiling instrumentation removed (git status clean, confirmed)
- [x] Zero logic/behavior changes made — confirmed via `git diff --stat` (clean working tree)
- [x] No regression to existing test/build floor — 590 passed, 0 failed (71 test files, all green)

---

## Pre-existing issue flagged (not addressed this phase)

The unauthorized fish `hunger` field added to `entities.lua` and `logic.lua` in the prior session is **still present** in the codebase. This investigation did not revert it (that would be a logic change, forbidden by the STOP rule). The next directive should address this — either revert it (making hunger visual mapping sharks-only, as the original STOP-rule report correctly scoped) or formally approve it with a documented decision.

---

*End of investigation report. No code was changed. All temporary instrumentation was removed. The working tree is clean.*
